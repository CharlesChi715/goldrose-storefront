# Full-repo review — 2026-07-23

Four-dimension review (security, data layer, code quality, tests/tooling). Findings verified against code; file:line references included. Prioritized: fix Tier 1 before the activation checklist finishes; Tier 2 before real traffic.

## Tier 1 — before activation (real money / public writes)

1. **Anon can execute the inventory RPCs.** `supabase/migrations/0001_init.sql:88-105` (`adjust_inventory`) and `:138-142` (`next_order_number`) are SECURITY DEFINER functions; table grants are revoked (line 437) but function EXECUTE is not, and Supabase grants EXECUTE on public-schema functions to `anon`/`authenticated` by default. Anyone with the public anon key can set any variant's stock via `POST /rest/v1/rpc/adjust_inventory`. Fix: `REVOKE EXECUTE ... FROM public, anon, authenticated;` per function (one migration).
2. **Mock checkout mints "paid" orders whenever PayPal is unconfigured.** `app/api/checkout/route.ts:57-64` only checks `getPayPalConfig().configured`. The activation plan wires Supabase env vars *before* PayPal — in that window, anyone can POST and create a paid order, decrement real inventory, burn discount usage, and trigger emails. Gate mock checkout behind an explicit env flag (e.g. only when not hosted), not "PayPal absent".
3. **Refund double-spend race.** `lib/admin/orders.ts:235-259` reads `refunded_cents`, calls the real PayPal refund API, then writes a JS-computed total. Two concurrent submissions (double-click / two admins) both pass validation → PayPal refunds twice, DB records once. Needs a conditional update (match on prior `refunded_cents`) + DB `CHECK (refunded_cents <= total_cents)`.
4. **Guaranteed oversell.** `lib/checkout/pricing.ts:101-121` never checks stock; `adjust_inventory` (SQL) has no `WHERE inventory_on_hand >= n` and no `CHECK >= 0`. Two buyers of the last unit both pay; a stale cart can buy a sold-out item (`in_stock` only gates display). Add an atomic guarded decrement and fail checkout when it doesn't apply.
5. **Order creation is non-transactional with scan-then-insert idempotency.** `lib/orders/db.ts:129-251`: dedup by scanning all orders for `provider_order_id`, then ~6 sequential writes (order → lines → stock → events → checkout → email). Race between capture route and webhook repair, or a mid-sequence crash, leaves a charged buyer with a 400 / an order with no lines. Wrap in a Postgres function/RPC for hosted mode; rely on the UNIQUE constraint, not the scan.

## Tier 2 — before real traffic

6. **Stored XSS via JSON-LD.** `app/products/[slug]/page.tsx:186`, `app/page.tsx:257`: `JSON.stringify` into `<script type="application/ld+json">` doesn't escape `<` — a product title containing `</script><script>` executes on the storefront. Escape `<` as `<` before injecting.
7. **CSV formula injection in admin exports.** `app/api/admin/orders/export/route.ts:9-12` (and customers export): leading `=` `+` `-` `@` in customer-supplied fields execute as formulas in Excel/Sheets. Prefix-escape those cells.
8. **`page_views` is unbounded in both directions.** Writer `app/api/beacon/route.ts:22-53` is unauthenticated, unthrottled, fully client-spoofable, and writes via service role; reader `lib/admin/analytics.ts:108-112` loads the ENTIRE table on every admin Home/Analytics render (hosted pages 1000 rows/round-trip). Root cause: `TableStore` has no range/limit queries. Needs: date-bounded reads (90d covers all ranges), basic rate limiting, and a retention/rollup plan. Same rate-limit gap applies to `/api/feedback`.
9. **No CI, no gates.** No `.github/workflows`, no `typecheck` script, nothing runs eslint; the only check is Vercel's `next build`. Add a workflow: `eslint + tsc --noEmit + test:unit + test:e2e` (pixel baselines are darwin-only — scope them out or generate Linux baselines).
10. **The money path and hosted backend ship untested.** Playwright deliberately blanks PayPal + Supabase env: `lib/paypal/client.ts` (create/capture/refund), `lib/supabase/remote.ts`, and all hosted auth flows (signup/approval, reset password, passkeys, OAuth) have zero coverage. The file adapter also enforces no unique constraints and serializes all ops (`lib/supabase/local.ts:55-59`), so the races in Tier 1 can never surface in e2e. Minimum: a PayPal-sandbox integration test and a hosted-Supabase smoke checklist before activation; longer-term a TableStore contract test suite run against both backends.

## Tier 3 — robustness / maintainability

