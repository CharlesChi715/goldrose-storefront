<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GoldRose Storefront

Direct-to-consumer storefront for a 24K gold-dipped rose gift line, with its
own Shopify-clone admin and native checkout. No Shopify code remains.

**Live:** <https://goldrose-storefront.vercel.app> · **Admin:** `/admin`

> **Start here:** [SUMMARY.md](SUMMARY.md) is the short repository entrypoint
> (high-level state, structure, and links to details).
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

## Tooling and connection checks

The main workspace is an Apple-silicon Mac using macOS, zsh, and Homebrew.
Project work uses Git/`gh`, Node/npm, Supabase CLI, Vercel CLI, `psql`, Docker,
Python 3/`uv`, `jq`, ripgrep, Claude, and Codex.

Installed does not mean authenticated or currently usable. Check only the tool
needed for the task:

```bash
gh auth status
vercel whoami
supabase projects list
docker info
```

The Git remote uses SSH. `.vercel/project.json` and `supabase/.temp/` hold the
local Vercel and Supabase project links and are gitignored. Never copy secrets
from `.env.local` into documentation, commands, logs, or chat.

For direct hosted PostgreSQL access, the password is stored as
`SUPABASE_DB_PASSWORD` in `.env.local`. Connect to
`aws-1-us-west-2.pooler.supabase.com` on port `5432`, database `postgres`, as
`postgres.<project-ref>`. Prefer read-only queries; make schema changes through
migrations.

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

## Housekeeping commands

**Forgot a command? Run `npm run` with no arguments — npm prints every script
in `package.json`.** The ones that are not obvious:

```bash
npm run agent-inbox          # what questions are waiting on you
npm run agent-inbox:close    # close one — picks from a list, archives it
npm run agent-inbox:try      # same menus, writes nothing (practice run)
npm run agent-inbox:check    # are the inbox's three records still in sync
npm run features:generate    # rebuild docs/features/README.md from the records
npm run features:check       # fail if that roadmap has drifted (CI runs this)
npm run format               # Prettier over the repo
npm run polish               # format + features:generate, before committing
```

Two conventions worth knowing before you touch either:

- **Agent inbox** — unresolved questions from AI agents live in
  [`agent-delivery/`](agent-delivery/README.md). Closing one always archives
  it; nothing is deleted, and `agent-delivery/archive/` is private.
- **Worklog** — every completed deliverable gets a dated entry in
  [`.ai/WORKLOG.md`](.ai/WORKLOG.md). It is append-only history, never startup
  context; do not read it unless Charles asks.

## Deploy

Push to `main` → Vercel production deploy (preview URLs for other branches).
Env vars live in the Vercel dashboard; changes need a redeploy.

The repository is also linked locally to Vercel for inspection and
troubleshooting. The normal production path remains the GitHub integration;
do not create a CLI production deployment unless the task explicitly requires
one.

## Repository map and documentation

[`SUMMARY.md`](SUMMARY.md) owns the repository tree and documentation index.
Keep setup and command guidance here; add project navigation there.
