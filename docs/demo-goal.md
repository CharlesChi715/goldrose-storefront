# Demo goal: prove the stack works end to end

> **✅ ACHIEVED — superseded 2026-07-15.** The store went past this goal: the
> deployed site now takes **real payments** through Shopify's hosted checkout.
> This document is kept as history of the demo phase; the mock loop below
> still works locally as the development mode. Current status lives in
> `README.md`.

**Goal (owner, 2026-06-30):** let the boss see that this tech stack *functions* —
a visitor can click, pay, and the order/money goes the right way. This is about
proving the plumbing, **not** about selling the real product yet.

## What "functioning" means here

The full loop is visible, with nothing disappearing along the way:

1. **Click** — browse the store, add a gold rose to the cart.
2. **Pay** — go to checkout, choose Shop Pay / PayPal / Credit Card, submit.
3. **Order goes the right way** — the completed order is captured and shows up
   in the **order log at `/orders`**, with items, total, payment method, and
   time. The success page links straight there so you can watch it land.

That third step is the part that was missing before: checkout used to end at a
"thank you" page and the order vanished. Now it lands somewhere you can see.

## Demo script (for showing the boss)

1. Start the app: `npm run dev`, open <http://localhost:3000>.
2. Add a product to the cart, go to checkout.
3. Pay with a test card (`4242 4242 4242 4242`, any future expiry / CVC), or
   tap Shop Pay / PayPal.
4. On the confirmation page, click **View order log →** (or open `/orders`).
5. The order is there. Place another; the count and revenue tick up.

## What is real vs. simulated

- **Real:** the storefront, cart, server-side re-pricing (the client can't set
  its own price), input validation, the checkout API, and order capture.
- **Simulated:** the payment itself. The app runs in `SHOPIFY_MODE=mock`, so no
  money moves, no real Shopify order is created, and card numbers are discarded
  after format validation (only brand + last four are kept for the receipt).
- The order log (`/orders`, backed by a gitignored `.data/orders.json`) is a
  demo stand-in for what would be a real Shopify order record in live mode.

## Next step to make payment real (decision needed)

To turn the *pay* step from simulated into a genuine sandbox payment that shows
up on a payment provider's dashboard, we need one of:

- **Shopify test mode** — matches the chosen backend ([[checkout-backend-decision]]),
  but Shopify Payments activation is currently blocked on the merchant-entity
  question (Hong Kong owner vs. AU-registered store — see the worklog).
- **A payment sandbox (e.g. Stripe test mode)** — fastest path to a real
  end-to-end test charge for a *demo*, independent of the merchant-entity
  question, but it is not the production backend the owner picked.

Until that's decided, this mock loop is the honest "the stack works" demo.
See [docs/checkout.md](checkout.md) and
[docs/mock-business-decisions.md](mock-business-decisions.md).
