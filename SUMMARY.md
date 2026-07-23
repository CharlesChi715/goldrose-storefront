# GoldRose / goldrose-storefront — SUMMARY

Single source of truth. Read first; keep fresh. "§" = sections of the spec, [docs/admin-design.md](docs/admin-design.md).

## Goal

- Sell the 24K gold-dipped rose gift line DTC — **international, USD-only V1, English storefront**. Brand: **GoldRose**.
- **Native checkout, PayPal Orders v2 (sandbox until launch)**; provider choice = OQ-1 (schema provider-neutral). Shopify code fully removed; owner cancels the subscription **after** the §14.3 walkthrough.

## File structure

```text
goldrose-storefront/
├── app/                 # Next.js App Router: storefront (/, /shop, /products/[slug], /account), /admin, API routes, sitemap/robots/llms.txt
├── components/          # Storefront + shared UI (VHeader, BackButton, WishlistButton, NoCalcScale…)
├── lib/                 # Domain logic: admin/, checkout/, supabase/ (2 backends: hosted / .data file adapter), account/, cart/
├── supabase/            # SQL migrations (0001 full schema, 0002 customer auth)
├── scripts/             # seed.ts (npm run seed; flags --reset / --demo)
├── tests/               # 55 Playwright e2e (production build, port 3001, file adapter) + 20 unit — green
├── public/              # Served assets: bottom-nav/, top-nav/, veloria/, products/
├── assets/              # Raw owner nav-icon art only (not served; public/ holds the canonical processed copies)
├── docs/                # Specs/guides, unified search plan, SEO/GEO research, repo review, and archive/
└── SUMMARY.md           # this file
```

## Current state (2026-07-23)

- **Admin build COMPLETE** — stages 0–9 on `main` per §0 one-shot run. Historical report: [docs/archive/BUILD-REPORT.md](docs/archive/BUILD-REPORT.md) — its **§5 owner activation checklist is still the live to-do list**.
- `/admin` = bilingual (EN/中文, visible top-bar toggle) Polaris Shopify-clone: Home, Orders (drafts/abandoned/fulfill/refund/cancel/timeline), Products (variants, media, inventory + movements), Customers, Content (slots/files/Ideas), Analytics (first-party beacon; channel + country + UTM attribution — owner must use UTM-tagged links, see USER-GUIDE "Marketing links"), Discounts, Settings, ⌘K search.
- **Storefront reads the DB** (revalidate 300). Pixel-exact Figma design guarded by pixel-diff; only designated text boxes show live data. SEO/GEO baseline live: sitemap, robots (AI-crawler toggle), /llms.txt, JSON-LD.
- **SUPABASE ACTIVE (hosted, ref `cfvsvgbldnzkcjvbwnjp`)**: migrations run, clean seed + announcements, verified. ⚠️ **local dev writes the SAME live db** (e2e stays on the file adapter). `npm run seed -- --demo` tops up demo store data (refuses if orders exist) — owner still to run it.
- **Admin auth = live-like**: everyone logs in (open-access override deleted; local no-Supabase dev stays open). "Request access" sign-up → owner approves at Settings → Team; **sign-up nickname mandatory** = forum identity; "Forgot password?" → `/admin/reset-password`. Team **Remove is owner-only** (earliest approved account, `lib/admin/team-owner.ts`).
- **Login methods (2026-07-23, DORMANT until owner runs archive/BUILD-REPORT §5 item 2)**: passkeys for admins (+ Settings → Security) & customers (Supabase WebAuthn beta); customer accounts at `/account` — Google/Apple OAuth (PKCE `/auth/callback`), orders matched by provider-verified email (`customers.auth_user_id`, migration 0002). ⚠️ RP ID = `goldrose-storefront.vercel.app`; changing it later kills enrolled passkeys. Password-account emails NOT trusted for order linking (auto-confirm on). Local/e2e: /account shows "sign-in unavailable".
- **Live deploy** <https://goldrose-storefront.vercel.app> — owner already set the 3 Supabase env vars in Vercel.
- `npm run seed -- --reset` restores a pristine local db.
- **"read:" comments (2026-07-23)**: `// read: "…"` one-liners after hard-to-read TypeScript syntax — near-literal wording keeping the code's own words (Charles's convention, see agent memory). Pilot: `lib/supabase/types.ts`; extend only to files Charles names.
- **JSDoc (2026-07-23)**: all exported functions in `lib/` have `/** … */` hover docs (summary + `@param`/`@returns`, side effects, cents units). Keep new `lib/` functions documented in this style; distinct from `read:` comments.

## Key facts / constraints

- Money = integer cents; orders never hard-deleted; admin strings via `t()` (EN + Shopify 中文); service key server-side only; sandbox/mock money only — `PAYPAL_ENV=live` is owner-only.
- [docs/admin-design.md](docs/admin-design.md) is the spec — don't compress or renumber (§0 guardrails were once accidentally deleted and restored).
- Owner ideas verbatim in [docs/ideas.md](docs/ideas.md) — don't expand. [docs/Database.md](docs/Database.md): Supabase Free + nightly pg_dump→S3 backup plan; edit only on request.

## Open questions (§4)

- OQ-1 payment provider (PayPal working assumption — built) · OQ-2 real shipping rates (RoW $19.95 placeholder) · OQ-3 real product info (seed placeholders)

## Next steps

- **Charles: finish the activation checklist** ([docs/archive/BUILD-REPORT.md](docs/archive/BUILD-REPORT.md) §5): Vercel env vars + redeploy → Supabase auth config → auth providers (passkeys RP, Google/Apple) → PayPal sandbox → §14.3 walkthrough → screenshots → cancel Shopify → revoke Figma token.
- Then: real rates (OQ-2), real product content (OQ-3), launch checklist items.
