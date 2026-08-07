# ELDREVE storefront — repository summary

Start here: goal, current state, safety gates, release queue, doc index.
Open linked resources only when the task needs them.

## How to update this file

- Concise startup context only — goal, state, structure, environment, tooling.
- This file owns **current project state**. Every other topic has one owning
  doc: state the short version here, link to the owner, never repeat it.
- Keep implementation details, history, and long instructions out.

## Goal

- Sell the ELDREVE 24K gold-dipped rose gift line direct to consumers.
  (Repo/dir name `goldrose-storefront` predates the rename — see OQ-4.)

## Business and team

- Two bosses decide everything (China).
- Frontend UI design team designs appearance and interaction (China); Charles
  oversees their work.
- Charles (Sydney) owns all IT and every technical implementation decision.
- No influencer found yet (to be located with the target customer).
- Market: United States first, Europe possibly later.

## Product map

- **Storefront:** home, shop (search/sort/filter overlays), product pages
  (review/color/photo/unboxing overlays), bag, checkout, confirmation, tracking.
- **Customer/business:** account (dashboard, orders, returns, gift reminders),
  care, partnership and wholesale enquiry.
- **Admin:** products/inventory, orders, customers, discounts, content, files,
  analytics, team, security.
- **Marketing:** SEO/GEO, analytics, campaign/UTM attribution.

## Current phase — reconciled 2026-08-04

- Pre-launch testing on <https://eldreve.com> (the vercel.app URL serves the
  same deployment). No real customers or campaigns; all orders and analytics
  are test data; uncertain public content stays visibly mocked.
- **Built:** storefront, admin, accounts, catalog, checkout/order flow,
  analytics, SEO/GEO baseline. PayPal Orders v2 wallet checkout works in sandbox.
- **Customer sign-in is live end to end (2026-08-03).** `/account/signup` does
  real email validation → `signInWithOtp` → 6-digit code → consent-gated
  CONTINUE → `verifyOtp` → `/account`. The same email carries a one-tap link.
- **`/account/personal-info` is live (2026-08-06).** Real name, email and
  language, saved via `lib/account/profile.ts` to the auth user's
  `user_metadata` (source of truth) and mirrored onto the linked `customers`
  row — never linked by email. Email changes go through
  `updateUser({ email })`; the project has secure email change on, so both
  addresses confirm. Signed-in only; signed out it redirects to
  `/account/signup`. ⚠️ The repo now carries an email-change mail template
  that is **not yet applied** — run
  `node scripts/apply-auth-email-templates.mjs` so the link returns to the
  page instead of the homepage.
- **AI-020 answered 2026-08-04 (owner): `/account/signup` is the ONLY login
  page.** `/account` is signed-in only and redirects there otherwise; the
  second login screen (`ShoppingLogin`, frame 74:53) is deleted. It carried the
  Gift Shopping ⇄ Business tabs, so `/account/business` now has **no
  signed-out entry** — the 08-04 MENU also dropped its FOR BUSINESS row. Needs
  a design ruling; the route still works directly.
- **Figma imports** are current through 2026-08-05 on `feat/figma-sync`; the
  per-frame history and prototype-link decisions live in the per-session
  write-backs under [`agent-delivery/sessions/`](agent-delivery/README.md)
  (`docs/ixd/` is now only the naming rules). The 08-05 sync found **no changed
  frames** and instead built the Ready-for-dev leftovers
  `/account/orders/delivered` (`2439:369`) and `/account/orders/review`
  (`2439:370`), closing AI-029's dead "View details". Landed so far: the two-step
  checkout redesign, the full returns flow, reminder date pickers and edit
  sheet, the restructured privacy hub, `/account/policies-legal` → 7
  `/policies/*` coming-soon scaffolds, the unified signup page, and the
  three-tile `/account` dashboard (frame `1523:2536`). The PDP now matches
  Ready-for-dev frame `1523:3971` (430×1616); its live catalog data and cart
  actions remain wired.
