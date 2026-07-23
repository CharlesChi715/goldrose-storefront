/**
 * ROLE OF THIS FILE
 * Who is the store owner? (owner request 2026-07-22: only the owner may
 * revoke team access.) The owner is the earliest-created APPROVED account:
 * the activation checklist creates the owner's auth user before sign-ups
 * open, and auth creation times are immutable, so the answer never changes
 * without a deliberate allowlist edit. Kept free of "server-only" so the
 * unit suite can exercise it directly.
 */

export type OwnerCandidate = {
  userId: string;
  approved: boolean;
  /** auth.users creation time; null on the local file adapter (no auth server). */
  createdAt: string | null;
};

/**
 * Earliest-created approved member, or null with no approved members.
 * Local adapter rows carry no createdAt — there the first allowlist row
 * wins (the seeded dev owner; local mode is single-admin anyway).
 *
 * @param members - Candidate accounts with approval state and auth creation time.
 * @returns The owner's user id, or null when nobody is approved.
 */
export function teamOwnerId(members: OwnerCandidate[]): string | null {
  const approved = members.filter((member) => member.approved);
  if (approved.length === 0) {
    return null;
  }
  const dated = approved.filter((member) => member.createdAt !== null);
  if (dated.length === 0) {
    return approved[0].userId;
  }
  return dated.reduce((a, b) => (a.createdAt! <= b.createdAt! ? a : b)).userId;
}
