---
schemaVersion: 1
id: order-tracking
kind: feature
parent: backend
area: backend
order: 10

delivery: uat
rollout: test-deployment
statusChangedAt: 2026-07-25

dependsOn: []
blockedBy: []

verification:
  automated:
    - "tests/unit/carriers.test.ts (7 tests — URL templates, encoding, labels)"
    - "tests/e2e/admin-orders.spec.ts — 'fulfill flow stores tracking' (Other/manual URL) + 'fulfill with the default UPS carrier auto-builds the tracking link'"
  human: null
---

# Order tracking (UPS) — carrier tracking & customer surfaces

## Context

- Boss (ideas.md 2026-07-25, verbatim): "UPS/" and "send the order tracking
  email." — he plans to ship from US stock via UPS and wants buyers to get a
  tracking email.
- Boss (ideas.md 2026-07-24, graduated here 2026-07-25): "Let people checkout
  the delivery info such as where the parcel in currently , and is that called
  UPS / USPS / Flow / Follow???" — i.e. customers should see delivery status;
  the term he was reaching for is *order tracking*, UPS/USPS are carriers.
- **Most of this already existed** (the "Order emails" + fulfill flow, UAT):
  - Orders carry `fulfillment_status`, `tracking_number`, `tracking_url`
    (`supabase/migrations/0001_init.sql`, `lib/supabase/types.ts:128`).
  - Admin "Fulfill items" (§9.4, `lib/admin/orders.ts` `fulfillOrder`): admin
    pastes a tracking number + URL → order marked fulfilled, timeline event,
    **shipping-confirmation email with the tracking link sent automatically**
    (`lib/email.ts` `sendShippingConfirmationEmail`, §10.3).
  - Signed-in customers see a "Track <number>" link per order on `/account`
    (`app/account/AccountClient.tsx`).
  - Emails go through Resend; until `RESEND_API_KEY` is set they print to the
    server console (BUILD-REPORT §5 activation item).
- What was missing:
  1. **No carrier concept** — admin had to hand-paste a full tracking URL
     every time; a typo silently sent buyers a dead link. → built 2026-07-25.
  2. **No delivery status in the Me section** — `/account` showed a bare
     "Track" link, no at-a-glance state. → built 2026-07-25 (status pill).
  3. **Guests have no tracking page** — after `/checkout/success` their only
     surface is the email itself (`/orders` is a guest lookup, no status).
  4. **No live status** ("in transit / delivered") — link-out to the carrier
     only. Deferred (Option C).

## Decision

**Confirmed by Charles 2026-07-25** (chat): **Option B — carrier picker +
auto-built tracking link, keep carrier link-out for V1 (Level 1)**, with two
scope rulings:

- Dropdown lists **UPS + USPS only** for now (plus "Other (paste a tracking
  URL)" as the manual escape hatch); FedEx/DHL templates dropped from V1 —
  add to `lib/shipping/carriers.ts` when actually used.
- **Me section (`/account`) shows delivery status immediately**: a status
  pill per order — Preparing your order / Shipped via UPS·USPS (+ Track
  link) / Cancelled. Live "where is it now" stays behind the carrier link.

Industry note: for a small store's V1, "email with a carrier tracking link"
*is* the standard design (what Shopify Basic does); in-house live tracking
pages come later, if ever.

## Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| A. Status quo — admin pastes number + full URL | Zero work; already at UAT | URL typos = dead links for buyers; no carrier on record for reports | ❌ |
| B. Carrier dropdown (UPS first) + URL auto-built from number; email/link-out unchanged | Small change (~1 field + URL template map); kills the typo risk; carrier stored for later use; provider-neutral | Still no live status; one more migration | ✅ **chosen 2026-07-25** |
| C. Full integration — UPS Track API or aggregator (AfterShip/17TRACK/Shippo): live status on our own page, "delivered" emails | Best buyer UX; enables delivery-based automations | Carrier API contracts + webhooks/polling to build and babysit; aggregators cost money (17TRACK ~$9/mo past 100 shipments); overkill before real volume | ❌ for V1 — revisit post-ship |

