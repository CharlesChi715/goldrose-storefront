> **ARCHIVED 2026-07-23.** Shopify-era snapshot — `lib/products.ts`, cart
> permalinks and `launch-checklist.md` no longer exist. Current state lives in
> `SUMMARY.md`; the spec is `docs/admin-design.md`.

# Buyer flow map — every step, its implementation, and its status

This walks the whole shopper journey one step at a time: how each step works
today, what's real vs simulated, and what could replace it later. Update the
statuses here whenever a step changes — this doc and `SUMMARY.md` are the
"where are we" pair; `docs/launch-checklist.md` stays the "what to do" list.

Legend: ✅ real / live · 🟡 simulated (mock) · ⬜ not built yet · 💡 future option

---

## 1. Land on the site — ✅ live

- Deployed at <https://goldrose-storefront.vercel.app> on Vercel.
- `app/page.tsx` (Server Component) does the SEO work — structured data,
  noscript fallback — and renders `components/Storefront.tsx`: header, hero,
  story sections, product grid, footer, and the slide-in cart drawer.
- `/shop` (`app/shop/page.tsx`) is a separate pixel-exact Figma import — a
  design reference page, not wired into the buying flow.
- ⬜ Real domain (still on the vercel.app address) — launch checklist.
- 💡 SEO/GEO baseline ships with the admin build ([admin-design.md](../admin-design.md) §8.1);
  post-launch levers tracked in `docs/seo-geo/seo-intro.md`.

## 2. Browse products — ✅ real data

- `lib/products.ts` is the catalog: 3 products with real prices (stored in
  cents) and the **real Shopify product/variant GIDs**. Every page, the cart,
  and checkout look products up here — one place to change anything.
- 💡 Future: fetch the catalog from Shopify instead of hard-coding it (worth
  it only if products start changing often).

## 3. Add to cart — ✅ works (browser-only)

- `lib/cart/store.ts`: the cart lives in the browser's localStorage and every
  page reads it through one `useCart()` hook, so the drawer and `/checkout`
  always agree. The cart never leaves the browser until checkout starts.

## 4. Choose how to pay — ✅ UI real

- Three buttons — Shop Pay, Credit Card, PayPal — defined once in
  `lib/checkout/methods.ts`; the cart drawer and `/checkout` render from that
  registry.
- `/checkout` (`app/checkout/page.tsx`): express buttons + full card form +
  live order summary.

## 5. Pay — three parallel paths

### 5a. Live path today: cart permalink — ✅ (PayPal confirmed)

- `lib/shopify/permalink.ts` builds
  `https://goldrose-9372.myshopify.com/cart/{variantId}:{qty}` and the browser
  navigates straight to Shopify's hosted checkout. No token, no server call.
- Switched on by `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` (set in production and in
  `.env.local`; unset it to fall back to mock).
- ✅ PayPal: real payment confirmed 2026-07-15.
- ⬜ Card + Shop Pay inside the hosted checkout: waiting on **Shopify
  Payments** activation (launch checklist Phase 2).

### 5b. Local dev path: mock checkout — 🟡 simulated

- `POST /api/checkout` (`app/api/checkout/route.ts` → the engine in
  `lib/checkout/process.ts`): re-prices the cart from the catalog (never
  trusts browser prices), validates the card **format-only**
  (`lib/checkout/card.ts` — Luhn/expiry, can never charge), and simulates
  approval. Default whenever the env vars above are unset. No money moves.

### 5c. Future path: Storefront API — 💡 built but dormant

- `lib/shopify/client.ts` (`cartCreate` GraphQL mutation) +
  `lib/shopify/config.ts`. Needs `SHOPIFY_MODE=live` and
  `SHOPIFY_STOREFRONT_ACCESS_TOKEN` — neither is set anywhere yet, so it
  always swaps in the fake cart from `lib/shopify/mock.ts` today.
- What it buys over permalinks: per-cart checkout URLs and buyer email
  prefill. The natural next step once a Storefront API token is created.

## 6. After paying

- **Live**: the buyer completes payment inside Shopify's flow; **Shopify
  admin is the system of record** for real orders. ⬜ No webhook or
  notification back into this app yet.
- **Mock**: redirect to `/checkout/success` (order details passed as
  validated URL params). Backing out of a hosted checkout lands on
  `/checkout/cancel` — reassurance page, cart stays intact.

## 7. See orders

- 🟡 `/orders` (`app/orders/page.tsx` + `lib/orders/store.ts`): an internal
  demo log of **mock** orders only, saved to a local JSON file. Not linked
  from customer navigation; live orders never land here.
- 💡 Future: customer order-status page / email notifications via Shopify.

## 8. Fulfillment, tax & policies — ⬜ mostly pending

- Tax setup, real shipping rates, policy pages, and confirmation of the
  business facts are launch checklist Phases 1–3.
- Provisional values (shipping offer, returns, warehouse, origin wording)
  live in `lib/business.ts` — see its `launchDecisions` list for what still
  needs the owner's confirmation.

---

## Open items (not tied to one step)

- (2026-07-22) Repo hygiene done: old prototype files deleted, `src/` →
  `assets/product-photos/`, Shopify-era docs archived to `docs/archive/`,
  `SEO.md` → `seo-roadmap.md`.

## Related docs

- [admin-design.md](../admin-design.md) — **the authoritative design**: custom admin + native checkout replacing Shopify
- [launch-checklist.md](launch-checklist.md) — the phased to-do list (tasks live there, not here)
- [seo-intro.md](../seo-geo/seo-intro.md) — post-launch SEO/GEO levers
- [ideas.md](../ideas.md) — owner's raw future ideas
- [checkout.md](checkout.md), [shopify-integration.md](shopify-integration.md) — historical (Shopify era)
