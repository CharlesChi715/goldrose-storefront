---
name: database
description: "ELDREVE's own database rules — table shapes, SKU rules, and how a schema change is applied to the hosted Supabase project. Use BEFORE writing a migration, adding a table or column, changing a view, or running ad-hoc SQL against hosted. Triggers: migration, supabase db push, schema change, new table/column, RLS policy, SKU, catalog_products view, psql, hosted database, seed data. (For Supabase library/API/auth questions load the `supabase` skill instead — this one is about THIS project's rules.)"
metadata:
  author: charles
  version: "1.0.0"
---

# Database rules (this project)

**Table shapes are `supabase/migrations/*.sql`, and nothing restates them.**
No document lists columns: a column list written by hand disagrees with the
schema the first time anyone adds one. Read the migrations, or ask the database
(`\d orders` in `psql`). The row types in `lib/supabase/types.ts` are the
TypeScript mirror, checked by `npm run typecheck`.

SKU rules and the handle rule are implemented, not described:
`lib/admin/products.ts` and `lib/admin/product-handle.ts`, guarded by
`tests/unit/product-handle.test.ts`.

## Applying a change — the only accepted route

1. Write it as `supabase/migrations/000N_name.sql`.
2. `supabase db push`. **Never the web SQL editor** — an edit made there is
   invisible to the repo and to every other environment.
3. `npm run check:migrations` before pushing.

- ⚠️ The Supabase CLI only works from the **main repo directory**, never from a
  git worktree (the link lives in `supabase/.temp/`).
- **Which migrations are actually applied to hosted** — including the one that
  is permanently skipped and any that are written but unpushed — is state, so
  it lives in a record that CI watches: `docs/features/database-migrations.md`.
  Read it before assuming a table exists.

## Hazards that have already bitten

- ⚠️ **A migration that rebuilds a view must restate every other feature's
  fields.** `0010` rebuilt `catalog_products` from its pre-`0009` definition and
  silently dropped `stocked`, so a shop filter matched nothing. `0011` repaired
  it. `check:migrations` compares a rebuilt view's columns — a key nested inside
  a `jsonb_build_object` is one level below that. See
  `docs/features/shop-facets.md`.
- ⚠️ **New analytics gets its OWN table.** `page_views.path` and `.utm` are
  load-bearing (`path` groups reports, `utm` is landing attribution that feeds
  commissions); reusing them does not throw, it silently produces wrong
  reports.
- Analytics tables run **RLS enabled with no policy at all** — Postgres denies
  everything until a policy allows it, so only the service role reads them.
- Money is integer cents. Orders are never hard-deleted.

## Reading hosted directly

`psql` with `SUPABASE_DB_PASSWORD` from `.env.local`:
`aws-1-us-west-2.pooler.supabase.com:5432`, database `postgres`, user
`postgres.<project-ref>`. **Prefer read-only queries.** `supabase db dump`
needs Docker running.
