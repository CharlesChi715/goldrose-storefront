-- ----------------------------------------------------------------------------
-- 0015 — a retention rule for page_views (docs/features/engagement-tracking.md).
--
-- Why this exists: `page_views` is the only table in this schema that grows
-- without anyone deciding to add a row. Every visit writes one, forever, and
-- each row carries a visitor id, a session id, a path, a referrer, campaign
-- parameters and a country. That is behavioural data about identifiable
-- people, kept for no stated period, on a free-tier database with a size cap.
--
-- Two problems in one, and the second is the one that bites:
--   1. Unbounded growth. Analytics is the only table here with no natural
--      ceiling, and the free tier stops accepting writes when the database
--      fills — which would take down ORDERS, not just reports.
--   2. "How long do you keep it?" is a question a shop is eventually asked and
--      must be able to answer. The market is the United States first and
--      Europe possibly later (SUMMARY.md), and in Europe "we kept it forever
--      because nobody deleted it" is not an answer. Deciding the period now,
--      while the table is small and the answer costs nothing, is far cheaper
--      than deciding it under a request.
--
-- THIRTEEN MONTHS, and the reason is year-on-year comparison. Twelve months
-- would delete last December before this December could be compared against
-- it; the extra month is the overlap that makes "how did we do versus last
-- year" answerable. It is also a common retention default, which matters if
-- the number is ever questioned.
--
-- IT DELETES NOTHING TODAY. The oldest row dates from July 2026, so the first
-- row this rule removes is one written in July 2026, removed in August 2027.
-- That is the point of installing it now: a retention rule written while it is
-- a no-op can be reasoned about calmly, and a retention rule written the day
-- the disk fills cannot.
--
-- ORDERS AND CUSTOMERS ARE NOT TOUCHED, and must never be added here. They are
-- commercial records with their own legal retention obligations, and this file
-- is deliberately about the one table that is purely observational.
--
-- NOT SCHEDULED BY THIS MIGRATION, on purpose. Scheduling needs the pg_cron
-- extension, whose availability depends on the plan, and a `create extension`
-- that fails takes the whole migration down with it — including the function
-- below, which is the part that has value. So this file only installs the
-- capability. Turning it on is one line, recorded in
-- docs/features/engagement-tracking.md, and can be done from the Supabase
-- dashboard's cron integration or from a scheduled job that calls the
-- function. Until then, calling it by hand once a year is enough.
-- ----------------------------------------------------------------------------

-- Batched rather than one big delete. A single `delete from page_views where
-- created_at < ...` takes row locks on everything it touches and holds them
-- for the whole statement; on a table with a year of traffic that is a long
-- lock on the table the beacon is trying to insert into, so visits would fail
-- to record while the cleanup ran. Deleting in slices keeps every lock short,
-- and a slice that fails leaves the earlier slices done rather than rolling
-- back an hour of work.
create or replace function public.prune_page_views(
  retain interval default interval '13 months',
  batch_size integer default 5000,
  max_batches integer default 1000
)
returns bigint
language plpgsql
-- SECURITY DEFINER so a scheduled caller need not be an owner of the table.
-- The `search_path` is pinned for the usual reason: without it, whoever calls
-- this could put their own `page_views` earlier on the path and have a
-- privileged function operate on their table instead.
security definer
set search_path = public, pg_temp
as $$
declare
  cutoff timestamptz := now() - retain;
  removed bigint := 0;
  slice integer;
  guard integer := 0;
begin
  -- A floor on the cutoff, not a nicety: `prune_page_views(interval '0')` would
  -- otherwise delete the entire table, and this function is exactly the kind of
  -- thing someone calls with a hand-typed argument at the end of a long day.
  if retain < interval '30 days' then
    raise exception
      'prune_page_views: refusing to keep less than 30 days (asked for %)',
      retain;
  end if;

  loop
    guard := guard + 1;
    -- max_batches bounds the work of one call so this can never become an
    -- unkillable statement; whatever is left is removed by the next run.
    exit when guard > max_batches;

    delete from public.page_views
    where id in (
      select id
      from public.page_views
      where created_at < cutoff
      limit batch_size
    );

    get diagnostics slice = row_count;
    removed := removed + slice;
    exit when slice = 0;
  end loop;

  return removed;
end;
$$;

comment on function public.prune_page_views(interval, integer, integer) is
  'Delete page_views older than `retain` (default 13 months) in batches. '
  'Returns the number of rows removed. Refuses a retention under 30 days. '
  'See migration 0015 and docs/features/engagement-tracking.md.';

-- The default grant on a new function is EXECUTE to PUBLIC, which on Supabase
-- means anon and authenticated can call it through PostgREST. A
-- SECURITY DEFINER function that deletes, callable by anyone with the public
-- anon key, would be a way for a stranger to erase our analytics. Revoke
-- first, then grant narrowly.
revoke all on function public.prune_page_views(interval, integer, integer)
  from public, anon, authenticated;

grant execute on function public.prune_page_views(interval, integer, integer)
  to service_role;

-- Retention is only affordable if finding the old rows is cheap. Without this,
-- each run sequentially scans the whole table to find what to delete — the one
-- operation that gets slower exactly as the table gets bigger.
create index if not exists page_views_created_at_idx
  on public.page_views (created_at);
