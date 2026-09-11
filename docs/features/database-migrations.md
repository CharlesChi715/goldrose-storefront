---
delivery: in-progress
rollout: live
statusChangedAt: 2026-08-15
priority: p1
---

# database-migrations

## Context

The hosted schema is changed only by numbered SQL files applied from this
repository. This record is where **which of them are actually applied** lives —
the one fact about this project that goes stale fastest, because code deploys
itself on merge while a migration is pushed by hand.

## Decision

A schema change is a file — `supabase/migrations/000N_name.sql` — applied with
`supabase db push`. **Never the web SQL editor:** an edit made there exists in
one database and in no repository, so no other environment, review or rollback
can ever see it.

## Applied state — verified 2026-09-07

Read from the hosted project itself, not from memory:
`select version from supabase_migrations.schema_migrations order by version`
returned exactly `0001 0002 0003 0005 0006 0007 0008 0009 0010 0011 0012 0013
0014`. Anyone may repeat that query — it is read-only, and it is the only
answer that cannot be stale.

| Migration      | Hosted           | Note                                                                                 |
| -------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `0001`–`0003`  | applied          | init, customer auth, tracking + hardening                                            |
| `0004`         | **skipped**      | permanently; its orphan history row was repaired 2026-07-28 — intentional, not a gap |
| `0005`–`0008`  | applied          | page engagement, `orders.auth_user_id`, reviews, focal point                         |
| `0009`–`0011`  | applied 08-07    | facets, image spotlights, and the view repair `0011` needs                           |
| `0012`–`0014`  | applied          | search queries, advisor keys, advisor key grants                                     |
| `0015`         | **NOT pushed**   | `page_views` retention; written 2026-09-07, see below                                |

**Every migration file in the repository is applied except `0015`.** This table
said otherwise until 2026-09-07: it claimed `0012` was unpushed and did not
mention `0013` or `0014` at all, so a reader would have gone looking for empty
search-analytics cards that had in fact been working for weeks. The lesson is
in the heading — this section is dated because it decays, and the query above
is how to re-date it.

### `0015` — page-view retention

Deletes `page_views` rows older than thirteen months, in batches. Written and
validated, deliberately not pushed: it is the first migration here that
DELETES, and it should be pushed by a human who has read it rather than
arriving as a surprise in someone else's change. Pushing it is safe today —
the oldest row is from July 2026, so it deletes nothing at all until August
2027, which is exactly the right time to install a rule like this.

## Tech details

- ⚠️ **Push order can be load-bearing.** `0009` added `stocked` to the
  `catalog_products` view; `0010` rebuilt that view from its pre-`0009`
  definition and dropped the field again. `0011` restates the view with both
  features' fields. The rule that follows: **a migration that rebuilds a view
  must restate every other feature's fields.** Full incident:
  [shop-facets](shop-facets.md).
- `npm run check:migrations` guards this, imperfectly by design: it compares a
  rebuilt view's **columns**, and a key nested inside a `jsonb_build_object` is
  one level below that. Extended 2026-08-07 to read those keys too.
- ⚠️ **The Supabase CLI only works from the main repo directory**, never from a
  git worktree — the project link lives in `supabase/.temp/`.
- **The read side must survive an unpushed migration.** `remote.ts`'s `all()`
  throws on a missing table, inside the `Promise.all` that builds
  `analyticsSummary` — so an unpushed `0012` would have taken down the whole of
  `/admin/analytics`, sales cards included. `cachedAllOptional` degrades that
  one read and logs it, and is **for optional tables only**: a missing `orders`
  must still fail loudly.
- Ad-hoc reads: `psql` with `SUPABASE_DB_PASSWORD` from `.env.local`
  (`aws-1-us-west-2.pooler.supabase.com:5432`, user `postgres.<project-ref>`).
  `supabase db dump` needs Docker running.

## Blockers and dependencies

- **`0015` is the only outstanding push**, and it blocks nothing: it removes
  analytics rows that do not exist yet. See above.
- ⚠️ The CLI cannot push from a git worktree, so `supabase db push` has to be
  run from the main checkout.

## Related links

- [`supabase/migrations/`](../../supabase/migrations/) — the files themselves
- [`scripts/check-migrations.mjs`](../../scripts/check-migrations.mjs) ·
  [`tests/unit/check-migrations.test.ts`](../../tests/unit/check-migrations.test.ts)
- Table shapes and SKU rules: [`docs/Database.md`](../Database.md) — change only
  on explicit request
- The workflow as a loadable rule card:
  [`.agents/skills/database/SKILL.md`](../../.agents/skills/database/SKILL.md)
- Verifying hosted by hand:
  [`docs/learning/05-verifying-the-hosted-database.md`](../learning/05-verifying-the-hosted-database.md)
