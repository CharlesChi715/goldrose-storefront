<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GoldRose Storefront

A beginner-friendly direct-to-consumer storefront MVP for a 24K gold dipped rose
gift product.

**Live site:** <https://goldrose-storefront.vercel.app/> (deployed on Vercel;
checkout hands off to Shopify for PayPal).

This README is the project map. Keep it updated as decisions change.

> **Where are we?** [SUMMARY.md](SUMMARY.md) is the short single source of
> truth (read it first); [docs/flow-map.md](docs/flow-map.md) tracks every
> step of the buyer flow — what's real, what's mock, what's still to build.

## Current Goal

**The store is live and can receive real payments** (confirmed 2026-07-15):
checkout hands the real cart to Shopify's hosted checkout via a cart
permalink. The next focus is launch hygiene — policy pages, real domain,
verified tax/shipping — and unlocking card + Shop Pay via Shopify Payments.
See [docs/launch-checklist.md](docs/launch-checklist.md).

## Current Result

The project now has a working Next.js storefront:

- luxury-style homepage/product page
- three-product gift catalog
- product options
- interactive cart drawer
- quantity controls and subtotal
- email capture UI placeholder
- product/story/occasion/operations sections
- provisional US-warehouse shipping, return, inventory, and origin assumptions
  (owner review still pending — see `lib/business.ts` `launchDecisions`)
- a checkout (Credit Card / PayPal; Shop Pay is built but hidden until Shopify
  Payments is enabled) — in mock (development) mode completed orders are
  captured to a demo **order log at `/orders`**, so the click → pay → order
  loop is visible end to end
- SEO metadata and basic structured data
- local product images served from `public/products/`

Checkout has two modes. **Live** (the deployed site): setting
`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` hands the real cart to Shopify's hosted
checkout via a cart permalink — real money moves. **Mock** (local
development default): everything is simulated server-side with no payment,
tax, order, or inventory side effects, so the flow can be developed and
demoed safely.

See [docs/mock-business-decisions.md](docs/mock-business-decisions.md) for the
launch assumptions that still need owner review.

See [docs/shopify-integration.md](docs/shopify-integration.md) for the Shopify
setup guide.

## Brand Direction

The visible brand is `GoldRose` (renamed from the earlier working name
`AUREÀ` on 2026-07-21).

`GoldRose` says exactly what the product is — a rose finished in 24K gold —
and is easy to type, pronounce, and search in the US launch market.

Naming conventions:

- display brand: `GoldRose`
- placeholder domain: `https://goldrose.example`
- internal identifiers renamed with the brand (`goldrose-cart-v1`
  localStorage key, `goldrose-visited` marker, `GR-` SKU prefixes) — safe
  because the store had no live shoppers or warehouse stock at rename time.

Before launch, check domain availability and trademark risk.

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

## How To Deploy

Vercel tracks the GitHub repo (`CharlesChi715/goldrose-storefront`) via its
Git integration — pushing is the standard deploy step:

- push to `main` → production deploy at
  <https://goldrose-storefront.vercel.app/>
- push any other branch → a preview deployment with its own URL

