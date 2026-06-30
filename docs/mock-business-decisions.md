# Mock Business Decisions

These are temporary assumptions so the AUREÀ storefront can keep moving. Replace
them with real business data before launch.

## Confirmed Decisions

- **Shopify plan: Advanced.** Chosen 2026-06-30 on a $1/mo 3-month trial
  (regular ~$575/mo AUD). Includes Grow features plus up to 15 staff accounts,
  real-time third-party shipping rates, region-customized stores, and the lowest
  card rate (1.4% + 30¢ AUD).
- **Currency: USD.** Confirmed 2026-06-30 by the owner ("boss sells it in US").
  The Shopify store base currency is set to **US Dollar (USD $)** and the launch
  market is the **United States**, matching `lib/products.ts` USD prices and the
  US-market assumptions below. Note the plan pricing/card rates are billed in
  AUD (the business entity/address are Australian), but customer-facing prices
  and the store currency are USD.

## Current Product Reality

- Product source: imported from China.
- Current stock location: United States.
- Launch market: United States customers.
- Customer-facing origin copy: `Imported from China. Ships from US inventory.`
- Do not use: `Made in USA`, `American-made`, or US-flag origin language.

Reason: the product is imported. A US warehouse location can be advertised as
shipping/fulfillment information, but it should not imply US manufacture.

## Mock Product Data

| SKU | Product | Price | Compare At | Mock Landed Cost | Mock Stock | Reorder Point |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `AUR-GR-SIG-001` | AUREÀ Signature 24K Gold Rose | $49.99 | $89.99 | $14.25 | 420 | 90 |
| `AUR-GR-BOX-002` | AUREÀ Boxed Keepsake Rose | $64.99 | $109.99 | $17.80 | 260 | 75 |
| `AUR-GR-BND-003` | AUREÀ Premium Gift Bundle | $79.99 | $139.99 | $23.60 | 140 | 50 |

Owner checks:

- Confirm actual landed cost per unit after product cost, freight, duty, tariffs,
  packaging, and warehouse receiving.
- Confirm real available inventory.
- Confirm whether the product is truly 24K gold dipped/plated and what exact
  wording the supplier can substantiate.
- Replace each mock Shopify variant ID with a real Shopify variant ID.

## Live Shopify Catalog

Created in the live store (`goldrose-9372`) on 2026-06-30. All three are
**Active** and published to all 3 sales channels, with the prices, compare-at
prices, cost, and inventory from the table above.

| SKU | Shopify product ID | Admin product GID |
| --- | --- | --- |
| `AUR-GR-SIG-001` | `7607585865774` | `gid://shopify/Product/7607585865774` |
| `AUR-GR-BOX-002` | `7607586160686` | `gid://shopify/Product/7607586160686` |
| `AUR-GR-BND-003` | `7607586193454` | `gid://shopify/Product/7607586193454` |

Still TODO before the Next.js storefront can run live (it currently defaults to
`SHOPIFY_MODE=mock`):

1. Add product images in Shopify (created text-only for now).
2. Create a public **Storefront API access token** in Shopify admin (owner
   action — it is a secret; do not commit it). Set `SHOPIFY_STORE_DOMAIN=
   goldrose-9372.myshopify.com` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` in env.
3. Pull each product's real **variant GID** (needs the Storefront/Admin API) and
   replace the placeholder `shopifyVariantId` values in `lib/products.ts`; also
   update `shopifyProductId` to the GIDs above.
4. Flip `SHOPIFY_MODE` off `mock` and verify a real cart/checkout end to end.

## Mock Fulfillment

- Warehouse: Ontario, California.
- Inventory status: stocked in the United States.
- Order cutoff: 2:00 PM PT.
- Processing time: 1-2 business days.
- Standard transit: 3-5 business days.
- Expedited transit: 2 business days.
- Mock carriers: USPS Ground Advantage, UPS Ground.
- Launch region: contiguous United States.
- Excluded for now: Alaska, Hawaii, US territories, expedited PO box shipping.

Owner checks:

- Replace Ontario, CA with the real warehouse or 3PL.
- Confirm daily cutoff, carrier service levels, and weekend handling.
- Confirm packaging dimensions and package weight.
- Confirm whether Alaska/Hawaii are excluded or priced separately.

## Mock Shipping Offer

- Standard shipping: $5.95.
- Free standard shipping threshold: $75.
- Expedited shipping: not priced yet.

Owner checks:

- Run real carrier quotes for each package weight.
- Confirm whether free shipping still leaves acceptable margin.
- Decide whether to show delivery estimates by state.

## Mock Return And Damage Policy

- Return window: 30 days.
- Damage report window: 7 days from delivery.
- Return condition: unused, original packaging, photo proof for damage claims.
- Refund timing: 5-10 business days after inspection.

Owner checks:

- Decide who pays return shipping.
- Decide whether gift orders can be refunded to the original purchaser only.
- Decide whether damaged items are refunded, replaced, or store-credit only.

## Mock Checkout Decision

Recommended path:

```text
Next.js storefront -> Shopify Storefront API -> Shopify cart/checkout/orders
```

Why:

- Shopify saves product admin, inventory, checkout, payment, order, refund, and
  tax setup work.
- The custom Next.js frontend keeps the AUREÀ luxury visual style.
- It is easier to launch safely than building a custom commerce backend.

Current implementation:

- `POST /api/shopify/cart` creates a mock Shopify-shaped cart by default.
- `SHOPIFY_MODE=mock` means no money, order, tax, or inventory action happens.
- `SHOPIFY_MODE=live` can call Shopify after real credentials and variant IDs
  exist.

Owner checks:

- Create Shopify store.
- Add products and variants.
- Replace mock variant IDs in `lib/products.ts`.
- Configure Shopify Payments or another payment provider.
- Configure tax and shipping settings.
- Decide whether to use Shopify Markets for future non-US sales.

## Mock Tax Decision

- Do not calculate sales tax manually in custom code.
- Use Shopify tax setup, Shopify Tax, or another trusted tax provider.

Owner checks:

- Confirm nexus obligations with an accountant or sales-tax tool.
- Confirm whether holding inventory in a US state creates sales-tax obligations.

## Mock Email Decision

- Current email field is UI-only.
- Recommended future providers: Shopify Email or Klaviyo.

Owner checks:

- Pick email provider.
- Add consent language.
- Add privacy policy.
- Decide welcome flow and abandoned checkout flow.

## What Works Now

- Storefront renders.
- Product catalog renders from structured data.
- Cart drawer works in the browser.
- Quantity changes and subtotal work.
- Shopify mock cart creation works through the Next.js API route.
- Mock US-warehouse fulfillment copy is visible.
- Mock origin disclosure is visible.
- Build and lint pass.

## What Does Not Work Yet

- No real Shopify checkout credentials yet.
- No real order creation.
- No real inventory sync.
- No real shipping rates.
- No real sales tax.
- No real email capture.
- No real policy pages.
- No real analytics.

## Compliance Notes To Recheck

- The FTC says unqualified `Made in USA` claims require the product to be
  "all or virtually all" made in the United States. This product is imported, so
  the mock copy avoids that claim.
- Imported products can raise country-of-origin marking issues. Confirm
  packaging/marking with supplier paperwork, customs broker, or qualified
  counsel before launch.

Useful references:

- FTC Made in USA guidance:
  https://www.ftc.gov/business-guidance/resources/complying-made-usa-standard
- Shopify product admin:
  https://help.shopify.com/en/manual/products
- Shopify checkout:
  https://help.shopify.com/en/manual/checkout-settings
- Shopify Storefront API cart:
  https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage
