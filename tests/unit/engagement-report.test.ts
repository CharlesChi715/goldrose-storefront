/**
 * ROLE OF THIS FILE
 * Unit tests for the admin engagement reports
 * (docs/features/backend/engagement-tracking.md). The rule that matters most
 * here: a visit whose closing beacon never arrived has active_ms null, and
 * must be excluded rather than counted as a zero-second visit — otherwise
 * every dwell number is silently dragged toward zero.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { engagementReport, median } from "../../lib/admin/engagement-report.ts";
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
    created_at: "2026-07-28T00:00:00Z",
    ...patch,
  };
}

test("median handles odd, even and empty lists", () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([1, 2, 3, 4]), 3);   // (2+3)/2 rounded
  assert.equal(median([]), 0);
});

test("visits with no closing beacon are excluded, not counted as zero", () => {
  const report = engagementReport([
    view({ active_ms: 10_000, scroll_pct: 50 }),
    view({ active_ms: 20_000, scroll_pct: 60 }),
    view({ active_ms: null }),              // still in flight
    view({}),                               // never reported
  ]);

  assert.equal(report.measuredVisits, 2);
  // Median of [10000, 20000] is 15000. Counting the two unmeasured rows as
  // zero would have produced 5000 instead.
  assert.equal(report.medianActiveMs, 15_000);
});

test("time on page is grouped per path", () => {
  const report = engagementReport([
    view({ path: "/", active_ms: 10_000, scroll_pct: 40 }),
    view({ path: "/", active_ms: 30_000, scroll_pct: 80 }),
    view({ path: "/shop", active_ms: 60_000, scroll_pct: 90 }),
  ]);

  const home = report.byPath.find((row) => row.path === "/");
  const shop = report.byPath.find((row) => row.path === "/shop");
  assert.equal(home?.visits, 2);
  assert.equal(home?.medianActiveMs, 20_000);
  assert.equal(home?.medianScrollPct, 60);
  assert.equal(shop?.medianActiveMs, 60_000);
});

test("section reach rate is a share of that page's measured visits", () => {
  const report = engagementReport([
    view({ path: "/", active_ms: 40_000, sections: { "HOME-HERO-SECTION": 20_000 } }),
    view({ path: "/", active_ms: 40_000, sections: { "HOME-HERO-SECTION": 10_000 } }),
    view({ path: "/", active_ms: 40_000, sections: { "HOME-STORY-SECTION": 30_000 } }),
    view({ path: "/", active_ms: 40_000 }),   // measured, reached no tagged section
  ]);

  const hero = report.sections.find((row) => row.section === "HOME-HERO-SECTION");
  const story = report.sections.find((row) => row.section === "HOME-STORY-SECTION");
  assert.equal(hero?.visits, 2);
  assert.equal(hero?.medianMs, 15_000);
  assert.equal(hero?.reachRatePercent, 50);   // 2 of 4 measured visits to "/"
  assert.equal(story?.reachRatePercent, 25);
});

test("sections are ranked by median attention, not by raw visit count", () => {
  const report = engagementReport([
    view({ path: "/", active_ms: 60_000, sections: { "HOME-HERO-SECTION": 2_000 } }),
    view({ path: "/", active_ms: 60_000, sections: { "HOME-HERO-SECTION": 2_000 } }),
    view({ path: "/", active_ms: 60_000, sections: { "HOME-STORY-SECTION": 45_000 } }),
  ]);
  // The story band is seen by fewer people but holds them far longer.
  assert.equal(report.sections[0].section, "HOME-STORY-SECTION");
});

test("drop-off counts where visits stopped, as a share of the total", () => {
  const report = engagementReport([
    view({ active_ms: 10_000, last_section: "HOME-PROMISE-SECTION" }),
    view({ active_ms: 10_000, last_section: "HOME-PROMISE-SECTION" }),
    view({ active_ms: 10_000, last_section: "HOME-PROMISE-SECTION" }),
    view({ active_ms: 10_000, last_section: "HOME-FEATURED-SECTION" }),
  ]);

  assert.equal(report.dropOff[0].section, "HOME-PROMISE-SECTION");
  assert.equal(report.dropOff[0].visits, 3);
  assert.equal(report.dropOff[0].sharePercent, 75);
});

test("an empty period reports zeroes rather than throwing", () => {
  const report = engagementReport([]);
  assert.deepEqual(report, {
    measuredVisits: 0,
    medianActiveMs: 0,
    byPath: [],
    sections: [],
    dropOff: [],
  });
});
