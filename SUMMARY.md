# GoldRose / goldrose-storefront — SUMMARY

Single source of truth for anyone (human or agent) working here. Read first; keep fresh.

## Goal

- Sell the 24K gold-dipped rose gift line direct-to-consumer — **international, not US-only (decided 2026-07-21); USD-only pricing V1, storefront stays English** — via this custom Next.js storefront. Brand: **GoldRose** (renamed from AUREÀ 2026-07-21).
- Payments: Shopify hosted checkout still wired but slated for deletion; the admin build ships a native checkout per [docs/admin-design.md](docs/admin-design.md). **Provider undecided since 2026-07-22 (OQ-1): PayPal is the working assumption; schema is provider-neutral.**

## Current state (2026-07-21)

- **No customers yet — still testing.** The live site is a test deployment; no real traffic, orders, or shopper data to preserve (breaking changes are fine).
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

- **Charles is dropping Shopify — no transition phase** (no customers yet, nothing to protect). One build: Supabase-backed admin + native PayPal checkout (sandbox first); Shopify code deleted in the same build (Stage 4); the subscription is cancelled **last** (live admin = visual reference).
- **Rev 3 (2026-07-21, owner request): the admin UX is a screen-for-screen Shopify-admin clone** — built with Shopify's Polaris, same nav/screens/wording in EN + Shopify's own 中文 terms; only the appearance/Online-Store features (themes, pages, blog…) are dropped. Parity additions: variants, customers, discounts, drafts, abandoned checkouts, analytics, settings, timeline, refunds, order emails.
- **Rev 4 (2026-07-21): international.** Markets settings page (adapt), zone-based shipping (seed: US · Rest of world), ship-to country selector at checkout, customs fields on products; duties on buyer, per-market pricing/multi-currency V2.
- **Rev 4.1 (2026-07-22): closer Shopify parity** — Duplicate product, buyer gift message → order Notes, customer Timeline + export, 2FA; returns/partial fulfillment/bulk editor/saved views/template editing explicitly V2.
- **Rev 4.2 (2026-07-22): visitor behavior in V1** — first-party page_views beacon → Supabase (no external provider): sessions, conversion funnel, traffic sources, live-visitor card, order Conversion summary. Anonymous/cookieless. GA4/Meta Pixel deferred until paid ads start (then + consent banner).
- **Rev 4.3 (2026-07-22): SEO + GEO in V1** — DB-driven sitemap/robots/canonicals/OG + Product JSON-LD; Settings → Search engine & AI (homepage listing, AI-crawler toggle); /llms.txt for AI assistants; every PNG-pixel fact must also exist machine-readably; checkout country defaults via geo-IP.
- **Rev 4.4 (2026-07-22): §0 one-shot autonomous build directive** — Charles authorizes an agent to build the whole backend unattended: decide within guardrails, mock missing resources (local Supabase, fixture-tested PayPal), sandbox money only, one commit per stage, deliver docs/BUILD-REPORT.md + owner activation checklist.
- Full design: [docs/admin-design.md](docs/admin-design.md) — fidelity cut list, schema, security model, screen-by-screen clone spec, checkout/webhook flows, staged rollout (stages 0–9). Restructured 2026-07-22 as a formal design doc: ToC, agent guide (§2), open questions OQ-1..4 (§4), alternatives (§5), changelog (§17).
- Waiting on (= the doc's open questions §4): payment provider decision (OQ-1); ship-to country list + international rates (OQ-2); Charles's real product info (OQ-3); Supabase project creation (OQ-4).

## Next steps

- Start admin build per [docs/admin-design.md](docs/admin-design.md) stages 0–2 (test baseline → Supabase schema → admin auth shell).
- Charles: revoke the Figma token (imports done); real product info for the catalog.
- Wire ADD TO CART / BUY NOW into checkout (folds into admin build Stage 4).
