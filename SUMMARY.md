# AUREÀ / goldrose-storefront — SUMMARY

Single source of truth for anyone (human or agent) working here. Read first; keep fresh.

## Goal

- Sell the 24K gold-dipped rose gift line direct-to-consumer (US market) via this custom Next.js storefront.
- Shopify is the one and only checkout/payment backend (Shop Pay requires Shopify).

## Current state (2026-07-21)

- **Live** at <https://goldrose-storefront.vercel.app> (Vercel, deploys from `main`).
- **Real payments work**: checkout hands the cart to Shopify's hosted checkout via a cart permalink; PayPal confirmed with a real payment 2026-07-15.
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
