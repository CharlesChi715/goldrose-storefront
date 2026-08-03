# GoldRose repository summary

Start here. This file is the repository's startup context: goal, current
state, safety gates, release queue, and the index of deeper docs. Open linked
resources only when the task needs them.

After this file, read [`agent-delivery/README.md`](agent-delivery/README.md) and
[`agent-delivery/INBOX.md`](agent-delivery/INBOX.md) for the agent workflow and
open messages. Before finishing, write back: anything you could not resolve or
must not guess goes into your own session file under
[`agent-delivery/sessions/`](agent-delivery/sessions), tagged `AI-nnn`, with a
row added to the inbox index and a matching comment beside the affected code.
Closed matters are archived, never deleted; never read
[`agent-delivery/archive/`](agent-delivery/archive/README.md) without asking
Charles first.

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

- Pre-launch testing on <https://eldreve.com> (the vercel.app URL still
  serves the same deployment). No real
  customers or public campaigns; all orders and analytics are test data, and
  uncertain public content remains visibly mocked.
- Built: storefront, admin, accounts, catalog, checkout/order flow,
  analytics, and the SEO/GEO baseline. PayPal Orders v2 wallet checkout
  works in sandbox. **Customer sign-in is live end to end (2026-08-03):**
  `/account/signup` is no longer a visual placeholder — real email input +
  validation, Send code (`signInWithOtp`), a live 6-digit code field,
  consent gating CONTINUE, and `verifyOtp` → `/account`. The same emailed
  message carries a one-tap sign-in link; `/account`'s own login screen
  still works alongside it (AI-020 asks the design team which is canonical). Supplied Figma screens are imported through the
  2026-08-02 sync (on `feat/figma-sync`): checkout is now the **two-step
  redesign** (2157:239/384 — details entry → payment confirmation, pay bar
  fixed to the viewport; the old single-page frame was deleted from the
  file; country/discount/gift-note/cart-row controls kept as flagged dev
  bands), the full **returns flow** is in (`/account/returns` rebuilt +
  add-photos/request-submitted/approved/refund-issued/not-approved + reason
  sheet — all mock data), the reminder edit modal gained live Y/M/D
  **dropdown pickers**, `/account/security` lost its password inputs at
  source, the privacy hub was restructured, and a new
  `/account/policies-legal` hub links 7 `/policies/*` coming-soon scaffolds
  (their frames are not Ready-for-dev). Earlier milestones: the 2026-07-29
  file-wide restyle and the 07-30 B-2 reflow
  ([`docs/ixd/README.md`](docs/ixd/README.md)). **DQ-34 answered 2026-08-03:**
  the "ELDREVE" wordmark on those frames was never a placeholder — ELDREVE
  is the brand. The design team was shipping it all along while the repo
  substituted GoldRose art at the same box (~23 call sites); that
  substitution is now wrong and retires with the rename project (OQ-4).
