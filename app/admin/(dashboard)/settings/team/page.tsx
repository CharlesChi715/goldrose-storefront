/**
 * ROLE OF THIS FILE
 * /admin/settings/team — accounts + approval (owner request 2026-07-22).
 * Lists every sign-up with its approval state; approve/remove for real
 * admins only. Nickname guests get a 404 (requireRealAdmin).
 */

import { listTeam, requireRealAdmin } from "@/lib/admin/team";
import { TeamView } from "./TeamView";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireRealAdmin();
  const members = await listTeam();
  return <TeamView members={members} selfUserId={session.userId} />;
}
