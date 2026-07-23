> **ARCHIVED 2026-07-23.** Historical record of the one-shot admin build.
> Still live: the **§5 owner activation checklist** below (tracked from
> `SUMMARY.md` → Next steps).

# GoldRose Admin Build — Report (§0.5)

**Build:** one-shot autonomous run per [docs/admin-design.md](../admin-design.md) §0, stages 0–9, one commit per stage on `main`.
**Date:** 2026-07-22 · **Builder:** Claude (autonomous, §0.4 authority)
**State:** all stages green — `next build` passes, 43 e2e + 9 unit tests pass, storefront pixel baselines intact (home byte-exact; shop/product masked per §14.2 Stage 9).

---

## 1. What shipped, stage by stage

| # | Commit | Shipped | Verified by |
|---|---|---|---|
| 0 | `feat(admin): stage 0` | Playwright vs a production build: full-page pixel snapshots of `/`, `/shop`, product page + mock-checkout click-through | Suite run twice, byte-identical |
| 1 | `stage 1` | `supabase/migrations/0001_init.sql` (full §7 schema, RLS deny-by-default, views, `adjust_inventory()`, order-number sequence, storage bucket) · `lib/supabase/*` TableStore with **two backends**: hosted Supabase / local `.data/db.json` file adapter (§0.2 — no Docker here) · `getCatalog()` safe view · `npm run seed` | Seed prints 3 products/9 variants/settings/content; temporary route served the catalog end-to-end |
| 2 | `stage 2` | Auth (middleware + `requireAdmin()` = session **and** `admin_users`; non-members 404) · local dev login (ADMIN_DEV_PASSWORD, HMAC cookie) · Polaris shell: cloned left nav, top bar, payment-mode banner · bilingual i18n (`t()`, EN + Shopify 中文, `admin_lang` cookie) | e2e: redirect, login, vague errors, nav labels, 中文 toggle + persistence |
| 3 | `stage 3` | Products list (tabs/filter/bulk/CSV) · full product form card-for-card (§9.5) with media upload+reorder+alt, profit/margin, variants (≤3 options → generated table), SEO listing with Google preview, Duplicate, red-confirm Delete · Inventory screen (Unavailable/Committed/Available/On hand + reasoned adjustments + history) · Content → Files browser | e2e: create→edit→duplicate→archive→delete; adjust + history |
| 4 | `stage 4` | Native checkout: DB re-pricing (`priceCart`), zone shipping + geo-IP country, gift note → order Notes, cart v2 (variant-id keyed), wired ADD TO CART / BUY NOW · `createOrder()` (stock movements, customer auto-create, timeline, checkout completion, emails, idempotent by `provider_order_id`) · PayPal Orders-v2 routes (create/capture, sandbox-only) · emails via Resend REST or console · **Shopify deleted** (lib/shopify, permalink, shop_pay, SHOPIFY_* env, stray Figma token line) | e2e: click-through with DB assertions, RoW zone rate, tamper-proofing, admin price edit → checkout total; PayPal mapping fixture unit tests |
| 5 | `stage 5` | Orders list + card-for-card detail (fulfill w/ tracking + shipping email, refund w/ restock + `refunded_cents`, cancel, archive, timeline comments, notes/tags, conversion summary, seller protection) · packing slip · Customers list + profile w/ own timeline · `/api/webhooks/paypal` (signature-verified; confirm/repair/refund-sync, idempotent) | 8 e2e + 5 webhook fixture tests (replay → no duplicate; invalid signature → 401) |
| 6 | `stage 6` | Discounts (3 Shopify code types, dates/limits/min-purchase/once-per-customer, derived status badges) · checkout discount field (server-validated, `/api/discount`) · draft orders + “Mark as paid” (stock decrements then) · abandoned checkouts (> 1 h open) | 6 e2e (apply→totals+used_count; expired/unknown/limit rejections; draft flow) + abandoned-rule unit test |
| 7 | `stage 7` | First-party `page_views` beacon (anonymous, cookieless; geo-IP country server-side) · Home dashboard (metrics, polaris-viz chart, things-to-do feed) · Analytics grid with compare-to-previous, funnel, live-visitors card · ⌘K search (orders/products/customers) · live notifications bell | 5 e2e incl. visitor-attributed order → Conversion summary |
| 8 | `stage 8` | Settings — every applicable §9.11 page (General/Payments/Checkout/Shipping zones/Markets/Taxes/Notifications/Users/Policies/Search engine & AI/Languages) · Content slots with Reset (PromoBar §11 PNG↔text rule) · SEO/GEO: DB-driven sitemap/robots (AI-crawler toggle)/llms.txt, Product+Breadcrumb JSON-LD, Organization/WebSite JSON-LD, settings-driven homepage metadata · **catalog cutover**: `lib/products.ts` deleted, storefront reads the DB (revalidate 300, graceful no-DB degradation) | 7 self-reverting e2e |
| 9 | `stage 9` | Live catalog values in the designated pixel boxes (/shop cards + product title/price/BUY NOW), single-line ellipsis; masked pixel-diff model | Live values render; long title = zero layout shift; new product serves + sitemaps with no redeploy |

