<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-051 · `OWNER-DECISION` · Stripe Adaptive Pricing would refuse non-US buyers

Stripe Checkout offered the test purchase in **A$204.39** before a US$139.98
was selected — Adaptive Pricing is on for the account, and it converts the
session into the buyer's local currency.

Our return leg compares the captured amount against the server re-price in
USD cents. A converted session arrives as AUD cents, which can never match,
so the hard stop fires: the payment is **refunded in full and no order is
written**. That is the safe direction — nobody is charged the wrong amount —
but every non-US buyer would be turned away after paying.

Two options, and it is a commercial call, not a technical one:

- **Turn Adaptive Pricing off** (Stripe dashboard → Settings → Payments →
  Adaptive Pricing). Everyone pays in USD, exactly as the catalog states.
  Simplest, and matches the US-first market.
- **Keep it and teach the code to price in the buyer's currency** — a real
  feature: FX at capture time, a currency column on orders, refunds and
  reporting in two currencies. Not worth it before the first sale.

Recommended: off until there is evidence of non-US demand.

**ANSWERED 2026-09-20 — leave it on.** Charles's call, knowing the trade:
non-US visitors are refunded and turned away rather than sold to, and the
failure is safe (no wrong amount is ever kept). Do not re-open this without
new information; what would count as new information is a non-US buyer
actually trying to pay, or the owner walkthrough hitting it.

⚠️ **It will bite the acceptance walkthrough** (`admin-design.md` §14.3):
the owner pays from China, so that session arrives in CNY, the amount check
refuses it and the screen reads "Prices changed while you were paying."
That is this setting, not a broken checkout. Either switch Adaptive Pricing
off for the ten minutes the walkthrough takes, or expect the message and
read it correctly.

Location: [`lib/stripe/client.ts`](../../lib/stripe/client.ts) ·
[`app/api/stripe/return/route.ts`](../../app/api/stripe/return/route.ts)
(the amount check that would reject it).
- **Closed:** 2026-09-20
- **Why:** answered 2026-09-20: Charles chose to leave Adaptive Pricing ON — non-US buyers are refunded and turned away, which fails safe; warning about the owner walkthrough (CNY) recorded in card-payments.md
