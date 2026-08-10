-- ----------------------------------------------------------------------------
-- 0012 — search-query analytics (docs/features/storefront-search.md, OQ-1).
--
-- Why this exists: the storefront search engine (lib/catalog/search.ts) answers
-- every query, and we keep none of them. That costs us the two things search
-- traffic is actually worth:
--   1. The overlay's five "Trending Searches" chips are a design guess. Real
--      popular queries are the only honest thing to put there.
--   2. ZERO-RESULT queries are invisible — and they are the single most
--      valuable merchandising signal a shop has, because each one is a shopper
--      who wanted to give us money for something they could not find.
--
-- WHY ITS OWN TABLE, AND NOT page_views.
-- The obvious shortcut is to reuse the beacon: write the query into
-- `page_views.path` or `.utm` and skip this migration. Both corrupt existing
-- reports, silently:
--   - `lib/admin/engagement-report.ts` groups `path` VERBATIM, so every
--     distinct query would become its own fake "page" in the time-on-page and
--     drop-off tables, burying the real pages under one row per query.
--   - `utm` is read as the SESSION'S LANDING ATTRIBUTION by page_view_sessions
--     and lib/admin/analytics.ts, so a query written there would masquerade as
--     the campaign that brought the visitor in, and corrupt commissions.
-- A search is not a page view. It gets its own row.
--
-- ONE ROW PER SUBMIT, NEVER PER KEYSTROKE. The overlay matches as you type,
-- but only Enter / a chip / a recent row / picking a result writes here. A
-- keystroke-level log would be both a privacy problem (it records hesitation
-- and half-typed thoughts nobody chose to send) and a garbage dataset — "r",
-- "ro", "ros", "rose" would drown the one query the shopper actually meant.
--
-- NO VISITOR ID, ON PURPOSE. Nothing here links a query to a person or a
-- session: this table answers "what does the shop get asked for", not "what
-- did THAT shopper look for". Queries are free text a stranger types, so they
-- are the one analytics field that can contain anything — leaving the join key
-- out means an accidentally-pasted email address in `query_raw` cannot be
-- attached to a browsing history.
-- ----------------------------------------------------------------------------

create table if not exists public.search_queries (
  id uuid primary key default gen_random_uuid(),

  -- The folded form (lib/catalog/search.ts `normalizeSearchText`): lowercase,
  -- accents dropped, apostrophes closed up, everything else a separator. This
  -- is the GROUPING key, so "Gold Rose", "gold  rose" and "GOLD ROSE" are one
  -- row in the report instead of three that each look unpopular.
  query text not null check (length(query) between 1 and 200),

  -- What the shopper actually typed, untouched. Kept because the folded form
  -- destroys exactly the evidence a merchandiser needs: 玫瑰, 🌹 and "!!!" all
  -- fold to the SAME empty string, and only this column shows that shoppers are
  -- searching in Chinese. Bounded at the engine's own MAX_QUERY_LENGTH.
  query_raw text not null check (length(query_raw) between 1 and 200),

  -- How many products the engine returned for this submit. 0 is the row that
  -- matters most; it is a real answer, not a missing value, so NOT NULL.
  result_count integer not null check (result_count >= 0),

  -- Which rung of the relaxation ladder answered, straight off SearchResult.mode:
  --   exact   — every word landed and every named facet was carried
  --   relaxed — the strict reading was empty, so some words were let go
  --   none    — nothing matched; `result_count` is 0 and the panel showed
  --             suggestions LABELLED as suggestions
  -- The engine's fourth mode, "all" (an empty box means show me everything), is
  -- deliberately absent: a submit with no text never reaches this table, so
  -- recording "all" here would mean a bug upstream. The constraint says so.
  mode text not null check (mode in ('exact', 'relaxed', 'none')),

  -- Facet slugs the QUERY ITSELF named, e.g. "gifts for mom" -> {mother}.
  -- Stored so the owner can see demand for a shelf ("valentines" spiking) and
  -- not only demand for a word. Same closed vocabulary as lib/catalog/facets.ts.
  facets text[] not null default '{}',

  created_at timestamptz not null default now()
);

-- The admin asks exactly two questions, both over a date range: "top queries"
-- and "top queries that found nothing". One range index serves the first; a
-- PARTIAL index serves the second, and stays small because it indexes only the
-- failures — which are the minority in a healthy shop and the whole point here.
create index if not exists search_queries_created_at_idx
  on public.search_queries (created_at desc);

create index if not exists search_queries_zero_result_idx
  on public.search_queries (created_at desc)
  where result_count = 0;

-- RLS: enabled with NO POLICY AT ALL — the page_views treatment. Postgres
-- denies everything under RLS until a policy allows it, so this table is
-- reachable only by the service role, which bypasses RLS. That is deliberate:
-- what shoppers search for (and what we fail to sell them) is business
-- intelligence, and the anon storefront key must never be able to read it.
-- The only writer is POST /api/search-queries, on service credentials.
alter table public.search_queries enable row level security;