- **Simplified homepage imported 2026-08-04** (frame `2380:370`, section
  首页一级), replacing the earlier "ignore the homepage frames" hold. Canvas
  8673 → 5193; bands 11 → 7 (A-4/A-7/A-8/A-10 deleted at source). The homepage
  and shop IxD tables were retired — interaction design is maintained in Figma
  now.
- **Three-tab bottom nav** replaced the four-tab bar (2026-08-03): 商务/Wholesale
  removed per the design team; Login/Me session swap restored.
- **DQ-34 answered 2026-08-03:** the ELDREVE wordmark was never a placeholder —
  it is the brand. The repo's GoldRose substitution is retired: the rename
  landed 2026-08-05 (see OQ-4 / AI-021).
- **Pending from design:** ADDRESS-BOOK section, the 7 policy pages,
  MENU/story-long redesigns, `/gift-guide` (frame 1942:182 — no route built).
- **Product reviews are real (2026-08-06, PR #30, `feat/product-reviews`).**
  `product_reviews` table live on hosted (migration `0007`; content-neutral
  moderation, never hard-deleted), `lib/reviews/db.ts` + `POST /api/reviews`,
  the `/account/orders/review` PUBLISH button wired (closes AI-031), PDP
  rating row/drawer show live stats and scroll; design mock stays the visible
  fallback while no review is published. Two demonstration reviews are seeded
  on hosted and locally (`npm run seed:reviews`; `-- --remove` reverses it) —
  they are not customer content and must go before launch. Missing on purpose:
  photo-upload UI (column ready) and an admin moderation screen (publish needs
  a manual DB update for now).
- **The whole home page is admin-editable (2026-08-07, `worktree-admin-home-sections`).**
  Content → **Home page** (`/admin/content/home`) lists all 8 sections in page
  order with ~100 fields — headings, copy, button labels, links, chips, FAQ
  rows, certificates, footer links — plus a show/hide switch per Figma band.
  `lib/home-content/registry.ts` holds the design defaults; `site_content`
  stores **only overrides** (a row exists iff the value differs from the
  design), so there is no migration and no seed, and a Figma re-sync updates
  every untouched field. Hiding a band re-stacks the page and shrinks the
  stage; with nothing hidden the render is byte-identical (all 3 pixel
  baselines pass). Figma-baked labels and catalogue/review data are listed
  read-only with the reason. `promo.slogan` moved here from `/admin/content`.
  Spec: [`admin-design.md` §9.8.1](docs/admin-design.md#981-content--home-page).
  ⚠️ The hero eyebrow still reads `— G O L D R O S E —`, a miss in the 08-05
  ELDREVE rename; it is now editable, so it is an owner decision, not a deploy.
- **Dwell tracking** is merged to `main` (PR #11) with schema `0005` live.
  Coverage is partial: 4 of the home page's 7 bands carry `data-el="…-SECTION"`
  (A-1/A-2/A-3/A-11; A-5/A-6/A-9 untagged);
  the rest waits on a signed-off section vocabulary
  ([`engagement-tracking.md`](docs/features/backend/engagement-tracking.md)).
- **Product-handle rule** ([`product-handles.md`](docs/ixd/naming/product-handles.md)
  v2.1) is adopted and enforced: `lib/admin/product-handle.ts` derives handles,
  collisions throw (no `-2`), non-draft handles are frozen. ⚠️ Duplicate in the
  Chinese admin (副本 prefix) now errors by design; `product_redirects` doesn't exist.
- **Feature-roadmap generator** was torn down 2026-08-01; a from-scratch rebuild
  (front matter only, no registry, no groups) is in progress. Its first piece,
  `scripts/features/cli.mjs`, reached `main` 2026-08-06 but nothing calls it:
  [`docs/features/README.md`](docs/features/README.md) still has no generated
  block and there are no `features:*` scripts or CI check.
- `/bag` items, tracking timeline, shipping choices and card fields are visual
  placeholders; the real cart enters through `/checkout`.
- The [owner walkthrough](docs/admin-design.md#143-final-acceptance) is pending.
  The Shopify *store integration* is removed (no `lib/shopify/`, no `SHOPIFY_*`
  vars); the `@shopify/polaris` UI framework is the admin's own and stays.
  Cancel the subscription only after acceptance.
- **Stale sweep 2026-08-07.** `archive/` deleted (git history is the archive
  now), and 1,029 unreferenced files removed from `public/` — 75MB → 24MB,
  1477 → 448 files. Those were Figma exports nothing renders, left by the
  homepage simplification and superseded screens; `public/` is served, so they
  were publicly reachable. Verified by build, 80 unit and 111 e2e tests
  (incl. the three pixel baselines). A deleted asset is re-exported by the
  next `npm run figma:assets`. Kept on purpose: `scripts/features/cli.mjs`
  (owner ruling — the generator rebuild still needs it).
- **Next:** owner activation/UAT → real shipping and product content → card
  integration → launch hardening.

## Environment and tooling — verified 2026-07-27

- Apple-silicon iMac, Sydney; macOS, zsh, Homebrew. CLIs: Git/`gh`, Node/npm,
  Supabase, Vercel, `psql`, Docker, Python 3/`uv`, `jq`, ripgrep, Claude, Codex.
- Production deploys `main` → GitHub/Vercel integration, **not** CLI deploys.
  Hosted Supabase project `cfvsvgbldnzkcjvbwnjp`; local dev uses it too when
  the Supabase variables are set.
- Secrets in `.env.local` (gitignored); `.env.example` lists every variable.
- Auth: `gh` SSH works as `CharlesChi715` but its API token is invalid — run
  `gh auth login` before `gh` API work. Vercel CLI linked as `vancechi`;
  Supabase CLI linked; `psql` works ([`README.md`](README.md)); Docker reachable.
  No `cloudflared`/`ngrok` — install one before PayPal webhook testing.
  `FIGMA_TOKEN` has `file_content:read`; revoke after design-import work.
  **Re-verify tool auth before environment-dependent work.**
- Agent tooling: `.mcp.json` declares supabase (read-only, pinned),
  next-devtools and playwright — all need one-time approval, Supabase needs
  `/mcp` OAuth. All four are global in `~/.codex/config.toml`. Skills live
  twice: `.agents/skills/` is the **source of truth** and `.claude/skills/`
  symlinks all four into it — `figma-sync`, `agent-delivery`, and, since
  2026-08-04, `supabase` + `supabase-postgres-best-practices` (they were still
  byte-identical copies when converged, so nothing was lost).
  `supply-chain-risk-auditor` exists only
  under `.agents/`. `.claude/` is gitignored, so the tracked path for any skill
  is always `.agents/…`.

## Runtime and safety

- **Local mode** (blank Supabase and PayPal variables): data in `.data/db.json`;
  e2e tests use this mode. `npm run seed -- --reset` restores it. Admin is open
  unless `ADMIN_DEV_PASSWORD` is set; customer sign-in is unavailable.
- **Hosted mode:** add migrations as `supabase/migrations/000N_*.sql` and apply
  with `supabase db push` — never the web SQL editor. `0001`–`0003`, `0005`,
  `0006` applied; `0004` is permanently skipped (its orphan history row was
  repaired 2026-07-28 — intentional, not a gap). Use `psql` for read-only
  ad-hoc queries; `supabase db dump` needs Docker.

### Release gates

- `CHECKOUT_SKIP_PAYMENT=1` is test-only and records uncharged mock orders.
  Remove before launch; builds reject it with `PAYPAL_ENV=live`.
- Only the owner may enable live PayPal.
- Supabase configuration must be fully present or absent; the service-role key
  stays server-side.
- Money uses integer cents; orders are never hard-deleted.
- Storefront data revalidates every 300 seconds.
- Admin strings use `t()` for English and Shopify-style Chinese; every exported
  `lib/` function requires JSDoc.
- [`docs/admin-design.md`](docs/admin-design.md) is the authoritative spec. Keep
  [`docs/ideas.md`](docs/ideas.md) verbatim; change
  [`docs/Database.md`](docs/Database.md) only on explicit request.

## Release queue

1. Owner activation + [acceptance walkthrough](docs/admin-design.md#143-final-acceptance).
2. ~~Customer sign-in activation~~ — **done 2026-08-03.** Custom SMTP live on
   Resend (`smtp.resend.com:465`, sender `noreply@eldreve.com` / "ELDREVE");
   templates applied from `scripts/apply-auth-email-templates.mjs` carrying both
   the `/auth/confirm` link and the 6-digit code; `mailer_otp_length` 6; send cap
   30/hour. Verified end to end. Remaining: watch Resend's free tier
   (~3k/month) against real volume.
3. Configure PayPal sandbox, begin Advanced Checkout onboarding; install
   `cloudflared`/`ngrok` when webhook testing starts.
4. Build guest order lookup. `0006` stamps `orders.auth_user_id` so OTP-signed-in
   customers already see their orders at `/account`; guests still have only
   `/orders/track`. (The leftover `/orders` → `/admin/orders` redirect was
   deleted 2026-08-04.)
5. Enter real shipping rates (OQ-2) and product content (OQ-3).
6. Replace third-party/dev imagery; reconcile palettes and tabs. (Wordmarks
   are done — the ELDREVE rename landed 2026-08-05, see OQ-4.)
7. Launch checks (incl. `npm run seed:reviews -- --remove`) + [database
   backups](docs/features/backend/db-backups.md).
8. After acceptance: capture screenshots, cancel Shopify, revoke the Figma
   token, begin marketing.

Later: promotion email consent
([`promotion-emails.md`](docs/features/backend/promotion-emails.md)), 120-SKU
imports ([`product-content-pipeline.md`](docs/features/product-content-pipeline.md)),
supplier colors ([`supplier-color-charts.md`](docs/supplier-color-charts.md)),
campaign ideas ([`ideas.md`](docs/ideas.md)), EU read replica
([`region-alignment.md`](docs/features/backend/region-alignment.md)).

## Product decisions

- **OQ-1 — decided 2026-07-26:** use
  [PayPal Advanced Cards](docs/features/card-payments.md) for Visa/Mastercard at
  checkout. Card processing is not built; Stage 0 is owner onboarding.
- **OQ-2 — open:** rest-of-world shipping at `$19.95` is a placeholder.
- **OQ-3 — open:** seed product details and some imagery are placeholders.
  `/shop` cards show real catalog photos, but they are supplier composites with
  English text baked in — replace before launch. Three products fill an
  eight-card grid, so cards repeat.
- **OQ-4 — resolved 2026-08-03:** the brand is **ELDREVE**; `goldrose.co` is
  superseded and **`eldreve.com` is registered and live** (Cloudflare Registrar,
  boss-owned account). Wired 08-02/08-03: domain + `www` on Vercel, cert issued;
  Supabase Site URL/redirects moved; **passkey RP ID switched to `eldreve.com`**
  — old vercel.app passkeys are dead by design, re-enrol on the new domain;
  Cloudflare Email Routing catch-all → company Gmail; Resend for outbound
  (DNS on `send.eldreve.com`). `NEXT_PUBLIC_SITE_URL=https://eldreve.com` is live
  (canonical, `og:image`, sitemap all verified). Resend uses two keys
  (`.env.example`): `RESEND_API_KEY` for our code, `RESEND_SMTP_PASSWORD` for
  Supabase SMTP — both live; `RESEND_API_KEY`/`RESEND_FROM` added to Vercel
  **Production only** on 2026-08-03, so previews still take `lib/email.ts`'s
  console-log fallback on purpose. Records:
  `~/Documents/Work/gold_rose/{eldreve-domain-registration,domain-setup}.md`.
  **Still pending:** billing → hua's PayPal.
- **Rename done 2026-08-05 (AI-021), branch `feat/eldreve-rename`.** Prose
  casing is **all-caps ELDREVE everywhere** (owner ruling). Three stale names
  went: `GoldRose`/`GOLDROSE` in all copy, titles, alt text and admin i18n;
  the title-case "Eldreve" in the Supabase auth email templates; and the
  `public/veloria/` asset namespace → `public/eldreve/`. Kept on purpose
  because they are identifiers, not copy: the lowercase `goldrose-*`
  localStorage/cookie keys (renaming them drops every admin session and
  empties every saved cart), `goldrose-storefront.vercel.app`, the
  `owner@goldrose.local` test fixture, and the literal noun "24K Gold Rose".
  Not attempted: renaming the repo/dir and the GitHub project.
- Use `assets/PlaceholderPicture.png` for explicitly unknown images.
- Path `~/Documents/Work/gold_rose` for company or additional info. 

## Repository structure

```text
goldrose-storefront/
├── app/                  # Next.js routes, pages, and API endpoints
├── components/           # Storefront, screen, and shared React UI
├── lib/                  # Domain logic and data/payment/auth adapters
├── public/               # Browser-served images and static assets
├── assets/               # Raw owner/source art; not served directly
├── supabase/             # Hosted database migrations
├── scripts/              # Seed, validation, and feature utilities
├── tests/                # Playwright end-to-end and unit tests
├── docs/                 # Specs, roadmaps, guides
├── agent-delivery/       # Agent workflow rules, INBOX, session write-backs
├── team-deliveries/      # Upstream deliveries: inbox/ + originals/ (kept)
├── trash/                # Scratch, gitignored, deletable; never referenced
├── .agents/              # Skills source of truth (.claude/ symlinks into it)
├── .ai/                  # Optional work history; never startup context
├── .data/                # Local file-adapter database and uploads
├── .github/              # CI workflows
├── .mcp.json             # Project MCP servers (supabase, next-devtools, playwright)
├── .env.example          # Every environment variable, documented
├── proxy.ts              # Admin route/API authentication guard
├── package.json          # Dependencies and runnable commands
├── CLAUDE.md             # Claude entry point importing SUMMARY.md
├── README.md             # Setup, stack, run, test, and deploy guide
└── SUMMARY.md            # This entrypoint: context, state, and doc index
```

Config at the root: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
`playwright.config.ts`, `postcss.config.mjs`, `vercel.json`, `.prettierrc.json`,
`.prettierignore`, `.npmrc`, `skills-lock.json`.

## Find details on demand

| Need                                                             | Open                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Agent instructions and open messages (`npm run agent-inbox`)     | [`agent-delivery/`](agent-delivery/README.md)                                                        |
| Feature status and roadmap (generator rebuild in progress)       | [`docs/features/README.md`](docs/features/README.md)                                                 |
| Authoritative admin/product requirements (`§` references)        | [`docs/admin-design.md`](docs/admin-design.md)                                                       |
| Figma imports, route decisions, interactions, design issues      | [`agent-delivery/sessions/`](agent-delivery/README.md) (per sync); [`docs/ixd/README.md`](docs/ixd/README.md) keeps the findings record |
| Naming rules — Figma sections/frames, `data-el`, product handles | [`docs/ixd/naming/`](docs/ixd/naming/figma-route-rule.md)                                            |
| Where raw deliveries land, and how to parse one                  | [`team-deliveries/README.md`](team-deliveries/README.md)                                             |
| Database decisions and SKU rules                                 | [`docs/Database.md`](docs/Database.md)                                                               |
| SEO/GEO implementation and research                              | [`docs/seo-geo/search-discovery-implementation.md`](docs/seo-geo/search-discovery-implementation.md) |
| End-to-end feature traces, written to learn from                 | [`docs/learning/README.md`](docs/learning/README.md)                                                 |
| Owner ideas, kept verbatim                                       | [`docs/ideas.md`](docs/ideas.md)                                                                     |
