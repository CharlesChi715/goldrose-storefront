<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GoldRose Storefront

Direct-to-consumer storefront for a 24K gold-dipped rose gift line, with its
own Shopify-clone admin and native checkout. No Shopify code remains.

**Live:** <https://goldrose-storefront.vercel.app> · **Admin:** `/admin`

> **Start here:** [SUMMARY.md](SUMMARY.md) is the short single source of truth
> (current state, constraints, next steps).
> [docs/admin-design.md](docs/admin-design.md) is the authoritative spec —
> "§" references everywhere point into it.

## What this is

- **Storefront** — pixel-exact Figma import (`/`, `/shop`, `/products/[slug]`),
  DB-driven catalog values in designated text boxes, native cart + checkout
  (PayPal Orders v2, sandbox), customer accounts at `/account`.
- **Admin** — bilingual (EN/中文) Polaris clone of the Shopify admin: orders,
  products/inventory, customers, content, analytics, discounts, settings,
  plus a testing forum (`/admin/forum`) and tester guide (`/admin/guide`).
- **Data** — Supabase Postgres (hosted) with a local file-adapter fallback
  (`.data/db.json`) when no Supabase env vars are set; schema in
  `supabase/migrations/`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Shopify Polaris (admin UI) · Supabase (Postgres/Auth/Storage) ·
PayPal Orders v2 · Playwright.

## Run & test

```bash
npm install
npm run dev            # http://localhost:3000  (admin: /admin)
npm run seed -- --reset   # pristine local db (file adapter)
npm run lint
npm run build
npm run test:unit
npm run test:e2e       # Playwright vs a production build, own port 3001
```

⚠️ With Supabase keys in `.env.local`, local dev reads/writes the **live**
hosted db. The e2e suite always pins itself to the local file adapter.
Money is sandbox/mock only — `PAYPAL_ENV=live` is an owner-only switch.

## Deploy

Push to `main` → Vercel production deploy (preview URLs for other branches).
Env vars live in the Vercel dashboard; changes need a redeploy.

## Project structure

```text
.
├── app/                 # Routes: storefront, /account, /admin, api/, sitemap/robots/llms.txt
├── components/          # Storefront + shared UI
├── lib/                 # admin/, checkout/, supabase/ (2 backends), account/, cart/
├── supabase/            # SQL migrations
├── scripts/             # seed.ts
├── tests/               # e2e (Playwright) + unit
├── public/              # Served assets (bottom-nav/, top-nav/, veloria/, products/)
├── assets/              # Raw owner art (not served)
├── docs/                # Spec + living docs; docs/archive/ = historical
└── SUMMARY.md           # Single source of truth — read first
```

## Docs

| Doc | Role |
|---|---|
| [SUMMARY.md](SUMMARY.md) | Current state, constraints, next steps |
| [docs/admin-design.md](docs/admin-design.md) | The spec (all § references) |
| [docs/TESTER-GUIDE.md](docs/TESTER-GUIDE.md) | Tester guide, rendered at `/admin/guide` |
| [docs/Database.md](docs/Database.md) | DB hosting + backup decisions |
| [docs/ideas.md](docs/ideas.md) | Owner's ideas, verbatim |
| [docs/seo-geo/search-discovery-implementation.md](docs/seo-geo/search-discovery-implementation.md) | SEO/GEO implementation source of truth |
| [docs/seo-geo/seo-intro.md](docs/seo-geo/seo-intro.md) | Concise, verified SEO opportunity map |
| [docs/seo-geo/geo-intro.md](docs/seo-geo/geo-intro.md) | AI-search/GEO research and platform background |
| [docs/archive/](docs/archive/) | Historical: build report (§5 activation checklist still live), Shopify-era docs, old flow map |
