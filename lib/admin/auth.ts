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
 * TESTING-PHASE OPEN ACCESS (owner decision 2026-07-23): while the store has
 * no real data — no Supabase configured AND no ADMIN_DEV_PASSWORD set — the
 * admin requires no login at all; everyone is the local owner. Setting
 * ADMIN_DEV_PASSWORD turns the password gate back on; configuring Supabase
 * switches to full real auth (email + password + admin_users allowlist).
 *
 * ADMIN_OPEN_ACCESS=1 (owner decision 2026-07-22, Supabase activation):
 * explicit override that keeps the admin + nickname forum open EVEN WITH
 * hosted Supabase configured, so testers need no accounts while data is now
 * persistent. Real logins still work on top (and show their own email).
 * REMOVE THIS ENV VAR AT LAUNCH — BUILD-REPORT §5.7 go-live list.
 */
function openAccessOverride(): boolean {
  const value = process.env.ADMIN_OPEN_ACCESS?.trim().toLowerCase();
  return value === "1" || value === "true";
}

export function isOpenAccess(): boolean {
  if (openAccessOverride()) {
    return true;
  }
  return !getSupabaseEnv().hosted && !process.env.ADMIN_DEV_PASSWORD?.trim();
}

/** The synthetic identity open-access visitors act as on hosted Supabase. */
const OPEN_ACCESS_GUEST: AdminSession = {
  userId: "00000000-0000-4000-8000-0000000000ff",
  email: "tester@goldrose.testing",
};

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
    if (token) {
      const session = await verifyLocalToken(token);
      if (session) {
        return session;
      }
    }
    if (isOpenAccess()) {
      return { userId: LOCAL_OWNER.user_id, email: LOCAL_OWNER.email };
    }
    return null;
  }

  const supabase = await supabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Testing-phase override: visitors without a login act as the guest.
    return isOpenAccess() ? OPEN_ACCESS_GUEST : null;
  }
  if (!(await isAllowlisted(user.id))) {
    // Logged in but not an admin → 404, unless the testing override is on.
    return isOpenAccess() ? OPEN_ACCESS_GUEST : null;
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
