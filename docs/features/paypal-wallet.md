---
delivery: uat
rollout: test-deployment
statusChangedAt: 2026-08-08
priority: p0
---

# paypal-wallet

## Context

PayPal Orders v2 wallet checkout is built and verified end to end in sandbox
(real card payment confirmed 2026-07-15); switching to live credentials is an
owner-only release gate, so the code serves the live site in sandbox mode.

## Blockers and dependencies

- Only the owner may enable live PayPal (release queue step 7), and
  `CHECKOUT_SKIP_PAYMENT` must be unset in the same move.