- A later batch (node ids 1593/1596/1599) delivered three more frames.
  **Imported:** the REMINDERS-EDIT-OPEN modal (1599:245) → a bottom sheet on
  `/account/reminders`, opened by Add reminder / each card's Edit; its "no
  navigation, info-storage, Cancel discards → defaults" behavior was
  **confirmed by the owner in the Figma comments**. **Not imported:**
  BLOG-JOURNAL-PAGE (built 2026-07-31 then **reverted** — its frame was never
  marked Ready-for-dev) and RETURNS-REQUEST-SUBMITTED-PAGE (not Ready-for-dev;
  its entry now exists — the return sheet's Confirm lands on a coming-soon
  scaffold at `/account/returns/request-submitted`, AI-007). A newer batch also
  added a `/gift-guide` long page (1942:182) and edited the blog frame's chrome
  — both untouched, no owner sign-off yet. The 07-31 sync processed the file's
  first prototype map (59 links): reminders toggles now default Email on / SMS
  off per the owner's frame comment; prototype links that would fake live
  features (cart→`/bag`, pay→keepsake, inert Save/submit) were not adopted
  (AI-008). The 08-01 sync: design un-marked `me三级` (reminders cluster pulled
  back for picker work — no re-imports from it until re-marked); the reminders
  timezone is now Pacific-only, shown as `Pacific Time (PT)UTC-8` per the
  design's updated frame (AI-009 closed 08-02). The 08-02 sync imported the
  re-marked `me三级` section (returns flow, date pickers) and the checkout
  redesign; the timezone-picker sheet was NOT built (contradicts the accepted
  Pacific-only comment). A **second, scoped 08-02 pass** then synced just two
  frames from the marked `me一级` section: `/account/signup` became the
  unified **"Continue with your email"** page (no name field, CONTINUE button,
  no Sign-in link, bottom nav band added), and the signed-in `/account`
  dashboard re-imported from its new frame id 2210:310 (Custom Archive tile
  back → four tiles; the inert "Address Management ›" row gone at source). The
  same pass made the dashboard greeting fall back to the visitor's **full
  email address** when they have no profile name. Pending from design: the
  simplified homepage (second frame 2024:378 — keep ignoring both homepage
  frames), the ADDRESS-BOOK section, the 7 policy pages, MENU/PDP/story-long
  redesigns, and `/gift-guide` ([`docs/ixd/README.md`](docs/ixd/README.md)).
- Page/section dwell tracking is **merged to `main`** (PR #11, `88831c4`) with
  its hosted schema live (`0005`), so it deploys with production. Section
  coverage is partial: only 3 of the home page's 17 bands carry a
  `data-el="…-SECTION"` tag; tagging the rest waits on a signed-off section
  vocabulary ([`engagement-tracking.md`](docs/features/backend/engagement-tracking.md)).
- The product-handle rule ([`product-handles.md`](docs/ixd/naming/product-handles.md),
  v2.1) is **Adopted and enforced in code** (2026-07-30): `lib/admin/product-handle.ts`
  derives handles, collisions throw (no `-2`), non-draft handles are frozen, and a
  unit test replays the doc's fixtures. ⚠️ Duplicate in the Chinese admin (副本
  prefix) now errors by design; `product_redirects` still doesn't exist.
