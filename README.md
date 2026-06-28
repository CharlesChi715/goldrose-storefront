# AUREÀ Storefront

A beginner-friendly direct-to-consumer storefront MVP for a 24K gold dipped rose
gift product.

This README is the project map. Keep it updated as decisions change.

## Current Result

The project now has a working Next.js storefront:

- luxury-style homepage/product page
- three-product gift catalog
- product options
- interactive cart drawer
- quantity controls and subtotal
- email capture UI placeholder
- product/story/occasion/operations sections
- mock US-warehouse shipping, return, inventory, and origin assumptions
- mock Shopify cart creation through a Next.js API route
- SEO metadata and basic structured data
- local product images served from `public/products/`

This `shopify-checkout` branch now has a Shopify-shaped checkout path. It runs
in mock mode by default, so no real payment, tax, order, or inventory action
happens yet. Live Shopify checkout can be turned on later with real Shopify
products, variant IDs, store domain, and Storefront API token.

See [docs/mock-business-decisions.md](docs/mock-business-decisions.md) for the
mock launch assumptions that need owner review.

See [docs/shopify-integration.md](docs/shopify-integration.md) for the Shopify
setup guide.

## Brand Direction

The visible brand is now `AUREÀ`.

`AUREÀ` is a stylized luxury brand name based on `aurea`, a Latin-root word
associated with "golden." The accent is decorative and gives the name a more
premium fashion/beauty feel.

For technical placeholders, use plain `aurea`:

- display brand: `AUREÀ`
- placeholder domain: `https://aurea.example`
- practical fallback spelling: `Aurea`

Before launch, check domain availability, trademark risk, and whether customers
in the launch market can type and pronounce the name easily.

## What DTC Means

DTC means direct-to-consumer. Instead of selling only through a marketplace like
Amazon or Etsy, the brand has its own storefront and customer experience.

An independent storefront can still use services like Stripe, Shopify, Shippo,
Klaviyo, or Vercel. The important idea is that the site, brand, content, and
customer journey are controlled by the business.

## Tech Stack

- Next.js `16.2.9`
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- ESLint
- Node.js package tooling through `npm`
- Shopify Storefront API integration path, mocked by default

We do not need `uv` right now. `uv` is for Python projects. Add it only if we
later create Python tooling for image processing, imports, automation, or a
Python backend.

## How To Run

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

Check code quality:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Run the production build locally:

```bash
npm run start
```

## Project Structure

```text
.
+-- app/
|   +-- globals.css      # global styles and Tailwind import
|   +-- layout.tsx       # metadata and root HTML/body wrapper
|   +-- page.tsx         # server page that renders the storefront
|   +-- api/
|   |   +-- shopify/
|   |       +-- cart/route.ts  # cart creation endpoint
+-- components/
|   +-- Storefront.tsx   # interactive storefront and cart UI
+-- lib/
|   +-- products.ts      # product data, types, and money formatting
|   +-- business.ts      # mock operations, shipping, returns, and launch decisions
|   +-- shopify/         # Shopify config, API client, mock cart, and types
+-- docs/
|   +-- mock-business-decisions.md
|   +-- shopify-integration.md
+-- public/
|   +-- products/        # browser-accessible storefront images
+-- src/                 # original source image folder
+-- index.html           # earlier static prototype reference
+-- styles.css           # earlier static prototype CSS reference
+-- script.js            # earlier static prototype JS reference
+-- .env.example         # safe Shopify environment variable template
+-- package.json         # scripts and dependencies
+-- README.md            # project map and learning notes
+-- AGENTS.md            # instructions for AI agents working in this repo
```

## Important Files

### `app/page.tsx`

This is the Next.js route for `/`. It imports the storefront component and adds
basic structured data for search engines.

Beginner idea: a file named `app/page.tsx` becomes the homepage.

### `app/layout.tsx`

This wraps the app and defines metadata like title, description, keywords, and
Open Graph image.

Beginner idea: layout is shared page setup.

### `components/Storefront.tsx`

This is a client component because it uses React state for cart interactions,
email form feedback, and the cart drawer.

Beginner idea: when a component needs browser interaction, it usually needs
`"use client"` at the top in the Next.js app router.

### `app/api/shopify/cart/route.ts`

