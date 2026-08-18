# ELDREVE storefront — repository summary

Start here: goal, where things stand, safety rules, release queue.
Open a linked document only when the task needs it.

## How to update this file

- **Startup context only** — goal, structure, environment, and the rules that
  change what an agent is allowed to do. If a fact needs a paragraph to be
  useful, it belongs to its owning doc.
- **Anything that changes as the app changes goes in a feature record**, never
  here: `docs/features/<id>.md` front matter is the status database, CI
  validates it, and the roadmap is generated from it. A status typed by hand in
  this file is a status no tool can contradict.
- **One fact, one home.** Link to the owner; never restate what the owner
  already says, because two copies drift and the reader must then load both to
  find out which is current.
- History belongs to `git log`, not to this file.
- **Which document owns which topic is a skill, not a table here.** Load
  `project-docs` to route — it also carries the rule for choosing where a new
  fact goes. Topic skills: `admin-spec`, `database`, `naming`, `seo-geo`,
  `figma-sync`, `agent-delivery`, `feature-new`.

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

## Where things stand

**Going live, de-mocking gradually (decided 2026-08-07).** The site is open for
real use on <https://eldreve.com> (the vercel.app URL serves the same
deployment), and mock content is retired piece by piece while it is up — not in
one sweep beforehand. Two rules keep that safe:

- **Hard gates — never gradual.** Anything a stranger's money or identity
  touches is real *before* the switch: live PayPal (owner-only),
  `CHECKOUT_SKIP_PAYMENT` unset, real shipping rates (OQ-2), demo reviews
  removed (`npm run seed:reviews -- --remove`), database backups on.
- **Gradual — everything else.** Product copy, imagery and the placeholder
  screens are replaced item by item while live. A live placeholder may look
  unfinished; it may **never** state a price, stock level, delivery date or
  policy we cannot honour.

Until every hard gate is cleared, orders and analytics are test data and no
campaigns run.

**What is built, and how far along it is, is not written here.** One record per
feature owns it, and the status table is **generated** from those records'
front matter — so it cannot disagree with them, and `npm run features:check`
fails if it drifts:

