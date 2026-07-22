/**
 * ROLE OF THIS FILE
 * /admin/settings/security — the signed-in admin's own passkeys (owner
 * request 2026-07-23): add / rename / remove. Credentials live inside
 * Supabase Auth and every call runs in the browser (WebAuthn), so this page
 * only gates access and reports whether the hosted backend exists.
 */

import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { SecurityView } from "./SecurityView";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  await requireAdmin();
  return <SecurityView hosted={getSupabaseEnv().hosted} />;
}