This is the server endpoint the cart calls when the customer clicks Shopify
Checkout. It validates the cart request, then asks `lib/shopify/client.ts` to
create a mock or live Shopify cart.

Beginner idea: a `route.ts` file inside `app/api/...` creates an API endpoint in
Next.js.

### `lib/shopify/`

Shopify-specific code lives here:

- `config.ts` reads environment variables.
- `client.ts` creates Shopify carts.
- `mock.ts` creates local fake carts while learning.
- `types.ts` keeps the cart data shapes readable.

Beginner idea: keep third-party service code in its own folder so the UI does
not become tangled with API details.

### `lib/products.ts`

Product names, prices, images, descriptions, options, Shopify handles, and
Shopify variant IDs live here.

Beginner idea: keeping product data separate from UI makes the page easier to
change later.

### `lib/business.ts`

Mock operating assumptions live here: US warehouse, shipping promise, return
window, country-of-origin copy, and launch decisions.

Beginner idea: business rules should live in data/config first, not be scattered
through page markup.

### `public/products/`

Images in `public/` can be referenced with paths like
`/products/gold-rose-box.jpg`.

Beginner idea: `public/` is for files the browser can request directly.

## MVP Assumptions

Because the business details are not final, the current MVP uses safe
placeholders:

- Brand name: `AUREÀ`
- Currency: USD
- Catalog shape: three gift options
- Pricing: placeholder values
- Product source: imported from China
- Inventory location: United States
- Fulfillment copy: `Imported from China. Ships from US inventory.`
- Mock warehouse: Ontario, California
- Mock free shipping threshold: $75
- Mock return window: 30 days
- Checkout: Shopify mock mode through `POST /api/shopify/cart`
- Domain in metadata: `https://aurea.example`
- Email capture: UI-only, no real provider
- Product claims: conservative placeholders

Replace these before launch.

## What Works Now

- The page renders as a real storefront.
- Product cards show images, prices, details, and gift options.
- Product cards show mock stock, US warehouse, and origin signals.
- Add-to-cart opens a cart drawer.
- Cart quantities can increase, decrease, or remove lines.
- Subtotal updates automatically.
- Shopify Checkout button creates a mock Shopify cart in mock mode.
- Email form validates a simple email shape and shows local feedback.
- Mock business decisions are listed in `docs/mock-business-decisions.md`.
- Shopify setup steps are listed in `docs/shopify-integration.md`.
- `npm run lint` passes.
- `npm run build` passes.

## What Is Not Real Yet

- No real Shopify store is connected.
- No real payment processing.
- No real order creation.
- No real tax calculation.
- No real shipping rates.
- No real inventory sync.
- No real email provider.
- No privacy, refund, terms, or shipping policy pages.
- No analytics.
- No real production domain.
- No verified customs, tariff, or country-of-origin review.

## Storefront Decisions To Make

These are business decisions, not just code decisions:

- Final brand name
- Exact product title
- Real price
- Cost of goods
- Shipping cost
- Delivery promise
- Return/refund policy
- Warranty or damage policy
- Product claims we can honestly support
- Shopify plan and checkout settings
- Launch country/currency
- Production domain

## Recommended Next Steps

The full, ordered to-do list for going from this mock to a real working store
lives in **[docs/launch-checklist.md](docs/launch-checklist.md)** — one place,
plain language, with checkboxes. The short version:

1. Confirm the real business facts (`docs/mock-business-decisions.md`).
2. Set up Shopify: products + variants, Shopify Payments with Shop Pay & PayPal,
   tax, and shipping rates (`docs/shopify-integration.md`, `docs/checkout.md`).
3. Connect this site: real `shopifyVariantId`s in `lib/products.ts`, fill
   `.env.local`, set `SHOPIFY_MODE=live`, and place a real test order.
4. Add the required policy pages (shipping, refund, privacy, terms).
5. Replace the placeholder domain and deploy; connect email + analytics last.

## How Codex Should Work Here

The owner is learning while Codex builds. Changes should be practical and well
documented.

- Ask clarifying questions when the prompt is unclear.
- Make conservative technical choices.
- Prefer small, understandable steps over large rewrites.
- Explain important decisions in plain language.
- Keep this README updated when the plan, stack, or structure changes.
- Do not add new tools just because they are popular.
