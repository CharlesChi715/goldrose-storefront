# Launch Checklist — from mock to a real working store

This is the single to-do list for turning AUREÀ from a clickable mock into a
real store that takes real orders. Work top to bottom. Tick boxes as you go.

**Plain-language status today:** the storefront looks and behaves like a real
shop — you can browse, add to cart, and check out with Shop Pay, credit card,
or PayPal — but everything money-related is **simulated (mock mode)**. No real
charge, order, tax, or inventory change happens yet. Each section below is what
it takes to make a part real.

Legend: `[ ]` = to do · `[x]` = done · `(mock)` = simulated today

---

## Phase 1 — Decide the real business facts

These are assumptions in the code (`docs/mock-business-decisions.md`) that only
you can confirm. Nothing technical, but everything downstream depends on them.

- [ ] Confirm the product is correctly described and legal to sell as shown.
- [ ] Confirm country-of-origin wording with supplier paperwork (currently
      "Imported from China. Ships from US inventory.", **not** "Made in USA").
- [ ] Confirm real prices, discounts, and what's actually in each gift option.
- [ ] Confirm the real warehouse / fulfillment location and order cutoff time
      (currently a mock: Ontario, CA).
- [ ] Confirm shipping offer (currently mock: free over $75, else $5.95).
- [ ] Confirm return policy (currently mock: 30-day returns, 7-day damage claims).

## Phase 2 — Set up Shopify (the checkout engine)

All three payment buttons are powered by one Shopify checkout. See
`docs/checkout.md` and `docs/shopify-integration.md`.

- [ ] Create the Shopify store and pick a plan.
- [ ] Add the 3 products with their variants and real prices.
- [ ] Turn on **Shopify Payments**, then enable **Shop Pay** and **PayPal** as
      accelerated checkout wallets (this is what makes those two buttons real).
- [ ] Set up **sales tax** in Shopify (don't calculate tax by hand) — confirm
      tax obligations with an accountant/tax tool.
- [ ] Set up **real shipping rates** in Shopify to match Phase 1.
- [ ] Create a **Storefront API access token** (public token, not the Admin
      token).

## Phase 3 — Connect this site to Shopify

- [ ] Copy each product's real Shopify **variant ID** into `lib/products.ts`
      (`shopifyVariantId`).
- [ ] Copy `.env.example` to `.env.local` and fill in:
      `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`,
      `NEXT_PUBLIC_SITE_URL`, and set `SHOPIFY_MODE=live`.
- [ ] Place a real test order end-to-end with each method (Shop Pay, card,
      PayPal) and confirm it appears in Shopify admin.
- [ ] Decide how orders get fulfilled (you, or a 3PL) and confirm confirmation
      + tracking emails go out.

## Phase 4 — Required pages & trust (before taking real money)

- [ ] Shipping policy page
- [ ] Refund / return policy page
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Contact / support email that someone actually reads.

## Phase 5 — Go live

- [ ] Replace the placeholder domain (`https://aurea.example`) in
      `app/layout.tsx` and `app/page.tsx` with the real domain.
- [ ] Buy/connect the production domain and deploy.
- [ ] Connect a real email provider for the "launch list" signup (currently UI
      only — it doesn't store emails yet).
- [ ] Add analytics (e.g. Shopify analytics or GA) once the offer is settled.

## Phase 6 — Nice-to-have, after launch

- [ ] More products / variants.
- [ ] Customer reviews, FAQ, gift messaging.
- [ ] Abandoned-cart and post-purchase emails.
- [ ] Keep raw ideas in `docs/ideas.md`; promote accepted ones up into this list.

---

## The one-line "is it real yet?" test

When `SHOPIFY_MODE=live` is set with real credentials **and** a real test order
shows up in Shopify admin, the store is taking real money. Until then, every
checkout here is a safe simulation.
