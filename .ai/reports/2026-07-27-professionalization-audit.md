# Professionalization audit — 2026-07-27

Read-only audit of engineering practices, requested by Charles ("how to make
this project more professional"). No code was changed. Evidence gathered by a
full-repo sweep; file:line references are from `main` at `125b72f`.

## What is already professional — keep doing this

- **Server-side re-pricing.** Every payment route re-prices the cart from the
  database and ignores client prices (`app/api/checkout/route.ts:87`,
  `app/api/paypal/capture/route.ts:53`), and an e2e test proves tampered
  prices are ignored (`tests/e2e/checkout.spec.ts:130`). This is the single
  most important e-commerce security property, and it is done right.
- **Zod at every trust boundary.** All six public API routes and all admin
  server actions parse request bodies with zod before trusting them.
- **Webhook signature verification, fail-closed.** PayPal webhooks are
  verified via PayPal's API and rejected when `PAYPAL_WEBHOOK_ID` is unset
  (`lib/paypal/client.ts:208-215`).
- **Database deny-by-default.** RLS is enabled on all 18 tables with
  `revoke all` from anon/authenticated (`supabase/migrations/0001_init.sql:412-439`);
  the service-role key never appears client-side.
- **Strict TypeScript, near-zero `any`; clean adapter pattern** —
  `lib/supabase/store.ts` switches one `TableStore` interface between the
  local file adapter and hosted Supabase; all env access funnels through
  `lib/supabase/env.ts`.
- **Repo hygiene**: battle-tested `.gitignore`, zero committed artifacts,
  CI (lint + typecheck + unit) with rationale comments, dependabot, prettier,
  a curated docs tree with a single-owner rule.

## Gaps, ranked

### P0 — money correctness and visibility (before owner UAT ends)

1. **Payment amount drift is logged, not blocked.**
   `app/api/paypal/capture/route.ts:63-68`: if PayPal captures an amount
   different from the server price, the code `console.error`s and still
   records a paid order. Industry practice: refuse or flag the order for
   manual review — a mismatch here is either a bug or an attack.
2. **The money path has no unit tests.** `lib/checkout/pricing.ts`,
   `createOrder` idempotency in `lib/orders/db.ts`, and `validateCard` are
   covered only indirectly through e2e. These are the exact functions where a
   bug costs real money; they deserve direct, fast tests.
3. **No error monitoring.** Nothing (Sentry/etc.) reports production
   exceptions. Playbook already plans this — it must land before real
   customers: a checkout failure should page someone, not wait to be noticed.

### P1 — abuse resistance and hardening (before real traffic)

4. **No rate limiting** on the six unauthenticated POST routes
   (`checkout`, `paypal/create`, `feedback`, `business-request` — the last
   sends an email per request, an open spam vector). Options: Vercel WAF
   rules, Upstash Ratelimit, or a simple per-IP window to start.
5. **No security headers.** `next.config.ts` sets only image cache headers —
   add HSTS, `X-Content-Type-Options`, `frame-ancestors`/`X-Frame-Options`,
   `Referrer-Policy`. A few lines of config.
6. **Data layer protected by convention only.** `lib/supabase/store.ts`,
   `remote.ts`, `local.ts`, `lib/orders/db.ts` lack `import "server-only"`
   (auth modules have it). One import line each makes "service-role code can
   never reach the browser bundle" a build-time guarantee. Also fix the stale
   comment at `lib/supabase/remote.ts:6` pointing to a non-existent
   `lib/supabase/server.ts`.
7. **No error boundaries; two API envelope shapes.** No `error.tsx` /
   `not-found.tsx` anywhere under `app/` (crashes show raw Next defaults),
   and PayPal routes return `{ error }` while checkout returns
   `{ ok: false, error }` — pick one envelope.

### P2 — engineering process

8. **Node version not pinned locally.** Unit tests need Node ≥ 23.6 (type
   stripping); CI pins 24 but a `.nvmrc` + `engines` field is missing — a
   contributor on Node 20 gets confusing failures.
9. **CI upgrades (playbook Proposed — endorsed).** Add `npm run build`
   (needs a seed step) and the e2e suite; regenerate the `-darwin.png`
   screenshot baselines on Linux via a one-time CI run rather than paying for
   macOS runners; then turn on branch protection for `main` (needs
   `gh auth login` refresh first).
10. **Staging Supabase project (playbook Proposed — strongly endorsed).**
    Today, local dev with Supabase keys set writes to the live database the
    owner tests on; one wrong `seed --reset` destroys their test data.
11. **No coverage measurement.** `node --test` supports
    `--experimental-test-coverage` (or use `c8`) — low effort, shows what the
    unit suite misses.

### P3 — code health, opportunistic

12. **God components.** 19 files exceed 500 lines; largest:
    `components/checkout/CheckoutSkin.tsx` (1460),
    `app/checkout/CheckoutClient.tsx` (1132),
    `app/admin/(dashboard)/products/ProductForm.tsx` (852). Slim them when
    touching them — no big-bang rewrite.
13. **Duplication.** The checkouts-row insert is near-identical in
    `app/api/checkout/route.ts:133-154` and
    `app/api/paypal/create/route.ts:53-74`; extract a shared helper.
14. **Docs entropy.** `Improvement-plan.md`, `ideas.md`, and
    `project-state.md` overlap as planning surfaces; worth one staleness pass.

## Suggested sequence

1. **Quick wins (each under an hour):** drift block (#1), `server-only`
   imports (#6), security headers (#5), `.nvmrc` + `engines` (#8),
   `error.tsx`/`not-found.tsx` + one envelope (#7).
2. **Pre-launch must-haves:** error monitoring (#3), rate limiting (#4),
   money-path unit tests (#2), staging database (#10).
3. **Process:** CI build + e2e + branch protection (#9), coverage (#11).
4. **Ongoing:** refactors and docs pass (#12–#14).
