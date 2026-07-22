# GoldRose / goldrose-storefront — SUMMARY

Single source of truth for anyone (human or agent) working here. Read first; keep fresh.

## Goal

- Sell the 24K gold-dipped rose gift line direct-to-consumer — **international, USD-only V1, storefront in English** — via this custom Next.js storefront + our own Shopify-clone admin. Brand: **GoldRose**.
- Payments: **native checkout, PayPal Orders v2 (sandbox until launch)**; provider choice stays OQ-1 (schema is provider-neutral). Shopify code is fully removed; the subscription is cancelled by the owner **after** the §14.3 walkthrough.

## Current state (2026-07-22)

- **ADMIN BUILD COMPLETE — stages 0–9 all merged to `main`** per [docs/admin-design.md](docs/admin-design.md) §0 autonomous run. Full report + **owner activation checklist**: [docs/BUILD-REPORT.md](docs/BUILD-REPORT.md).
- `/admin` is a bilingual (EN/中文) Polaris Shopify-clone: Home dashboard, Orders (drafts, abandoned, fulfill/refund/cancel, timeline), Products (variants, media, inventory + movement log), Customers, Content (slots + files), Analytics (first-party beacon: sessions/funnel/live visitors), Discounts, Settings (zones, tax, notifications, policies, Search engine & AI), ⌘K search.
- **Storefront reads the DB** (catalog view, revalidate 300); pixel-exact Figma design intact — home byte-exact, shop/product gated by masked pixel-diff (only the designated text boxes show live data). SEO/GEO live: sitemap, robots (AI-crawler toggle), /llms.txt, Product JSON-LD.
- **Bottom nav = owner's cat-button art (2026-07-22)**: PNGs in `public/nav/` (outline idle, `-active` colored shown on own page; hi-res source art archived in `assets/nav-buttons/`); tabs Home / Shop / Wholesale / Me (wholesale+me have no pages yet → non-links). Pixel baselines regenerated for the new nav. Storefront's inline no-calc `<script>` fallbacks → `components/NoCalcScale.tsx` client component (React never runs inline scripts on client nav).
- **Running in §0.2 fallback mode**: local file db (`.data/db.json`, auto-seeded), dev admin login (`ADMIN_DEV_PASSWORD`, default `goldrose-admin`), console emails, fixture-tested PayPal. Hosted Supabase + PayPal sandbox = activation checklist (no code changes).
- **Supabase activation IN PROGRESS (2026-07-22)**: hosted project created (region ap-southeast-2-ish, project ref cfvsvgbldnzkcjvbwnjp), migration run, clean seed done + announcements inserted, verified (catalog public / orders 401 / bucket ✓). Local `.env.local` now points at hosted. Owner auth user + allowlist row created; local admin = real email/password login. **ADMIN_OPEN_ACCESS=1 override built (owner decision)**: keeps admin open on hosted during testing, but everyone funnels through the login page — nickname is the minimum identity (proxy gate; e2e pinned to local adapter). **Sign-up + approval (owner request)**: "Request access" on the login page (hosted only) creates a Supabase account; unapproved logins see "awaiting approval"; owner approves/removes at Settings → Team (requireRealAdmin — nickname guests 404). **Owner decision (2026-07-22 evening): run live-like now — everyone logs in; ADMIN_OPEN_ACCESS stays UNSET** (code kept as dormant escape hatch). Forum identity for logged-in accounts = email name (nickname popup optional). REMAINING: Vercel env vars (3 Supabase keys only, Prod+Preview) + redeploy + turn OFF Supabase email confirmation.
- **Visitor ideas (2026-07-23)**: the concierge chat bubble now collects ideas/feedback (`/api/feedback` → `feedback` table); owner reads/deletes them at Content → Ideas. Persists locally; on live it's ephemeral until Supabase activation (same as all data).
- **Testing forum + nickname login (2026-07-22)**: /admin/forum — threads + replies for the testing crew; identity = nickname-only field added to the login page (cookie, no credentials while admin is open-access; email/password unchanged). Posts editable by their author (nickname match, "edited" marker); nickname changeable via an in-place popup on the forum page; two seeded 📢 announcement threads explain the forum + testing phase (fully bilingual, titles + bodies). Tables `forum_threads`/`forum_posts` in both backends. Owner also confirmed **Supabase (not self-hosted Postgres)**; backup plan = Free plan + nightly pg_dump→AWS S3 (Pro at launch) — see [docs/Database.md](docs/Database.md). **Tester guide**: /admin/guide (nav item "Guide") renders [docs/USER-GUIDE.md](docs/USER-GUIDE.md) (owner-editable markdown; EN and 中文 in side-by-side columns, one per `# ` heading).
- **Testing-phase conveniences (2026-07-23)**: /admin needs NO login while no Supabase + no ADMIN_DEV_PASSWORD (auto-locks when either exists); demo store data seeds locally + on live (orders #901–905, customers, GOLD10, analytics) — hosted activation seeds clean; EN/中文 toggle is a visible top-bar button.
- Tests: 45 e2e (Playwright vs production build, own port 3001) + 9 unit — green. `npm run seed -- --reset` restores a pristine local db.
- Live deploy at <https://goldrose-storefront.vercel.app> now runs the build (fixed via .npmrc legacy-peer-deps): open demo admin, seeded demo store, mock checkout. Ephemeral until Supabase env vars are set.

## Key facts / constraints

- All money integer cents; orders never hard-deleted; admin strings all go through `t()` (EN + Shopify 中文); service key only server-side; sandbox/mock money only — `PAYPAL_ENV=live` is owner-only.
- Design doc [docs/admin-design.md](docs/admin-design.md) is the spec (§0 guardrails restored 2026-07-22 after an accidental deletion).
- Owner ideas verbatim in [docs/ideas.md](docs/ideas.md) — don't expand them.

## Open questions (§4)

- OQ-1 payment provider (PayPal working assumption — built), OQ-2 real shipping rates (RoW $19.95 is a placeholder), OQ-3 real product info (seed placeholders live in the designated boxes), OQ-4 Supabase project (checklist step 1).

## Next steps

- **Charles: run the activation checklist** in [docs/BUILD-REPORT.md](docs/BUILD-REPORT.md) §5 (Supabase → PayPal sandbox → walkthrough → screenshots → cancel Shopify → revoke Figma token).
- Then: real rates (OQ-2), real product content (OQ-3), launch checklist items.
