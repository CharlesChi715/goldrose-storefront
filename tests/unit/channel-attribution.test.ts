/**
 * ROLE OF THIS FILE
 * Unit tests for marketing-channel attribution (owner request 2026-07-22:
 * see traffic per channel — Google ads + content on Facebook / TikTok /
 * Instagram / Pinterest / YouTube). Verifies utm_source spellings and
 * referrer hostnames collapse into one canonical channel label.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { accountOf, channelOf } from "../../lib/admin/channels.ts";
import type { PageViewRow } from "../../lib/supabase/types.ts";

function view(patch: Partial<PageViewRow>): PageViewRow {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    visitor_id: "v1",
    session_id: "s1",
    path: "/",
    referrer: null,
    utm: null,
    country: null,
    created_at: "2026-07-22T00:00:00Z",
    ...patch,
  };
}

test("utm_source spellings collapse into the owner's channels", () => {
  const cases: Array<[string, string]> = [
    ["google", "Google"],
    ["fb", "Facebook"],
    ["facebook", "Facebook"],
    ["fbclid", "Facebook"],
    ["ig", "Instagram"],
    ["instagram", "Instagram"],
    ["tiktok", "TikTok"],
    ["pinterest", "Pinterest"],
    ["youtube", "YouTube"],
    ["yt", "YouTube"],
  ];
  for (const [source, channel] of cases) {
    assert.equal(channelOf(view({ utm: { utm_source: source } })), channel, source);
  }
});

test("referrer hostnames map to the same channels", () => {
  const cases: Array<[string, string]> = [
    ["https://www.google.com/", "Google"],
    ["https://l.facebook.com/l.php?u=x", "Facebook"],
    ["https://m.facebook.com/", "Facebook"],
    ["https://l.instagram.com/", "Instagram"],
    ["https://vm.tiktok.com/ZM123/", "TikTok"],
    ["https://pin.it/abc", "Pinterest"],
    ["https://www.pinterest.com/pin/1/", "Pinterest"],
    ["https://youtu.be/dQw4w9WgXcQ", "YouTube"],
    ["https://www.youtube.com/watch?v=1", "YouTube"],
  ];
  for (const [referrer, channel] of cases) {
    assert.equal(channelOf(view({ referrer })), channel, referrer);
  }
});

test("YouTube wins over Google despite shared ownership hints", () => {
  assert.equal(channelOf(view({ referrer: "https://www.youtube.com/" })), "YouTube");
});

test("utm_source outranks the referrer", () => {
  const row = view({
    referrer: "https://www.google.com/",
    utm: { utm_source: "tiktok" },
  });
  assert.equal(channelOf(row), "TikTok");
});

test("no signal means Direct; unknown sources pass through unchanged", () => {
  assert.equal(channelOf(undefined), "Direct");
  assert.equal(channelOf(view({})), "Direct");
  assert.equal(channelOf(view({ utm: { utm_source: "Newsletter" } })), "Newsletter");
  assert.equal(channelOf(view({ referrer: "https://example.com/blog" })), "example.com");
});

test("accountOf labels the posting account from utm_acc, prefixed with the channel", () => {
  assert.equal(
    accountOf(view({ utm: { utm_source: "tiktok", utm_acc: "amy" } })),
    "TikTok · amy",
  );
  assert.equal(
    accountOf(view({ utm: { utm_source: "tiktok", utm_acc: "ben" } })),
    "TikTok · ben",
  );
  assert.equal(
    accountOf(view({ utm: { utm_source: "instagram", utm_acc: "amy" } })),
    "Instagram · amy",
  );
});

test("accountOf without a channel signal falls back to the bare account name", () => {
  assert.equal(accountOf(view({ utm: { utm_acc: "amy" } })), "amy");
});

test("accountOf is null without a utm_acc tag", () => {
  assert.equal(accountOf(undefined), null);
  assert.equal(accountOf(view({})), null);
  assert.equal(accountOf(view({ utm: { utm_source: "tiktok" } })), null);
  assert.equal(accountOf(view({ utm: { utm_source: "tiktok", utm_acc: "  " } })), null);
});

test("accountOf ignores utm_content — ad-variant values must never become accounts", () => {
  // Decision 2026-07-24 (docs/features/posting-account-attribution.md): no
  // fallback, so a tool-filled utm_content=banner_a can't corrupt commissions.
  assert.equal(accountOf(view({ utm: { utm_source: "tiktok", utm_content: "banner_a" } })), null);
  assert.equal(
    accountOf(view({ utm: { utm_source: "tiktok", utm_acc: "amy", utm_content: "banner_a" } })),
    "TikTok · amy",
  );
});
