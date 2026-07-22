/**
 * ROLE OF THIS FILE
 * /admin/forgot-password — password recovery moved off the login page
 * (owner request 2026-07-22). Hosted only, like sign-up.
 */

import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  if (!getSupabaseEnv().hosted) {
    redirect("/admin/login");
  }
  return <ForgotForm />;
}