11. **Zero error/loading boundaries.** No `error.tsx`, `loading.tsx`, `not-found.tsx`, or `<Suspense>` anywhere; the data layer throws on any transient failure → buyers see Next's raw error screen. Cheapest high-leverage fix in the list.
12. **More check-then-write races**: fulfill vs cancel can yield a fulfilled AND cancelled order (`lib/admin/orders.ts:180,280` — make updates conditional on current state); discount `used_count` lost-update lets a limit-100 code redeem 100+ (`lib/checkout/discounts.ts:130-141` — use SQL increment).
13. **Whole-table fetches & N+1**: `all(...).find(id)` instead of `where()` in `lib/admin/orders.ts:164`, `drafts.ts:56,87`, `discounts.ts:26`, `products.ts:113`, `lib/account/data.ts`; `deleteProducts` re-fetches all variants per id (`products.ts:356-370`).
14. **Missing DB safety nets**: no FK indexes on any child table (order_lines, order_events, inventory_movements, product_variants…), no money CHECK constraints (negative totals possible, percentage discounts store up to 100,000,000).
15. **Backend semantic drift traps**: local `where({col: null})` matches NULL, PostgREST `eq.null` matches nothing; `undefined` in patches stored locally, dropped hosted; row-order differs. Plus `in_stock` logic duplicated in SQL view (`0001_init.sql:400`) vs TS (`lib/supabase/catalog.ts:74-77`).
16. **Admin error UX**: server actions surface raw `error.message` (English-only, leaks internals, bypasses `t()` — violates §9.12); `ActionResult` plumbing copy-pasted across ~6 action files; `ProductForm.tsx:311-322` silently ignores Duplicate/Archive failures.
17. **Forum**: delete has no author check (`forum/actions.ts:177-191`); edit "auth" is a spoofable self-set nickname cookie. Acceptable for the testing-phase trust model, revisit before wider access. Also drop `.svg` from the upload whitelist (`lib/admin/files.ts:39` — stored XSS on app origin in file-adapter mode).

## Tier 4 — housekeeping

18. No `revalidatePath` anywhere — admin freshness depends on each client calling `router.refresh()`; product saves don't invalidate the storefront's 300 s ISR.
19. `$${(cents/100).toFixed(2)}` hand-rolled in ~12 places despite `lib/money.ts` existing.
20. `node --test tests/unit/*.test.ts` relies on Node ≥22.6 type-stripping while `@types/node` is pinned `^20` — align both.
21. Stale tracked snapshot `tests/e2e/stage9-live-data.spec.ts-snapshots/` (441 KB, dead — snapshotPathTemplate routes elsewhere); `assets/` (6.9 MB) referenced by no code.
22. Four 600–850-line single-function client components (`ProductForm`, `CheckoutClient`, `OrderDetailView`, `SettingsView`) — extract per Polaris card/modal when next touched.

## Addendum — merged from second (Codex) review, spot-verified 2026-07-23

Findings the first pass missed; the top four verified by reading the code:

A1. **PayPal capture can record a total different from the amount captured** (High). `app/api/paypal/capture/route.ts:53-68` re-prices from the *current* catalog after capture; on mismatch it only `console.error`s and records the re-priced total — books diverge from PayPal. Webhook repair has the same shape. Fix: persist an immutable priced snapshot on the `checkouts` row at PayPal-order create and finalize from it (re-price only shipping when PayPal's ship-to country differs).
A2. **Inventory model double-counts committed units** (High). Paid orders decrement `inventory_on_hand` at capture (`lib/orders/db.ts:196`), but `listVariantInventory` (`lib/admin/products.ts:380+`) computes available = on_hand − committed(paid-but-unfulfilled) — subtracting the same sale twice. Sell 2 of 10 → shows available 6, truth is 8. Pick one model: either decrement on_hand at fulfillment (Shopify-style) or drop the committed subtraction.
A3. **Displayed variant ≠ purchased variant** (Med). `app/products/[slug]/page.tsx:139-140` adds the first *in-stock* variant to cart while the page renders `variants[0]`'s price/SKU — if variant 0 is out of stock or priced differently, the buyer sees one price and buys another variant. Option selectors are inert.
A4. **Mock card form collects PAN/CVC on a public page** (Med). `app/checkout/CheckoutClient.tsx:546+` — mock-only and unstored, but a live demo invites real card entry and expands PCI scope. Keep mock card entry non-production; real cards must use provider-hosted fields.
A5. Storefront still shows placeholder/unsupported claims (fake review counts, Shop Pay/Klarna badges, apparel copy) — known as OQ-3, but note payment-provider review will also care.
A6. No public legal/support pages (privacy, terms, returns, shipping, contact) — needed for trust and PayPal merchant review.
A7. No security headers (CSP, Referrer-Policy, Permissions-Policy) in `next.config.ts`; needs a PayPal-compatible CSP.
A8. Forum attachments live in the public product-image bucket and aren't deleted with their posts (`lib/admin/files.ts:50`, `0001_init.sql:445`) — reported by the second review, not independently verified here.
A9. Build reproducibility/perf: Google Fonts fetched at build time (`lib/fonts.ts:9` — self-host); storefront bypasses `next/image` with several >500 KB images.
A10. Their verification run: lint, strict tsc, build, 20/20 unit pass; e2e 54/55 with one toast-synchronization flake worth fixing.

## What's already solid

PayPal amounts re-priced server-side (client can't tamper) + webhook signature verification; RLS deny-by-default with minimal anon surface; service key confined to `server-only` modules; auth fails closed on partial config; OAuth callback rejects open redirects; integer-cents money math throughout; strict TS with near-zero `any`; no secrets in tree or history; clean, current dependencies; e2e count honest (54 actual vs 55 claimed — only off by one).
