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
- product/story/occasion/FAQ sections
- SEO metadata and basic structured data
- local product images served from `public/products/`

Checkout is intentionally not connected yet. Payments, tax, shipping, inventory,
and order creation should wait until the business details are confirmed.

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
+-- components/
|   +-- Storefront.tsx   # interactive storefront and cart UI
+-- lib/
|   +-- products.ts      # product data, types, and money formatting
+-- public/
|   +-- products/        # browser-accessible storefront images
+-- src/                 # original source image folder
+-- index.html           # earlier static prototype reference
+-- styles.css           # earlier static prototype CSS reference
+-- script.js            # earlier static prototype JS reference
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

### `lib/products.ts`

Product names, prices, images, descriptions, options, and details live here.

Beginner idea: keeping product data separate from UI makes the page easier to
change later.

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
- Checkout: not connected
- Domain in metadata: `https://aurea.example`
- Email capture: UI-only, no real provider
- Product claims: conservative placeholders

Replace these before launch.

## What Works Now

- The page renders as a real storefront.
- Product cards show images, prices, details, and gift options.
- Add-to-cart opens a cart drawer.
- Cart quantities can increase, decrease, or remove lines.
- Subtotal updates automatically.
- FAQ sections expand and collapse.
- Email form validates a simple email shape and shows local feedback.
- `npm run lint` passes.
- `npm run build` passes.

## What Is Not Real Yet

- No payment processing.
- No order creation.
- No tax calculation.
- No shipping rates.
- No inventory tracking.
- No real email provider.
- No privacy, refund, terms, or shipping policy pages.
- No analytics.
- No real production domain.

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
- Checkout provider
- Launch country/currency
- Production domain

## Recommended Next Steps

1. Review the storefront at `http://localhost:3000`.
2. Replace placeholder product prices and copy in `lib/products.ts`.
3. Replace the metadata domain in `app/layout.tsx` and `app/page.tsx`.
4. Choose checkout direction:
   - Stripe Checkout if you want a lightweight custom storefront.
   - Shopify if you want built-in products, orders, taxes, and inventory.
5. Add policy pages before accepting real orders:
   - shipping policy
   - refund policy
   - privacy policy
   - terms of service
6. Add analytics and email capture only after the core offer is clear.

## How Codex Should Work Here

The owner is learning while Codex builds. Changes should be practical and well
documented.

- Ask clarifying questions when the prompt is unclear.
- Make conservative technical choices.
- Prefer small, understandable steps over large rewrites.
- Explain important decisions in plain language.
- Keep this README updated when the plan, stack, or structure changes.
- Do not add new tools just because they are popular.
