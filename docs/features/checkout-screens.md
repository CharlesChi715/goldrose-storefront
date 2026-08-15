---
delivery: uat
rollout: live
statusChangedAt: 2026-08-08
priority: p1
---

# checkout-screens

## Context

The two-step checkout flow (bag → address/shipping review → payment hand-off)
is built and serving real visitors on eldreve.com; it awaits the owner
acceptance walkthrough, and its card fields and shipping choices are still
visual placeholders tracked by their own records.

**`/bag` is real** (2026-08-07): it reads `useCart()` rather than the design's
"Artisan Blue Rose" placeholder row, resolves each line against the database
catalog, and its stepper and Remove actually mutate the cart — which closed
AI-017, the last "nothing in the live site can change a cart" blocker. The
frame shrank 1726 → 932 when the design deleted four of its six sections at
source, and a second frame (`2976:375`) gave the bag an **empty state** for the
first time; an empty state only means anything against a real cart, which is
why the two landed together.

## Blockers and dependencies

- ⚠️ **AI-041 — a release-gate string.** Both `/bag` frames promise
  complimentary shipping and same-day dispatch unconditionally, on an empty bag
  too, while [shipping-rates](shipping-rates.md) (OQ-2) is unanswered. Carried
  over verbatim rather than reworded, and it may not be live as a promise we
  cannot honour.
- ⚠️ **AI-042 — "Move to Wishlist / Remove" only half works.** Remove is wired;
  there is no wishlist anywhere in the build.
- Tracking timeline, shipping choices and card fields remain visual
  placeholders; the real cart enters through `/checkout`.

## Related links

- [card-payments](card-payments.md) — the card fields this flow hands off to
- [shipping-rates](shipping-rates.md) — the rates this flow displays
- [paypal-wallet](paypal-wallet.md) — the payment step itself
- The money path end to end:
  [`docs/learning/01-add-to-cart-checkout.md`](../learning/01-add-to-cart-checkout.md)
