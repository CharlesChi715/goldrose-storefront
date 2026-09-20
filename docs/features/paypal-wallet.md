---
delivery: dropped
rollout: not-deployed
statusChangedAt: 2026-09-20
---

# paypal-wallet

## Context

A PayPal wallet button at checkout, settling into the boss's PayPal business
account. Built in July (Orders v2 routes, webhook, refunds, fixture tests) and
never configured: no PayPal credential was ever set on any machine or in
Vercel, so the code never ran outside its unit fixtures.

## Decision

**Dropped 2026-09-20 (Charles).** The business runs on Stripe and Aspire;
PayPal is not part of how the company is paid.

- PayPal was the plan only while the boss's PayPal account was the one way to
  take money. The company's verified Stripe account replaced that reason the
  day the card rail was built —
  [card-payments](card-payments.md).
- Two rails mean two dashboards, two refund paths and two webhooks to keep
  correct, for a shop with no customers yet.
- The code was removed rather than left dormant, because dormant payment code
  still has to be kept correct. Removing it also exposed a real hole: the mock
  order endpoint only closed itself when PayPal was configured, never when
  Stripe was.

The cost, accepted: US buyers who prefer PayPal see no PayPal button. If that
ever matters, the order columns are provider-neutral, so a second rail is new
routes and no schema change. The removed code is in git history before commit
`e659e4b`.
