# GoldRose repository summary

Start here. This file is the repository's startup context: goal, current
state, safety gates, release queue, and the index of deeper docs. Open linked
resources only when the task needs them.

## How to update this file

- Keep this file as concise startup context for any AI agent working on the
  project.
- Include only what an agent needs to understand the project's goal, current
  state, structure, environment, available tooling, and connected services well
  enough to make informed decisions.
- This file owns the current project state (owner's choice, 2026-07-28 — no
  separate state file). Every other topic gets one authoritative owning doc:
  state the short version here and link to the owner instead of repeating it.
- Keep implementation details, history, and long instructions out of this
  file so they do not overwhelm the agent's context.

## Goal

- Sell the GoldRose 24K gold-dipped rose gift line directly to consumers.

## Project context — reconciled 2026-07-27

### Business and team

- Two bosses decides everything. (Locate in China)
- Frontend UI design team design appearance and interaction of web page. (Locate in China)
    And I oversee and manage their jobs.
- Charles(me) taking responsibility of all IT part and decide how to implement everything in tech,
  (Locate in Sydney).
- Influencer which we have not found any yet. (locate same place with our targetted customer, US first)
- Website Initial targets United States first, with Europe as a possible later market.

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

- Pre-launch testing on <https://goldrose-storefront.vercel.app>. No real
  customers or public campaigns; all orders and analytics are test data, and
  uncertain public content remains visibly mocked.
- Built: storefront, admin, accounts, catalog, checkout/order flow,
  analytics, and the SEO/GEO baseline. PayPal Orders v2 wallet checkout
  works in sandbox. Supplied Figma screens are imported through the
  2026-07-29 redesign batch — a file-wide restyle plus `/account/privacy`,
  `/account/orders/details`, `/orders/track` (redesigned, with an unlinked
  return sheet), `/story` and `/craft` (routes, placeholders, and design
  conflicts: [`docs/ixd/README.md`](docs/ixd/README.md)). ⚠️ The delivery
  stamped an "ELDREVE" placeholder wordmark on many frames — GoldRose was
  substituted everywhere; DQ-34 asks the design team to confirm.
- Page/section dwell tracking is built, its hosted schema is live (`0005`), and
  the code sits on branch `feat/engagement-tracking` awaiting preview review —
  **not merged to `main`**, so production records no engagement yet
  ([`engagement-tracking.md`](docs/features/backend/engagement-tracking.md)).
- `/bag` items, tracking timeline, shipping choices, and card fields are
  visual placeholders; the real cart enters through `/checkout`.
