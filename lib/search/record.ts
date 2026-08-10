/**
 * ROLE OF THIS FILE
 * The browser half of search analytics: one call, made when a shopper SUBMITS
 * a search, that reports the query and what it found to /api/search-queries.
 *
 * It is a plain module rather than a hook or a component so the search overlay
 * can call it from inside its existing `submit()` — the one function every way
 * of submitting already funnels through (Enter, a trending chip, a recent row,
 * picking a result), which is what makes "record on submit" true by
 * construction rather than by four call sites remembering to agree.
 *
 * ON SUBMIT ONLY, NEVER PER KEYSTROKE
 * The overlay matches as you type, so recording every keystroke would be one
 * line of code and a permanent mistake. It is a privacy problem — a keystroke
 * log records hesitation, corrections and half-formed thoughts the shopper
 * never chose to send — and it is a garbage dataset, because "r", "ro", "ros"
 * and "rose" would bury the single query that was actually meant. A submit is
 * the moment the shopper says "this is my question". That is the event.
 */

import {
  SEARCH_QUERY_MAX_LENGTH,
  type SearchQueryReport,
} from "./query-log.ts";

/**
 * Whether this document is the admin looking at the storefront, rather than a
 * shopper using it.
 *
 * THE SAME ONE TEST THE BEACON USES — see `components/Beacon.tsx`, which
 * carries the full reasoning. In short: the search overlay is reachable inside
 * Content → Home page, where the storefront is rendered in eleven iframes so
 * the owner can see their own edits. A teammate opening the overlay there and
 * typing is not a shopper searching, and counting it would put invented demand
 * into the very report the trending chips are about to be chosen from.
 *
 * Nothing legitimately embeds this storefront, so "inside a frame" is never a
 * real visit. Stating it that broadly is the point: this guard covered the
 * per-section preview windows before they were built, and will cover the next
 * preview somebody adds.
 *
 * `?adminPreview` is NOT the test, deliberately. It rides along on the admin's
 * iframes as a readable marker, but if it decided anything then
 * `https://eldreve.com/?adminPreview=1` would be an analytics kill switch that
 * any stranger could type. Being framed is a property of the browsing context:
 * it cannot be typed into a URL bar, and unlike a query parameter it cannot be
 * destroyed by a client-side navigation.
 *
 * @returns True when this search must not be recorded.
 */
function isAdminPreview(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Reaching `window.top` across origins can throw. Not being able to see the
    // top window is itself proof this document is framed.
    return true;
  }
}

/**
 * Report one submitted search. Fire-and-forget: never awaited, never throws,
 * and never blocks the navigation to `/shop` that follows it.
 *
 * @param report - The query, the engine's fold of it, and what it found.
 */
export function recordSearchQuery(report: SearchQueryReport): void {
  try {
    if (typeof window === "undefined" || isAdminPreview()) return;

    const raw = report.raw.trim().slice(0, SEARCH_QUERY_MAX_LENGTH);
    // An empty submit is not a search. The overlay already refuses one; this is
    // the copy of the rule that holds if a future caller forgets.
    if (!raw) return;

    const body = JSON.stringify({
      query: raw,
      queryNormalized: report.normalized
        .trim()
        .slice(0, SEARCH_QUERY_MAX_LENGTH),
      resultCount: report.resultCount,
      mode: report.mode,
      facets: [...report.facets],
    });

    // `keepalive`, because submitting a search immediately navigates to /shop:
    // without it the browser is free to cancel this request as the page tears
    // down, and we would lose precisely the searches that led somewhere.
    void fetch("/api/search-queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never break browsing. A shopper's search runs whether or
    // not we manage to write it down.
  }
}
