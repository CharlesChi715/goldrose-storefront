# Checkout: Shop Pay, Credit Card & PayPal

The storefront offers three ways to pay, in priority order:

1. **Shop Pay** — one-tap accelerated wallet
2. **Credit Card** — on-page card form (Visa, Mastercard, Amex, Discover)
3. **PayPal** — accelerated wallet

**Status (2026-07-15): the deployed store is live and takes real payments** —
checkout hands the cart to Shopify's hosted checkout via a cart permalink.
Locally, everything still runs in **mock (development) mode** by default, so
the whole flow is clickable without any real account, money, or order.
Nothing is charged in mock mode and no card number is ever stored. See
`docs/web-app-learning-guide.md` for why storing card numbers is never done.

## Why one Shopify checkout powers all three

Shop Pay only exists inside Shopify. So instead of bolting on three separate
payment companies, all three methods are served by **one Shopify checkout** in
live mode:

| Method | Live provider |
| --- | --- |
| Shop Pay | Shopify accelerated checkout (Shop Pay wallet) |
| Credit Card | Shopify Payments — hosted, PCI-compliant card fields |
| PayPal | Shopify accelerated checkout (PayPal wallet) |

You enable Shop Pay and PayPal as accelerated wallets inside **Shopify Payments**
— there are no separate card or PayPal API keys to manage in this app.

> An earlier Stripe-based exploration lives on the archived `stripe-checkout`
> branch. Stripe can do card + PayPal but **not** Shop Pay, which is why the
> Shopify path was chosen.

## How it flows

```
Cart drawer / Checkout page
        │
        ├─ Shop Pay / PayPal (express)  ─┐
        └─ Credit Card (on-page form)  ──┤
                                         ▼
                          POST /api/checkout
                                         │
                 lib/checkout/process.ts → processCheckout()
                  • re-prices every line from the catalog
                  • validates card format (Luhn) — card method
                  • computes subtotal + shipping (lib/business.ts)
                                         │
                ┌────────────────────────┴───────────────────────┐
       mock mode (default)                              live mode (Shopify)
   internal /checkout/success page              express → Shopify checkoutUrl
                                                card → Shopify Payments fields
```

## Key files

| File | Role |
| --- | --- |
| `lib/cart/store.ts` | `useCart()` — localStorage cart shared by the storefront and `/checkout` |
| `lib/checkout/methods.ts` | Registry of the three methods (label, kind, brand colors) |
| `lib/checkout/card.ts` | Format-only card validation (Luhn, brand, expiry, CVC) — never stores the PAN |
| `lib/checkout/process.ts` | `processCheckout()` — server-side pricing, mock orders, live Shopify hand-off |
| `lib/checkout/client.ts` | `startExpressCheckout()` — shared express helper for the UI |
| `app/api/checkout/route.ts` | Validates input and calls `processCheckout()` |
| `app/checkout/page.tsx` | Order summary + express buttons + card form |
| `app/checkout/success/page.tsx` | Method-aware confirmation |
| `app/checkout/cancel/page.tsx` | Canceled-checkout page (cart preserved) |

## Try it (mock mode)

1. `npm run dev`
2. Add a product, open the cart.
3. Click **Shop Pay** or **PayPal** → mock confirmation page.
4. Or click **Checkout · Credit Card** → fill the form and use test card
   `4242 4242 4242 4242`, any future expiry, any CVC → mock confirmation.

No real payment is taken in any of these.

## Going live — progress

1. ✅ Shopify store `goldrose-9372` exists with the three products, and the
   real **variant IDs** are in `lib/products.ts` (`shopifyVariantId`).
2. ✅ The deployed site takes real payments: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
   is set on Vercel, so every checkout button opens Shopify's hosted checkout
   via a cart permalink (PayPal is the confirmed working method).
3. ⬜ Enable **Shopify Payments** to unlock card + **Shop Pay** as native
   buttons (blocked on the merchant-entity decision).
4. ⬜ Optional next step: switch from cart permalinks to the Storefront API
   path (`SHOPIFY_MODE=live` + `SHOPIFY_STORE_DOMAIN` +
   `SHOPIFY_STOREFRONT_ACCESS_TOKEN`) for per-cart checkout URLs and email
   prefill.

**Owner to confirm before full launch:** Shopify Payments activation,
sales-tax configuration, shipping rates, and order fulfillment /
confirmation emails.