➜ **[`docs/features/README.md#roadmap`](docs/features/README.md#roadmap)** —
21 records, each with its own blockers, open questions and links.

What is still visibly mocked (product copy and imagery, the tracking timeline,
shipping choices, card fields) is tracked in those records and in
[`agent-delivery/INBOX.md`](agent-delivery/INBOX.md); how far the design
import has got is [`docs/ixd/README.md`](docs/ixd/README.md).

⚠️ **The `/policies/*` documents are built but not published.** Six were
imported from their Figma frames on 2026-08-18 and are reachable, but they
commit ELDREVE to a 30-day return window, a one-year warranty, stated
processing times and arbitration — so every route ships
`robots: { index: false }` until the bosses sign the copy off (AI-046).
Removing that line is a business decision, not a technical one.

**Next:** clear the hard gates (owner activation/UAT, real shipping rates, live
PayPal) → take real orders → keep replacing mock content and placeholder
screens while live; card integration after.

## Runtime and safety

- **Local mode** (blank Supabase and PayPal variables): data in `.data/db.json`;
  e2e tests use this mode. `npm run seed -- --reset` restores it. Admin is open
  unless `ADMIN_DEV_PASSWORD` is set; customer sign-in is unavailable.
  ⚠️ **`npm run dev` refuses to start in local mode** (2026-08-07, owner) —
  `predev` runs `scripts/require-hosted-dev.mjs`, because a dev server backed by
  the 3-product seed looks like the live 2-product shop and is not. Local mode
  sleeps rather than being deleted: the test suite blanks the variables for its
  own server, and `ALLOW_LOCAL_MODE=1 npm run dev` wakes it deliberately.
- **Hosted mode:** a schema change is a file — `supabase/migrations/000N_*.sql`
  applied with `supabase db push`, **never the web SQL editor**. Code deploys
  itself on merge while migrations are pushed by hand, so **which ones are
  actually applied is state** and lives with the feature that owns it:
  [database-migrations](docs/features/database-migrations.md). Read it before
  assuming a table exists.
- `public/` is served, so anything left there is publicly reachable; a Figma
  export deleted from it is re-exported by
  `node scripts/figma/cli.mjs assets <frame-id>`.

### Release gates

- Mock data is retired **gradually while live**, except the hard gates above. A
  placeholder on the live site must read as a placeholder and must never assert
  a price, stock level, delivery date or policy we cannot honour.
- `CHECKOUT_SKIP_PAYMENT=1` is test-only and records uncharged mock orders.
  Remove before the first real order; builds reject it with `PAYPAL_ENV=live`.
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
2. Configure PayPal sandbox, begin Advanced Checkout onboarding; install
   `cloudflared`/`ngrok` when webhook testing starts.
3. Enter real shipping rates ([shipping-rates](docs/features/shipping-rates.md),
   OQ-2) — no placeholder rate may be live.
4. Clear the test scaffolding: `npm run seed:reviews -- --remove`, unset
   `CHECKOUT_SKIP_PAYMENT`, turn on [database backups](docs/features/db-backups.md).
5. Owner enables live PayPal → **the site is open for real orders.**

While live, in any order (nothing below blocks taking orders):

6. `supabase db push` for `0012`, which fills the two search-analytics cards.
7. Apply the email-change mail template
   ([customer-accounts](docs/features/customer-accounts.md) step 4).
8. Build guest order lookup ([order-tracking](docs/features/order-tracking.md));
   signed-in customers already see their orders at `/account`.
9. Replace mock product content (OQ-3) and third-party/dev imagery product by
   product; reconcile palettes and tabs.
10. Replace the remaining placeholder screens: tracking timeline, shipping
    choices, card fields, `/blog`. Sign off the six `/policies/*` documents so
    they can come out of `noindex` (AI-046).
11. Capture screenshots, cancel Shopify, revoke the Figma token, begin
    marketing. (The Shopify *store integration* is already gone; the
    `@shopify/polaris` UI framework is the admin's own and stays. Cancel the
    subscription only after acceptance.)

Later: promotion email consent
([`promotion-emails.md`](docs/features/promotion-emails.md)), 120-SKU imports
([`product-content-pipeline.md`](docs/features/product-content-pipeline.md)),
supplier colors ([`supplier-color-charts.md`](docs/supplier-color-charts.md)),
campaign ideas ([`ideas.md`](docs/ideas.md)), EU read replica
([`region-alignment.md`](docs/features/region-alignment.md)).

## Product decisions

- **OQ-1 — decided 2026-07-26:** use
  [PayPal Advanced Cards](docs/features/card-payments.md) for Visa/Mastercard at
  checkout; that record owns the state and the onboarding stages.
- **OQ-2 — open, and a hard gate:** real shipping rates must replace the
  placeholder before the first real order —
  [shipping-rates](docs/features/shipping-rates.md).
- **OQ-3 — open, gradual:** seed product details and some imagery are
  placeholders, and three products fill an eight-card grid so cards repeat. Each
  product's price and stock must be true even while its copy and photos are not
  — [product-content-pipeline](docs/features/product-content-pipeline.md).
- **OQ-4 — resolved 2026-08-03:** the brand is **ELDREVE** and the live domain
  is **`eldreve.com`**, replacing `goldrose.co`. What that decision is wired to
  — Vercel, Supabase redirects, passkey RP ID, inbound routing, Resend — is
  state, so it lives in
  [domain-and-email](docs/features/domain-and-email.md). What may still be
  called `goldrose` is [`brand-name.md`](docs/ixd/naming/brand-name.md).
- Use `assets/PlaceholderPicture.png` for explicitly unknown images.
- Path `~/Documents/Work/gold_rose` for company or additional info.

## Environment and tooling — verified 2026-07-27

- Apple-silicon iMac, Sydney; macOS, zsh, Homebrew. CLIs: Git/`gh`, Node/npm,
  Supabase, Vercel, `psql`, Docker, Python 3/`uv`, `jq`, ripgrep, Claude, Codex.
- Production deploys `main` → GitHub/Vercel integration, **not** CLI deploys.
  Hosted Supabase project `cfvsvgbldnzkcjvbwnjp`; local dev uses it too when the
  Supabase variables are set.
- Secrets in `.env.local` (gitignored); `.env.example` lists every variable.
- Auth: `gh` SSH works as `CharlesChi715` but its API token is invalid — run
  `gh auth login` before `gh` API work. Vercel CLI linked as `vancechi`;
  Supabase CLI linked; `psql` works ([`README.md`](README.md)); Docker reachable.
  No `cloudflared`/`ngrok` — install one before PayPal webhook testing.
  `FIGMA_TOKEN` has `file_content:read`; revoke after design-import work.
  **Re-verify tool auth before environment-dependent work.**
- Agent tooling: `.mcp.json` declares supabase (read-only, pinned),
  next-devtools and playwright — all need one-time approval, Supabase needs
  `/mcp` OAuth; all are global in `~/.codex/config.toml`. `.agents/skills/` is
  the **source of truth** for skills and `.claude/skills/` symlinks into it;
  `.claude/` is gitignored, so the tracked path for any skill is always
  `.agents/…`.

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
├── docs/                 # Specs, feature records, guides
├── agent-delivery/       # Agent workflow rules, INBOX, session write-backs
├── team-deliveries/      # Upstream deliveries: inbox/ + originals/ (kept)
├── trash/                # Scratch, gitignored, deletable; never referenced
├── .agents/skills/       # Skills — the doc router too (.claude/ symlinks in)
├── .ai/                  # Optional work history; never startup context
├── .data/                # Local file-adapter database and uploads
├── .github/              # CI workflows
├── .mcp.json             # Project MCP servers (supabase, next-devtools, playwright)
├── .env.example          # Every environment variable, documented
├── proxy.ts              # Admin route/API authentication guard
├── package.json          # Dependencies and runnable commands
├── README.md             # Setup, stack, run, test, and deploy guide
└── SUMMARY.md            # This entrypoint: context, state index, and rules
```

Config at the root: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
`playwright.config.ts`, `postcss.config.mjs`, `vercel.json`, `.prettierrc.json`,
`.prettierignore`, `.npmrc`, `skills-lock.json`.
