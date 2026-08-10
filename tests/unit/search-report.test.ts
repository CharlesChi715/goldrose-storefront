/**
 * ROLE OF THIS FILE
 * Unit tests for search-query analytics (docs/features/storefront-search.md
 * OQ-1). Two rules matter most here:
 *   - queries GROUP on the engine's folded form but DISPLAY what a person
 *     typed, so "Gold Rose" and "gold rose" are one row that still reads like
 *     English; and
 *   - a query the fold destroys entirely (玫瑰, 🌹) keeps its own identity via
 *     `searchGroupingKey`, because those are the zero-result rows worth most.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { searchReport } from "../../lib/admin/search-report.ts";
import { searchGroupingKey } from "../../lib/search/query-log.ts";
import type { SearchQueryRow } from "../../lib/supabase/types.ts";

function row(patch: Partial<SearchQueryRow>): SearchQueryRow {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    query: "gold rose",
    query_raw: "Gold Rose",
    result_count: 3,
    mode: "exact",
    facets: [],
    created_at: "2026-08-10T00:00:00Z",
    ...patch,
  };
}

test("searchGroupingKey folds to the engine's form when there is one", () => {
  assert.equal(searchGroupingKey("Gold Rose", "gold rose"), "gold rose");
  // Whitespace around the fold is never part of the key.
  assert.equal(searchGroupingKey("  Gold Rose ", " gold rose "), "gold rose");
});

test("searchGroupingKey falls back to raw when the fold destroys everything", () => {
  // 玫瑰 and 🌹 both normalize to "" — the row would fail its NOT NULL /
  // length CHECK and be lost, and every such query would merge into one
  // meaningless blank bucket. The raw text becomes the key instead.
  assert.equal(searchGroupingKey("玫瑰", ""), "玫瑰");
  assert.equal(searchGroupingKey("🌹", ""), "🌹");
  // Case and spacing still fold, so "玫瑰 " and "玫瑰" are one row.
  assert.equal(searchGroupingKey("  ROSE🌹  ", ""), "rose🌹");
  // Genuinely no input at all stays empty; the endpoint rejects that.
  assert.equal(searchGroupingKey("   ", ""), "");
});

test("an empty range reports zeros, not NaN", () => {
  const report = searchReport([]);
  assert.equal(report.totalSearches, 0);
  assert.equal(report.zeroResultSearches, 0);
  // The rate is a division by totalSearches — the guard that stops it being NaN.
  assert.equal(report.zeroResultRatePercent, 0);
  assert.deepEqual(report.topQueries, []);
  assert.deepEqual(report.zeroResultQueries, []);
});

test("queries group on the folded key and display the commonest spelling", () => {
  const report = searchReport([
    row({ query: "gold rose", query_raw: "gold rose" }),
    row({ query: "gold rose", query_raw: "Gold Rose" }),
    row({ query: "gold rose", query_raw: "Gold Rose" }),
    row({ query: "for mom", query_raw: "for mom", facets: ["mother"] }),
  ]);

  assert.equal(report.totalSearches, 4);
  assert.equal(report.distinctQueries, 2);

  const top = report.topQueries[0];
  assert.equal(top.query, "gold rose");
  assert.equal(top.searches, 3);
  // Two rows said "Gold Rose" and one said "gold rose": the owner sees the
  // spelling shoppers actually used, which is what belongs on a chip.
  assert.equal(top.display, "Gold Rose");
});

test("average results is per search, and rounds", () => {
  const report = searchReport([
    row({ query: "rose", result_count: 2 }),
    row({ query: "rose", result_count: 3 }),
  ]);
  assert.equal(report.topQueries[0].averageResults, 3); // 2.5 → 3
});

test("zero-result queries are ranked among their own kind", () => {
  const report = searchReport([
    // A popular query that works — it must NOT crowd the failures out.
    ...Array.from({ length: 20 }, () =>
      row({ query: "rose", result_count: 4 }),
    ),
    row({
      query: "sunflower",
      query_raw: "sunflower",
      result_count: 0,
      mode: "none",
    }),
    row({
      query: "sunflower",
      query_raw: "Sunflower",
      result_count: 0,
      mode: "none",
    }),
    row({ query: "tulip", query_raw: "tulip", result_count: 0, mode: "none" }),
  ]);

  assert.equal(report.totalSearches, 23);
  assert.equal(report.zeroResultSearches, 3);
  assert.equal(report.zeroResultRatePercent, 13); // 3/23 = 13.04%

  // The working query is top overall...
  assert.equal(report.topQueries[0].query, "rose");
  // ...and absent from the failure list, which is ranked on its own.
  assert.deepEqual(
    report.zeroResultQueries.map((entry) => entry.query),
    ["sunflower", "tulip"],
  );
  assert.equal(report.zeroResultQueries[0].searches, 2);
});

test("zero-result is measured on the count, not on the mode", () => {
  // `mode` is the engine's account of HOW it answered; `result_count` is what
  // the shopper actually saw. If a future rung of the relaxation ladder ends
  // with an empty list, the count is what still tells the truth.
  const report = searchReport([
    row({ query: "peony", result_count: 0, mode: "relaxed" }),
  ]);
  assert.equal(report.zeroResultSearches, 1);
  assert.equal(report.zeroResultQueries[0].query, "peony");
});

test("ties break alphabetically so the table never reshuffles", () => {
  const report = searchReport([
    row({ query: "zinnia", query_raw: "zinnia" }),
    row({ query: "aster", query_raw: "aster" }),
    row({ query: "mimosa", query_raw: "mimosa" }),
  ]);
  assert.deepEqual(
    report.topQueries.map((entry) => entry.query),
    ["aster", "mimosa", "zinnia"],
  );
});

test("lists are capped so one busy period cannot flood the card", () => {
  const report = searchReport(
    Array.from({ length: 30 }, (_unused, index) =>
      row({ query: `q${String(index).padStart(2, "0")}`, result_count: 0 }),
    ),
  );
  assert.equal(report.distinctQueries, 30);
  assert.equal(report.topQueries.length, 10);
  assert.equal(report.zeroResultQueries.length, 10);
});
