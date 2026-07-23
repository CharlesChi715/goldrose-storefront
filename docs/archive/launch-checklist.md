# Launch Checklist — from mock to a real working store

This is the single to-do list for turning GoldRose from a clickable mock into a
real store that takes real orders. Work top to bottom. Tick boxes as you go.

**Plain-language status today (updated 2026-07-15):** the deployed store is
**live and takes real payments** — checkout hands the real cart to Shopify's
hosted checkout via a cart permalink (PayPal confirmed working). Local
development still uses the simulated mock mode by default. What remains below
is launch hygiene: Shopify Payments (card + Shop Pay natively), verified
tax/shipping, policy pages, and the real domain.

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

> **⚠️ Superseded (2026-07-21):** Shopify is being removed — the custom admin
> + native checkout per [admin-design.md](../admin-design.md) replaces this
> phase. Kept for historical context; details archived in
> `docs/archive/checkout.md` and `docs/archive/shopify-integration.md`.

All three payment buttons are powered by one Shopify checkout.

> **You don't have to rebuild your store on Shopify.** Shop Pay only works
> through Shopify, but you can keep this custom storefront and use Shopify
> *headless* — purely as the checkout/payment engine behind it. A low-tier plan
> (e.g. Shopify Starter) is enough to enable Shop Pay + checkout. There is no
> way to accept Shop Pay without some Shopify account.

- [x] Create the Shopify store and pick a plan (done: `goldrose-9372`,
      Advanced plan on trial).
- [x] Add the 3 products with their variants and real prices (done, with
      images; real GIDs recorded in `lib/products.ts`).
- [ ] Turn on **Shopify Payments**, then enable **Shop Pay** and **PayPal** as
      accelerated checkout wallets (this is what makes those two buttons real).
- [ ] Set up **sales tax** in Shopify (don't calculate tax by hand) — confirm
      tax obligations with an accountant/tax tool.
- [ ] Set up **real shipping rates** in Shopify to match Phase 1.
- [ ] Create a **Storefront API access token** (public token, not the Admin
      token).

## Phase 3 — Connect this site to Shopify

- [x] Copy each product's real Shopify **variant ID** into `lib/products.ts`
      (`shopifyVariantId`).
- [x] Connect live checkout (done via `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` on
      Vercel — cart permalink to hosted checkout; the token-based
      `SHOPIFY_MODE=live` path remains optional).
- [x] Place a real test order and confirm it appears in Shopify admin
      (done for PayPal; Shop Pay + native card wait on Shopify Payments).
- [ ] Decide how orders get fulfilled (you, or a 3PL) and confirm confirmation
      + tracking emails go out.

## Phase 4 — Required pages & trust (before taking real money)

- [ ] Shipping policy page
- [ ] Refund / return policy page
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Contact / support email that someone actually reads.

## Phase 4b — Stay compliant & avoid payment holds

Most "Shopify banned me" stories are really one of two things. Both are
preventable. This is guidance, not legal advice.

**Avoid the store being suspended (policy / legal):**

- [ ] Keep every product claim truthful and backed by supplier paperwork —
      "24K gold", "real rose", and the China-origin wording. Never use
      "Made in USA" (the code already blocks this).
- [ ] No fake discounts, fake scarcity, or fake reviews.
- [ ] Only use product images you have the rights to (supplier/stock images can
      trigger IP complaints). Don't use other brands' names or trademarks.
- [ ] Use accurate, complete business identity details in Shopify.

**Avoid payment holds / frozen funds (risk — the common one):**

- [ ] Have real inventory on hand and ship fast; state delivery times clearly.
- [ ] Expect a new store + a gift-season spike to look "risky" — funds may be
      held or a reserve applied at first. Don't over-promise dates.
- [ ] Reply to customer questions quickly and refund cleanly to keep
      **chargebacks low** (chargebacks are the #1 reason processors cut you off).
- [ ] Don't take a flood of orders you can't fulfill yet.

## Phase 5 — Go live

- [ ] Replace the placeholder domain (`https://goldrose.example`) in
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

**✅ Passed 2026-07-15.** The deployed store hands real carts to Shopify's
hosted checkout and real payments are accepted. Local `npm run dev` without
env vars remains a safe simulation.