- The feature-roadmap generator was **torn down 2026-08-01** (merged to
  `main`); a from-scratch rebuild is in progress (roadmap generated from
  record front matter only — no legacy registry, no groups). Until it lands,
  [`docs/features/README.md`](docs/features/README.md) has no generated block
  and there are no `features:*` npm scripts or CI check.
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
2. ~~Customer sign-in activation~~ — **done 2026-08-03.** Custom SMTP is live
   on Resend (`smtp.resend.com:465`, user `resend`, sender
   `noreply@eldreve.com` / "ELDREVE"), which is what unlocks template editing
   at all: the free tier refuses it while the built-in sender is in use, so
   the queue's old order (templates, *then* SMTP) was impossible. Templates
   applied from `scripts/apply-auth-email-templates.mjs` and carry both a
   `/auth/confirm?token_hash=…&next=/account` link and the 6-digit code;
   `mailer_otp_length` 8 → 6 to match the UI; send cap 2 → 30/hour.
   **Verified end to end 2026-08-03** — a real code was emailed through
   Resend and signed a customer in from `/account/signup`. Remaining: watch
   Resend's free tier (~3k/month) against real volume.
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
- **OQ-4 — resolved 2026-08-03:** the brand is switching to **ELDREVE**
  (per Charles; ties to DQ-34's ELDREVE wordmark), so `goldrose.co` is
  superseded. **`eldreve.com` is registered and live.** Registered
  2026-08-01 at Cloudflare Registrar on the boss-owned account (registrant
  He Jinhua / Zhongshu Technology Worldwide Limited, HK; $10.46/yr
  auto-renew). Wired 08-02/08-03: `eldreve.com` + `www` on the Vercel
  project via grey-cloud CNAMEs, cert issued; Supabase Site URL/redirects
  moved to eldreve.com; **passkey RP ID switched to `eldreve.com`** — old
  vercel.app passkeys are dead by design, re-enrol on the new domain;
  Cloudflare Email Routing catch-all → the company Gmail; Resend added for
  outbound (DNS on `send.eldreve.com`). Records:
  `~/Documents/Work/gold_rose/{eldreve-domain-registration,domain-setup}.md`.
  ✅ `NEXT_PUBLIC_SITE_URL=https://eldreve.com` is **live** — verified
  2026-08-03 against the deployed site: canonical, `og:image` and the sitemap
  all emit `eldreve.com`.
  ⚠️ Still pending: **`RESEND_API_KEY` and `RESEND_FROM` are missing from
  Vercel**, so production order/shipping mail is silently console-logged
  rather than sent (`lib/email.ts` never throws by design). Also pending:
  billing → hua's PayPal, and
  the GoldRose→ELDREVE rename project (~270 occurrences in ~110 files;
  scoped but not started).
  AI-TAG(AI-021): OWNER-DECISION — the rename needs its own branch and a
  decision on how the name is written in prose (ELDREVE vs Eldreve). See
  /agent-delivery/sessions/figma-sync-signup-mepage-08-02-feat-figma-sync.md. Resend carries outbound
  mail with two keys (see `.env.example`): `RESEND_API_KEY` for our code,
  `RESEND_SMTP_PASSWORD` for Supabase's custom SMTP. **Both are live as of
  2026-08-03** — SMTP configured, auth templates applied and Eldreve-branded
  (release queue #2).
- Use `assets/PlaceholderPicture.png` for explicitly unknown images.

## Repository structure

```text
goldrose-storefront/
├── agent-delivery/      # Golden rules of how agent delivery work outcome
├── CLAUDE.md            # Claude entry point importing SUMMARY.md
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
├── team-deliveries/     # Upstream deliveries: inbox/ + originals/ (kept)
├── archive/             # Superseded repo docs; never referenced from anywhere
├── trash/               # Scratch, gitignored, deletable; never referenced
├── .data/               # Local file-adapter database and uploads
├── .ai/                 # Optional work history; never startup context
├── .mcp.json            # Project MCP servers (supabase read-only, next-devtools, playwright)
├── proxy.ts             # Admin route/API authentication guard
├── package.json         # Dependencies and runnable commands
├── README.md            # Setup, stack, run, test, and deploy guide
└── SUMMARY.md           # This entrypoint: context, state, and doc index
```

## Find details on demand

| Need                                                                                  | Open                                                                                                 |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Agent instructions and open messages (`npm run agent-inbox`)                          | [`agent-delivery/`](agent-delivery/README.md)                                                        |
| Feature status and roadmap (generator rebuild in progress)                            | [`docs/features/README.md`](docs/features/README.md)                                                 |
| Authoritative admin/product requirements (`§` references)                             | [`docs/admin-design.md`](docs/admin-design.md)                                                       |
| Figma imports, route decisions, interactions, design issues                           | [`docs/ixd/README.md`](docs/ixd/README.md)                                                           |
| Naming rules — Figma sections/frames, components (`data-el`), and product URL handles | [`docs/ixd/naming/`](docs/ixd/naming/figma-route-rule.md)                                            |
| Where raw deliveries land, and how to parse one without re-importing it               | [`team-deliveries/README.md`](team-deliveries/README.md)                                             |
| Database decisions and SKU rules                                                      | [`docs/Database.md`](docs/Database.md)                                                               |
| SEO/GEO implementation and supporting research                                        | [`docs/seo-geo/search-discovery-implementation.md`](docs/seo-geo/search-discovery-implementation.md) |
| End-to-end feature traces, written to learn from                                      | [`docs/learning/README.md`](docs/learning/README.md)                                                 |
| Owner ideas, kept verbatim                                                            | [`docs/ideas.md`](docs/ideas.md)                                                                     |
