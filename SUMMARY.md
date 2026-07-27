# GoldRose repository summary

Start here. This file is the repository's high-level startup context and
navigation index—not implementation history or a detailed backlog. Open linked
resources only when the task needs them.

## How to update this file

- Keep this file as concise startup context for any AI agent working on the
  project.
- Include only what an agent needs to understand the project's goal, current
  state, structure, environment, available tooling, and connected services well
  enough to make informed decisions.
- Give each documentation topic one authoritative owner. This file may state
  the short version needed at startup, but it should link to the owner instead
  of repeating the full explanation. This rule applies to prose, not code.
- Summarize each topic at the highest useful level and link to its owning
  document. Keep implementation details, history, long instructions, and full
  task lists out of this file so they do not overwhelm the agent's context.

## Goal

- Sell the GoldRose 24K gold-dipped rose gift line directly to consumers.
- Help me learn the things you did proactively. I want to learn.

## Project context — 2026-07-27

### Business and team

- Charles is in Sydney; most teammates are in China.
- Launch in the United States first, with Europe as a possible later market.
  Public storefront content is English.
- Recruit influencers in the same market as the target customers.

### Product map

- **Public storefront:** homepage, shop (search/sort/filter overlays),
  product pages (review/color/photo/unboxing overlays), bag, checkout, order
  confirmation, and tracking.
- **Customer and business:** customer account (dashboard, orders, gift
  reminders), customer care, plus partnership and wholesale enquiry pages.
- **Admin:** products and inventory, orders, customers, discounts, content,
  files, analytics, team, security, and other store operations.
- **Marketing layer:** SEO/GEO, analytics, and campaign/UTM attribution.
- **Main customer journey:** discover → browse → select a product → checkout →
  confirmation, tracking, or account.

### Current phase

- The storefront and admin are in pre-launch testing. There are no real
  customers or public campaigns; uncertain public content remains visibly
  mocked.
- Next: owner activation/UAT → real shipping and product content → card
  integration → launch hardening. Current readiness and blockers:
  [`docs/project-state.md`](docs/project-state.md).

### Environment and connected tooling

- Main workspace: Apple-silicon iMac in Sydney, using macOS, zsh, and Homebrew.
- Core CLIs are installed: Git/`gh`, Node/npm, Supabase, Vercel, `psql`,
  Docker, Python 3/`uv`, `jq`, ripgrep, Claude, and Codex.
- The repository is linked to GitHub, hosted Supabase, and Vercel. Normal
  production deployment is `main` → GitHub/Vercel integration, not a CLI
  deployment.
- Secrets in `.env.local` (gitignored); `.env.example` lists the variables.
- Authentication and tool availability can change. Check current verification
  in [`docs/project-state.md`](docs/project-state.md) and commands in
  [`README.md`](README.md) before environment-dependent work.

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
| SEO/GEO implementation and supporting research | [`docs/seo-geo/search-discovery-implementation.md`](docs/seo-geo/search-discovery-implementation.md) |
| Testing procedure | [`docs/TESTER-GUIDE.md`](docs/TESTER-GUIDE.md) |
| End-to-end feature traces, written to learn from | [`docs/learning/README.md`](docs/learning/README.md) |
| Owner ideas, kept verbatim | [`docs/ideas.md`](docs/ideas.md) |
| Historical documents | [`docs/archive/`](docs/archive/) |
