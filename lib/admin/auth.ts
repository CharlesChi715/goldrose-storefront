/**
 * ROLE OF THIS FILE
 * Admin access control (§9.2). Two modes behind one API:
 *
 * - Hosted Supabase: real Supabase Auth sessions (@supabase/ssr, the current
 *   getAll/setAll cookie pattern) AND membership in the admin_users
 *   allowlist — having a login is not enough.
 * - Local file adapter (§0.2 fallback, no Supabase configured): a dev-only
 *   login gated by ADMIN_DEV_PASSWORD, tracked by an HMAC-signed cookie
 *   whose secret lives in .data/admin-secret. Disabled the moment hosted
 *   env vars exist.
 *
 * `requireAdmin()` is called in the admin layout AND at the top of every
 * admin server action / API route. Non-members get a 404, so the admin's
 * existence is never leaked.
 */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { LOCAL_OWNER } from "@/lib/supabase/seed-data.ts";

export const ADMIN_SESSION_COOKIE = "admin_session";
const LOCAL_SESSION_DAYS = 30;
const SECRET_FILE = path.join(process.cwd(), ".data", "admin-secret");

export type AdminSession = {
  userId: string;
  email: string;
};

/* ---------- Local (file adapter) sessions ---------- */

/**
 * The dev-login password. The "goldrose-admin" default exists ONLY in
 * development: on a production deployment with no Supabase configured, the
 * fallback login stays disabled unless ADMIN_DEV_PASSWORD is explicitly set
 * — a public site must never ship a known default password.
 */
function devPassword(): string | null {
  const explicit = process.env.ADMIN_DEV_PASSWORD?.trim();
  if (explicit) {
    return explicit;
  }
  return process.env.NODE_ENV === "production" ? null : "goldrose-admin";
}

let memorySecret: string | null = null;

async function localSecret(): Promise<string> {
  // With ADMIN_DEV_PASSWORD set, derive a stable secret from it so sessions
  // survive serverless instance churn (no shared disk there).
  const password = process.env.ADMIN_DEV_PASSWORD?.trim();
  if (password) {
    return createHmac("sha256", "goldrose-admin-session-v1").update(password).digest("hex");
  }
  try {
    return (await fs.readFile(SECRET_FILE, "utf8")).trim();
  } catch {
    if (!memorySecret) {
      memorySecret = randomBytes(32).toString("hex");
      try {
        await fs.mkdir(path.dirname(SECRET_FILE), { recursive: true });
        await fs.writeFile(SECRET_FILE, memorySecret, "utf8");
      } catch {
        // Read-only fs — in-memory secret; sessions last per instance only.
      }
    }
    return memorySecret;
  }
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

async function makeLocalToken(email: string): Promise<string> {
  const secret = await localSecret();
  const expires = Date.now() + LOCAL_SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${Buffer.from(email).toString("base64url")}.${expires}`;
  return `${payload}.${sign(secret, payload)}`;
}

async function verifyLocalToken(token: string): Promise<AdminSession | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [emailB64, expires, mac] = parts;
  const payload = `${emailB64}.${expires}`;
  const secret = await localSecret();
  if (!safeEqual(mac, sign(secret, payload))) {
    return null;
  }
  if (Number(expires) < Date.now()) {
    return null;
  }
  const email = Buffer.from(emailB64, "base64url").toString("utf8");
  return { userId: LOCAL_OWNER.user_id, email };
}

/* ---------- Hosted Supabase sessions ---------- */

/**
 * Auth client bound to the request's cookies — the current @supabase/ssr
 * getAll/setAll pattern (§15: use it exactly; older get/set silently breaks
 * session refresh). setAll throws inside a Server Component render; that's
 * expected and safe to swallow — the middleware refreshes cookies instead.
 */
async function supabaseAuthClient() {
  const env = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component render — middleware owns the refresh.
        }
      },
    },
  });
}

async function isAllowlisted(userId: string): Promise<boolean> {
  const admins = await getStore().all("admin_users");
  return admins.some((row) => row.user_id === userId);
}

/* ---------- Public API ---------- */

/** The current admin session, or null. Never throws. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const env = getSupabaseEnv();

  if (!env.hosted) {
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) {
      return null;
    }
    return verifyLocalToken(token);
  }

  const supabase = await supabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  if (!(await isAllowlisted(user.id))) {
    return null; // logged in, but not an admin → treated as no session (404)
  }
  return { userId: user.id, email: user.email ?? "" };
}

/**
 * Gate for every admin page and server action. Non-admins see a plain 404 —
 * the admin's existence isn't leaked (§9.2).
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    notFound();
  }
  return session;
}

export type SignInResult = { ok: true } | { ok: false; error: "invalid" };

/** Email + password sign-in for both modes. Errors stay deliberately vague. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  const env = getSupabaseEnv();

  if (!env.hosted) {
    // Local dev fallback: any email + the dev password. Disabled entirely in
    // production unless ADMIN_DEV_PASSWORD is explicitly set (see devPassword).
    const expected = devPassword();
    if (!expected || !safeEqual(password, expected)) {
      return { ok: false, error: "invalid" };
    }
    const token = await makeLocalToken(email || LOCAL_OWNER.email);
    (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LOCAL_SESSION_DAYS * 24 * 60 * 60,
    });
    return { ok: true };
  }

  const supabase = await supabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: "invalid" };
  }
  if (!(await isAllowlisted(data.user.id))) {
    await supabase.auth.signOut();
    return { ok: false, error: "invalid" };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const env = getSupabaseEnv();
  if (env.hosted) {
    const supabase = await supabaseAuthClient();
    await supabase.auth.signOut();
    return;
  }
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
