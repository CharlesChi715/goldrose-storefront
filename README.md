# GoldRose Storefront

A beginner-friendly direct-to-consumer storefront project for a 24K gold dipped
rose gift product.

This README is the project map. Keep it updated as decisions change.

## Project Goal

Build an independent storefront that can eventually sell directly to customers.
The first serious version should teach the fundamentals while moving toward a
real store:

- a polished product page
- product images and product details
- cart behavior
- checkout integration
- trust, shipping, returns, and FAQ content
- analytics and launch basics

## What DTC Means

DTC means direct-to-consumer. Instead of selling only through a marketplace like
Amazon or Etsy, the brand has its own storefront and customer experience.

An independent storefront still can use services like Stripe, Shopify, Shippo,
Klaviyo, or Vercel. The important idea is that the site, brand, content, and
customer journey are controlled by the business.

## Current Status

The project currently has a fresh Next.js scaffold plus an earlier static HTML
prototype.

Main app path:

- `app/` is the Next.js application we will build from.
- `app/page.tsx` is the home page.
- `app/layout.tsx` wraps every page and controls metadata/fonts.
- `app/globals.css` contains global CSS and Tailwind setup.

Reference prototype:

- `index.html`, `styles.css`, and `script.js` are a plain HTML/CSS/JS prototype.
- Treat these as reference material, not the long-term app structure.

Product assets:

- `src/` currently contains rose product images.
- We will likely move final storefront images into `public/products/` when we
  start wiring them into Next.js pages.

## Tech Stack

- Next.js `16.2.9`
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- ESLint
- Node.js package tooling through `npm` for now

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
|   +-- layout.tsx       # root document layout and metadata
|   +-- page.tsx         # current home page
+-- public/              # browser-accessible static files
+-- src/                 # current product image source folder
+-- package.json         # scripts and dependencies
+-- README.md            # project map and learning notes
+-- AGENTS.md            # instructions for AI agents working in this repo
```

## Learning Plan

Work in small passes. Each pass should leave the app better and the README more
accurate.

1. Understand the scaffold
   - Learn what `app/page.tsx`, `app/layout.tsx`, and `app/globals.css` do.
   - Run the app locally.
   - Replace the default Next.js starter page.

2. Build the storefront shell
   - Header
   - Product hero
   - Product detail section
   - Trust badges
   - FAQ
   - Footer

3. Add real product content
   - Product name
   - Price
   - Short description
   - Product images
   - Gift options
   - Shipping and returns copy

4. Add cart behavior
   - Add to cart
   - Quantity changes
   - Subtotal
   - Cart drawer or cart page

5. Add checkout
   - Choose Stripe Checkout, Shopify Buy Button, or another commerce provider.
   - Keep payment, tax, and order logic out of custom code unless there is a
     strong reason.

6. Prepare for launch
   - Analytics
   - SEO metadata
   - Email capture
   - Privacy policy
   - Terms
   - Refund policy
   - Shipping policy

## How Codex Should Work Here

The owner is learning while Codex builds. That means changes should be practical
and well documented.

- Ask clarifying questions when the prompt is unclear.
- Make conservative technical choices.
- Prefer small, understandable steps over large rewrites.
- Explain important decisions in plain language.
- Keep this README updated when the plan, stack, or structure changes.
- Do not add new tools just because they are popular.

## Storefront Decisions To Make

These are business decisions, not just code decisions:

- Final brand name
- Exact product title
- Price
- Cost of goods
- Shipping cost
- Delivery promise
- Return/refund policy
- Warranty or damage policy
- Product claims we can honestly support
- Checkout provider
- Launch country/currency

## Next Build Step

Replace the default `app/page.tsx` starter screen with the first real GoldRose
home/product page.

Before coding that page, decide:

- Should this be a one-product landing page or a small catalog?
- What price should we show for the first product?
- Which checkout direction do we want later: Stripe Checkout or Shopify?
