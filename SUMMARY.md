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
- Help me learn the things you did proactively. I want to learn.

## State — 2026-07-27

### Team
- Most of our teams located in China. I am in Sydney. The influencer we going to find
  to marketting locates same area with customer.

### Marketing

- The influencer who going to marketting our product and targetted user in
  American currently.
- We planning to sell it in Euorpe in the future but Amarican first.

### Project

- Storefront and admin are deployed for testing:
  <https://goldrose-storefront.vercel.app>.
- The US-first storefront is English-only; unknown content stays visibly mocked.
- Supabase, Vercel, PayPal, analytics, and attribution are test-only. There are
  no real customers or public campaigns.
- PayPal wallet works in sandbox. PayPal Advanced Cards is selected but not
  built; the current card form is a mock.
- Shopify code is removed; cancel the subscription after owner acceptance.
- All supplied mobile Figma frames are imported, with some placeholders and
  design conflicts remaining.
- Next: owner activation/UAT → real shipping and product content → card
  integration and launch hardening. See
  [`docs/project-state.md`](docs/project-state.md).

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
