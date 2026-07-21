# AUREÀ / goldrose-storefront — SUMMARY

Single source of truth for anyone (human or agent) working here. Read first; keep fresh.

## Goal

- Sell the 24K gold-dipped rose gift line direct-to-consumer (US market) via this custom Next.js storefront.
- Shopify is the one and only checkout/payment backend (Shop Pay requires Shopify).

## Current state (2026-07-21)

- **Live** at <https://goldrose-storefront.vercel.app> (Vercel, deploys from `main`).
- **Redesign (2026-07-21)**: all three pages are pixel-exact Figma imports — `/` (home), `/shop` (VELORIA "Frame 26"), `/products/[slug]` (VELORIA 详情页; every product shows the same placeholder design for now). Cards link to product pages; all three pages share the same fixed white bottom nav (Home/Shop wired, active tab per page). Concierge chatbox (mascot + green bar) floats fixed above the nav on all pages — clicking opens a placeholder panel; real chat widget TBD. Old storefront UI deleted (backup: branch `gold-rose-v0`).
- Pixel-verified vs Figma renders: shop 98.6% / detail 96.6% visually identical (residual = text antialiasing). Symbol glyphs (✦◯▣★●…) served as exact pixel crops from the frame render (`public/veloria/glyph-*.png`).
- **Deployed**: redesign pushed to `main` 2026-07-21 → live on Vercel. Working back button on all headers; chatbox on all pages.
- **Checkout backend intact but unreachable from UI**: the Shopify cart-permalink flow (`/checkout`, PayPal confirmed 2026-07-15) still works, but ADD TO CART / BUY NOW on the new product page aren't wired to it yet — the live site currently can't take an order.
- Local dev defaults to **mock checkout** — fully clickable, no money moves.
- Step-by-step status of the whole buyer flow: [docs/flow-map.md](docs/flow-map.md).

## Key facts / constraints

- Shopify store: `goldrose-9372.myshopify.com` (Advanced plan, on trial).
- Env switches: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` turns on live permalink checkout; `SHOPIFY_MODE=live` + Storefront API token would activate the dormant API path (`lib/shopify/client.ts`).
- Owner ideas are captured verbatim in [docs/ideas.md](docs/ideas.md) — don't expand them.

## Custom admin (decided 2026-07-21, design approved, build not started)

- **Charles is dropping Shopify.** A custom admin (products, prices, inventory, orders, site content) backed by Supabase becomes the system of record; Shopify remains only as a temporary payment rail until a PayPal-direct checkout replaces it (Shop Pay loss accepted — reverses the original decision).
- Full design: [docs/admin-design.md](docs/admin-design.md) — schema, security model, admin screens, webhook ingestion, staged rollout (each stage keeps live checkout working), Phase B Shopify exit.
- Waiting on: Charles's real product info; Supabase project creation.

## Next steps

- Start admin build per [docs/admin-design.md](docs/admin-design.md) stages 0–2 (test baseline → Supabase schema → admin auth shell).
- Charles: revoke the Figma token (imports done); real product info for the catalog.
- Wire ADD TO CART / BUY NOW into checkout (folds into admin build Stage 4).
