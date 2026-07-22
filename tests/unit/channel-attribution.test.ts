/**
 * ROLE OF THIS FILE
 * Unit tests for marketing-channel attribution (owner request 2026-07-22:
 * see traffic per channel — Google ads + content on Facebook / TikTok /
 * Instagram / Pinterest / YouTube). Verifies utm_source spellings and
 * referrer hostnames collapse into one canonical channel label.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { channelOf } from "../../lib/admin/channels.ts";
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
