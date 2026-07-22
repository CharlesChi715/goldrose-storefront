/**
 * ROLE OF THIS FILE
 * /admin/signup — "Request access" moved off the login page (owner request
 * 2026-07-22: keep the login screen clean). Hosted only: without a real
 * auth server there is nothing to sign up to, so local mode bounces back.
 */

import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  if (!getSupabaseEnv().hosted) {
    redirect("/admin/login");
  }
  return <SignupForm />;
}
