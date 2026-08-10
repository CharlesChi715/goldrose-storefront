/**
 * ROLE OF THIS FILE
 * The contract shared by everything that logs a search: the browser recorder
 * (`record.ts`), the endpoint that stores the row (`/api/search-queries`) and
 * the admin report that reads them back (`lib/admin/search-report.ts`).
 *
 * It is deliberately tiny, pure and dependency-free — like `facets.ts` and
 * `search.ts` — because it has to run in the browser, on the server and in a
 * unit test without dragging any of them into the others.
 *
 * WHY THE BROWSER SENDS THE FOLDED FORM RATHER THAN THE SERVER FOLDING IT
 * The grouping key must be the SEARCH ENGINE'S OWN fold (`normalizeSearchText`
 * in `lib/catalog/search.ts`), not a second implementation of it. A report that
 * groups queries by a slightly different rule than the engine matches them by
 * is the same class of bug one shared engine exists to prevent. The browser has
 * already run the engine to get `mode` and the result count, so it has the
 * folded string in hand and sends it; the server bounds it and stores it rather
 * than re-deriving it from a copy of the rule that could drift.
 *
 * That means the folded form is client-supplied and therefore spoofable. This
 * is accepted: an analytics endpoint that anyone can POST to is spoofable in
 * every field anyway (the beacon has exactly the same property), and nothing
 * here authorises anything — it decides which words appear in a merchandising
 * report, not who may do what.
 */

/**
 * Longest query stored, matching the engine's own `MAX_QUERY_LENGTH`. The
 * string originates in `?q=` / a text field, which is a stranger's to write.
 */
export const SEARCH_QUERY_MAX_LENGTH = 200;

/**
 * The rungs of the relaxation ladder that can be SUBMITTED.
 *
 * `SearchMode` in the engine has a fourth value, `"all"` — an empty box meaning
 * "show me everything". It is absent here on purpose: submitting requires text,
 * so an `"all"` reaching the log would mean a bug upstream, and the database
 * check constraint rejects it rather than quietly recording a search nobody ran.
 */
export type LoggedSearchMode = "exact" | "relaxed" | "none";

/** One submitted search, as the browser reports it. */
export type SearchQueryReport = {
  /** Exactly what the shopper typed, untrimmed length permitting. */
  raw: string;
  /** The engine's fold of it (`normalizeSearchText`); may be "". */
  normalized: string;
  /** How many products the engine returned. */
  resultCount: number;
  mode: LoggedSearchMode;
  /** Facet slugs the query itself named, e.g. "for mom" → ["mother"]. */
  facets: readonly string[];
};

/**
 * The key a report GROUPS by: the engine's folded form, or the raw text when
 * folding leaves nothing behind.
 *
 * WHY THE FALLBACK EXISTS. The fold keeps only `[a-z0-9]`, so 玫瑰, 🌹 and
 * "!!!" all reduce to the empty string — indistinguishable from an empty box.
 * Those are not noise to be discarded; they are the most interesting rows in
 * the table. A shop selling to the United States whose zero-result list is
 * suddenly full of Chinese is being told something urgent, and a report that
 * merged all of them into one blank "" row would never say it. So when the fold
 * comes back empty, the shopper's own characters become the grouping key —
 * case-folded and whitespace-collapsed so "玫瑰" and "玫瑰 " still group as one.
 *
 * This is also what keeps the row insertable at all: `search_queries.query` is
 * `NOT NULL CHECK (length between 1 and 200)`, so an empty key would fail the
 * constraint and be swallowed by the endpoint's catch — losing exactly the
 * queries we most wanted.
 *
 * @param raw - What the shopper typed.
 * @param normalized - The engine's fold of it; "" when nothing survived.
 * @returns A non-empty grouping key, or "" if there was no input at all.
 */
export function searchGroupingKey(raw: string, normalized: string): string {
  const folded = normalized.trim();
  if (folded) return folded;
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
