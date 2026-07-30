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
import { cache } from "react";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { supabaseServerAuthClient } from "@/lib/supabase/server-auth.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { LOCAL_OWNER } from "@/lib/supabase/seed-data.ts";

export const ADMIN_SESSION_COOKIE = "admin_session";
const LOCAL_SESSION_DAYS = 30;
const SECRET_FILE = path.join(process.cwd(), ".data", "admin-secret");

export type AdminSession = {
  userId: string;
  email: string;
  /** Account nickname (sign-up user_metadata) — the forum identity. */
  nickname?: string | null;
};

/* ---------- Local (file adapter) sessions ---------- */

/**
 * TESTING-PHASE OPEN ACCESS (owner decision 2026-07-23): while the store has
 * no real data — no Supabase configured AND no ADMIN_DEV_PASSWORD set — the
 * admin requires no login at all; everyone is the local owner. Setting
 * ADMIN_DEV_PASSWORD turns the password gate back on; configuring Supabase
 * switches to full real auth (email + password + admin_users allowlist).
 *
 * (The hosted ADMIN_OPEN_ACCESS override from earlier in the testing phase
 * was DELETED on owner decision 2026-07-22 — hosted Supabase always means
 * real accounts; open access exists only in the local no-Supabase mode.)
 */
export function isOpenAccess(): boolean {
  // `!url`, not `!hosted`: a PARTIAL Supabase config (URL set, service key
  // missing/mis-scoped) must fail closed to a locked admin — never fall
  // open to the public because one env var didn't make it to the deploy.
  return !getSupabaseEnv().url && !process.env.ADMIN_DEV_PASSWORD?.trim();
}

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

/**
 * The HMAC secret for local session cookies. With ADMIN_DEV_PASSWORD set,
 * derived from it so sessions survive serverless instance churn (no shared
 * disk there); otherwise read from — or first written to — the
 * .data/admin-secret file, falling back to an in-memory secret when the
 * filesystem is read-only.
 */
async function localSecret(): Promise<string> {
  // With ADMIN_DEV_PASSWORD set, derive a stable secret from it so sessions
  // survive serverless instance churn (no shared disk there).
  const password = process.env.ADMIN_DEV_PASSWORD?.trim();
  if (password) {
    return createHmac("sha256", "goldrose-admin-session-v1")
      .update(password)
      .digest("hex");
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

/**
 * Builds a signed local session token — base64url(email).expiry.HMAC —
 * valid for 30 days.
 *
 * @param email - Email to embed as the session identity.
 */
async function makeLocalToken(email: string): Promise<string> {
  const secret = await localSecret();
  const expires = Date.now() + LOCAL_SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${Buffer.from(email).toString("base64url")}.${expires}`;
  return `${payload}.${sign(secret, payload)}`;
}

/**
 * Verifies a local session token's shape, HMAC, and expiry; returns the
 * session (always the seeded local owner's user id) or null when invalid.
 *
 * @param token - The admin_session cookie value.
 */
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

// Cookie-bound auth client — shared with the customer account layer, see
// lib/supabase/server-auth.ts for the §15 getAll/setAll pattern notes.
const supabaseAuthClient = supabaseServerAuthClient;

/** True when the user id has a row in the admin_users allowlist. */
async function isAllowlisted(userId: string): Promise<boolean> {
  const admins = await getStore().all("admin_users");
  return admins.some((row) => row.user_id === userId);
}

/* ---------- Public API ---------- */

/**
 * The current admin session, or null. Never throws. Wrapped in React
 * cache(): layout + page + actions all call this in one request, and each
 * uncached call costs a Supabase auth round trip (Sydney) — dedupe it.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
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
    return null;
  }
  if (!(await isAllowlisted(user.id))) {
    return null; // logged in, but not an admin → treated as no session (404)
  }
  return {
    userId: user.id,
    email: user.email ?? "",
    nickname:
      typeof user.user_metadata?.nickname === "string"
        ? user.user_metadata.nickname
        : null,
  };
});

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

export type SignInResult =
  { ok: true } | { ok: false; error: "invalid" | "pending" };

/**
 * Email + password sign-in for both modes. Errors stay deliberately vague.
 * Success sets the session (local: signed cookie; hosted: Supabase Auth);
 * a correct hosted password without allowlist approval is signed straight
 * back out with "pending".
 *
 * @param email - Login email; local mode falls back to the seeded owner's when blank.
 * @param password - Password to verify.
 */
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return { ok: false, error: "invalid" };
  }
  if (!(await isAllowlisted(data.user.id))) {
    await supabase.auth.signOut();
    // Correct password but not approved yet (sign-up flow) — saying so is
    // fine: this branch is only reachable by someone who owns the account.
    return { ok: false, error: "pending" };
  }
  return { ok: true };
}

/**
 * Post-passkey-login gate (owner request 2026-07-23). The WebAuthn ceremony
 * runs entirely in the browser, so the allowlist can only be checked after
 * the session cookie lands. Non-admins — e.g. a customer whose passkey also
 * opens the storefront account — are signed straight back out; "pending"
 * is safe to show because only the account's owner can reach this branch.
 */
export async function confirmPasskeySignIn(): Promise<SignInResult> {
  if (!getSupabaseEnv().hosted) {
    return { ok: false, error: "invalid" };
  }
  const supabase = await supabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "invalid" };
  }
  if (!(await isAllowlisted(user.id))) {
    await supabase.auth.signOut();
    return { ok: false, error: "pending" };
  }
  return { ok: true };
}

/**
 * Change the signed-in account's own nickname (user_metadata) — the forum
 * identity (owner request 2026-07-22). Hosted only: the local file mode
 * has no auth server, callers fall back to the display-name cookie there.
 *
 * @param nickname - New nickname to store in user_metadata.
 * @returns True when the update succeeded.
 */
export async function updateAccountNickname(
  nickname: string,
): Promise<boolean> {
  if (!getSupabaseEnv().hosted) {
    return false;
  }
  const supabase = await supabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }
  const { error } = await supabase.auth.updateUser({ data: { nickname } });
  return !error;
}

/** Ends the admin session: Supabase sign-out when hosted, otherwise deletes the local session cookie. */
export async function signOut(): Promise<void> {
  const env = getSupabaseEnv();
  if (env.hosted) {
    const supabase = await supabaseAuthClient();
    await supabase.auth.signOut();
    return;
  }
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
