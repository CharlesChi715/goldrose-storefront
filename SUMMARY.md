# GoldRose / goldrose-storefront — SUMMARY

Single source of truth. Read first; keep fresh. "§" = sections of the spec, [docs/admin-design.md](docs/admin-design.md).

## Goal

- Sell the 24K gold-dipped rose gift line DTC — **international, USD-only V1, English storefront**. Brand: **GoldRose**.
- **Native checkout, PayPal Orders v2 (sandbox until launch)**; provider choice = OQ-1 (schema provider-neutral). Shopify code fully removed; owner cancels the subscription **after** the §14.3 walkthrough.

## File structure

```text
goldrose-storefront/
├── app/                 # Next.js App Router: storefront (/, /shop, /products/[slug], /account), /admin, API routes, sitemap/robots/llms.txt
├── components/          # Storefront + shared UI (VHeader, BackButton, WishlistButton, NoCalcScale…)
├── lib/                 # Domain logic: admin/, checkout/, supabase/ (2 backends: hosted / .data file adapter), account/, cart/
├── supabase/            # SQL migrations (0001 full schema, 0002 customer auth)
├── scripts/             # seed.ts (npm run seed; flags --reset / --demo)
├── proxy.ts             # Auth middleware (Next 16 name, §9.2) — guards /admin + /api/admin only
├── tests/               # 55 Playwright e2e (production build, port 3001, file adapter) + 28 unit — green
├── public/              # Served assets: bottom-nav/, top-nav/, veloria/, products/
├── assets/              # Raw owner art, not served: nav icons (public/ holds processed copies) + supplier-color-charts/
├── docs/                # Specs/guides, features/ decision records, learning/ walkthroughs, SEO/GEO research, repo review, and archive/
├── temp/                # Owner's raw upload zips (nav-button art) — scratch, not served
└── SUMMARY.md           # this file
```

## Current state (2026-07-24) — high level

- **⚠️ EVERYTHING STILL TESTING — nothing live/reliable yet. Ship target: 2026-07-30.** Sandbox PayPal only, placeholder products (OQ-3), no real marketing links posted; treat all data (orders, analytics, UTM tags) as test data until ship.
- **Deployed (testing)**: <https://goldrose-storefront.vercel.app> — build complete (stages 0–9 on `main`); awaiting the owner's §14.3 walkthrough.
- **Per-feature status: [docs/features/README.md](docs/features/README.md) Status tree** (= the roadmap). Open a feature's own file/docs/code only when working on that feature.
- **⚠️ Hosted Supabase is LIVE data** (ref `cfvsvgbldnzkcjvbwnjp`) — local dev writes the SAME live db.
- **Mock/local mode** (what e2e uses): blank the Supabase + PayPal env vars → file adapter `.data/db.json`; `npm run seed -- --reset` restores pristine; admin login is open-access unless `ADMIN_DEV_PASSWORD` is set; `/account` shows "sign-in unavailable".
- Owner activation to-dos: [BUILD-REPORT §5](docs/archive/BUILD-REPORT.md) — still the live to-do list.

## Key facts / constraints

- Money = integer cents; orders never hard-deleted; admin strings via `t()` (EN + Shopify 中文); service key server-side only; sandbox/mock money only — `PAYPAL_ENV=live` is owner-only.
- `npm run build` validates Supabase env first: local/test may omit all 3; partial config fails with exact missing names; Vercel production requires URL + anon key + service-role key.
- Storefront reads the DB (revalidate 300); pixel-exact Figma design guarded by pixel-diff — only designated text boxes show live data.
- `// read:` comments = near-literal verbalization, only in files Charles names (pilot: `lib/supabase/types.ts`); JSDoc required on every exported `lib/` function.
- [docs/admin-design.md](docs/admin-design.md) is the spec — don't compress or renumber (§0 guardrails were once accidentally deleted and restored).
- Owner ideas verbatim in [docs/ideas.md](docs/ideas.md) — don't expand. [docs/Database.md](docs/Database.md): Supabase Free + nightly pg_dump→S3 backup plan; edit only on request.

## Open questions (§4)

- OQ-1 payment provider (PayPal working assumption — built) · OQ-2 real shipping rates (RoW $19.95 placeholder) · OQ-3 real product info (seed placeholders)

## Next steps

- **Charles: finish the activation checklist** ([docs/archive/BUILD-REPORT.md](docs/archive/BUILD-REPORT.md) §5): Vercel env vars + redeploy → Supabase auth config → auth providers (passkeys RP, Google/Apple) → PayPal sandbox → §14.3 walkthrough → screenshots → cancel Shopify → revoke Figma token.
- Then: real rates (OQ-2), real product content (OQ-3), launch checklist items.
- Boss asks 07-25, now feature files (BACKLOG, approach awaiting sign-off): [order-tracking](docs/features/backend/order-tracking.md) (UPS carrier + auto link; tracking email already built) · [promotion-emails](docs/features/backend/promotion-emails.md) (consent + Resend audience).
- Post-ship: owner's influencer campaign + website-exclusive video finale ([docs/ideas.md](docs/ideas.md) 07-24) — no influencer links before ship.
- 120-SKU content pipeline (admin editing + bulk import): now a feature file, [docs/features/product-content-pipeline.md](docs/features/product-content-pipeline.md) — BACKLOG, after ship; SKU rules in [docs/Database.md](docs/Database.md). Supplier's full color catalog (124 colors: Y/YS/YC series) parsed in [docs/supplier-color-charts.md](docs/supplier-color-charts.md).
