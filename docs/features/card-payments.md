---
delivery: in-progress
rollout: not-deployed
statusChangedAt: 2026-09-20
priority: p0
---

# card-payments

## Context

Visa and Mastercard paid on our own checkout page, without the buyer leaving
for PayPal's window.

- Owner ask (2026-07-26): "just start build: Visa, PayPal, Mastercard".
  `SUMMARY.md` has listed those three as the US launch requirement for a while,
  which read as though cards already worked.
- They do not. **There is no card rail at all today.** The "Credit Card" method
  in `lib/checkout/methods.ts` renders a form (`app/checkout/CheckoutClient.tsx`
  §mock card form) that Luhn-checks the number and POSTs the raw PAN to our own
  `/api/checkout` — and only in mock mode. `validateCard`'s `brand`/`last4` are
  computed and then discarded; nothing card-related is persisted.
- Outside mock mode there are deliberately no card fields at all — checkout says
  "Card and bank details are collected in PayPal's own window." So a buyer who
  does not want to log into PayPal currently cannot pay.
- Posting a PAN to our own server is acceptable for a fake and unacceptable for
  real money — it would drag us into PCI scope we have no reason to enter.
- The provider question was tracked as **OQ-1** and had been open since
  2026-07-22. This record closes it.
- No evidence exists yet because nothing is built. The PayPal *wallet* took a
  real card-funded payment on 2026-07-15, which proves the account works; it
  exercises none of this.

## Decision

**REVISED 2026-09-20: cards go through Stripe Checkout, not PayPal Advanced
Checkout.** The 2026-07-26 decision below is superseded; it survives for the
reasoning trail.

- What changed: the company already holds a **live, verified Stripe account**
  (Zhongshu Technology Worldwide Limited, `acct_1U1f0EGvea4GUGR4`) with a live
  payment link taking card money (AI-047) — the original rejection reason
  ("the boss would need to open and KYC a second financial account") is dead.
- Sign-off: the boss approved card revenue settling into Zhongshu's Stripe
  instead of his PayPal (relayed by Charles in-session, 2026-09-20). The
  PayPal **wallet** rail is unchanged and still settles to his PayPal.
- Shape: the "Credit Card" action redirects to **Stripe Checkout** (Stripe's
  hosted payment page) — card number never touches our page or server (PCI
  SAQ A), 3DS handled by Stripe, shipping address collected there and
  restricted to the priced zone's countries so the charged shipping can never
  be wrong. Server routes: `/api/stripe/checkout` (re-price → session),
  `/api/stripe/return` (verify → drift hard-stop → `createOrder`),
  `/api/webhooks/stripe` (HMAC-verified confirm/repair/refund/dispute sync).
  Orders carry `payment_provider: "stripe"` in the same provider-neutral
  columns; refunds dispatch per provider via `lib/payments/provider.ts`.
- Advantages over ACDC that decided it, beyond the account: no per-account
  onboarding wait (ACDC stage 0 never happened), `stripe listen` replaces
  cloudflared for local webhook testing, and the mock card form retires the
  moment the key is set.

Build (2026-09-20): code, migration `0016_card_payment_columns.sql`, unit
tests, all `npm run check` gates green.

**Sandbox walkthrough passed the same day** (localhost against Stripe test
mode, real browser). Evidence: three card purchases — orders `#1018`
(Visa 4242), `#1019` and `#1021` (Mastercard 4444) — each written from the
server re-price with the shipping address Stripe collected, one $5 partial
refund and three full refunds, every one synced by the signature-verified
webhook (`refund_synced`, `partially_refunded` → `refunded`). Migration 0016
applied to hosted after a `pg_dump` safety copy.

