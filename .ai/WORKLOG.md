# AI Worklog

Append concise timestamped entries here when agent work creates useful project history.

Use a minute-precision timestamp for each entry heading, in local time with the
timezone, formatted as `## YYYY-MM-DD HH:MM TZ` (for example `## 2026-06-25 12:28 AEST`).
Run `date "+%Y-%m-%d %H:%M %Z"` to get the current value.

This file is optional history. Agents should read `.ai/HANDOFF.md` at startup and search this file only when they need older context.

## scaffold

- Added shared agent memory scaffold: `AGENTS.md`, `CLAUDE.md`, `.ai/HANDOFF.md`, and `.ai/WORKLOG.md`.

## 2026-06-25

- Built the first dependency-free GoldRose DTC storefront prototype with
  `index.html`, `styles.css`, `script.js`, `README.md`, and `.gitignore`.
- Kept checkout as a demo flow and documented the next commerce integration
  choices for a beginner-friendly learning path.
- Replaced the default Next.js README with a project-specific learning map for
  the GoldRose DTC storefront and documented the current Next.js scaffold as the
  main build path.
- Built the first real Next.js storefront MVP: product data module, interactive
  cart drawer, product/occasion/story/FAQ sections, copied storefront images into
  `public/products/`, and verified with lint/build plus a local dev server.
- Rebranded the current storefront direction from GoldRose to display brand
  `AUREÀ`, restyled the UI toward the bundled `temp/Gold Rose Landing.html`
  luxury visual direction, and documented the brand meaning and launch caveats.

## 2026-06-25 13:15 AEST

- Reread `.ai/HANDOFF.md` and `.ai/WORKLOG.md` on request.
- Confirmed the current direction: Next.js storefront MVP, visible brand
  `AUREÀ`, luxury visual style based on `temp/Gold Rose Landing.html`, checkout
  intentionally not connected yet.

## 2026-06-25 15:46 AEST

- Added `.claude/` to `.gitignore` and removed the staged `.claude` worktree
  entry from git tracking with `git rm --cached -r -f .claude`, keeping local
  files on disk.

## 2026-06-25 18:54 AEST

- Added mock US-market business assumptions for the AUREÀ storefront: China
  import origin, US inventory, Ontario CA warehouse placeholder, shipping/return
  policy placeholders, SKU/inventory/landed-cost fields, and an owner-review doc
  at `docs/mock-business-decisions.md`.
- Updated the storefront to display conservative origin and fulfillment copy,
  then verified with `npm run lint`, `npm run build`, and a local `200 OK` check.

## 2026-06-25 19:18 AEST

- On branch `shopify-checkout`, added Shopify mock/live cart creation: checkout
  UI posts to `POST /api/shopify/cart`, mock mode returns a Shopify-shaped cart,
  and live mode is ready to call Storefront API `cartCreate` after real Shopify
  credentials and variant IDs exist.
- Added `.env.example`, `lib/shopify/`, `docs/shopify-integration.md`, and
  updated README/business docs. Verified with lint, production build, homepage
  `200 OK`, and a mock Shopify cart POST.

## 2026-06-28 17:56 AEST

- Consolidated branches into `main`: merged the Shopify checkout path, folded in
  the ideas/learning docs, and archived the in-progress Stripe exploration on the
  `stripe-checkout` branch. Removed the stray worktrees and redundant branches.
- Built a unified checkout offering Shop Pay, credit card, and PayPal, all served
  by one Shopify checkout in live mode and fully mocked by default. Added
  `lib/cart/store.ts` (localStorage cart), `lib/checkout/*` (methods, Luhn card
  validation, mock order processor, express helper), `app/api/checkout`, and
  `app/checkout` (page + success + cancel). Card numbers are validated for format
  only and never stored.
- Refactored the storefront/cart drawer onto the shared cart hook with Shop Pay +
  PayPal express buttons and a Checkout · Credit Card button. Added `docs/checkout.md`.
