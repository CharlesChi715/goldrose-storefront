<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-048 · `OWNER-TODO` · the link takes $79 with no address and no order

Independent of the rail decision (AI-047, closed 2026-09-20: answered (a), a
real checkout rail) — this bites as soon as the QR is shown to a customer.

- **A payment through it is invisible to the storefront.** It writes no
  `orders` row, so it reaches no admin screen, decrements no inventory, sends
  no confirmation email and creates no tracking. Whoever watches the Stripe
  dashboard *is* the fulfilment system.
- **It sells a physical gift and collects no delivery address.** On the
  evidence of the page a customer can pay $79 and we will not know where to
  send the rose. Stripe payment links can collect one; it is switched off.
- **$79.00 is not a catalog price.** The nearest is `premium-gift-bundle` at
  **$79.99**, and "Gold-Dipped Roses" is not a handle we ship. Same brand,
  different price, is a claim the live site contradicts.
- **Discounts, tax and shipping are Stripe's settings**, not our `discounts`
  table — and not the real shipping rates OQ-2 still has not answered.

SUMMARY's hard gate reads: anything a stranger's money or identity touches is
real *before* the switch. This is money, and it is live now.

**Recommended before the QR is given to anyone else:** turn on shipping-address
collection, set the price to the catalog price, and name the person who
reconciles Stripe payments into orders by hand.

**RESOLVED 2026-09-20 — the link is deactivated.** Charles's instruction once
the real card rail existed: retire it rather than patch it. `plink_1U7snA…`
is now `active: false` on the live account, and it was the only payment link
there, so nothing outside the storefront collects money any more. The QR
poster in `team-deliveries/inbox/` now resolves to Stripe's "no longer
active" page — the artefact is kept, as delivered, but it cannot take a
payment.

Note for whoever reads this next: a payment link **cannot be deleted**, only
deactivated. The record stays for accounting, which is the right behaviour —
any past payment through it still needs a human to reconcile, and this entry
is the only place that says so.
- **Closed:** 2026-09-20
- **Why:** done 2026-09-20: Charles had the link retired once the real card rail existed — plink_1U7snA… set active:false on the live account (payment links cannot be deleted); it was the only one, so nothing outside the storefront collects money
