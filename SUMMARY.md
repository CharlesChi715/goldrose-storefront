# GoldRose / goldrose-storefront — SUMMARY

Single source of truth. Read first; keep fresh. "§" = sections of the spec, [docs/admin-design.md](docs/admin-design.md).

## Goal

- Sell the 24K gold-dipped rose gift line DTC — **international, USD-only V1, English storefront**. Brand: **GoldRose**.
- **Native checkout, PayPal Orders v2 (sandbox until launch)**; provider choice = OQ-1 (schema provider-neutral). Shopify code fully removed; owner cancels the subscription **after** the §14.3 walkthrough.
- Add intuitive placeholder/mocking data/img to anything not sure. path of placeholder img: `temp/PlaceholderPicture.png` which contains only the text: "PlaceHolder".

## File structure

```text
goldrose-storefront/
├── app/                 # Next.js App Router: storefront (/, /shop, /products/[slug], /account), /admin, API routes, sitemap/robots/llms.txt
├── components/          # Storefront + shared UI (home/ = homepage modules A1–A11, VHeader, BackButton…)
├── lib/                 # Domain logic: admin/, checkout/, supabase/ (2 backends: hosted / .data file adapter), account/, cart/
├── supabase/            # SQL migrations (0001 full schema, 0002 customer auth, 0003 tracking carrier + hardening)
├── scripts/             # seed.ts (npm run seed; flags --reset / --demo)
├── proxy.ts             # Auth middleware (Next 16 name, §9.2) — guards /admin + /api/admin only
├── tests/               # 57 Playwright e2e (production build, port 3001, file adapter) + 35 unit — green
├── public/              # Served assets: bottom-nav/, top-nav/, veloria/, products/
├── assets/              # Raw owner art, not served: nav icons (public/ holds processed copies) + supplier-color-charts/
├── docs/                # Specs/guides, ixd/ interaction specs (交互稿), features/ decision records, learning/ walkthroughs, SEO/GEO research, repo review, and archive/
├── temp/                # Owner's raw uploads (nav-button art zips, IxD .numbers + archived zh spec export) — scratch, not served
└── SUMMARY.md           # this file
```

## Current state (2026-07-24) — high level

