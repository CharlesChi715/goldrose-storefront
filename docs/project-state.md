# Project state

Read this only when the task depends on deployment state, test/live boundaries,
release blockers, or the current queue. For repository orientation, start with
[`SUMMARY.md`](../SUMMARY.md). Feature-level status belongs in
[`docs/features/README.md`](features/README.md); UI import history and design
findings belong in [`docs/ixd/README.md`](ixd/README.md).

Last reconciled: **2026-07-26**

## Environment and release state

- Everything is still in testing. There are no real customers or public
  marketing links; treat orders, analytics, and UTM data as test data.
- Testing deployment: <https://goldrose-storefront.vercel.app>
- Hosted Supabase project `cfvsvgbldnzkcjvbwnjp` is connected and contains
  live hosted data, but that data is test-only. Local development with the
  Supabase variables present reads and writes this same database.
- Vercel is deployed from `main`; the owner walkthrough in
  [`admin-design.md` §14.3](admin-design.md#143-final-acceptance) is pending.
- Shopify code has been removed. The owner should cancel Shopify only after
  the walkthrough passes.
- `FIGMA_TOKEN` exists in `.env.local` with `file_content:read`; revoke it
  after design import work is complete. Import notes and traps are in
  [`ixd/login-import.md`](ixd/login-import.md).

## Runtime modes and safety gates

### Local/file-adapter mode

Blank the Supabase and PayPal environment variables to use `.data/db.json`.
This is the mode used by end-to-end tests.

- `npm run seed -- --reset` restores pristine local data.
- Admin login is open-access unless `ADMIN_DEV_PASSWORD` is set.
- Customer `/account` reports that sign-in is unavailable.

### Hosted mode

- Supabase CLI is linked from the repository root. Add migrations as
  `supabase/migrations/000N_*.sql`, then use `supabase db push`.
- Migrations `0001`–`0003` are recorded on hosted Supabase; `0003` was
  verified live on 2026-07-25.
- Do not paste migrations into the Supabase web editor; that previously left
  migration history out of sync.
- Ad-hoc queries still require Docker (`supabase db dump`) or a Management API
  token. Docker is not usable in the current macOS environment.

### Payment bypass

`CHECKOUT_SKIP_PAYMENT=1` is testing-only. It replaces payment controls with a
single **Place order** action and records a mock order without charging money.
It overrides PayPal without changing the real payment implementation.

Remove it before launch. `npm run build` intentionally fails if it is combined
with `PAYPAL_ENV=live`. Only the owner may switch PayPal to live mode.

### Other invariants

- Money is stored as integer cents.
- Orders are never hard-deleted.
- The Supabase service-role key is server-side only.
- Admin UI strings go through `t()` and support English and Shopify-style
  Chinese.
- Storefront DB reads revalidate every 300 seconds.
- `npm run build` permits all three Supabase variables to be absent for local
  mode, but rejects partial configuration. A Vercel production build requires
  the URL, anon key, and service-role key.
- Every exported `lib/` function needs JSDoc.
- `// read:` near-literal explanations are used only in files Charles names;
  the current pilot is `lib/supabase/types.ts`.
- [`admin-design.md`](admin-design.md) is the authoritative spec; do not
  compress or renumber it.
- Keep [`ideas.md`](ideas.md) verbatim. Edit [`Database.md`](Database.md) only
  when Charles explicitly requests a database-decision change.

## Implemented product state

- Native checkout uses PayPal Orders v2, currently sandboxed. The schema stays
  provider-neutral pending OQ-1 confirmation.
- The storefront, admin, accounts, catalog, order flow, analytics, and
  SEO/GEO baseline are implemented. The feature roadmap is
  [`features/README.md`](features/README.md).
- The redesigned homepage, shop, login/B2B account screens, bag, checkout,
  partnerships, wholesale, tracking, confirmation, and menu frames have been
  imported. Exact routes, interaction decisions, placeholders, pixel-diff
  results, and conflicting design languages are documented in
  [`ixd/README.md`](ixd/README.md).
- `/bag` line items, the `/orders/track` timeline, checkout shipping-method
  choices, and mock card fields are presentation placeholders, not connected
  production features. The real cart still enters through `/checkout`.
- Product rails, occasion links, MORI path links, image hover zoom,
  `/shop?page=1…5`, account-tab fades, and shared carousel behavior are wired.
  Implementation details live beside the corresponding UI code and IxD docs.

## Release blockers and active queue

1. Complete the owner activation checklist. The detailed historical checklist
   is [`archive/BUILD-REPORT.md` §5](archive/BUILD-REPORT.md#5-owner-activation-checklist激活清单);
   where it conflicts with the current UI, the rules below win.
2. Configure storefront customer auth as **email one-time code only**:
   enable the email provider, make the template emit `{{ .Token }}` instead of
   only a magic link, and configure SMTP. The built-in sender is too limited
   for launch. Google, Apple, and storefront passkeys are intentionally absent;
   admin passkeys remain.
3. Configure PayPal sandbox and complete the §14.3 owner walkthrough.
4. Fix customer order navigation before launch: the success page's “View order
   log” and signed-in account's “VIEW MY ORDER” target `/orders`, which is a
   leftover admin redirect. Point them to `/account`, or build the promised
   guest lookup by order number and email. The current href is asserted in
   `tests/e2e/account.spec.ts`.
5. Decide and enter real shipping rates (OQ-2) and real product information
   (OQ-3).
6. Replace third-party/dev imagery, reconcile the two palettes/wordmarks and
   tab bars, and decide whether checkout needs real shipping methods and a
   card provider. See [`ixd/README.md`](ixd/README.md).
7. Finish launch checklist items, then establish database backups using
   [`features/backend/db-backups.md`](features/backend/db-backups.md).
8. After acceptance: capture required screenshots, cancel Shopify, revoke the
   Figma token, and begin marketing.

Later work:

- Promotion email consent and Resend audience:
  [`features/backend/promotion-emails.md`](features/backend/promotion-emails.md)
- 120-SKU admin/bulk-import pipeline:
  [`features/product-content-pipeline.md`](features/product-content-pipeline.md)
- Supplier color source (124 Y/YS/YC colors):
  [`supplier-color-charts.md`](supplier-color-charts.md)
- Influencer campaign and website-only video finale:
  [`ideas.md`](ideas.md)
- EU read replica if Europe launches:
  [`features/backend/region-alignment.md`](features/backend/region-alignment.md) §Future.

## Open product decisions

- **OQ-1 — Payment provider:** PayPal is the working assumption and is built.
- **OQ-2 — Shipping rates:** rest-of-world `$19.95` is a placeholder.
- **OQ-3 — Product content:** seed product information and some imagery are
  placeholders.

Use `temp/PlaceholderPicture.png` when an unknown image needs an explicit
placeholder. It contains only the word “PlaceHolder”.
