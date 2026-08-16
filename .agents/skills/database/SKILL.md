---
name: database
description: "ELDREVE's own database rules — table shapes, SKU rules, and how a schema change is applied to the hosted Supabase project. Use BEFORE writing a migration, adding a table or column, changing a view, or running ad-hoc SQL against hosted. Triggers: migration, supabase db push, schema change, new table/column, RLS policy, SKU, catalog_products view, psql, hosted database, seed data. (For Supabase library/API/auth questions load the `supabase` skill instead — this one is about THIS project's rules.)"
metadata:
  author: charles
  version: "1.0.0"
---

# Database rules (this project)

Shapes and SKU rules: [`docs/Database.md`](../../../docs/Database.md) —
`products` / `product_variants` / `product_images` column lists, SKU rules
(2026-07-24) and the SKU naming convention (2026-07-25).
⚠️ **Edit that file only on Charles's explicit request**, and keep it concise.

Table-by-table requirements live in `docs/admin-design.md` §7 (`admin-spec`
skill). RLS is §7.13.

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
