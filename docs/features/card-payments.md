---
schemaVersion: 1
id: card-payments
kind: feature
parent: native-checkout
area: frontend
order: 50

delivery: ready
rollout: not-deployed
statusChangedAt: 2026-07-26

priority: p0
owner: charles
target: v1-launch
qualifier: owner must enable Advanced Checkout first

dependsOn: []
blockedBy: []

verification:
  automated: []
  human: null
---

# Card payments — Visa/Mastercard on our own checkout page

## Context

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

## Decision

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

## Verification evidence

None yet — nothing built. The PayPal *wallet* took a real card-funded payment on
2026-07-15, which proves the account works; it does not exercise any of this.

## Related links

- Decision register: [SUMMARY.md · Product decisions](../../SUMMARY.md#product-decisions) (OQ-1)
- Spec: [admin-design.md](../admin-design.md) §4 (OQ-1 row), §7.4 (order payment columns), §14.3 (owner walkthrough)
- PayPal: [Advanced Checkout overview](https://developer.paypal.com/studio/checkout/advanced) ·
  [eligibility, countries and card brands](https://developer.paypal.com/expanded/eligibility)
