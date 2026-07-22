"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for Settings → Team: approve a signed-up account, remove
 * one from the allowlist. Real-admin only — the testing-phase nickname
 * guest is rejected by requireRealAdmin (owner request 2026-07-22).
 */

import { z } from "zod";
import { approveMember, listTeam, removeMember, requireRealAdmin } from "@/lib/admin/team";
import { teamOwnerId } from "@/lib/admin/team-owner";

const id = z.string().uuid();

export async function approveMemberAction(userId: string, email: string): Promise<void> {
  await requireRealAdmin();
  await approveMember(id.parse(userId), z.string().email().parse(email));
}

export async function removeMemberAction(userId: string): Promise<void> {
  const session = await requireRealAdmin();
  const parsed = id.parse(userId);
  if (parsed === session.userId) {
    throw new Error("You cannot remove your own admin access.");
  }
  // Owner-only (owner request 2026-07-22): approved members must not be able
  // to revoke each other — or the owner. Checked server-side; the UI hiding
  // the button is cosmetic.
  if (teamOwnerId(await listTeam()) !== session.userId) {
    throw new Error("Only the store owner can remove a member's access.");
  }
  await removeMember(parsed);
}
