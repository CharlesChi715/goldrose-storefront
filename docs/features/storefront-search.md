---
delivery: ready
rollout: not-deployed
statusChangedAt: 2026-08-10
priority: p2
---

# storefront-search

## Context

The header's search button opened a panel that only matched product titles, so
three of the five trending chips it ships — "Anniversary Gift", "For Mom",
"Ready to Ship" — landed a shopper on an empty grid, and nothing appeared until
Enter was pressed.

## Decision

One matching engine (`lib/catalog/search.ts`) indexes names, facet labels, tags
and handles, and is run by BOTH the overlay (in the browser, per keystroke,
against a cached index) and `/shop?q=` (on the server), so a preview and the
page it hands over to can never disagree.

## Plan

1. Extract the matching rule out of `app/shop/page.tsx` into `lib/catalog/search.ts`. ✅
2. Index each product's `best_for` slugs plus the derived Availability/Price
   facets, so a query naming a facet filters exactly as the drawer's chip would. ✅
3. Publish a projected index at `GET /api/search`, cached 300s like every other
   storefront read. ✅
4. Render results in the overlay as you type, with keyboard navigation. ✅
5. Record what shoppers submit, so the demo trending chips can be retired in
   favour of real popular queries and zero-result searches become visible. ✅
   (The chips themselves stay the design's until there is traffic to read.)

## Options considered

| Option                                            | Pros                                                                                                                        | Cons                                                                                                       | Verdict                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------- |
| Fetch a whole index once, match in the browser     | Zero latency per keystroke; no debounce, no `AbortController`, no out-of-order responses; the browser runs the SAME engine as the server | Payload grows with the catalogue; a change is up to 300s stale                                              | ✅ **chosen**               |
| `GET /api/search?q=` per keystroke                 | Payload never grows; always fresh                                                                                            | Needs debounce + abort + race handling; a spinner between a letter and its results; a request per character | ❌                          |
| Postgres full-text search (`tsvector`)             | Scales past any catalogue size; stemming and ranking for free                                                                | A migration, an index to maintain, and a rule the browser cannot run — so the dropdown could disagree with `/shop` | ❌ (revisit past ~1,000 SKUs) |
| Leave matching on the server, preview nothing      | No new code                                                                                                                 | The panel keeps promising occasions and recipients it cannot deliver                                        | ❌                          |

## Tech details

- **What is indexed, by weight:** short name (100), title (90), facet labels
  (60), tags (30), badge (20), handle (15), description (8, capped at 240
  characters). The handle is low-weighted but load-bearing: handles are frozen
  at creation, so a product whose title later loses a word is still findable
  under the name it launched with — which is the only reason the seed's
  "Premium Gift Bundle" is returned by a search for "rose". The description cap
  lives in `toSearchDoc`, not in the wire projection: applied at the wire, the
  browser searched 240 characters and `/shop` searched all of them, so a word
  late in a product's story was findable on the page but not in the panel that
  hands over to it.
- **Query → facet.** `ALIASES` maps shopper wording onto the closed vocabulary
  in `lib/catalog/facets.ts` ("mom", "mum", "bday", "ships now"), and every
  facet's own label is registered automatically, so a re-worded chip keeps
  working. Named facets FILTER (OR inside a heading, AND across headings — the
  drawer's own combination); free words SCORE.
- **The relaxation ladder.** Strict (every word lands, every named facet
  carried) → drop the words, keep the facets → drop the facets, keep the words
  → facets alone → nothing. `mode` reports which rung answered, so the panel
  labels a loose match as loose. `mode: "none"` is a real outcome and is what
  keeps `/shop?q=zzzz` empty.
- **An empty box and an unreadable one are different questions.** Folding keeps
  `[a-z0-9]`, so 玫瑰, 🌹 and `!!!` all reduce to "" exactly as an empty field
  does. Only a genuinely empty field means "show me everything"; anything else
  that folds away is `mode: "none"`, and the panel offers the catalogue as
  labelled SUGGESTIONS rather than reporting it as matches for a query nothing
  matched.
- **Matching starts at two characters**, which is also `highlightRuns`' floor.
  The two numbers have to agree: when the engine needed three and the
  highlighter bolded from two, typing "ro" produced "No exact match" above a
  list of rows with "Ro" bolded in them.
- **Bounds.** The query is truncated at 200 characters before anything scans it
  (`?q=` is a stranger's to write), and a term may exceed an indexed word by at
  most three characters — unbounded, "rosewood dining table" matched every rose
  in the shop, as an exact hit.
- **Failure is a third state, not an empty list.** `/api/search` answering
  `ok: false` makes `loadSearchIndex` throw rather than resolve `[]`, and the
  panel says "Search is unavailable" and still carries the typed words to
  `/shop`, which matches on the server. Resolving an empty array would have
  told every shopper, during any outage, that this shop sells nothing.
- **Geometry.** `lib/catalog/search-layout.ts` derives the stage height from the
  row count; 932 (the imported frame) is a FLOOR, so the idle panel is
  byte-identical to the design and a longer list grows the stage rather than
  being clipped by NoCalcScale's fallback path.
- **Accessibility.** The repo's first keyboard-navigable list: the input keeps
  focus and carries `aria-activedescendant` (W3C combobox) rather than the
  Carousel's roving tabindex, because moving focus onto a result would stop the
  next character reaching the field.
- **Caching.** `GET /api/search` takes no arguments and reads nothing off the
  request, which is what lets `export const revalidate = 300` apply; the build
  reports it as `○ /api/search 5m`. `revalidateStorefront()` busts it so an
  owner's edit is not stale for 300s after every other surface has updated.
- **Search analytics (OQ-1).** One row per SUBMIT in `search_queries`
  (migration `0012`): the engine's folded form as the grouping key, the raw
  text untouched, `result_count`, the `mode` that answered, and any facets the
  query named. `/admin/analytics` shows search volume, the share finding
  nothing, and two separate lists — top searches, and what shoppers could not
  find. Separate because a failing query is almost never popular, so ranked
  together it sits below the fold, which is where nobody looks.
  - **On submit, never per keystroke.** The panel matches as you type, so a
    keystroke log would be one line of code and a permanent mistake: a privacy
    problem, and a dataset in which "r", "ro", "ros" bury the one query that
    was meant. All four ways to submit already funnel through `remember()`, so
    recording there makes the rule true by construction. The engine is re-run
    for the submitted term rather than reusing `results` — a chip and a recent
    row submit a term that is NOT in the field, so reusing the typed result
    would file every chip tap under the result count of an empty box.
  - **`page_views` is deliberately not reused.** `engagement-report.ts` groups
    `path` verbatim, so each query would become a fake page in the
    time-on-page and drop-off cards; `utm` is read as the session's landing
    attribution, which also feeds posting-account commissions. Neither would
    throw — both would quietly produce wrong reports.
  - **The send carries the Beacon's own guard** (`window.self !== window.top`,
    catch → true), because this overlay is reachable inside the admin's eleven
    home-page preview iframes, where the pathname genuinely is `/`.
    `?adminPreview` is not the test: it would be an analytics kill switch
    anyone could type into a URL bar.
  - **A query the fold destroys keeps its identity.** 玫瑰, 🌹 and `!!!` all
    normalize to `""`, and they are the zero-result rows worth most — a shop
    selling to the US whose misses fill with Chinese is being told something
    urgent. `searchGroupingKey` falls back to the raw text, which is also what
    keeps the row inside its `NOT NULL CHECK (length between 1 and 200)`
    instead of throwing into the endpoint's own catch.
  - **RLS with no policy at all**, the `page_views` treatment: Postgres denies
    everything under RLS until a policy allows it, so only the service role
    reaches the table. What shoppers fail to find is business intelligence.
  - **The endpoint always answers 200 fast**, swallowing every failure into
    `console.error`. It is fired immediately before navigating to `/shop`, so a
    slow or angry response here would be a slow or broken search.

## Blockers and dependencies

- Search itself ships behind no flag and needs no migration.
- **Search analytics needs migration `0012` pushed to hosted** (`supabase db
  push`). Until then the endpoint's insert fails, is swallowed into
  `console.error` as designed, and the two admin cards stay empty — searching
  itself is unaffected, which is the point of swallowing it.

## Open questions

- **OQ-1 — RESOLVED 2026-08-10. Search analytics are live in code.** Every
  submitted search — Enter, a trending chip, a recent row, or tapping a result
  — is recorded to `search_queries` (migration `0012`) through
  `POST /api/search-queries`. See **Search analytics** under Tech details.
  ⚠️ `0012` is written and validated but **not yet pushed to hosted**, so the
  report is empty on the deployed site until `supabase db push` runs.
- **OQ-2 — `/shop` does not say when it relaxed.** The overlay admits "the
  closest gifts we have"; the grid shows the same products with no such note,
  because the frame has no place to put one. Needs a design ruling.
- **OQ-3 — product copy is the real ceiling.** "Premium Gift Bundle" is only
  found by "rose" through its handle. Search is as good as the words on the
  products, and those are still placeholders (SUMMARY.md OQ-3).

## Related links

- Engine: [`lib/catalog/search.ts`](../../lib/catalog/search.ts) · vocabulary:
  [`lib/catalog/facets.ts`](../../lib/catalog/facets.ts)
- Wire format: [`lib/catalog/search-index.ts`](../../lib/catalog/search-index.ts) ·
  browser cache: [`lib/catalog/search-client.ts`](../../lib/catalog/search-client.ts)
- Geometry: [`lib/catalog/search-layout.ts`](../../lib/catalog/search-layout.ts)
- UI: [`components/SearchOverlay.tsx`](../../components/SearchOverlay.tsx) ·
  [`components/SearchButton.tsx`](../../components/SearchButton.tsx)
- Analytics: [`lib/search/record.ts`](../../lib/search/record.ts) ·
  [`lib/search/query-log.ts`](../../lib/search/query-log.ts) ·
  [`app/api/search-queries/route.ts`](../../app/api/search-queries/route.ts) ·
  [`lib/admin/search-report.ts`](../../lib/admin/search-report.ts) · migration
  [`0012_search_queries.sql`](../../supabase/migrations/0012_search_queries.sql)
- Tests: [`tests/unit/search.test.ts`](../../tests/unit/search.test.ts),
  [`tests/unit/search-layout.test.ts`](../../tests/unit/search-layout.test.ts),
  [`tests/unit/search-report.test.ts`](../../tests/unit/search-report.test.ts),
  [`tests/unit/search-record.test.ts`](../../tests/unit/search-record.test.ts),
  [`tests/e2e/search.spec.ts`](../../tests/e2e/search.spec.ts),
  [`tests/e2e/search-queries.spec.ts`](../../tests/e2e/search-queries.spec.ts)
