"use server";

/**
 * ROLE OF THIS FILE
 * The login server action (§9.2). Email + password only — there is no
 * signup flow to abuse; the owner account is created in the Supabase
 * dashboard (or, in local dev mode, gated by ADMIN_DEV_PASSWORD).
 *
 * TESTING-PHASE ADDITION (owner request 2026-07-22): a nickname field for
 * the forum. Nickname alone (no password) is enough while the admin runs in
 * open access — it just sets the forum identity cookie and goes to the
 * forum. With real auth active, nickname-only submits are rejected.
 */

import { redirect } from "next/navigation";
import { isOpenAccess, signInWithPassword } from "@/lib/admin/auth";
import { cleanNickname, setForumNickname } from "@/lib/admin/forum";

export type LoginState = { error: string | null };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nickname = cleanNickname(formData.get("nickname"));

  // Nickname-only: forum access during the open testing phase.
  if (!password && !email) {
    if (!nickname) {
      return { error: "nickname" };
    }
    if (!isOpenAccess()) {
      return { error: "invalid" };
    }
    await setForumNickname(nickname);
    // Nickname is the general testing-phase entry (owner request) — land on
    // the dashboard like any other login, not just the forum.
    redirect("/admin");
  }

  if (!email || !password) {
    return { error: "invalid" };
  }

  const result = await signInWithPassword(email, password);
  if (!result.ok) {
    return { error: "invalid" };
  }

  if (nickname) {
    await setForumNickname(nickname);
  }
  redirect("/admin");
}
