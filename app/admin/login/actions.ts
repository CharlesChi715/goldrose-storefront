"use server";

/**
 * ROLE OF THIS FILE
 * The login server action (§9.2). Email + password only — there is no
 * signup flow to abuse; the owner account is created in the Supabase
 * dashboard (or, in local dev mode, gated by ADMIN_DEV_PASSWORD).
 */

import { redirect } from "next/navigation";
import { signInWithPassword } from "@/lib/admin/auth";

export type LoginState = { error: string | null };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "invalid" };
  }

  const result = await signInWithPassword(email, password);
  if (!result.ok) {
    return { error: "invalid" };
  }

  redirect("/admin");
}
