/**
 * ROLE OF THIS FILE
 * Turns raw `search_queries` rows into the two tables the admin actually needs:
 * what shoppers search for, and what they search for and DO NOT FIND. Pure
 * functions over rows already filtered to a date range, so
 * `lib/admin/analytics.ts` stays the orchestrator and this stays unit-testable
 * — the same split `engagement-report.ts` uses.
 *
 * WHY ZERO-RESULT QUERIES GET THEIR OWN TABLE RATHER THAN A COLUMN
 * They are not a footnote on the popular list; they are a different question
 * with a different answer. A failing query is almost never popular — that is
 * why it is still failing — so it would sit far below the fold of a list ranked
 * by volume, which is exactly where nobody looks. Ranked among its own kind,
 * "sunflower" asked eleven times is visible, and it is worth more than the
 * thousandth search for the product on the front page: it is a shopper who
 * tried to give us money for something we did not show them.
 */

import type { SearchQueryRow } from "../supabase/types.ts";

/** Longest lists the dashboard cards will show. */
const TOP_QUERIES = 10;
const TOP_ZERO_RESULT = 10;

export type SearchQueryStat = {
  /** The grouping key — the engine's folded form (`searchGroupingKey`). */
  query: string;
  /**
   * The most common raw spelling behind that key, shown to the owner. The
   * folded key is a matching artefact ("valentines day"); this is what a person
   * typed ("Valentine's Day"), and it is what belongs on a trending chip.
   */
  display: string;
  searches: number;
  /** Mean products returned across those searches, rounded. */
  averageResults: number;
};

export type SearchReport = {
  /** Every submitted search in range — the denominator for everything here. */
  totalSearches: number;
  /** How many of them returned nothing at all. */
  zeroResultSearches: number;
  /** Those as a share of all searches, rounded. The headline health number. */
  zeroResultRatePercent: number;
  /** Distinct queries asked, folded — the vocabulary size, not the volume. */
  distinctQueries: number;
  /** Most-asked queries, whatever they found. */
  topQueries: SearchQueryStat[];
  /** Most-asked queries that found NOTHING. The merchandising to-do list. */
  zeroResultQueries: SearchQueryStat[];
};

const EMPTY_REPORT: SearchReport = {
  totalSearches: 0,
  zeroResultSearches: 0,
  zeroResultRatePercent: 0,
  distinctQueries: 0,
  topQueries: [],
  zeroResultQueries: [],
};

/** One grouping key's running totals while the rows are being folded together. */
type Bucket = {
  searches: number;
  resultTotal: number;
  /** Raw spelling → how often it was typed, so the commonest can be shown. */
  spellings: Map<string, number>;
};

/**
 * Fold rows into per-query buckets.
 *
 * @param rows - Search rows, already filtered to the reporting range.
 * @returns Grouping key → totals for that key.
 */
function bucketize(rows: SearchQueryRow[]): Map<string, Bucket> {
  const buckets = new Map<string, Bucket>();
  for (const row of rows) {
    let bucket = buckets.get(row.query);
    if (!bucket) {
      bucket = { searches: 0, resultTotal: 0, spellings: new Map() };
      buckets.set(row.query, bucket);
    }
    bucket.searches += 1;
    bucket.resultTotal += row.result_count;
    const spelling = row.query_raw.trim();
    if (spelling) {
      bucket.spellings.set(spelling, (bucket.spellings.get(spelling) ?? 0) + 1);
    }
  }
  return buckets;
}

/**
 * Rank buckets into the shape a card renders.
 *
 * Ties break alphabetically rather than by whatever order the rows arrived in,
 * so the same data always produces the same table — a list that reshuffles
 * between refreshes reads as churn the shop did not have.
 *
 * @param buckets - Output of {@link bucketize}.
 * @param limit - Longest list to return.
 * @returns Stats, most-searched first.
 */
function rank(buckets: Map<string, Bucket>, limit: number): SearchQueryStat[] {
  return [...buckets.entries()]
    .map(([query, bucket]) => {
      let display = query;
      let best = 0;
      for (const [spelling, count] of bucket.spellings) {
        // `>` not `>=`: the first spelling seen at the winning count keeps it,
        // and Map preserves insertion order, so this is deterministic too.
        if (count > best) {
          best = count;
          display = spelling;
        }
      }
      return {
        query,
        display,
        searches: bucket.searches,
        averageResults: Math.round(bucket.resultTotal / bucket.searches),
      };
    })
    .sort((a, b) => b.searches - a.searches || a.query.localeCompare(b.query))
    .slice(0, limit);
}

/**
 * Build both search reports from one range's rows.
 *
 * @param rows - Search queries already filtered to the reporting range.
 * @returns Headline totals plus the top-queries and zero-result tables.
 */
export function searchReport(rows: SearchQueryRow[]): SearchReport {
  if (rows.length === 0) return EMPTY_REPORT;

  // A search found nothing when it RETURNED nothing. Tested on `result_count`
  // rather than on `mode === "none"` even though today they coincide: the count
  // is the direct measurement, while the mode is the engine's account of how it
  // got there. If the relaxation ladder ever gains a rung that legitimately
  // ends with an empty list, this keeps meaning what it says.
  const zeroRows = rows.filter((row) => row.result_count === 0);
  const buckets = bucketize(rows);

  return {
    totalSearches: rows.length,
    zeroResultSearches: zeroRows.length,
    zeroResultRatePercent: Math.round((zeroRows.length / rows.length) * 100),
    distinctQueries: buckets.size,
    topQueries: rank(buckets, TOP_QUERIES),
    zeroResultQueries: rank(bucketize(zeroRows), TOP_ZERO_RESULT),
  };
}
