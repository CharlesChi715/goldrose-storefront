---
delivery: uat
rollout: live
statusChangedAt: 2026-08-07
priority: p2
---

# shop-facets

## Context

`/shop`'s filter drawer filters for real (2026-08-07, `feat/best-for-facets`):
`products.best_for` changed from a dormant prose blurb into `text[]` holding
filter slugs (migration `0009`, pushed to hosted 2026-08-07), so a product may
carry any number of them.

## Decision

One closed vocabulary in [`lib/catalog/facets.ts`](../../lib/catalog/facets.ts)
— eleven stored slugs under Collections / Occasion / Recipient, plus Price and
Availability **computed** from `price_cents` and stock and never stored — and
the selection lives in the URL (`?f=jewel,anniversary`, noindexed) so the grid,
the count and the pager cannot disagree.

## Tech details

- **OR inside a heading, AND across headings** — the combination a shopper
  expects from every store's drawer.
- **Price takes one band at a time and swaps** (owner, 2026-08-07). The rule is
  a `select` field on the group rather than a UI behaviour, so a hand-typed URL
  asking for two bands is narrowed to one too.
- **Slugs are globally unique**, which is what lets a value alone recover its
  group; a duplicate throws at import rather than filtering under two headings.
- The admin's "Best for" free-text box became a grouped multi-select, so the
  vocabulary cannot be widened by typing.
- ⚠️ **The frames' two fixed active-filter chips ("Ruby Red", "Gift Sets") are
  gone.** An unfiltered shop correctly shows none; that is the only pixel
  change (`/shop` baseline updated, home and PDP byte-identical).
- ⚠️ **The view hazard this feature exposed, worth knowing before writing any
  migration.** `0009` added `stocked` to the `catalog_products` view; `0010`
  rebuilt that view from its pre-`0009` definition and silently dropped the
  field again, so "Ready to Ship" matched nothing and "Pre-Order" matched
  everything sellable. `0011` restates the view with both features' fields and
  is applied. `npm run check:migrations` missed it because it compares a
  rebuilt view's **columns**, and `stocked` is a key inside the `variants`
  `jsonb_build_object`, one level below what the heuristic read — extended
  2026-08-07 to read those keys too.

## Related links

- Vocabulary: [`lib/catalog/facets.ts`](../../lib/catalog/facets.ts) · migration
  [`0009_product_best_for_facets.sql`](../../supabase/migrations/0009_product_best_for_facets.sql)
  · view repair
  [`0011_catalog_products_restore_stocked.sql`](../../supabase/migrations/0011_catalog_products_restore_stocked.sql)
- The same vocabulary is what a typed query filters on:
  [storefront-search](storefront-search.md)
- Tests: [`tests/unit/facets.test.ts`](../../tests/unit/facets.test.ts),
  [`tests/e2e/shop-filters.spec.ts`](../../tests/e2e/shop-filters.spec.ts)
