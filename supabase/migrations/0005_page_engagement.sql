-- ----------------------------------------------------------------------------
-- 0005 — engagement tracking (features/backend/engagement-tracking.md): how
-- long a visit actually lasted, how far it scrolled, and which named sections
-- held attention. Three nullable columns on the existing page_views row — the
-- browser aggregates and flushes one summary per visit, so row count is
-- unchanged and every existing analytics query keeps working untouched.
--
-- NOTE the numbering: 0004 is deliberately skipped. The remote database holds
-- an orphan 0004 history row with no matching file (reverted in code
-- 2026-07-27); `supabase migration repair` clears it before this is pushed.
-- ----------------------------------------------------------------------------

-- Active time only: the client clock runs while the tab is visible and pauses
-- after 30s idle, so this is attention, not wall-clock. NULL (never 0) means
-- the closing beacon never arrived — an unknown, not a zero-second visit.
alter table page_views add column if not exists active_ms integer;

-- Deepest scroll reached, 0-100. NULL for the same reason as active_ms.
alter table page_views add column if not exists scroll_pct smallint;

-- Per-section active milliseconds, keyed by the data-el name the section
-- already carries in Figma, code and tests (docs/ixd/naming/component-names.md):
--   {"HOME-HERO-SECTION": 8200, "HOME-STORY-SECTION": 19500}
-- Exactly one section owns the clock at a time, so these sum to <= active_ms;
-- the gap is unattributed skim time and is itself a signal.
alter table page_views add column if not exists sections jsonb;

-- Where the visit stopped, for the drop-off report. Stored as its own column
-- rather than read off the end of `sections`, because jsonb does NOT preserve
-- key order — the "last" key of that blob is meaningless once Postgres has it.
alter table page_views add column if not exists last_section text;

-- Sanity bounds. Cheap to enforce here, and they document the contract for
-- anyone reading the schema without the feature doc to hand.
alter table page_views drop constraint if exists page_views_active_ms_check;
alter table page_views add constraint page_views_active_ms_check
  check (active_ms is null or active_ms >= 0);

alter table page_views drop constraint if exists page_views_scroll_pct_check;
alter table page_views add constraint page_views_scroll_pct_check
  check (scroll_pct is null or (scroll_pct >= 0 and scroll_pct <= 100));

-- The engagement flush finds its row by primary key, but the reports filter by
-- path and time ("median seconds on /products/x, last 30 days"). This partial
-- index keeps those scans off the rows that never reported engagement.
create index if not exists page_views_engagement
  on page_views (path, created_at)
  where active_ms is not null;
