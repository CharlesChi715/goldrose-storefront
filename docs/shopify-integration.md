# Shopify Integration

This branch uses Shopify as the commerce backend direction.

The storefront is still a custom Next.js site. Shopify is responsible for the
commerce parts once real credentials are added: product admin, cart, checkout,
payment, taxes, inventory, orders, refunds, and customer checkout emails.

## Current Status

What works now:

- The customer can add AUREÀ products to the cart drawer.
- The cart drawer can call `POST /api/shopify/cart`.
- In mock mode, the API returns a Shopify-shaped cart locally.
- In live mode, the API calls Shopify Storefront API `cartCreate`.
- Product records already include mock Shopify product and variant GraphQL IDs.

What is still mocked:

- Shopify store domain.
- Storefront API access token.
- Product and variant GraphQL IDs.
- Checkout URL in mock mode.
- Shopify admin product setup.
- Real tax, shipping, inventory, payment, orders, refunds, and customer emails.

## How The Flow Works

```text
Customer clicks Shopify Checkout
  -> components/Storefront.tsx
  -> POST /api/shopify/cart
  -> app/api/shopify/cart/route.ts
  -> lib/shopify/client.ts
  -> mock cart now, real Shopify cart later
```

Beginner idea: the browser does not call Shopify directly in this project. It
calls our own Next.js API route first. That keeps Shopify configuration in server
code instead of spreading commerce logic through the UI.

## Shopify Files

| File | Purpose |
| --- | --- |
| `components/Storefront.tsx` | Builds the visible cart and sends cart lines to the API route. |
| `app/api/shopify/cart/route.ts` | Validates the request and creates a Shopify cart. |
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
SHOPIFY_MOCK_CHECKOUT_URL=https://aurea.example/mock-checkout
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
| `AUR-GR-SIG-001` | `signature-24k-gold-rose` | `gid://shopify/ProductVariant/200000000001` |
| `AUR-GR-BOX-002` | `boxed-keepsake-gold-rose` | `gid://shopify/ProductVariant/200000000002` |
| `AUR-GR-BND-003` | `premium-gold-rose-gift-bundle` | `gid://shopify/ProductVariant/200000000003` |

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
2. Add the three AUREÀ products.
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
