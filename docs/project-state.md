# Project state

Current deployment boundaries, release blockers, and decisions. Start with
[`SUMMARY.md`](../SUMMARY.md); see [`features/README.md`](features/README.md)
for feature status and [`ixd/README.md`](ixd/README.md) for UI details.

Last reconciled: **2026-07-27**

## Environment

- Testing deployment: <https://goldrose-storefront.vercel.app>. There are no
  real customers or public campaigns; all orders, analytics, and attribution
  are test data.
- Vercel deploys `main`. Hosted Supabase project `cfvsvgbldnzkcjvbwnjp` is
  connected; local development also uses it when Supabase variables are set.
- The [owner walkthrough](admin-design.md#143-final-acceptance) is pending.
  Cancel Shopify only after it passes.
- `FIGMA_TOKEN` has `file_content:read`; revoke it after design import work.

## Runtime and safety

### Local mode

Blank Supabase and PayPal variables to use `.data/db.json`; end-to-end tests use
this mode.

- `npm run seed -- --reset` restores local data.
- Admin is open unless `ADMIN_DEV_PASSWORD` is set.
- Customer sign-in is unavailable.

### Hosted mode

- Add migrations as `supabase/migrations/000N_*.sql`, then run
  `supabase db push`. Migrations `0001`–`0003` are applied.
- Do not use the Supabase web editor for migrations.
- Ad-hoc queries require Docker or a Management API token; Docker is currently
  unavailable.

### Release gates

- `CHECKOUT_SKIP_PAYMENT=1` is test-only and records uncharged mock orders.
  Remove it before launch; builds reject it with `PAYPAL_ENV=live`.
- Only the owner may enable live PayPal.
- Supabase configuration must be fully present or absent; the service-role key
  stays server-side.
- Money uses integer cents; orders are never hard-deleted.
- Storefront data revalidates every 300 seconds.
- Admin strings use `t()` for English and Shopify-style Chinese.
- Every exported `lib/` function requires JSDoc.
- [`admin-design.md`](admin-design.md) remains the authoritative spec. Keep
  [`ideas.md`](ideas.md) verbatim; change [`Database.md`](Database.md) only on
  explicit request.

## Implemented

- Storefront, admin, accounts, catalog, checkout/order flow, analytics, and
  SEO/GEO baseline are built.
- PayPal Orders v2 wallet checkout works in sandbox.
- Supplied mobile Figma screens are imported. Routes, placeholders, pixel
  differences, and design conflicts are tracked in
  [`ixd/README.md`](ixd/README.md).
- `/bag` items, tracking timeline, shipping choices, and card fields are visual
  placeholders. The real cart enters through `/checkout`.
- Product rails, occasion/MORI links, hover zoom, shop pagination, account
  fades, and shared carousels are wired.

## Release queue

1. Complete owner activation and the
   [acceptance walkthrough](admin-design.md#143-final-acceptance).
2. Configure customer auth as email one-time code: enable email, use
   `{{ .Token }}`, and configure launch-ready SMTP.
3. Configure PayPal sandbox and begin Advanced Checkout onboarding.
4. Fix customer order links that currently point to the leftover `/orders`
   admin redirect; use `/account` or build guest lookup.
5. Enter real shipping rates (OQ-2) and product content (OQ-3).
6. Replace third-party/dev imagery and reconcile palettes, wordmarks, and tabs.
7. Finish launch checks and configure
   [database backups](features/backend/db-backups.md).
8. After acceptance, capture screenshots, cancel Shopify, revoke the Figma
   token, and begin marketing.

Later: [promotion email consent](features/backend/promotion-emails.md),
[120-SKU imports](features/product-content-pipeline.md),
[supplier colors](supplier-color-charts.md),
[campaign ideas](ideas.md), and an
[EU read replica](features/backend/region-alignment.md#future).

## Product decisions

- **OQ-1 — Decided 2026-07-26:** use
  [PayPal Advanced Cards](features/card-payments.md) for Visa/Mastercard on the
  checkout page. Card processing is not built; Stage 0 is owner onboarding.
- **OQ-2 — Open:** rest-of-world shipping at `$19.95` is a placeholder.
- **OQ-3 — Open:** seed product details and some imagery are placeholders.

Use `temp/PlaceholderPicture.png` for explicitly unknown images.
