# cart / login triage · 2026-08-07 · `fix/nav-cart-login-redirect`

Charles reported: *"if I click the cart button in the top right nav bar, it
directs me to login page if I haven't logged in."* Triaged against local dev
(hosted Supabase config, signed out, 375×812). **Both halves of the report are
non-reproducible — no code change was needed.**

---

## Finding 1 · the cart never routes to the login page

Every cart control in the repo points at `/checkout`:

| Component                                              | Used by                  | Target      |
| ------------------------------------------------------ | ------------------------ | ----------- |
| `components/chrome.tsx:232` `VHeader`                  | PDP, `/story`, `/craft`  | `/checkout` |
| `components/chrome.tsx:286` `HomeHeader`               | `/`                      | `/checkout` |
| `components/chrome.tsx:330` `ShopHeader`               | `/shop`                  | `/checkout` |
| `components/screens/returns/returns-chrome.tsx:131`    | `/account/returns/*`     | `/checkout` |
| `components/screens/CraftScreen.tsx:125`               | `/craft`                 | `/checkout` |

`/checkout` has no auth gate: `app/checkout/page.tsx` loads only catalog,
shipping zones and settings, and `CheckoutClient.tsx` never imports Supabase
auth. There is no `middleware.ts`; `proxy.ts` matches `/admin/:path*` and
`/api/admin/:path*` only.

The **only** three redirects to `/account/signup` in the codebase are
`app/account/AccountClient.tsx`, `app/account/personal-info/page.tsx:34` and
`components/screens/PersonalInfoScreen.tsx:170` — all under `/account/*`.

Verified signed out (no `sb-*` cookie): `/checkout` empty → empty-cart card;
with one line → Details step; `?step=payment` → full payment step. No sign-in
prompt at any point.

**Most likely cause of the report:** the bottom nav's right-hand tab is
labelled **"Login"** when signed out and does route to `/account/signup` (by
design, AI-020). Top-right and bottom-right are the two thumb corners on a
phone, and both are icon-only.

## Finding 2 · the "pre-filled cart" was agent test data

Charles then reported the cart showing an item he had not chosen. That line
(`variantId 59c886f2-…`, Golden Eternal Rose) was written to
`localStorage["goldrose-cart-v2"]` **by this session** while testing Finding 1,
via the PDP's ADD TO CART. Cleared; `/checkout` then correctly renders
"Your cart is empty. → SHOP THE EDIT". The behaviour he asked for already
exists.

Process note: agent-seeded browser state must be cleared before handing the
preview pane to Charles.

## Decision · cart persistence stays device-local for now

Charles asked whether the cart should be stored in the database against the
user. **Recommendation given: not yet, and never as a replacement for the
local cart.**

- Gating "add to cart" behind sign-in is a known conversion killer; guest
  checkout stays open. `orders.auth_user_id` (migration `0006`) already links
  an order to an account when one exists.
- The standard shape when it is built: localStorage stays the guest source of
  truth, and signing in **merges** the local cart into a DB cart. On a
  variantId collision prefer `max(qty)` over `sum(qty)` — the same rose added
  on two devices usually means one rose.
- The real payoff is abandoned-cart email, which is worthless before real
  traffic. Build it alongside
  [`promotion-emails.md`](../../docs/features/backend/promotion-emails.md) —
  the cart table is the payload, the consent is the permission. Separately
  they are two half-projects.
- `lib/cart/store.ts` stores only `{variantId, quantity}` — no prices, which
  are re-resolved server-side. That keeps a future DB cart cheap (same two
  columns) and is why tampering cannot change what a customer pays.

Not filed as an AI-nnn matter: nothing is blocked on it.

## Flag · concurrent uncommitted work in this working directory

At 23:35 this tree held ~220 lines of uncommitted work **from another session**
(files touched 21:50–23:31; this session made no edits): migration
`0011_catalog_products_restore_stocked.sql`, `scripts/require-hosted-dev.mjs`
plus a `predev` hook, and changes to `SUMMARY.md`, `.ai/WORKLOG.md`,
`.env.example`, `app/shop/page.tsx`, `scripts/check-migrations.mjs` and two
test files. None of it was committed here.

`git checkout -b` moved every process in this folder onto this branch,
including that session and the `next dev` server on PID 51364. Concurrent
agents should take a worktree (`.claude/launch.json` already carries
`worktree-*` entries with their own ports) rather than sharing one checkout.

This session's log was written here rather than in `.ai/WORKLOG.md` to avoid
racing that session's in-flight edit to the same file.
