# Project state

Current deployment boundaries, connected-tool status, release blockers, and
decisions. The high-level product map belongs in [`SUMMARY.md`](../SUMMARY.md);
setup commands belong in [`README.md`](../README.md); feature and UI details
belong in [`features/README.md`](features/README.md) and
[`ixd/README.md`](ixd/README.md).

Last reconciled: **2026-07-27**

## Environment

- Testing deployment: <https://goldrose-storefront.vercel.app>. There are no
  real customers or public campaigns; all orders, analytics, and attribution
  are test data.
- Vercel deploys `main`. Hosted Supabase project `cfvsvgbldnzkcjvbwnjp` is
  connected; local development also uses it when Supabase variables are set.
- The [owner walkthrough](admin-design.md#143-final-acceptance) is pending.
  Shopify code is removed; cancel its subscription only after acceptance.
- `FIGMA_TOKEN` has `file_content:read`; revoke it after design import work.

## Connected tooling — verified 2026-07-27

- Git remote: `git@github.com:CharlesChi715/goldrose-storefront.git`. The `gh`
  CLI is installed and SSH authentication works as `CharlesChi715`, but its
  API token is invalid; run `gh auth login -h github.com` before `gh` API work.
- Vercel CLI `57.0.0` is installed, and `.vercel/project.json` links this
  repository to `goldrose-storefront`. It is authenticated as `vancechi`.
- Supabase CLI is authenticated and links the active, healthy project
  `cfvsvgbldnzkcjvbwnjp` (`GoldRose Project`).
- `psql` is installed; connection details are in
  [`README.md`](../README.md#tooling-and-connection-checks).
- Docker CLI is installed, and engine `28.4.0` is reachable.
- Neither `cloudflared` nor `ngrok` is installed. Add one only when PayPal
  webhook testing begins.

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
- Use `psql` for read-only ad-hoc queries. `supabase db dump` requires Docker;
  verify daemon access first.

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
- Supplied mobile Figma screens are imported, including the 2026-07-27
  batch: the signed-in account dashboards, customer orders list, gift
  reminders, signup, customer care, the search overlay, the shop sort/filter
  overlays, and four product-page drawers; the tab bar is renamed back to
  "Me" and `/bag` is re-imported after the design's polish pass. Routes,
  placeholders, pixel differences, and design conflicts are tracked in
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
3. Configure PayPal sandbox and begin Advanced Checkout onboarding. Install
   `cloudflared` or `ngrok` when webhook testing starts.
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