Two defects the walkthrough caught, both fixed (PR #56):

- The webhook can beat the buyer's return leg to the insert, and its event
  payload carries `payment_intent` as a bare id — so `#1018` recorded no card
  brand or last four. The webhook now re-reads the session with the charge
  expanded, and the return leg backfills what the winner could not know.
- Worse: both paths read "no order", both inserted, and the unique index
  rejected the loser — which threw, so a buyer who had already paid was sent
  to an error page. `createOrderIfAbsent` now treats that violation as the
  race being decided, and returns the winner's order.

AI-TAG(AI-050): OWNER-TODO — those three sandbox orders still hold 4 units of
live stock; cancel + restock + archive them. See
/agent-delivery/sessions/payment-learning-09-20-worktree-stripe-checkout.md.

⚠️ **Adaptive Pricing stays ON — decided 2026-09-20 (AI-051, closed).**
Stripe converts a Checkout Session into the buyer's own currency, based on
their IP, before any card is entered. Our return leg compares the captured
amount against the USD re-price, so a converted session can never match: the
payment is refunded in full and no order is written. That is the safe
direction — nobody is charged the wrong amount — and Charles accepted losing
non-US sales rather than fund multi-currency (FX at capture, a currency
column, two-currency refunds and reporting) before there is demand for it.

**This will hit the §14.3 acceptance walkthrough.** The owner pays from
China, so that session arrives in CNY and the screen reads "Prices changed
while you were paying." That is this setting, not a broken checkout. Either
switch Adaptive Pricing off for the ten minutes the walkthrough takes
(Stripe → Settings → Payments → Adaptive Pricing → the *Zhongshu Technology
Worldwide Limited* toggle in the Checkout row), or expect the message and
read it correctly.

Remaining to reach `uat`: Stripe keys in Vercel + a production webhook
endpoint, then the owner's live low-value card payment and refund.

The original decision, superseded:

Build on **PayPal Advanced Checkout** (also marketed as "Expanded Checkout";
the card feature is *Advanced Credit and Debit Card Payments*). PayPal renders
the card fields as PayPal-hosted iframes inside our own checkout page, so the
buyer never leaves for a PayPal popup and the card number never reaches our
servers. Card revenue settles into the **same PayPal business account** as the
existing wallet button.

PayPal therefore wears two hats: the wallet (buyer logs into PayPal) and the
card processor/acquirer (buyer types a Visa; PayPal routes it to the card
networks). One account, one payout, one refund path, one webhook.

Order columns stay provider-neutral (`payment_provider`, `provider_order_id`,
`provider_capture_id`), so adding or switching providers later changes routes,
not the database.

## Options considered

| Option                                  | Pros                                                                                                                                                                                                                                                                                                        | Cons                                                                                                                                                                                                                         | Verdict                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **PayPal Advanced Cards**               | Reuses the boss's already-verified PayPal business account — no second company KYC; one dashboard, one settlement, one reconciliation; cards typically priced below wallet; PayPal is a PCI DSS service provider so the PAN never touches us; 3DS included; US/AU/HK all on the 37-country eligibility list | Needs per-account onboarding — not automatic on a standard business account; buyer may still see a "Powered by PayPal" mark; single-vendor concentration                                                                     | ✅ **chosen**                                            |
| **Stripe for cards, PayPal for wallet** | Best-in-class card UX; easiest path to Apple Pay/Google Pay later                                                                                                                                                                                                                                           | Boss must open and KYC a second financial account (Stripe does not onboard China-registered entities); two dashboards, two payouts, two refund paths; roughly double the money-code and a provider dispatch layer everywhere | ❌ rejected on account/ops overhead, not technical merit |
| **Both providers**                      | Best theoretical conversion                                                                                                                                                                                                                                                                                 | All of Stripe's cost, plus routing logic and split reconciliation, for a store with zero customers                                                                                                                           | ❌ deferred; revisit only if card conversion disappoints |
| **Stay wallet-only**                    | Zero work                                                                                                                                                                                                                                                                                                   | Buyers without a PayPal account cannot check out; contradicts the stated US launch requirement                                                                                                                               | ❌                                                       |

## Acceptance criteria

- [ ] A buyer can pay with a Visa or Mastercard without leaving the checkout page
      and without logging into PayPal.
- [ ] The card number never reaches our server or our logs (PayPal-hosted fields only).
- [ ] The resulting order records provider, capture id, card brand and last four.
- [ ] A declined card shows the buyer a usable error and creates **no** order.
- [ ] Admin can refund a card order, partially and fully, and the order status follows.
- [ ] Captured amount is reconciled against the server-side re-price; a mismatch does
      not silently record a paid order.
- [ ] Mock mode still works offline with no PayPal keys (it is what the e2e suite runs on).
- [ ] **Human acceptance:** owner completes the §14.3 walkthrough in sandbox, then a
      real low-value card payment on the live account is taken and refunded.

## Plan

**Superseded 2026-09-20** with the ACDC decision — kept for the trail. What
replaced it is listed in the Decision revision above; of the stages below,
the build delivered the intent of 2 (as migration `0016`), 3 (as Stripe
Checkout), 4's failure handling (drift hard-stop, refund/dispute webhooks)
and 5 (tests) in one pass, and stage 0 is no longer needed at all.

Tracked as stages 0–7 (session task list, 2026-07-26):

- **Stage 0** — owner enables Advanced Checkout in the PayPal dashboard and
  activates Visa/Mastercard; hands over sandbox credentials. *Owner action.*
- **Stage 1** — extract a provider-neutral payment layer (`lib/payments/`),
  replacing the hardcoded `payment_provider === "paypal"` checks in
  `lib/admin/orders.ts` and the literal "PayPal" in admin settings. No behaviour
  change. Also fixes a config hole where PayPal server keys without the
  `NEXT_PUBLIC_` client id leave checkout a dead end.
- **Stage 2** — migration `0004`: `payment_method_kind`, `card_brand`,
  `card_last4`, plus a check constraint on the currently free-form
  `payment_provider`. Surface in admin order detail and the receipt.
- **Stage 3** — replace the mock card form with PayPal Card Fields
  (`components=buttons,card-fields`, a client-token route, 3DS via
  `SCA_WHEN_REQUIRED`). Keep the mock rail for local dev.
- **Stage 4** — harden for card failure modes: enforce amount drift, handle
  `PAYMENT.CAPTURE.DENIED`/`.PENDING`/`.REVERSED` and disputes, give refunds real
  rows instead of timeline string-matching, index the `provider_order_id` lookup.
- **Stage 5** — tests; today no test touches `/api/paypal/*` at all.
- **Stage 6** — close OQ-1 in `admin-design.md` §4; clear the stale Shopify comments.
- **Stage 7** — sandbox walkthrough → live cutover → real card payment + refund.

## Blockers and dependencies

- **Stage 0 gates Stage 3.** Advanced Checkout is not switched on by default;
  PayPal must approve it for the account and individual card brands can need
  activation. Not expressible as a feature id — it is an owner dashboard action.
- No PayPal credentials exist on this machine (`.env.local` carries only Supabase
  vars plus `CHECKOUT_SKIP_PAYMENT`), so **the live PayPal path has never run
  here** — wallet included, not just cards.
- `PAYPAL_WEBHOOK_ID` must be set or signature verification fails closed and every
  delivery 401s.

AI-TAG(AI-048): OWNER-TODO — that link collects no shipping address and writes
no order. See
/agent-delivery/sessions/stripe-payment-link-delivery-08-25-worktree-team-delivery-stripe-payment.md.

## Related links

- **How to wire it, step by step:** [`docs/guides/paypal-wiring.md`](../guides/paypal-wiring.md)
  — sandbox → webhooks → card fields (stages 1–5) → live cutover (written 2026-09-05).
- Decision register: [SUMMARY.md · Product decisions](../../SUMMARY.md#product-decisions) (OQ-1)
- Spec: [admin-design.md](../admin-design.md) §4 (OQ-1 row), §7.4 (order payment columns), §14.3 (owner walkthrough)
- PayPal: [Advanced Checkout overview](https://developer.paypal.com/studio/checkout/advanced) ·
  [eligibility, countries and card brands](https://developer.paypal.com/expanded/eligibility)