## 2. Decisions made under §0.1 (and why)

1. **Local data fallback = file adapter, not Docker Supabase** — Docker and the supabase CLI are absent on this machine; §0.2 names the file adapter as the fallback. One `TableStore` interface (all/insert/update/remove + `adjustInventory`/`nextOrderNumber`); business logic is written once in TS over those primitives, so hosted mode runs the identical code. The SQL migration remains the hosted source of truth; SQL views (`catalog_products`, `variant_inventory`, `page_view_sessions`) exist for the hosted security model even though app code computes the same shapes in TS.
2. **`.ts`-suffixed relative imports** in the shared server libs so Node type-stripping (`node scripts/seed.ts`, `node --test`) and Turbopack resolve the same files. Verified in both runtimes.
3. **Polaris 13.9.5 + polaris-viz 16.16.0 on React 19** via `--legacy-peer-deps` (they declare React 18). Smoke-tested per §15; one real issue found and fixed (polaris-viz touches `window` during SSR → chart mounts client-only).
4. **Sessions are client-assigned** (sessionStorage id, 30-min inactivity rotation); the SQL view groups by that id instead of deriving boundaries in SQL — one implementation both backends share.
5. **Beacon mounts in the root layout** (renders null, skips `/admin`) rather than per-page — impossible to forget on a new page; `/api/beacon` also drops any `/admin` path server-side.
6. **Schema addition:** `orders.refunded_cents` (cumulative) — refund state needed a stored amount for partial refunds and idempotent webhook sync. Migration updated (no hosted DB exists yet, so no ALTER needed).
7. **Settings UI is one indexed page** of section cards rather than 11 sub-routes — same content as Shopify's settings index, applicable pages only.
8. **Draft orders carry no shipping charge**; refund-restock restocks all lines (per-item refund picking is V2 alongside returns).
9. **Media reorder uses arrow buttons**, not drag — same capability, far less code; drag-and-drop noted for V2 polish.
10. **Product "Duplicate"** copies variants + media with **zero stock** (stock is never cloned; movements stay truthful).
11. **ADD TO CART navigates to /checkout** (as does BUY NOW): the redesigned storefront has no cart drawer/page — checkout's editable summary *is* the cart.
12. **Country of origin is a 2-letter ISO field**, not a country picker (kept the form light; the checkout ship-to selector has the full list).
13. **Live Shopify admin was not reachable from this environment** (no credentials) — per §0.2 all screens were built from the design doc + Polaris defaults. Affected: every admin screen; the §14.3 side-by-side squint pass remains on the owner walkthrough.

## 3. Mocked / deferred — and what activates it

| Mocked here | Behavior now | Activation |
|---|---|---|
| Hosted Supabase (OQ-4) | `.data/db.json` file adapter, auto-seeded | Checklist step 1 — paste env vars; same code runs hosted |
| Supabase Auth | Dev login: any email + `ADMIN_DEV_PASSWORD` (default `goldrose-admin`) | Automatically disabled the moment Supabase env vars exist |
| PayPal sandbox E2E | Real Orders-v2 routes + webhook shipped; verified by recorded-fixture tests (§0.2) — no sandbox credentials existed here | Checklist step 2, then run the sandbox payment test |
| Order emails | Logged to the server console | `RESEND_API_KEY` (+ optional `RESEND_FROM`) |
| Product media storage | `.data/uploads` served via `/api/files/*` | Hosted mode uses the public `product-images` bucket automatically |
| Real shipping rates (OQ-2) | Seed zones: US $5.95 / free ≥ $75 · Rest of world **$19.95 placeholder** | Settings → Shipping and delivery |
| Real product content (OQ-3) | Seed products (the 3 placeholders); design pages show live values in the designated boxes | Owner edits products in the admin — no code changes needed |

## 4. Known gaps

- **V2 list (§16)** unchanged: order editing, returns workflow, partial fulfillment, draft “Send invoice”, recovery emails, automatic/BXGY discounts, bulk editor, saved views, email templates, CSV import, Reports builder, Live View globe, push notifications, rich-text descriptions, inventory holds.
- Hosted-only paths not exercisable locally: Supabase Auth login/MFA, RLS/grants, storage bucket, the real PayPal network calls (fixture-tested instead), geo-IP headers (Vercel-only).
- Non-admin-user → 404 is enforced in code (`requireAdmin`) but only meaningful with hosted auth (local dev login is inherently owner-only).
- First e2e-suite caveat: tests mutate the local db (orders, movements accumulate). `npm run seed -- --reset` restores a pristine db (stop the dev server first).
- `docs/archive/flow-map.md` and README still describe some Shopify-era flow; superseded by this report and the design doc.

## 5. Owner activation checklist（激活清单）