Environment variables (`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `SHOPIFY_MODE`,
Storefront token) are set in the Vercel dashboard, not in git; changing one
needs a redeploy. The `/orders` demo log lives on Vercel's ephemeral
filesystem and resets on every deploy.

A machine with the Vercel CLI linked (`.vercel/` folder, gitignored) can also
deploy directly with `vercel --prod`, but that ships whatever is in the folder
— even uncommitted code — so prefer pushing to `main` and keep the CLI for
utilities like `vercel env pull` or `vercel logs`.

## Project Structure

```text
.
+-- app/
|   +-- globals.css      # global styles and Tailwind import
|   +-- layout.tsx       # metadata and root HTML/body wrapper
|   +-- page.tsx         # server page that renders the storefront
|   +-- checkout/        # checkout page plus success and cancel pages
|   +-- orders/          # demo order log page
|   +-- api/
|   |   +-- checkout/route.ts  # unified checkout endpoint (mock/dev orders)
+-- components/
|   +-- Storefront.tsx   # interactive storefront and cart UI
+-- lib/
|   +-- products.ts      # product data, types, and money formatting
|   +-- business.ts      # operations data: shipping, returns, launch decisions
|   +-- cart/            # shared cart state store (localStorage + useCart hook)
|   +-- checkout/        # checkout client, payment methods, card checks, order engine
|   +-- orders/          # demo order log store
|   +-- shopify/         # Shopify config, API client, mock cart, permalinks, and types
+-- docs/
|   +-- checkout.md
|   +-- demo-goal.md
|   +-- ideas.md
|   +-- launch-checklist.md
|   +-- mock-business-decisions.md
|   +-- shopify-integration.md
|   +-- web-app-learning-guide.md
+-- public/
|   +-- products/        # browser-accessible storefront images
+-- .data/               # runtime-only demo order log (orders.json, gitignored)
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

### `app/api/checkout/route.ts`

This is the server endpoint the storefront calls when the customer checks out
in mock (development) mode. It validates the cart lines and payment method,
then processes the order via the checkout engine (`lib/checkout/process.ts`)
and records it in the demo order log at `/orders`. In live mode the client
skips this route and hands the cart to Shopify's hosted checkout through a
cart permalink (`lib/shopify/permalink.ts`).

Beginner idea: a `route.ts` file inside `app/api/...` creates an API endpoint in
Next.js.

### `lib/shopify/`

Shopify-specific code lives here:

- `config.ts` reads environment variables.
- `client.ts` creates Shopify carts via the Storefront API.
- `permalink.ts` builds the cart permalink URL — the live checkout path.
- `mock.ts` creates local fake carts for safe development.
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

- Brand name: `GoldRose`
- Currency: USD
- Catalog shape: three gift options
- Pricing: placeholder values ($49.99 / $64.99 / $79.99 — the $1 live-test
  price has been restored to $49.99; confirm final pricing before launch)
- Product source: imported from China
- Inventory location: United States
- Fulfillment copy: `Imported from China. Ships from US inventory.`
- Mock warehouse: Ontario, California
- Mock free shipping threshold: $75
- Mock return window: 30 days
- Checkout: mock mode through `POST /api/checkout`; live mode hands off to
  Shopify hosted checkout via a cart permalink
- Domain in metadata: `https://goldrose.example`
- Email capture: UI-only, no real provider
- Product claims: conservative placeholders

Replace these before launch.

## What Works Now

- The page renders as a real storefront.
- Product cards show images, prices, details, and gift options.
- Product cards show stock, US warehouse, and origin signals.
- Add-to-cart opens a cart drawer.
- Cart quantities can increase, decrease, or remove lines.
- Subtotal updates automatically.
- **Live checkout takes real payments**: with
  `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` set (as on the Vercel deploy), every
  checkout button hands the real cart to Shopify's hosted checkout.
- In local development (mock mode), checkout simulates the order and logs it
  at `/orders`.
- Email form validates a simple email shape and shows local feedback.
- Launch assumptions are listed in `docs/mock-business-decisions.md`.
- Shopify setup steps are listed in `docs/shopify-integration.md`.
- `npm run lint` passes.
- `npm run build` passes.
- Every source file carries a "ROLE OF THIS FILE" comment plus per-function
  notes, written as learning documentation for the owner.

## What Is Real vs Not Real Yet

Real now:

- A real Shopify store exists (`goldrose-9372`) with all three products
  published, images attached, and the real variant IDs wired into
  `lib/products.ts`.
- **The store can receive real payments** (owner-confirmed 2026-07-15): the
  deployed site hands the real cart to Shopify's hosted checkout via a cart
  permalink (enabled by `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`).
- The $1 live-test price has been restored to the normal $49.99 in
  `lib/products.ts` (deploys with the next push).

Not real yet:

- Shopify Payments / Shop Pay: the Shop Pay button stays hidden until Shopify
  Payments is enabled (the merchant-entity decision — see ⚠️ below).
- No verified tax or shipping-rate setup in Shopify.
- No inventory sync — Shopify stock and `lib/products.ts` are maintained by
  hand and can drift.
- Mock-mode orders exist only in the local `.data/orders.json` demo log, which
  resets on every Vercel deploy.
- No real email provider.
- No privacy, refund, terms, or shipping policy pages.
- No analytics.
- No real production domain (metadata still uses `goldrose.example`).
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
- Shopify plan (chosen: **Advanced**, $1/mo trial) and checkout settings
- ⚠️ **Payment processor eligibility (blocker, decide first):** which country's
  legal entity + bank account owns the store and receives payouts. Shopify
  Payments (and therefore the Shop Pay button) is **not available for mainland
  China**. If the owner is China-based, a different processor is required and
  Shop Pay can't be used. This must be settled before M1.
- Launch country/currency (⚠️ plan billed in AUD vs USD storefront assumption —
  confirm; see `docs/mock-business-decisions.md`)
- Production domain

## Recommended Next Steps — Roadmap to Launch

Where we are now: the store is past the "can take real money" line — the
deployed storefront hands real carts to the real Shopify checkout and
payments are being accepted (M2 substantially done). Remaining: the ⚠️
payment-processor entity decision (M0) to unlock Shopify Payments (card +
Shop Pay natively), then policy pages, compliance, and the real domain.

The detailed, checkbox version lives in
**[docs/launch-checklist.md](docs/launch-checklist.md)**. This is the map.

```
M0 Decide ──▶ M1 Shopify ──▶ M2 Connect & test ──▶ M3 Pages & compliance ──▶ M4 Launch ──▶ M5 Grow
 (you)         (you)          (you + this app)        (you + this app)         (this app)    (later)
                                     ▲
                          "store can take real money" line
```

**M0 — Decide the business facts** *(you; ~hours)*
Confirm real prices, gift-box contents, shipping/return terms, and **truthful
product claims** (gold, real rose, China origin — no "Made in USA"). See
`docs/mock-business-decisions.md`.

**M1 — Stand up Shopify as the checkout engine** *(you; ~½–1 day)*
⚠️ **Decide the payment processor first:** Shopify Payments is not available for
mainland China, so a China-based owner can't use it or the Shop Pay button —
confirm the owning entity/bank-account country before this step.
Shop Pay only works through Shopify, so this is required for all three buttons.
You do **not** rebuild your site — a low-tier Shopify plan is used headless,
behind this storefront. Add the products + variants, enable **Shopify Payments**
with **Shop Pay** and **PayPal**, and set up tax + shipping rates.
See `docs/shopify-integration.md` and `docs/checkout.md`.
*Progress: store `goldrose-9372` and all three products are created with
images. Remaining: activate a payment provider, tax, and shipping rates.*

**M2 — Connect this site and test** *(you + this app; ~hours)* ← go-live line
Put real `shopifyVariantId`s in `lib/products.ts`, fill `.env.local`, set
`SHOPIFY_MODE=live`, then place one **real test order per method** and confirm it
lands in Shopify admin. After this, "no real orders" is no longer true.
*Progress: done for the permalink path — real variant IDs are wired in, the
deployed site hands carts to the real Shopify checkout, and payments are
confirmed working (the $1 test price is restored to $49.99). Card + Shop Pay
as native buttons wait on Shopify Payments (M0/M1).*

**M3 — Required pages & staying compliant** *(you + this app; ~1 day)*
Add shipping / refund / privacy / terms pages. Keep claims truthful, use images
you have rights to, and reduce payment-hold risk (real inventory, fast shipping,
clear delivery times, responsive support). See the compliance section in
`docs/launch-checklist.md`.

**M4 — Launch** *(this app; ~hours)*
Swap the placeholder `goldrose.example` domain in `app/layout.tsx` / `app/page.tsx`,
connect the real domain, and deploy.

**M5 — Grow** *(later)*
Email capture/marketing, analytics, reviews, more products, lifecycle emails.

**Who does what:** M0–M1 are yours (decisions + Shopify account — I can't make
those). From M2 on I can do the wiring, the policy pages, the domain swap, and
run the live tests with you.
