# AI Handoff

Last updated: 2026-06-28 17:56 AEST
Agent: Claude

## Current Task

Branches consolidated into `main` (the owner was overwhelmed by parallel
branches). The Shopify checkout path is merged; the ideas/learning docs are
folded in; the in-progress Stripe exploration is archived on `stripe-checkout`.

On top of that, built a unified checkout offering **Shop Pay, credit card, and
PayPal**. All three are served by one Shopify checkout in live mode (Shop Pay
and PayPal as accelerated wallets, card via Shopify Payments) and are fully
mocked by default — no real money, order, or stored card number. Shopify was
chosen as the single backend because Shop Pay only exists on Shopify; Stripe
(archived) cannot offer it. See `docs/checkout.md`.

### New checkout files

- `lib/cart/store.ts` — `useCart()` localStorage cart shared by storefront + `/checkout`.
- `lib/checkout/{types,methods,card,mock,client}.ts` — method registry, Luhn
  card validation (format only, no PAN storage), mock order processor with
  server-side re-pricing and live Shopify hand-off, and the express helper.
- `app/api/checkout/route.ts` — validates input, calls `processCheckout()`.
- `app/checkout/{page,success/page,cancel/page}.tsx` — checkout UI + result pages.
- `components/Storefront.tsx` — refactored onto `useCart`; drawer now has Shop Pay
  + PayPal express buttons and a Checkout · Credit Card button.

## Earlier Task (Shopify path, now merged into main)

Added a Shopify-first checkout path: the cart posts to a Next.js API route that
returns a local Shopify-shaped cart in mock mode or calls Storefront API
`cartCreate` in live mode.

## Changed Files

- `components/Storefront.tsx` - replaced the disconnected checkout alert with a
  Shopify Checkout button, loading state, mock success message, and live-mode
  redirect behavior.
- `app/api/shopify/cart/route.ts` - added server route for Shopify cart creation
  with JSON parsing, line validation, quantity limits, and sanitized attributes.
- `lib/shopify/config.ts` - added Shopify mode/config handling, domain
  normalization, API version pinning, and live credential validation.
- `lib/shopify/client.ts` - added Storefront API GraphQL `cartCreate` mutation,
  live response normalization, and mock/live switching.
- `lib/shopify/mock.ts` - added local Shopify-shaped cart creation for safe
  development without payment/order/inventory side effects.
- `lib/shopify/types.ts` - added shared Shopify cart/request TypeScript types.
- `lib/products.ts` - added handles, mock Shopify product IDs, mock Shopify
  variant IDs, and tags to each product.
- `.env.example` - added safe Shopify environment variable template.
- `.gitignore` - allows `.env.example` while ignoring real `.env*` files and
  `.claude/`.
- `eslint.config.mjs` - excludes `.claude/**` and `temp/**` from lint scans.
- `README.md` - updated project map to explain Shopify mock mode and the new
  API route.
- `docs/shopify-integration.md` - added beginner-friendly Shopify integration
  guide, env setup, product mapping, and admin checklist.
- `docs/mock-business-decisions.md` - updated checkout section to match the
  Shopify mock/live direction.
- `lib/business.ts` - updated mock launch decision text for Shopify checkout.
- `.ai/HANDOFF.md` and `.ai/WORKLOG.md` - updated agent memory.

## Decisions Made

- Shopify is the selected checkout direction for this branch.
- Default mode is `SHOPIFY_MODE=mock`, so local testing creates no payment,
  Shopify order, tax calculation, inventory mutation, or customer email.
- `SHOPIFY_MODE=live` now fails clearly if `SHOPIFY_STORE_DOMAIN` or
  `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is missing.
- The Storefront API version is pinned to `2026-04`, based on the current
  official Shopify Storefront API docs checked during this work.
- The browser calls the local route `POST /api/shopify/cart`; Shopify token and
  API details stay in server-side code.
- Real Shopify product and variant IDs are not available yet, so `lib/products.ts`
  uses mock GraphQL IDs shaped like `gid://shopify/ProductVariant/...`.
- Local product data remains the catalog source of truth for now. Later, Shopify
  can become the product source of truth.

## Commands / Tests Run

- `git status --short --branch`
- `sed -n '1,220p' .ai/HANDOFF.md`
- Read local Next route-handler and fetch docs from `node_modules/next/dist/docs/`.
- Checked official Shopify docs for Storefront API version, GraphQL endpoint,
  product admin, cart management, and checkout settings.
- `npm run lint` passed.
- `npm run build` initially caught TypeScript narrowing issues, then passed.
- `curl -I http://127.0.0.1:3000/` returned `200 OK`.
- `curl -X POST http://127.0.0.1:3000/api/shopify/cart ...` returned a mock
  Shopify cart with subtotal `$99.98`, mode `mock`, and the expected no-real-
  Shopify-action warning.

## Known Issues

- No real Shopify store is connected yet.
- Mock Shopify product IDs and variant IDs in `lib/products.ts` must be replaced
  with real GraphQL IDs after products are created in Shopify.
- Live checkout has not been tested because there is no real store domain,
  Storefront API token, Shopify product setup, tax setup, or shipping setup yet.
- No Shopify webhook/order sync exists. Orders should live in Shopify first.
- Local UI prices/inventory may drift from Shopify later unless Shopify becomes
  the source of truth or a sync process is added.
- No real policy pages, analytics, email provider, or production domain yet.
- Product copy, pricing, origin, shipping, returns, and legal/compliance claims
  remain placeholders and need owner/professional review before launch.
- `npm install` previously reported 2 moderate vulnerabilities and pending npm
  script approvals for `sharp` and `unrs-resolver`; do not run force fixes
  blindly.
- Dev server appears to be running at `http://localhost:3000` from the prior
  session.

## Next Steps

1. Review the Shopify guide in `docs/shopify-integration.md`.
2. Create the real Shopify store and three products.
3. Copy real Shopify product and variant GraphQL IDs into `lib/products.ts`.
4. Configure Shopify Payments, tax, shipping, refund policy, privacy policy,
   terms, and shipping policy.
5. Create `.env.local` from `.env.example` and switch `SHOPIFY_MODE=live`.
6. Test live mode with Shopify test payment settings before taking real orders.
7. Decide whether to keep local product data or fetch products from Shopify.
8. Add policy pages and real email capture before launch.
