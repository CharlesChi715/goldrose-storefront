# AUREÀ / goldrose-storefront — SUMMARY

Single source of truth for anyone (human or agent) working here. Read first; keep fresh.

## Goal

- Sell the 24K gold-dipped rose gift line direct-to-consumer (US market) via this custom Next.js storefront.
- Shopify is the one and only checkout/payment backend (Shop Pay requires Shopify).

## Current state (2026-07-21)

- **Live** at <https://goldrose-storefront.vercel.app> (Vercel, deploys from `main`).
- **Redesign (2026-07-21)**: all three pages are pixel-exact Figma imports — `/` (home), `/shop` (VELORIA "Frame 26"), `/products/[slug]` (VELORIA 详情页; every product shows the same placeholder design for now). Cards link to product pages; shared bottom nav (fixed) has Home/Shop wired. Old storefront UI deleted (backup: branch `gold-rose-v0`).
- Pixel-verified vs Figma renders (~1–3% residual = text antialiasing); one cosmetic follow-up pending: swap ✦◯▣★● symbol glyphs for Figma SVG exports (API rate-limited mid-session).
- **Checkout backend intact but unreachable from UI**: the Shopify cart-permalink flow (`/checkout`, PayPal confirmed 2026-07-15) still works, but ADD TO CART / BUY NOW on the new product page aren't wired to it yet. Not pushed/deployed yet.
- Local dev defaults to **mock checkout** — fully clickable, no money moves.
- Step-by-step status of the whole buyer flow: [docs/flow-map.md](docs/flow-map.md).

## Key facts / constraints

- Owner is non-technical: docs stay plain-language; work stays consolidated on `main`.
- Shopify store: `goldrose-9372.myshopify.com` (Advanced plan, on trial).
- Env switches: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` turns on live permalink checkout; `SHOPIFY_MODE=live` + Storefront API token would activate the dormant API path (`lib/shopify/client.ts`).
- Owner ideas are captured verbatim in [docs/ideas.md](docs/ideas.md) — don't expand them.

## Next steps

- Finish glyph-SVG swap on new pages; re-verify; push to deploy.
- Wire ADD TO CART / BUY NOW into the cart + Shopify permalink checkout.
- Charles: revoke the Figma token once imports are done.
- Launch hygiene per [docs/launch-checklist.md](docs/launch-checklist.md): Shopify Payments (unlocks card + Shop Pay), tax, shipping rates, policy pages, real domain.
