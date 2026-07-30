/**
 * ROLE OF THIS FILE
 * Unit tests for the store-owner rule (owner request 2026-07-22: only the
 * owner may revoke team access). The e2e suite runs single-admin local mode
 * and can't build a multi-member team, so the picking logic is verified here.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  teamOwnerId,
  type OwnerCandidate,
} from "../../lib/admin/team-owner.ts";

const member = (
  userId: string,
  approved: boolean,
  createdAt: string | null,
): OwnerCandidate => ({ userId, approved, createdAt });

test("earliest-created approved member is the owner", () => {
  const members = [
    member("tester-b", true, "2026-07-23T10:00:00Z"),
    member("owner", true, "2026-07-22T08:00:00Z"),
    member("tester-a", true, "2026-07-22T09:00:00Z"),
  ];
  assert.equal(teamOwnerId(members), "owner");
});

test("pending accounts never count — even with an earlier creation time", () => {
  const members = [
    member("early-pending", false, "2026-07-20T00:00:00Z"),
    member("owner", true, "2026-07-22T08:00:00Z"),
  ];
  assert.equal(teamOwnerId(members), "owner");
});

test("no approved members → no owner", () => {
  assert.equal(
    teamOwnerId([member("pending", false, "2026-07-22T08:00:00Z")]),
    null,
  );
  assert.equal(teamOwnerId([]), null);
});

test("local adapter (no creation times): first allowlist row wins", () => {
  const members = [
    member("local-owner", true, null),
    member("other", true, null),
  ];
  assert.equal(teamOwnerId(members), "local-owner");
});

test("mixed: dated members beat undated ones", () => {
  const members = [
    member("undated", true, null),
    member("dated", true, "2026-07-22T08:00:00Z"),
  ];
  assert.equal(teamOwnerId(members), "dated");
});
