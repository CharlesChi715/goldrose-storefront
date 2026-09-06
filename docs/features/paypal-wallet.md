---
delivery: uat
rollout: test-deployment
statusChangedAt: 2026-08-08
priority: p0
---

# paypal-wallet

## Context

PayPal Orders v2 wallet checkout is built (routes, webhook, refunds, fixture
tests); switching to live credentials is an owner-only release gate.

- ⚠️ **Corrected 2026-09-05:** no `PAYPAL_*` variable is set in Vercel (checked
  with `vercel env ls production`), so the live site is **not** in sandbox mode
  — `/checkout` renders the **mock card form** and records `source='mock'`
  orders. No PayPal credentials exist on Charles's machine either; the PayPal
  code path has never run outside its unit fixtures. The 2026-07-15 real
  payment went through the since-deleted Shopify checkout, not this code.

## Blockers and dependencies

- Only the owner may enable live PayPal (release queue step 5), and
  `CHECKOUT_SKIP_PAYMENT` must be unset in the same move.
- Sandbox credentials + webhook id must exist before anything here can be
  verified — the wiring order is in the guide below.

## Related links

- **How to wire it, step by step:** [`docs/guides/paypal-wiring.md`](../guides/paypal-wiring.md)
- Card rail on the same account: [card-payments](card-payments.md)
