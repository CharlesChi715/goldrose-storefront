/**
 * ROLE OF THIS FILE
 * Unit tests for forum unread counting (owner request 2026-07-23: show new
 * messages and how many). Pure logic only — the localStorage read-mark
 * helpers need a browser and are covered by the forum e2e spec.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { totalUnread, unreadInThread } from "../../lib/forum-unread.ts";

const T1 = "2026-07-23T10:00:00Z";
const T2 = "2026-07-23T11:00:00Z";
const T3 = "2026-07-23T12:00:00Z";

test("a thread never read counts every post by others", () => {
  const posts = [
    { at: T1, by: "GoldRose Team" },
    { at: T2, by: "GoldRose Team" },
  ];
  assert.equal(unreadInThread(posts, undefined, "owner"), 2);
});

test("posts up to the read mark are read; newer ones count", () => {
  const posts = [
    { at: T1, by: "boss" },
    { at: T2, by: "boss" },
    { at: T3, by: "boss" },
  ];
  assert.equal(unreadInThread(posts, T2, "owner"), 1);
  assert.equal(unreadInThread(posts, T3, "owner"), 0);
});

test("your own posts never count as unread", () => {
  const posts = [
    { at: T1, by: "owner" },
    { at: T2, by: "boss" },
  ];
  assert.equal(unreadInThread(posts, undefined, "owner"), 1);
});

test("totalUnread sums per-thread counts using each thread's own mark", () => {
  const activity = [
    { threadId: "a", posts: [{ at: T1, by: "boss" }, { at: T3, by: "boss" }] },
    { threadId: "b", posts: [{ at: T2, by: "boss" }] },
    { threadId: "c", posts: [{ at: T2, by: "owner" }] },
  ];
  // Thread a read up to T1 (one newer), b never read, c only own post.
  assert.equal(totalUnread(activity, { a: T1 }, "owner"), 2);
  assert.equal(totalUnread(activity, { a: T3, b: T2 }, "owner"), 0);
});
