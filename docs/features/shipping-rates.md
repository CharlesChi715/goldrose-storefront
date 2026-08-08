---
delivery: ready
rollout: not-deployed
statusChangedAt: 2026-08-08
priority: p0
---

# shipping-rates

## Context

Rest-of-world shipping currently charges a `$19.95` placeholder; a shipping
rate is a price we charge, so real rates must replace it before the first
real order — a hard release gate (SUMMARY.md OQ-2).

## Blockers and dependencies

- OQ-2 is unanswered: the owner has not supplied the real rate card; entering
  it is data work in the admin, not code work.