- The [owner walkthrough](docs/admin-design.md#143-final-acceptance) is
  pending. Shopify code is removed; cancel its subscription only after
  acceptance.
- Next: owner activation/UAT → real shipping and product content → card
  integration → launch hardening (see [Release queue](#release-queue)).

### Environment and connected tooling — verified 2026-07-27

- Main workspace: Apple-silicon iMac in Sydney, using macOS, zsh, and
  Homebrew. Core CLIs installed: Git/`gh`, Node/npm, Supabase, Vercel,
  `psql`, Docker, Python 3/`uv`, `jq`, ripgrep, Claude, and Codex.
- Production deployment is `main` → GitHub/Vercel integration, not CLI
  deploys. Hosted Supabase project `cfvsvgbldnzkcjvbwnjp` is connected;
  local development also uses it when Supabase variables are set.
- Secrets in `.env.local` (gitignored); `.env.example` lists the variables.
- Auth status: `gh` SSH works as `CharlesChi715` but its API token is
  invalid — run `gh auth login` before `gh` API work. Vercel CLI is linked
  and authenticated as `vancechi`. Supabase CLI is authenticated and linked.
  `psql` works (connection details in [`README.md`](README.md)). Docker
  engine is reachable. Neither `cloudflared` nor `ngrok` is installed — add
  one when PayPal webhook testing begins.
- `FIGMA_TOKEN` has `file_content:read`; revoke it after design-import work.
- Tool auth can change; re-verify before environment-dependent work.
- Agent tooling (installed 2026-07-29): `.mcp.json` declares supabase
  (read-only, pinned project), next-devtools, and playwright MCP servers —
  all three still need one-time interactive approval, and Supabase needs
  `/mcp` OAuth. context7 and Trail of Bits supply-chain-risk-auditor plugins
  are live (user scope); official Supabase skills sit in `.claude/skills/`
  (Claude Code) and `.agents/skills/` (Codex — verified it loads them).
  Codex mirror complete: supply-chain-risk-auditor skill in
  `.agents/skills/`, and all four MCP servers in `~/.codex/config.toml`
  (global) — Supabase OAuth already done on the Codex side.

## Runtime and safety

- **Local mode** (blank Supabase and PayPal variables): data lives in
  `.data/db.json`; end-to-end tests use this mode. `npm run seed -- --reset`
  restores local data. Admin is open unless `ADMIN_DEV_PASSWORD` is set;
  customer sign-in is unavailable.
- **Hosted mode:** add migrations as `supabase/migrations/000N_*.sql`, apply
  with `supabase db push` — never the web SQL editor. Migrations `0001`–`0003`
  and `0005` are applied; `0004` is permanently skipped (its orphan history row
  was repaired 2026-07-28 — intentional, not a gap to fill). Use `psql` for
  read-only ad-hoc queries; `supabase db dump` requires Docker.

### Release gates

- `CHECKOUT_SKIP_PAYMENT=1` is test-only and records uncharged mock orders.
  Remove it before launch; builds reject it with `PAYPAL_ENV=live`.
- Only the owner may enable live PayPal.
- Supabase configuration must be fully present or absent; the service-role
  key stays server-side.
- Money uses integer cents; orders are never hard-deleted.
- Storefront data revalidates every 300 seconds.
- Admin strings use `t()` for English and Shopify-style Chinese; every
  exported `lib/` function requires JSDoc.
- [`docs/admin-design.md`](docs/admin-design.md) remains the authoritative
  spec. Keep [`docs/ideas.md`](docs/ideas.md) verbatim; change
  [`docs/Database.md`](docs/Database.md) only on explicit request.

## Release queue

1. Complete owner activation and the
   [acceptance walkthrough](docs/admin-design.md#143-final-acceptance).
2. Finish customer sign-in activation: apply the new email templates with
   `node scripts/apply-auth-email-templates.mjs`, then configure
   launch-ready SMTP (built-in Supabase email allows only ~2 mails/hour).
3. Configure PayPal sandbox and begin Advanced Checkout onboarding; install
   `cloudflared` or `ngrok` when webhook testing starts.
4. Fix customer order links that point at the leftover `/orders` admin
   redirect; use `/account` or build guest lookup.
5. Enter real shipping rates (OQ-2) and product content (OQ-3).
6. Replace third-party/dev imagery and reconcile palettes, wordmarks, tabs.
7. Finish launch checks and configure
   [database backups](docs/features/backend/db-backups.md).
8. After acceptance: capture screenshots, cancel Shopify, revoke the Figma
   token, and begin marketing.

Later: promotion email consent (`docs/features/backend/promotion-emails.md`),
120-SKU imports (`docs/features/product-content-pipeline.md`), supplier
colors (`docs/supplier-color-charts.md`), campaign ideas (`docs/ideas.md`),
and an EU read replica (`docs/features/backend/region-alignment.md`).

## Product decisions

- **OQ-1 — decided 2026-07-26:** use
  [PayPal Advanced Cards](docs/features/card-payments.md) for
  Visa/Mastercard on the checkout page. Card processing is not built;
  Stage 0 is owner onboarding.
- **OQ-2 — open:** rest-of-world shipping at `$19.95` is a placeholder.
- **OQ-3 — open:** seed product details and some imagery are placeholders.
  `/shop` cards now show the real catalog photos, which are supplier
  composites with English text baked in — replace before launch. Only three
  products fill the eight-card grid, so cards repeat.
- Use `temp/PlaceholderPicture.png` for explicitly unknown images.

## Repository structure

```text
goldrose-storefront/
├── AGENTS.md            # Canonical AI collaboration and teaching protocol
├── CLAUDE.md            # Claude import of the canonical agent instructions
├── .codex/              # Local Codex hooks, including the working-mode selector
├── app/                 # Next.js routes, pages, and API endpoints
├── components/          # Storefront, screen, and shared React UI
├── lib/                 # Domain logic and data/payment/auth adapters
├── public/              # Browser-served images and static assets
├── assets/              # Raw owner/source art; not served directly
├── supabase/            # Hosted database migrations
├── scripts/             # Seed, validation, and feature utilities
├── tests/               # Playwright end-to-end and unit tests
├── docs/                # Specs, roadmaps, guides
├── temp/                # Raw imports and scratch material; not served
├── .data/               # Local file-adapter database and uploads
├── .ai/                 # Optional work history; never startup context
├── .mcp.json            # Project MCP servers (supabase read-only, next-devtools, playwright)
├── proxy.ts             # Admin route/API authentication guard
├── package.json         # Dependencies and runnable commands
├── README.md            # Setup, stack, run, test, and deploy guide
└── SUMMARY.md           # This entrypoint: context, state, and doc index
```

## Find details on demand

| Need | Open |
|---|---|
| Workflow rules: branching, parallel sessions, CI gates, environments | [`docs/engineering-playbook.md`](docs/engineering-playbook.md) |
| Feature status and roadmap | [`docs/features/README.md`](docs/features/README.md) |
| Authoritative admin/product requirements (`§` references) | [`docs/admin-design.md`](docs/admin-design.md) |
| Figma imports, route decisions, interactions, design issues | [`docs/ixd/README.md`](docs/ixd/README.md) |
| Front-end Definition of Done (Proposed, awaiting sign-off) | [`docs/ixd/frontend-definition-of-done.md`](docs/ixd/frontend-definition-of-done.md) |
| How work is handed over: design team → dev → bosses, delivery checklist | [`docs/ixd/delivery-protocol.md`](docs/ixd/delivery-protocol.md) |
| Database decisions and SKU rules | [`docs/Database.md`](docs/Database.md) |
| SEO/GEO implementation and supporting research | [`docs/seo-geo/search-discovery-implementation.md`](docs/seo-geo/search-discovery-implementation.md) |
| Testing procedure | [`docs/TESTER-GUIDE.md`](docs/TESTER-GUIDE.md) |
| End-to-end feature traces, written to learn from | [`docs/learning/README.md`](docs/learning/README.md) |
| Owner ideas, kept verbatim | [`docs/ideas.md`](docs/ideas.md) |
| Per-task hand-offs awaiting the owner's decisions | [`docs/TODO/`](docs/TODO/README.md) |
| Open questions for the front-end design team (frame → route, missing states) | [`docs/TODO/design-team-questions.md`](docs/TODO/design-team-questions.md) |
