/**
 * ROLE OF THIS FILE
 * /admin/login — the one unauthenticated admin page (§9.2): email +
 * password, Polaris-styled, plus the testing-phase nickname field for the
 * forum. Visitors who already have both a session and a forum nickname are
 * bounced straight to the dashboard; anyone still missing a nickname gets
 * the form so they can pick one (the forum sends them here).
 */

import { redirect } from "next/navigation";
import { getAdminSession, isOpenAccess } from "@/lib/admin/auth";
import { getForumNickname } from "@/lib/admin/forum";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  const nickname = await getForumNickname();
  if (session && nickname) {
    redirect("/admin");
  }
  return (
    <LoginForm
      showDevHint={!getSupabaseEnv().hosted}
      // The "nickname only is enough" helper is true only in open access —
      // with real auth locked on, showing it just misleads (owner hit this).
      nicknameOnly={isOpenAccess()}
    />
  );
}
