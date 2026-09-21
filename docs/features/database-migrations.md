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

## Applied state — ask, do not read

**This record does not list which migrations are applied.** It did, and the
list disagreed with its own Blockers section within two weeks. Run the query
instead; it is read-only and it cannot be stale:

```bash
supabase migration list        # from the MAIN checkout, never a worktree
```

The only durable fact is the one below: `0004` is skipped on purpose, so a gap
there is not a missing push.

⚠️ **`supabase db push` applies every unapplied file, not the one you have in
mind.** `0015` went up on 2026-09-20 as a passenger of the card-payment push,
though it had been held back on purpose. The rule that follows: the repository
*is* the queue, so a migration you are not ready to apply belongs outside
`supabase/migrations/` until you are.

Why the list went: a hand-written applied-state table claimed `0012` was
unpushed for weeks after it was live, and never mentioned `0013` or `0014`. A
reader went looking for broken search-analytics cards that had been working
the whole time.

### `0015` — page-view retention

Deletes `page_views` rows older than thirteen months, in batches. **Applied
2026-09-20.** It had been held back deliberately — the first migration here
that DELETES, meant to be pushed by a human who had read it — and it went up
with the next `supabase db push` regardless, because the CLI applies every
unapplied file. No harm: the oldest row is from July 2026, so it deletes
nothing until August 2027. The rule to carry forward is that the repository
is the queue; a migration you are not ready to apply belongs outside
`supabase/migrations/` until you are.

### `0016` — card payment columns

Adds `orders.payment_method_kind` / `card_brand` / `card_last4` and widens
`checkouts.status` with the terminal `rejected` (the Stripe drift hard-stop,
[card-payments](card-payments.md)). Written with the Stripe build,
deliberately not pushed with it: the code omits the new columns from every
insert until they exist, so main can deploy first and the push happens from
the main repo dir (CLI rule) with the usual pre-push dump. Push it before
setting `STRIPE_SECRET_KEY` in Vercel — a card order recorded without its
instrument columns loses nothing but the brand/last4 display, but the
`rejected` constraint must exist before the first real drift rejection.

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

- Whether anything is unpushed is answered by `supabase migration list`, not
  by this file.
- ⚠️ The CLI cannot push from a git worktree, so `supabase db push` has to be
  run from the main checkout.

## Related links

- [`supabase/migrations/`](../../supabase/migrations/) — the files themselves
- [`scripts/check-migrations.mjs`](../../scripts/check-migrations.mjs) ·
  [`tests/unit/check-migrations.test.ts`](../../tests/unit/check-migrations.test.ts)
- Table shapes: the migrations themselves, `supabase/migrations/*.sql` — change only
  on explicit request
- The workflow as a loadable rule card:
  [`.agents/skills/database/SKILL.md`](../../.agents/skills/database/SKILL.md)
- Verifying hosted by hand:
