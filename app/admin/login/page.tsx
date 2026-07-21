/**
 * ROLE OF THIS FILE
 * /admin/login — the one unauthenticated admin page (§9.2): email +
 * password, Polaris-styled. Already-signed-in admins are bounced straight
 * to the dashboard.
 */

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }
  return <LoginForm showDevHint={!getSupabaseEnv().hosted} />;
}
