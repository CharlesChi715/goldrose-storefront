# GoldRose / goldrose-storefront — SUMMARY

Single source of truth for anyone (human or agent) working here. Read first; keep fresh.

## Goal

- Sell the 24K gold-dipped rose gift line direct-to-consumer — **international, USD-only V1, storefront in English** — via this custom Next.js storefront + our own Shopify-clone admin. Brand: **GoldRose**.
- Payments: **native checkout, PayPal Orders v2 (sandbox until launch)**; provider choice stays OQ-1 (schema is provider-neutral). Shopify code is fully removed; the subscription is cancelled by the owner **after** the §14.3 walkthrough.

## Current state (2026-07-22)

- **ADMIN BUILD COMPLETE — stages 0–9 all merged to `main`** per [docs/admin-design.md](docs/admin-design.md) §0 autonomous run. Full report + **owner activation checklist**: [docs/BUILD-REPORT.md](docs/BUILD-REPORT.md).
- `/admin` is a bilingual (EN/中文) Polaris Shopify-clone: Home dashboard, Orders (drafts, abandoned, fulfill/refund/cancel, timeline), Products (variants, media, inventory + movement log), Customers, Content (slots + files), Analytics (first-party beacon: sessions/funnel/live visitors), Discounts, Settings (zones, tax, notifications, policies, Search engine & AI), ⌘K search.
- **Storefront reads the DB** (catalog view, revalidate 300); pixel-exact Figma design intact — home byte-exact, shop/product gated by masked pixel-diff (only the designated text boxes show live data). SEO/GEO live: sitemap, robots (AI-crawler toggle), /llms.txt, Product JSON-LD.
- **Running in §0.2 fallback mode**: local file db (`.data/db.json`, auto-seeded), dev admin login (`ADMIN_DEV_PASSWORD`, default `goldrose-admin`), console emails, fixture-tested PayPal. Hosted Supabase + PayPal sandbox = activation checklist (no code changes).
- Tests: 43 e2e (Playwright vs production build) + 9 unit — all green. `npm run seed -- --reset` restores a pristine local db.
- Live deploy at <https://goldrose-storefront.vercel.app> still runs the **pre-build** commit until Vercel env vars are set (build works with none, but checkout there is mock-mode).

## Key facts / constraints

- All money integer cents; orders never hard-deleted; admin strings all go through `t()` (EN + Shopify 中文); service key only server-side; sandbox/mock money only — `PAYPAL_ENV=live` is owner-only.
- Design doc [docs/admin-design.md](docs/admin-design.md) is the spec (§0 guardrails restored 2026-07-22 after an accidental deletion).
- Owner ideas verbatim in [docs/ideas.md](docs/ideas.md) — don't expand them.

## Open questions (§4)

- OQ-1 payment provider (PayPal working assumption — built), OQ-2 real shipping rates (RoW $19.95 is a placeholder), OQ-3 real product info (seed placeholders live in the designated boxes), OQ-4 Supabase project (checklist step 1).

## Next steps

- **Charles: run the activation checklist** in [docs/BUILD-REPORT.md](docs/BUILD-REPORT.md) §5 (Supabase → PayPal sandbox → walkthrough → screenshots → cancel Shopify → revoke Figma token).
- Then: real rates (OQ-2), real product content (OQ-3), launch checklist items.
