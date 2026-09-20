# aws-paypal-wireup · 2026-09-20 · `worktree-remove-paypal`

Charles confirmed the business runs on Stripe and Aspire, so PayPal was removed
from the code and the documents. One matter stays open because it belongs to
the design, not the code.

## AI-052 · `OWNER-DECISION` · the design still draws payment brands we do not accept

The shop accepts Visa and Mastercard through Stripe, and nothing else. Two
pixel-exact Figma imports still show other brands to customers:

- The checkout payment card draws three rows — **PayPal**, **Apple Pay**,
  **Afterpay**. None of them does anything. (The PayPal row used to be the
  mock "pay without a card" click target; that target is gone.)
- The product page's checkout block reads "Secure Checkout · Multiple Payment
  Options" above four brand marks — **shop Pay**, **Klarna.**, **PayPal**,
  **● Pay**.

The repo's rule is that a live placeholder may never state a policy we cannot
honour, and a brand mark under "Multiple Payment Options" reads as a promise.
They were left as drawn because both are frame imports and redrawing a frame
is the design team's work, not an agent's.

Recommendation: ask the design team to redraw both blocks around what is
true — cards, with the Visa and Mastercard marks — or to remove them. If Apple
Pay is wanted, Stripe Checkout can offer it on its own page without any change
on ours, and the mark could then stay truthfully.

Locations: [`CheckoutClient.tsx`](../../app/checkout/CheckoutClient.tsx) (the
"PayPal / Apple Pay / Afterpay rows" block) ·
[`products/[slug]/page.tsx`](../../app/products/[slug]/page.tsx) (section
"07 · Checkout actions").

## Delivered this session

- Removed the PayPal rail: `lib/paypal/`, `/api/paypal/*`,
  `/api/webhooks/paypal`, the SDK button, the refund branch, the env block and
  the PayPal build guards. Stripe is the only provider.
- Closed a hole found on the way: the mock order endpoint `/api/checkout` only
  switched off when PayPal was configured, never when Stripe was.
- Admin payment banner and Settings payments card now report Stripe test or
  live mode; `llms.txt` no longer says PayPal is accepted; the e2e server
  blanks Stripe keys so the suite always runs mock checkout.
- Documents: `paypal-wallet` dropped, `card-payments` cut to today's truth,
  spec §10 rewritten for Stripe, the payment-failing runbook rewritten against
  the Stripe alerts, lesson 06 and the PayPal wiring guide deleted.
