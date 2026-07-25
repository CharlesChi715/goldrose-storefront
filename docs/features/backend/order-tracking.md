---
schemaVersion: 1
id: order-tracking
kind: feature
parent: backend
area: backend
order: 10

delivery: backlog
rollout: not-deployed
statusChangedAt: 2026-07-25

dependsOn: []
blockedBy: []

verification:
  automated: []
  human: null
---

# Order tracking (UPS) — carrier tracking & customer surfaces

## Context

- Boss (ideas.md 2026-07-25, verbatim): "UPS/" and "send the order tracking
  email." — he plans to ship from US stock via UPS and wants buyers to get a
  tracking email.
- **Most of this already exists** (it is the "Order emails" + fulfill flow,
  currently UAT):
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
- What's missing:
  1. **No carrier concept** — admin must hand-paste a full tracking URL every
     time; a typo silently sends buyers a dead link.
  2. **Guests have no tracking page** — after `/checkout/success` their only
     surface is the email itself (`/orders` is an old redirect to
     `/admin/orders`, not a guest lookup).
  3. **No live status** ("in transit / delivered") — link-out to the carrier
     only.

## Decision

Proposed, awaiting Charles/owner sign-off (stays BACKLOG until then):
**Option B — carrier picker + auto-built tracking link, keep carrier link-out
for V1.** Industry note: for a small store's V1, "email with a carrier
tracking link" *is* the standard design (what Shopify Basic does); in-house
live tracking pages come later, if ever.

## Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| A. Status quo — admin pastes number + full URL | Zero work; already at UAT | URL typos = dead links for buyers; no carrier on record for reports | ❌ |
| B. Carrier dropdown (UPS first) + URL auto-built from number; email/link-out unchanged | Small change (~1 field + URL template map); kills the typo risk; carrier stored for later use; provider-neutral (UPS/USPS/FedEx/DHL templates) | Still no live status; one more migration | ✅ **proposed** |
| C. Full integration — UPS Track API or aggregator (AfterShip/Shippo): live status on our own page, "delivered" emails | Best buyer UX; enables delivery-based automations | Carrier API contracts + webhooks/polling to build and babysit; aggregators cost money; overkill before real volume | ❌ for V1 — revisit post-ship |

## Acceptance criteria

- [ ] Fulfilling with carrier = UPS + a tracking number auto-fills a working
      `ups.com` tracking URL; admin can still override the URL by hand.
- [ ] Carrier is stored on the order and shown on the admin order detail
      (EN + 中文 labels via `t()`).
- [ ] Shipping-confirmation email names the carrier and links the tracking
      URL (already links today — pin with a test).
- [ ] Orders fulfilled before this change (URL only, no carrier) still render
      fine everywhere.
- [ ] Human acceptance: owner fulfills a sandbox order with a real UPS
      number, receives the email, link opens UPS tracking (UAT → VERIFIED).

## Plan

| # | Work item |
|---|---|
| 1 | Migration `0003`: nullable `tracking_carrier` text on `orders` (+ file-adapter default in `lib/orders/db.ts`) |
| 2 | `lib/shipping/carriers.ts`: carrier → tracking-URL template map (UPS, USPS, FedEx, DHL), JSDoc'd; unit tests |
| 3 | `fulfillOrder` accepts `carrier`; builds URL from template when the URL field is left blank |
| 4 | Admin fulfill dialog: carrier dropdown (default UPS), number field, URL field now optional; i18n strings |
| 5 | Email: mention carrier name in the shipping-confirmation text |
| 6 | e2e: fulfill-with-carrier path in the admin orders spec |

Out of scope here (own decisions later): guest tracking page (tokenized
order-status link in the email) and live-status integration (Option C).

## Blockers and dependencies

None on other features. The email half only becomes real once the owner sets
`RESEND_API_KEY` (BUILD-REPORT §5 — an env-var task, not a feature id).

## Verification evidence

None yet — BACKLOG.

## Related links

- Spec: [admin-design.md §9.4 fulfill flow, §10.3 notifications](../../admin-design.md)
- Activation: [BUILD-REPORT §5](../../archive/BUILD-REPORT.md)
- Sibling ask, same boss note: [promotion-emails.md](promotion-emails.md)
