# AUREÀ / goldrose-storefront — SUMMARY

Single source of truth for anyone (human or agent) working here. Read first; keep fresh.

## Goal

- Sell the 24K gold-dipped rose gift line direct-to-consumer (US market) via this custom Next.js storefront.
- Shopify is the one and only checkout/payment backend (Shop Pay requires Shopify).

## Current state (2026-07-21)

- **Live** at <https://goldrose-storefront.vercel.app> (Vercel, deploys from `main`).
- **Redesign in progress (2026-07-21)**: `/` is now the pixel-exact Figma home page; old interactive storefront UI deleted (backup: branch `gold-rose-v0`). `/shop` temporarily redirects to `/` until Figma "Frame 26" is imported; product detail pages (`/products/[slug]`, from 详情页 frame) come next.
- **Checkout backend intact but unreachable from UI**: the Shopify cart-permalink flow (`/checkout`, PayPal confirmed 2026-07-15) still works, but nothing adds to the cart until the new design is wired in.
- Local dev defaults to **mock checkout** — fully clickable, no money moves.
- Step-by-step status of the whole buyer flow: [docs/flow-map.md](docs/flow-map.md).

## Key facts / constraints

- Owner is non-technical: docs stay plain-language; work stays consolidated on `main`.
- Shopify store: `goldrose-9372.myshopify.com` (Advanced plan, on trial).
- Env switches: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` turns on live permalink checkout; `SHOPIFY_MODE=live` + Storefront API token would activate the dormant API path (`lib/shopify/client.ts`).
- Owner ideas are captured verbatim in [docs/ideas.md](docs/ideas.md) — don't expand them.

## Next steps

- Launch hygiene per [docs/launch-checklist.md](docs/launch-checklist.md): Shopify Payments (unlocks card + Shop Pay), tax, shipping rates, policy pages, real domain.
- Open item: fate of deleted `docs/demo-goal.md` + `docs/mock-business-decisions.md` (deletion uncommitted; launch checklist still references the latter). `docs/SEO.md` is untracked.
