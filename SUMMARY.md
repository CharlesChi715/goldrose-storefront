# GoldRose repository summary

Start here. This file is only the repo's high-level state and navigation
index—not implementation history or a detailed backlog. Open linked resources
only when the task needs them.

## How to update this file
- This file only contains highest-level state or things of this project which not
  fitable in other subfolder, and move any content into its relevant file to make
  this summary extremely concise.

## Goal

- Sell the GoldRose 24K gold-dipped rose gift line directly to consumers.
- The current planned area for marketting and selling is only US. Potential
  area in the future is Europe.
- All the content in frontend page should be English only.
- Keep uncertain content visibly mocked until the teammates supplies real content.

## State — 2026-07-26

### Team
- Most of our teams located in China. I am in Sydney. 
- Build payments for US where we going to marketing frist: Visa、 PayPal、Mastercard.
- PayPal Orders v2 is built in sandbox mode. Shopify code is removed, but the
  subscription stays active until the owner walkthrough passes.
- Hosted Supabase and Vercel are connected. All current data, payments,
  analytics, and marketing attribution are test-only; there are no real
  customers or public campaign links.
- All supplied mobile Figma frames are imported. Some B/C-screen controls and
  content remain visual placeholders, and design-system conflicts remain open.
- Immediate path: owner activation/UAT → real shipping and product content →
  launch hardening. Detailed state and blockers:
  [`docs/project-state.md`](docs/project-state.md).

### Marketting

- The influencer who going to marketting our product and 
  targetted user in American currently. We planning to sell it in Euorpe in
  the future but Amarican first.

### App

- The full storefront/admin build is deployed for testing at
  <https://goldrose-storefront.vercel.app>.

## Repository structure

```text
goldrose-storefront/
├── app/                 # Next.js routes, pages, and API endpoints
├── components/          # Storefront, screen, and shared React UI
├── lib/                 # Domain logic and data/payment/auth adapters
├── public/              # Browser-served images and static assets
├── assets/              # Raw owner/source art; not served directly
├── supabase/            # Hosted database migrations
├── scripts/             # Seed, validation, and feature utilities
├── tests/               # Playwright end-to-end and unit tests
├── docs/                # Specs, state, roadmaps, guides, and archive
├── temp/                # Raw imports and scratch material; not served
├── .data/               # Local file-adapter database and uploads
├── .ai/                 # Optional work history; never startup context
├── proxy.ts             # Admin route/API authentication guard
├── package.json         # Dependencies and runnable commands
├── README.md            # Setup, stack, run, test, and deploy guide
└── SUMMARY.md           # This high-level entrypoint
```

## Find details on demand

| Need | Open |
|---|---|
| Environment, safety gates, blockers, open decisions | [`docs/project-state.md`](docs/project-state.md) |
| Setup, architecture, commands, deployment | [`README.md`](README.md) |
| Feature status and roadmap | [`docs/features/README.md`](docs/features/README.md) |
| Authoritative admin/product requirements (`§` references) | [`docs/admin-design.md`](docs/admin-design.md) |
| Figma imports, route decisions, interactions, design issues | [`docs/ixd/README.md`](docs/ixd/README.md) |
| Database decisions and SKU rules | [`docs/Database.md`](docs/Database.md) |
| Testing procedure | [`docs/TESTER-GUIDE.md`](docs/TESTER-GUIDE.md) |
| End-to-end feature traces, written to learn from | [`docs/learning/README.md`](docs/learning/README.md) |
| Owner ideas, kept verbatim | [`docs/ideas.md`](docs/ideas.md) |
| Historical documents | [`docs/archive/`](docs/archive/) |

Do not read `.ai/WORKLOG.md` at startup; consult it only when Charles asks for
historical work detail. Keep feature-specific descriptions in their owning
docs/code, not in this file.