## Acceptance criteria

- [x] Fulfilling with carrier = UPS + a tracking number auto-fills a working
      `ups.com` tracking URL; admin can still override the URL by hand.
      (e2e: UPS fulfill test)
- [x] Carrier is stored on the order and shown on the admin order detail
      (EN + 中文 labels via `t()`). (e2e asserts "UPS ·" on the detail)
- [x] Shipping-confirmation email names the carrier ("Carrier: UPS") and
      links the tracking URL.
- [x] Orders fulfilled before this change (URL only, no carrier) still render
      fine everywhere. (seed keeps a legacy-shaped demo order; "Other" e2e
      path stores carrier = null)
- [x] Me section: signed-in customers see a delivery-status pill per order —
      Preparing / Shipped via <carrier> + Track link / Cancelled.
- [ ] Human acceptance: owner fulfills a sandbox order with a real UPS
      number, receives the email, link opens UPS tracking (UAT → DONE).

## Plan

| # | Work item | Status |
|---|---|---|
| 1 | Migration `0003`: nullable `tracking_carrier` on `orders` (+ literal defaults in `lib/orders/db.ts`, seed) — bundled with the agreed 0003 hardening: SKU partial unique index, FK indexes, `discounts.value` check (Database.md) | ✅ 2026-07-25 |
| 2 | `lib/shipping/carriers.ts`: carrier → tracking-URL template map (UPS, USPS per owner scope), JSDoc'd; unit tests | ✅ 2026-07-25 |
| 3 | `fulfillOrder` accepts `carrier`; builds URL from template when the URL field is left blank; carrier in the timeline event | ✅ 2026-07-25 |
| 4 | Admin fulfill dialog: carrier dropdown (UPS default, USPS, Other), URL optional with help text; i18n EN + 中文 | ✅ 2026-07-25 |
| 5 | Email: "Carrier: UPS" line in the shipping confirmation | ✅ 2026-07-25 |
| 6 | e2e: manual-URL ("Other") + UPS auto-build fulfill paths in the admin orders spec | ✅ 2026-07-25 |
| 7 | Me section `/account`: delivery-status pill (Preparing / Shipped via X / Cancelled) + Track link (owner ask 07-25) | ✅ 2026-07-25 |
| 8 | SKU-guard side effects of the 0003 bundle: `saveProduct` rejects taken SKUs; Duplicate clears copied SKUs | ✅ 2026-07-25 |

Out of scope here (own decisions later): guest tracking page (tokenized
order-status link in the email) and live-status integration (Option C —
aggregator free tier or UPS Track API, post-ship).

## Blockers and dependencies

- **Apply `0003_tracking_carrier_and_hardening.sql` on hosted Supabase
  BEFORE deploying this code** — fulfill writes `tracking_carrier`, which
  errors while the column doesn't exist. Additive + `if not exists`, safe to
  run via the dashboard SQL editor.
- The email half only becomes real once the owner sets `RESEND_API_KEY`
  (BUILD-REPORT §5 — an env-var task, not a feature id).

## Verification evidence

- 2026-07-25 — built on worktree branch `worktree-order-tracking`:
  `npm run test:unit` 35/35 green (7 new carrier tests), eslint + tsc clean,
  full Playwright e2e suite green (57 tests incl. the two fulfill paths).
  Awaiting merge to main + Vercel deploy + 0003 on hosted → then UAT.

## Related links

- Spec: [admin-design.md §9.4 fulfill flow, §10.3 notifications](../../admin-design.md)
- Activation: [BUILD-REPORT §5](../../archive/BUILD-REPORT.md)
- SKU rules behind the 0003 bundle: [Database.md](../../Database.md)
- Sibling ask, same boss note: [promotion-emails.md](promotion-emails.md)