Do these in order; everything else already works.

1. **Supabase**（约 15 分钟）
   - [ ] Create a project at supabase.com (region `ap-southeast-2`), open **SQL Editor**, paste & run `supabase/migrations/0001_init.sql`.
   - [ ] Project Settings → API: copy the URL + anon key + service-role key into `.env.local` and Vercel (Production **and** Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (mark sensitive).
   - [ ] Seed: `npm run seed` (with the env vars set — it fills products/settings/content, never touches a non-empty db).
   - [ ] Auth → Users → **Add user**: your email + a strong password. Then SQL Editor: `insert into admin_users (user_id, email) select id, email from auth.users where email = 'YOUR-EMAIL';`
   - [ ] Auth → enable **MFA (TOTP)** on your account (§9.2).
   - [ ] Storage: confirm the public `product-images` bucket exists (the migration creates it).
2. **Login options — passkeys + customer Google/Apple sign-in**（2026-07-23 加入，约 20 分钟 + Apple 开发者账号）
   - [ ] First run `supabase/migrations/0002_customer_auth.sql` in the SQL Editor (adds the `customers.auth_user_id` link column; safe to re-run).
   - [ ] **Passkeys** (admins at Settings → Security, customers at /account): Supabase Dashboard → Authentication → **Passkeys** → enable; Relying Party Display Name `GoldRose`, Relying Party ID `goldrose-storefront.vercel.app`, Origins `https://goldrose-storefront.vercel.app`. ⚠️ Changing the RP ID later (e.g. moving to a custom domain) **breaks every enrolled passkey** — if the custom domain is close, wait and use it as the RP ID from day one. Passkeys only work on that domain (not localhost).
   - [ ] **Google sign-in** (customers): Google Cloud Console → create an OAuth client (web) → authorized origin `https://goldrose-storefront.vercel.app`, redirect URI = the callback URL shown on Supabase's Google provider page → paste client id + secret into Supabase → Authentication → Providers → Google.
   - [ ] **Apple sign-in** (customers): needs a paid Apple Developer account. Create App ID + **Services ID** + signing key (.p8), configure the Services ID with domain `cfvsvgbldnzkcjvbwnjp.supabase.co` and Supabase's callback URL, generate the client secret, paste into Supabase → Providers → Apple. ⚠️ Apple's client secret **expires every 6 months** — set a calendar reminder to regenerate it.
   - [ ] Supabase → Authentication → URL Configuration → add redirect URLs: `https://goldrose-storefront.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.
   - [ ] Try it: storefront **Me** tab → Continue with Google → account appears (orders placed with that email show up) → Add a passkey → sign out → sign back in with the passkey. Then in the admin: Settings → Security → add a passkey → log out → "Sign in with a passkey".
3. **PayPal sandbox**（约 10 分钟）
   - [ ] developer.paypal.com → My Apps → create an app → copy client id + secret into `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`; set `PAYPAL_ENV=sandbox`.
   - [ ] Same app → Webhooks → add `https://goldrose-storefront.vercel.app/api/webhooks/paypal`, subscribe to `PAYMENT.CAPTURE.COMPLETED` + `PAYMENT.CAPTURE.REFUNDED`, copy the id into `PAYPAL_WEBHOOK_ID`.
   - [ ] Run the deferred sandbox E2E: buy with a sandbox buyer account → order arrives “Paid” with a stock movement → refund it from the order page.
4. **Optional email**: create a Resend key → `RESEND_API_KEY` (and `RESEND_FROM` once you have a domain).
5. **Final walkthrough (§14.3, 中文)**: log in → add a product with photos and a variant → receive stock → create a discount → place a sandbox payment with the code → watch it arrive Paid with a movement and a customer profile → fulfill with tracking → refund → edit the slogan → reset it.
6. **Shopify shutdown (§12)** — only after the walkthrough passes:
   - [ ] Screenshot every Shopify admin screen we clone, in **EN and 中文**, into `docs/shopify-reference/`.
   - [ ] Cancel the Shopify trial/subscription. (Nothing to migrate.)
7. **Figma token**: the stray token was deleted from `.env.local` (Stage 4) — **revoke it** in Figma → Settings → Personal access tokens.
8. **Go-live later** (from `docs/archive/launch-checklist.md`): real zone rates (OQ-2), tax approach, real product content (OQ-3), custom domain, policy pages, consent wording review, **turn Supabase Auth "Confirm email" back ON** once Resend is connected (it's off during testing — sign-up emails wouldn't deliver without SMTP) — and flipping `PAYPAL_ENV=live` is **yours alone** (§0.3).

## 6. How to run

```bash
npm run dev            # storefront + admin at localhost:3000 (/admin — dev login)
npm run seed -- --reset  # fresh local database
npm run test:unit      # Node fixture tests (PayPal mapping, webhook, abandoned rule)
npm run test:e2e       # full Playwright suite (builds a production bundle)
```
