<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AUREÀ Storefront

A beginner-friendly direct-to-consumer storefront MVP for a 24K gold dipped rose
gift product.

**Live site:** <https://goldrose-storefront.vercel.app/> (deployed on Vercel;
checkout hands off to Shopify for PayPal).

This README is the project map. Keep it updated as decisions change.

## Current Goal

**Show the boss the stack works end to end** — a visitor can click, pay, and the
order goes the right way — *without* selling the real product yet. The full loop
(click → pay → **order lands in the `/orders` log**) now runs in mock mode. See
[docs/demo-goal.md](docs/demo-goal.md) for the demo script and what is real vs.
simulated.

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
- a checkout (Credit Card / PayPal; Shop Pay is built but hidden until it is
  configured as a wallet) that captures each completed order to a demo
  **order log at `/orders`**, so the click → pay → order loop is visible end
  to end
- SEO metadata and basic structured data
- local product images served from `public/products/`

`main` now has a Shopify-shaped checkout path (the former `shopify-checkout`
branch, since merged). It runs in mock mode by default, so no real payment,
tax, order, or inventory action happens yet. Live checkout is switched on by
setting `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, which hands the cart to Shopify's
hosted checkout via a cart permalink.

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
|   |   +-- checkout/route.ts  # unified checkout endpoint (mock orders)
|   |   +-- shopify/
|   |       +-- cart/route.ts  # Shopify cart endpoint (no longer called by the UI)
+-- components/
|   +-- Storefront.tsx   # interactive storefront and cart UI
+-- lib/
|   +-- products.ts      # product data, types, and money formatting
|   +-- business.ts      # mock operations, shipping, returns, and launch decisions
|   +-- cart/            # shared cart state store
|   +-- checkout/        # checkout client, payment methods, and mock order processing
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

This is the server endpoint the storefront calls when the customer checks out.
It validates the cart lines and payment method, then processes a mock order
(via `lib/checkout/mock.ts`) and records it in the demo order log at `/orders`.
In live mode the client skips this route and hands the cart to Shopify's
hosted checkout through a cart permalink (`lib/shopify/permalink.ts`).

Beginner idea: a `route.ts` file inside `app/api/...` creates an API endpoint in
Next.js.

### `app/api/shopify/cart/route.ts`

An earlier endpoint that creates a mock or live Shopify cart through
`lib/shopify/client.ts`. The storefront UI no longer calls it — checkout now
goes through `/api/checkout` (mock) or a Shopify cart permalink (live) — but it
remains as the Storefront API cart-creation path.

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
- Pricing: placeholder values (⚠️ the signature rose is temporarily $1 in
  `lib/products.ts` for the live PayPal test — restore before launch)
- Product source: imported from China
- Inventory location: United States
- Fulfillment copy: `Imported from China. Ships from US inventory.`
- Mock warehouse: Ontario, California
- Mock free shipping threshold: $75
- Mock return window: 30 days
- Checkout: mock mode through `POST /api/checkout`; live mode hands off to
  Shopify hosted checkout via a cart permalink
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
- Checkout buttons process a mock order and log it at `/orders` in mock mode.
- With `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` set (as on the Vercel deploy), the
  PayPal button hands the real cart to Shopify's hosted checkout.
- Email form validates a simple email shape and shows local feedback.
- Mock business decisions are listed in `docs/mock-business-decisions.md`.
- Shopify setup steps are listed in `docs/shopify-integration.md`.
- `npm run lint` passes.
- `npm run build` passes.

## What Is Real vs Not Real Yet

Real now:

- A real Shopify store exists (`goldrose-9372`) with all three products
  published, images attached, and the real variant IDs wired into
  `lib/products.ts`.
- The deployed site can hand a real cart to Shopify's hosted checkout via a
  cart permalink (the PayPal path; enabled by setting
  `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`). The ⚠️ $1 test price set for the live
  PayPal test is still in `lib/products.ts`.

Not real yet:

- Shopify Payments is not activated, so no card or Shop Pay payments — blocked
  on the payment-processor / merchant-entity decision (see ⚠️ below).
- No verified tax or shipping-rate setup in Shopify.
- No inventory sync — Shopify stock and `lib/products.ts` are maintained by
  hand and can drift.
- Mock-mode orders exist only in the local `.data/orders.json` demo log, which
  resets on every Vercel deploy.
- No real email provider.
- No privacy, refund, terms, or shipping policy pages.
- No analytics.
- No real production domain (metadata still uses `aurea.example`).
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

Where we are now: the storefront and a credit card / PayPal checkout (Shop Pay
built but hidden) work in **mock mode**, and the real Shopify store
(`goldrose-9372`) already exists with products, images, and real variant IDs in
`lib/products.ts` — so M1 is partly done. The remaining wall is the ⚠️
payment-processor entity decision (M0), which blocks Shopify Payments and
therefore card + Shop Pay. The road from here to a real store is 6 milestones.

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
*Progress: real variant IDs are already in `lib/products.ts`, and the deployed
site hands the cart to the real Shopify checkout via a PayPal cart permalink
(⚠️ the $1 test price from that test is still in `lib/products.ts`). Card +
Shop Pay tests wait on Shopify Payments (M0/M1).*

**M3 — Required pages & staying compliant** *(you + this app; ~1 day)*
Add shipping / refund / privacy / terms pages. Keep claims truthful, use images
you have rights to, and reduce payment-hold risk (real inventory, fast shipping,
clear delivery times, responsive support). See the compliance section in
`docs/launch-checklist.md`.

**M4 — Launch** *(this app; ~hours)*
Swap the placeholder `aurea.example` domain in `app/layout.tsx` / `app/page.tsx`,
connect the real domain, and deploy.

**M5 — Grow** *(later)*
Email capture/marketing, analytics, reviews, more products, lifecycle emails.

**Who does what:** M0–M1 are yours (decisions + Shopify account — I can't make
those). From M2 on I can do the wiring, the policy pages, the domain swap, and
run the live tests with you.
