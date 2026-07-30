/**
 * ROLE OF THIS FILE
 * Team management (owner request 2026-07-22): self-service sign-up on the
 * login page + owner approval before any access. An account exists in
 * Supabase Auth from the moment of sign-up but is invisible to the admin
 * until a real admin adds it to the admin_users allowlist here.
 *
 * All mutations require a REAL admin session (requireRealAdmin) — the
 * testing-phase nickname guest must never be able to approve accounts.
 */

import "server-only";
import { createClient, type User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { requireAdmin, type AdminSession } from "./auth";
import { siteBaseUrl } from "./settings";

/** Admin-API client (service role) — server only, never cached in globals. */
function adminAuthClient() {
  const env = getSupabaseEnv();
  return createClient(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Historically stricter than requireAdmin (it rejected the deleted
 * open-access guest); kept as the named gate for team mutations.
 */
export async function requireRealAdmin(): Promise<AdminSession> {
  return await requireAdmin();
}

export type TeamMember = {
  userId: string;
  email: string;
  nickname: string | null;
  createdAt: string | null;
  approved: boolean;
};

/**
 * Every auth account + its approval state. Hosted only — the local file
 * adapter has no auth server, so it lists just the allowlist rows.
 */
export async function listTeam(): Promise<TeamMember[]> {
  const approved = await getStore().all("admin_users");
  const approvedIds = new Set(approved.map((row) => row.user_id));

  if (!getSupabaseEnv().hosted) {
    return approved.map((row) => ({
      userId: row.user_id,
      email: row.email,
      nickname: null,
      createdAt: null,
      approved: true,
    }));
  }

  // Paginate to the end: storefront customer accounts (Google/Apple/passkey)
  // share auth.users, so one page would silently drop admins past the cap —
  // and with them the owner-detection that gates Remove.
  const client = adminAuthClient();
  const perPage = 200;
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`listUsers: ${error.message}`);
    }
    users.push(...data.users);
    if (data.users.length < perPage) {
      break;
    }
  }
  return users
    .map((user) => ({
      userId: user.id,
      email: user.email ?? "",
      nickname:
        typeof user.user_metadata?.nickname === "string"
          ? user.user_metadata.nickname
          : null,
      createdAt: user.created_at ?? null,
      approved: approvedIds.has(user.id),
    }))
    .sort(
      (a, b) =>
        Number(a.approved) - Number(b.approved) ||
        a.email.localeCompare(b.email),
    );
}

/**
 * Adds the account to the admin_users allowlist, granting admin access.
 * No-op when already approved.
 *
 * @param userId - Auth user id to approve.
 * @param email - Email stored alongside for display.
 */
export async function approveMember(
  userId: string,
  email: string,
): Promise<void> {
  const existing = await getStore().all("admin_users");
  if (existing.some((row) => row.user_id === userId)) {
    return;
  }
  await getStore().insert("admin_users", [{ user_id: userId, email }]);
}

/**
 * Remove from the allowlist (the auth account itself stays — re-approvable).
 *
 * @param userId - Auth user id to remove.
 */
export async function removeMember(userId: string): Promise<void> {
  await getStore().remove("admin_users", { user_id: userId });
}

/**
 * Email-based password recovery (owner request 2026-07-22). Fire-and-forget
 * on purpose: the caller always shows the same "if that account exists…"
 * message, so this can't be used to probe which emails have accounts.
 * NOTE: until real SMTP (Resend) is connected, Supabase's built-in mailer
 * is rate-limited to a handful of emails per hour.
 *
 * @param email - Address to send the reset link to; silently ignored when not hosted or malformed.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!getSupabaseEnv().hosted || !email.includes("@")) {
    return;
  }
  const env = getSupabaseEnv();
  const anon = createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await anon.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteBaseUrl()}/admin/reset-password`,
  });
}

export type SignUpResult =
  | { ok: true }
  | { ok: false; error: "unavailable" | "invalid" | "exists" | "nickname" };

/**
 * Self-service sign-up from the login page. Hosted only. Nickname is
 * MANDATORY (owner request 2026-07-22) — it lives in the account's
 * user_metadata and is the member's forum identity.
 *
 * @param email - New account's email.
 * @param password - Password, minimum 8 characters.
 * @param nickname - Forum display name; trimmed and capped at 40 chars.
 * @returns Success flag, or a coded error for the login page to translate.
 */
export async function signUpForApproval(
  email: string,
  password: string,
  nickname: string,
): Promise<SignUpResult> {
  if (!getSupabaseEnv().hosted) {
    return { ok: false, error: "unavailable" };
  }
  const cleanedNickname = nickname.trim().slice(0, 40);
  if (!cleanedNickname) {
    return { ok: false, error: "nickname" };
  }
  if (!email.includes("@") || password.length < 8) {
    return { ok: false, error: "invalid" };
  }
  const env = getSupabaseEnv();
  // Anon client on purpose: sign-up is the one public operation.
  const anon = createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await anon.auth.signUp({
    email,
    password,
    options: { data: { nickname: cleanedNickname } },
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return { ok: false, error: "exists" };
    }
    return { ok: false, error: "invalid" };
  }
  return { ok: true };
}
