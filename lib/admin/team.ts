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
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { OPEN_ACCESS_GUEST, requireAdmin, type AdminSession } from "./auth";

/** Admin-API client (service role) — server only, never cached in globals. */
function adminAuthClient() {
  const env = getSupabaseEnv();
  return createClient(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Like requireAdmin, but rejects the open-access guest: approval and
 * removal stay owner-only even while the testing override is on.
 */
export async function requireRealAdmin(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (session.userId === OPEN_ACCESS_GUEST.userId) {
    notFound();
  }
  return session;
}

export type TeamMember = {
  userId: string;
  email: string;
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
      createdAt: null,
      approved: true,
    }));
  }

  const { data, error } = await adminAuthClient().auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    throw new Error(`listUsers: ${error.message}`);
  }
  return data.users
    .map((user) => ({
      userId: user.id,
      email: user.email ?? "",
      createdAt: user.created_at ?? null,
      approved: approvedIds.has(user.id),
    }))
    .sort((a, b) => Number(a.approved) - Number(b.approved) || a.email.localeCompare(b.email));
}

export async function approveMember(userId: string, email: string): Promise<void> {
  const existing = await getStore().all("admin_users");
  if (existing.some((row) => row.user_id === userId)) {
    return;
  }
  await getStore().insert("admin_users", [{ user_id: userId, email }]);
}

/** Remove from the allowlist (the auth account itself stays — re-approvable). */
export async function removeMember(userId: string): Promise<void> {
  await getStore().remove("admin_users", { user_id: userId });
}

export type SignUpResult =
  | { ok: true }
  | { ok: false; error: "unavailable" | "invalid" | "exists" };

/** Self-service sign-up from the login page. Hosted only. */
export async function signUpForApproval(
  email: string,
  password: string,
): Promise<SignUpResult> {
  if (!getSupabaseEnv().hosted) {
    return { ok: false, error: "unavailable" };
  }
  if (!email.includes("@") || password.length < 8) {
    return { ok: false, error: "invalid" };
  }
  const env = getSupabaseEnv();
  // Anon client on purpose: sign-up is the one public operation.
  const anon = createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await anon.auth.signUp({ email, password });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return { ok: false, error: "exists" };
    }
    return { ok: false, error: "invalid" };
  }
  return { ok: true };
}
