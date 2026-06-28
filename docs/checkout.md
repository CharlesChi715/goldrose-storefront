# Checkout: Shop Pay, Credit Card & PayPal

The storefront offers three ways to pay, in priority order:

1. **Shop Pay** — one-tap accelerated wallet
2. **Credit Card** — on-page card form (Visa, Mastercard, Amex, Discover)
3. **PayPal** — accelerated wallet

All three are **mocked by default** so the whole flow is clickable without any
real account, money, or order. Nothing is charged and no card number is ever
stored. See `docs/web-app-learning-guide.md` for why storing card numbers is
never done.

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
                 lib/checkout/mock.ts → processCheckout()
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
| `lib/checkout/mock.ts` | `processCheckout()` — server-side pricing, mock orders, live Shopify hand-off |
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

## Going live

1. Create the Shopify store, add the three products, and copy their real
   **variant IDs** into `lib/products.ts` (`shopifyVariantId`).
2. In Shopify admin, enable **Shopify Payments** and turn on **Shop Pay** and
   **PayPal** as accelerated checkout wallets.
3. Set env vars (see `.env.example`): `SHOPIFY_MODE=live`,
   `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`,
   `NEXT_PUBLIC_SITE_URL`.
4. Express buttons then redirect to the real Shopify checkout with the wallet
   pre-selected; the card form maps to Shopify Payments' hosted fields.

**What is still mocked / owner to confirm before launch:** real product variant
IDs, Shopify plan + payment activation, sales-tax configuration, and order
fulfillment / confirmation emails.
