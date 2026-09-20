---
delivery: in-progress
rollout: not-deployed
statusChangedAt: 2026-09-20
priority: p0
---

# card-payments

## Context

Visa and Mastercard at checkout, with the card number never touching our page
or our server. Stripe is the shop's only payment provider, and card money
settles into the company's Stripe account. The business runs on Stripe and
Aspire (Charles, 2026-09-20).

- Owner ask (2026-07-26): take cards at launch. Until 2026-09-20 there was no
  card rail at all, only a mock form that Luhn-checks a number and records a
  `source='mock'` order.
- Posting a card number to our own server is acceptable for a fake and
  unacceptable for real money: it would drag us into PCI scope we have no
  reason to enter. A hosted payment page avoids that entirely.

## Decision

**Stripe Checkout, decided 2026-09-20.** The company holds a live, verified
Stripe account (Zhongshu Technology Worldwide Limited,
`acct_1U1f0EGvea4GUGR4`), and the boss approved card revenue settling there
(relayed by Charles in-session, 2026-09-20).

- Shape: the pay action redirects to **Stripe Checkout**, Stripe's hosted
  payment page. Stripe collects the card and the shipping address, handles
  3DS, and restricts the address to the priced zone's countries so the charged
  shipping can never be wrong (PCI SAQ A). Server routes:
  `/api/stripe/checkout` (re-price → session), `/api/stripe/return` (verify →
  drift hard-stop → `createOrder`), `/api/webhooks/stripe` (HMAC-verified
  confirm, repair, refund and dispute sync).
- Orders carry `payment_provider: "stripe"` in provider-neutral columns
  (`payment_provider`, `provider_order_id`, `provider_capture_id`), so a future
  provider changes routes, not the database. Refunds dispatch through
  `lib/payments/provider.ts`.
- The mock card form retires the moment `STRIPE_SECRET_KEY` is set, and so
  does the mock order endpoint `/api/checkout` (fixed 2026-09-20: it used to
  close only when PayPal was configured).
- PayPal is not used. The wallet built in July was removed the same day —
  [paypal-wallet](paypal-wallet.md) holds the why.

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

**Adaptive Pricing is OFF — set 2026-09-20 (AI-051).** Stripe converts a
Checkout Session into the buyer's own currency, based on their IP, before any
card is entered. Our return leg compares the captured amount against the USD
re-price, so a converted session can never match: the payment would be
refunded in full and no order written — safe, in that nobody is charged the
wrong amount, but every non-US buyer would be turned away after paying. The
decision was first to accept that, then reversed the same day: the toggle
(Stripe → Settings → Payments → Adaptive Pricing → *Zhongshu Technology
Worldwide Limited*, Checkout row) is now off, so every session is priced in
USD exactly as the catalog states, wherever the buyer is.

Two things follow:

- **The §14.3 acceptance walkthrough is safe.** The owner pays from China
  and still gets a USD session, so "Prices changed while you were paying"
  should NOT appear. If it does, something else is wrong — start by checking
  whether this toggle was switched back on.
- **Payment links are the exception.** Adaptive Pricing is permanently on for
  Payment Links and Managed Payments and cannot be switched off, so any
  future link sells in local currency no matter what this setting says. The
  one link that existed was retired on 2026-09-20 (AI-048).

If multi-currency is ever wanted for real, it is a feature, not a toggle: FX
at capture, a currency column on orders, and refunds and reporting in two
currencies.

## Options considered

| Option                              | Pros                                                                                                       | Cons                                                                                                   | Verdict                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------- |
| **Stripe Checkout (hosted page)**   | Company account already live and verified; no card data on our side; 3DS and address collection included   | Buyer leaves our page for Stripe's; its look is Stripe's, not the design team's                        | ✅ **chosen 2026-09-20**  |
| **PayPal Advanced Cards**           | Would have reused the boss's PayPal account (the 2026-07-26 choice, made before the Stripe account existed) | Per-account onboarding that never happened; money lands outside the company's Stripe and Aspire setup | ❌ superseded, then dropped |
| **Stripe and PayPal side by side**  | A PayPal button for buyers who prefer it                                                                   | Two dashboards, two refund paths, two webhooks, for a shop with no customers                           | ❌                        |
| **Stay on the mock form**           | Zero work                                                                                                  | Nobody can pay                                                                                         | ❌                        |

## Acceptance criteria

- [ ] A buyer can pay with a Visa or Mastercard on Stripe's hosted page and
      lands back on our confirmation page.
- [ ] The card number never reaches our server or our logs.
- [ ] The resulting order records provider, capture id, card brand and last four.
- [ ] A declined card shows the buyer a usable error and creates **no** order.
- [ ] Admin can refund a card order, partially and fully, and the order status follows.
- [ ] Captured amount is reconciled against the server-side re-price; a mismatch does
      not silently record a paid order.
- [ ] Mock mode still works offline with no Stripe key (it is what the e2e suite runs on).
- [ ] **Human acceptance:** owner completes the §14.3 walkthrough in test mode, then a
      real low-value card payment on the live account is taken and refunded.

## Blockers and dependencies

What is left to reach `uat`, as of 2026-09-20:

- **A test purchase on eldreve.com.** `STRIPE_SECRET_KEY` and
  `STRIPE_WEBHOOK_SECRET` (test values) are set on Vercel Production and
  Preview, the test-mode webhook endpoint `we_1UHcTpGvea4GUGR4Secqlyv9` points
  at `https://eldreve.com/api/webhooks/stripe` for the three events we handle,
  and production has been deployed since the keys were set. Nobody has yet
  bought with the `4242` test card on the real domain, which is the one check
  that exercises Vercel's variables and that webhook endpoint together.
- **The live cutover is the owner's**, and it is a one-way door: a live secret
  key plus a **live-mode** webhook endpoint and its own signing secret, with
  `CHECKOUT_SKIP_PAYMENT` unset and OQ-2 shipping rates answered first. Confirm
  Adaptive Pricing is off in live mode before the owner pays from China.
- **The design still draws payment brands we do not accept** — a PayPal row on
  the checkout payment card, and shop Pay, Klarna, PayPal and Apple Pay marks on
  the product page. They are pixel-exact imports, so redrawing them is the
  design team's call.

## Related links

- Decision register: [SUMMARY.md · Product decisions](../../SUMMARY.md#product-decisions) (OQ-1)
- When a payment fails: [payment-failing runbook](../runbooks/payment-failing.md)
- Stripe: [Checkout Sessions](https://docs.stripe.com/payments/checkout) ·
  [webhook signatures](https://docs.stripe.com/webhooks#verify-official-libraries)
