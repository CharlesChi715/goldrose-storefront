# Shopify Integration

This branch uses Shopify as the commerce backend direction.

The storefront is still a custom Next.js site. Shopify is responsible for the
commerce parts once real credentials are added: product admin, cart, checkout,
payment, taxes, inventory, orders, refunds, and customer checkout emails.

## Current Status (updated 2026-07-15)

What works now:

- The real store `goldrose-9372.myshopify.com` exists with all three products
  and real variant GraphQL IDs wired into `lib/products.ts`.
- **Live checkout takes real payments**: the deployed site hands the cart to
  Shopify's hosted checkout via a cart permalink (`lib/shopify/permalink.ts`).
- Mock mode still exists for safe local development — `lib/shopify/mock.ts`
  builds a Shopify-shaped cart locally with no side effects.
- The Storefront API `cartCreate` client (`lib/shopify/client.ts`) is kept as
  the next-step live path once a Storefront API token is configured. (The old
  `POST /api/shopify/cart` demo endpoint has been removed.)

What is still pending:

- Shopify Payments activation (unlocks card + Shop Pay natively).
- Verified tax, shipping-rate, refund, and policy setup in Shopify admin.
- Inventory sync between Shopify and `lib/products.ts`.

## How The Flow Works

```text
Customer clicks any checkout button (live mode)
  -> components/Storefront.tsx or app/checkout/page.tsx
  -> lib/shopify/permalink.ts builds
     https://{store}/cart/{variantId}:{qty},...
  -> browser goes straight to Shopify's hosted checkout
```

Beginner idea: a cart permalink is just a URL — no API token or server call is
needed, which is why it was the fastest safe way to go live. The alternative
Storefront API path (`lib/shopify/client.ts`) needs a token but returns a
per-cart checkout URL and supports buyer email prefill.

## Shopify Files

| File | Purpose |
| --- | --- |
| `components/Storefront.tsx` | Builds the visible cart and starts checkout. |
| `lib/shopify/permalink.ts` | Builds the live cart-permalink checkout URL. |
| `lib/shopify/config.ts` | Reads Shopify environment variables and decides mock vs live mode. |
| `lib/shopify/client.ts` | Contains the Storefront API GraphQL `cartCreate` request. |
| `lib/shopify/mock.ts` | Creates a fake cart response for local development. |
| `lib/shopify/types.ts` | Shared TypeScript types for Shopify cart data. |
| `lib/products.ts` | Local product data plus mock Shopify product and variant IDs. |
| `.env.example` | Safe environment variable template. |

## Environment Variables

Copy `.env.example` to `.env.local` when you are ready to configure your own
machine. Do not commit `.env.local`.

```bash
SHOPIFY_MODE=mock
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_STOREFRONT_API_VERSION=2026-04
SHOPIFY_MOCK_CHECKOUT_URL=https://goldrose.example/mock-checkout
```

Use `SHOPIFY_MODE=mock` while learning and designing.

Use `SHOPIFY_MODE=live` only after:

- the Shopify store exists
- the products exist in Shopify
- every local product has a real Shopify variant ID
- shipping and tax settings are configured
- the Storefront API access token exists

If `SHOPIFY_MODE=live` is set but the domain or token is missing, the API route
will return a clear error instead of silently using mock mode.

## Product Mapping

The local products currently use mock IDs:

| Local SKU | Handle | Mock Variant ID |
| --- | --- | --- |
| `GR-SIG-001` | `signature-24k-gold-rose` | `gid://shopify/ProductVariant/200000000001` |
| `GR-BOX-002` | `boxed-keepsake-gold-rose` | `gid://shopify/ProductVariant/200000000002` |
| `GR-BND-003` | `premium-gold-rose-gift-bundle` | `gid://shopify/ProductVariant/200000000003` |

When real Shopify products exist, replace these fields in `lib/products.ts`:

- `handle`
- `shopifyProductId`
- `shopifyVariantId`
- price and compare-at price if Shopify becomes the source of truth
- inventory count if Shopify becomes the source of truth

For a first launch, keep local product data and manually copy real Shopify
variant IDs into `lib/products.ts`. Later, we can fetch products from Shopify so
Shopify becomes the catalog source of truth.

## Shopify Admin Setup Checklist

1. Create the Shopify store.
2. Add the three GoldRose products.
3. Add SKUs exactly as shown in `lib/products.ts`.
4. Add product prices, compare-at prices, weights, and inventory.
5. Configure Shopify Payments or another payment provider.
6. Configure shipping rates for the United States.
7. Configure tax settings.
8. Create refund, shipping, privacy, and terms pages.
9. Create a Storefront API access token.
10. Copy the real product and variant GraphQL IDs into `lib/products.ts`.

## Testing The Mock Flow

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Add a product, open the cart, and click `Shopify Checkout`.

Expected result in mock mode:

- the drawer shows a mock Shopify cart ID
- no payment page opens
- no Shopify order is created
- no inventory changes

## Testing The Live Flow Later

After real Shopify credentials are configured in `.env.local`:

```bash
SHOPIFY_MODE=live
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
SHOPIFY_STOREFRONT_API_VERSION=2026-04
```

Then run:

```bash
npm run dev
```

Expected result in live mode:

- clicking `Shopify Checkout` creates a real Shopify cart
- the browser redirects to Shopify's checkout URL
- payment, tax, shipping, and order creation happen inside Shopify

Before accepting real orders, test with Shopify payment test mode or a very
small internal test order.

## Why Shopify Saves Work

Without Shopify, we would need to build or integrate many pieces ourselves:

- product admin
- secure checkout
- payment provider wiring
- tax calculation
- shipping-rate logic
- order storage
- inventory adjustment
- refunds
- fraud and payment edge cases
- customer emails

With Shopify, this Next.js project can focus on the branded storefront and pass
the serious commerce work to Shopify.

## Official References

- Shopify Storefront API:
  https://shopify.dev/docs/api/storefront
- Shopify Storefront API cart management:
  https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage
- Shopify product admin:
  https://help.shopify.com/en/manual/products
- Shopify checkout settings:
  https://help.shopify.com/en/manual/checkout-settings