- `FIGMA_TOKEN` in `.env.local` — scope `file_content:read`. Import method + traps: [docs/ixd/login-import.md](docs/ixd/login-import.md)..env.local
- ** EVERYTHING STILL TESTING; SUPABASE CONFIGGED in .env.local; VERCEL DEPLOYED; ENV VARIABLE CONFIGED IN VERCEL and deployed buy no any real customer right now; no real marketing links posted; treat all data (orders, analytics, UTM tags) as test data until ship.
- **Hosted Supabase is LIVE data but testing no real customer** (ref `cfvsvgbldnzkcjvbwnjp`) — local dev writes the SAME live db.
- **Deployed (testing)**: <https://goldrose-storefront.vercel.app> — build complete (stages 0–9 on `main`); awaiting the owner's §14.3 walkthrough.
- **2026-07-25**: `/` + `/shop` rebuilt pixel-exact from the redesigned VELORIA 已完成 frames (homepage A-1…A-11 → `components/home/`, warm palette, new nav art, account tab reads "Login" signed out / "Me" signed in per [docs/ixd/bottom-nav-buttons.md](docs/ixd/bottom-nav-buttons.md), swapped client-side because the pages are ISR-cached); IxD routes decided → [docs/ixd/README.md](docs/ixd/README.md) route table; bag/checkout/orders/menu NOT imported (design 美化未完成). **登录界面 74:53 imported + deployed live 07-25** (`ea6baa6`) → `/account` signed-out is now pixel-exact (band diff ≤4.5%, nav 0.02%); its sign-in is an **emailed one-time code** — the design carries no Google/Apple/passkey buttons and the owner confirmed "no passkey", so the storefront now offers only OTP (auth libs kept, so it is reversible). Signed-in `/account` stays hand-built (design ships no signed-in frame). **74:55 (Business · Procurement) imported 07-25** → `/account/business` (whole page 3.44%); account-type tabs switch between the two frames; its request CTAs POST to `/api/business-request`, which emails the owner's contact address (nothing persisted — "static + email the request"). **Design boxes vs live text**: `/shop` card prices overlapped (frame boxes sized for the mock's short "$219"; `formatMoney` adds cents) — fixed 07-25 to a flex row, shop pixel baseline regenerated. Same latent risk on `/products/[slug]` above $1,000. **Motion 07-25**: hero carousel drag-follows the pointer (parks where the finger stops, auto-play paused, tap still opens the card); bottom-nav tab switches cross-fade the canvas via `components/PageFade.tsx` (nav bar stays put; reduced motion opts out).
- **2026-07-26**: the **last 7 Figma frames are imported** — `/bag` (B-1), `/business/partnerships` (B-3), `/business/wholesale` (B-4), `/orders/track` (C-1), C-2 restyles `/checkout/success`, C-3 is a real slide-out menu drawer behind the header menu button (portalled to `<body>`; ScaleFrame's transform traps `fixed`), and B-2 restyles the live `/checkout` (markup only — PayPal logic, handlers and money math untouched). Pixel-diff 1.1–2.2% vs the frames. ⚠️ **Placeholder, not wired**: `/bag` line items (cart icon still → `/checkout`, the real basket), C-1's whole timeline, B-2's shipping-method picker (cosmetic — no per-method rates) and its card fields (mock branch only, PCI). Two design languages now coexist and the tab bars disagree — findings + asks for the design team in [docs/ixd/README.md](docs/ixd/README.md).
- **Per-feature status: [docs/features/README.md](docs/features/README.md) Status tree** (= the roadmap). Open a feature's own file/docs/code only when working on that feature.
- **Mock/local mode** (what e2e uses): blank the Supabase + PayPal env vars → file adapter `.data/db.json`; `npm run seed -- --reset` restores pristine; admin login is open-access unless `ADMIN_DEV_PASSWORD` is set; `/account` shows "sign-in unavailable".
- **`CHECKOUT_SKIP_PAYMENT=1`** (TESTING ONLY; on in `.env.local`, add it in Vercel too if the deployed testing site should skip payment): `/checkout` drops the card form and all payment buttons for one **Place order** button — order recorded via the mock path (test badge, no money), overrides PayPal even with keys set. Real payment code is gated, not modified; unset it to restore normal checkout. **Must be off before launch** — `npm run build` hard-fails if it is set alongside `PAYPAL_ENV=live`.
- Owner activation to-dos: [BUILD-REPORT §5](docs/archive/BUILD-REPORT.md) — still the live to-do list.

## Key facts / constraints

- Money = integer cents; orders never hard-deleted; admin strings via `t()` (EN + Shopify 中文); service key server-side only; sandbox/mock money only — `PAYPAL_ENV=live` is owner-only.
- `npm run build` validates Supabase env first: local/test may omit all 3; partial config fails with exact missing names; Vercel production requires URL + anon key + service-role key.
- Storefront reads the DB (revalidate 300); pixel-exact Figma design guarded by pixel-diff — only designated text boxes show live data.
- `// read:` comments = near-literal verbalization, only in files Charles names (pilot: `lib/supabase/types.ts`); JSDoc required on every exported `lib/` function.
- [docs/admin-design.md](docs/admin-design.md) is the spec — don't compress or renumber (§0 guardrails were once accidentally deleted and restored).
- Owner ideas verbatim in [docs/ideas.md](docs/ideas.md) — don't expand. [docs/Database.md](docs/Database.md): DB platform decision + SKU rules; edit only on request (backup plan → [docs/features/backend/db-backups.md](docs/features/backend/db-backups.md)).
- **Supabase CLI linked** (07-25, repo root): `supabase migration list` / `db push` hit hosted with no password. History repaired → 0001–0003 recorded. Migrate by adding `supabase/migrations/000N_*.sql` + `db push` — never paste into the web editor again (that's what left history empty). Ad-hoc SELECT still needs Docker (`db dump`) or a Management-API token; Docker unusable here — `/var/run/docker.sock` → another macOS user's home.

## Open questions (§4)

- OQ-1 payment provider (PayPal working assumption — built) · OQ-2 real shipping rates (RoW $19.95 placeholder) · OQ-3 real product info (seed placeholders)

## Next steps

- **Charles: finish the activation checklist** ([docs/archive/BUILD-REPORT.md](docs/archive/BUILD-REPORT.md) §5): Vercel env vars + redeploy → Supabase auth config → auth providers (**admin** passkeys RP; **storefront = email OTP only** ⚠️ blocks all customer sign-in until the email provider is on, the template emits `{{ .Token }}` — Supabase defaults to a magic *link*, not a code — and SMTP is set; built-in sender is ~few/hour) → PayPal sandbox → §14.3 walkthrough → screenshots → cancel Shopify → revoke Figma token.
- **Pre-launch fix (diagnosed 07-26, harmless while testing — no customers)**: customer "View order log" ([app/checkout/success/page.tsx](app/checkout/success/page.tsx)) + "VIEW MY ORDER" ([components/login/ShoppingLogin.tsx](components/login/ShoppingLogin.tsx)) both point at `/orders`, a leftover stub that redirects to `/admin/orders` → proxy bounces to `/admin/login` (signed-in customer gets 404 via `requireAdmin`). Fix = point at `/account`, or build the guest order lookup the design's copy promises (order № + email); `tests/e2e/account.spec.ts` asserts the href.
- Then: real rates (OQ-2), real product content (OQ-3), launch checklist items, and DB backups at/near launch ([docs/features/backend/db-backups.md](docs/features/backend/db-backups.md) — live DB has no backups until then).
- Boss asks 07-25: [order-tracking](docs/features/backend/order-tracking.md) **BUILT 07-25** (carrier dropdown UPS/USPS + auto link, /account status pill, 0003 bundles the agreed hardening) — PR merged, **0003 verified live on hosted 07-25** (column + 10 indexes + `discounts_value_range`), remaining: owner UAT · [promotion-emails](docs/features/backend/promotion-emails.md) still BACKLOG (consent + Resend audience).
- Design: IxD spec (37+15 rows) → [docs/ixd/](docs/ixd/README.md). **All Figma frames are now imported** (homepage+shop 07-25, the 7 B/C screens 07-26). Open: design team to pick ONE palette/wordmark and ONE tab bar, replace stock/dev art, and decide whether B-2 gets real shipping methods + a card provider — see the 07-26 findings section.
- Post-ship: owner's influencer campaign + website-exclusive video finale ([docs/ideas.md](docs/ideas.md) 07-24) — no influencer links before ship.
- 120-SKU content pipeline (admin editing + bulk import): now a feature file, [docs/features/product-content-pipeline.md](docs/features/product-content-pipeline.md) — BACKLOG, after ship; SKU rules in [docs/Database.md](docs/Database.md). Supplier's full color catalog (124 colors: Y/YS/YC series) parsed in [docs/supplier-color-charts.md](docs/supplier-color-charts.md).
