# Payment failing — a buyer's money is already involved

Open this when an alert arrives whose event name starts with `stripe.`, or when
a customer says they paid and got nothing. It is the only runbook where someone
else's money has already moved, so the work is always three moves: find what
Stripe did, find what the shop recorded, make the two agree.

## Symptoms

- Subject `[ELDREVE alert] stripe.return.orphaned` — or
  `stripe.return.amount-mismatch`, `stripe.return.failed`,
  `stripe.checkout.failed`, `stripe.webhook.failed`. The body carries `Event:`,
  `Time:` and the fields; the three return alerts include `sessionId`, the
  Stripe Checkout Session id (`cs_…`) everything below searches on.
- Subject `Card dispute opened on order #…` — a buyer's bank has reversed a
  charge. That one has its own section.
- One email can stand for many failures: alerts are throttled to one per event
  per 15 minutes per server instance, and the body says how many more were
  logged but not sent. Believe that number, not your inbox.
- A customer writes "I paid and never got a confirmation", or a payment sits in
  the Stripe account with no matching order in `/admin/orders`.
- A shopper reports `Could not start card checkout.` (nothing began, no money
  at risk) or `Prices changed while you were paying.` (the shop refunded the
  payment in full and correctly wrote no order).

## Do this first

**1. Check whether it already repaired itself.** The webhook rebuilds the order
on its own when the buyer's browser dies between paying and our return leg, so
many of these are resolved before you read them. Wait five minutes from the
alert's `Time:` (deliveries arrive in seconds; a retry takes a few minutes),
then search `/admin/orders` for the buyer's email or the order name — the box
matches only those two, never Stripe ids. Open the order and read its timeline;
any of these lines means it is done:

```text
Order repaired from Stripe webhook (checkout session completed)
Payment confirmed by Stripe webhook
Payment of $49.99 captured via stripe
```

Good answer: the order is there and its payment badge reads Paid, so skip to
**Afterwards**.

**2. Ask Stripe what happened.** <https://dashboard.stripe.com> → Payments, with
the **Test mode** switch matching the key the site runs on. Paste the alert's
`sessionId` into the dashboard's search box; we also put our own checkout id on
every session as `client_reference_id` and `metadata.checkout_id`, so either
finds it. Open the payment and note its status, its amount, the card's last
four and the shipping address Stripe collected. Good answer: exactly one
succeeded payment for that session, or none — the two lead different ways,
which is the point of the step.

**3. Ask the database whether an order exists.** Run it from the repo root,
where `.env.local` holds `SUPABASE_DB_PASSWORD`. It only reads.

```bash
cd ~/Developer/goldrose-storefront
PGPASSWORD="$(grep -m1 '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-)" \
psql -h aws-1-us-west-2.pooler.supabase.com -p 5432 \
  -U postgres.cfvsvgbldnzkcjvbwnjp -d postgres -c \
  "select name, financial_status, total_cents, provider_capture_id from orders
   where provider_order_id = 'PASTE_THE_SESSION_ID';"
```

Good answer: one row (the order exists — read `financial_status`) or `(0 rows)`
(this payment has no order). **4.** Now read the section for your alert.

### stripe.return.orphaned — highest urgency, and it will not fix itself

Money was taken and the checkout row the order should have been built from is
gone, so no order exists and the buyer receives nothing. Waiting will not help:
the webhook's repair path reads that same missing row and gives up. Confirm by
re-running the step 3 command with `select id, status from checkouts where
provider_order_id = 'PASTE_THE_SESSION_ID';` — `(0 rows)` confirms the orphan,
a row with status `open` means it can still repair itself, so wait. Then, using
the line items Stripe shows for the payment, either **fulfil** or **refund**.

⚠️ **Before leaving the Stripe payment, copy the buyer's shipping address out
of it.** The draft form (`/admin/orders/drafts/new`) takes lines, quantities,
the buyer's email, a discount code and a note — there is **no address field
anywhere in the admin**, and `priceDraft` forces `shipping_cents: 0`
(`lib/admin/drafts.ts`). So a draft alone produces an order nobody can post, at
a total lower than the amount Stripe actually took.

**To fulfil:** `/admin/orders/drafts/new` → same variants and quantities, the
buyer's email → paste the shipping address AND the shipping you charged into
the **note** → Save → **Mark as paid**. That decrements stock, writes the
timeline and sends the confirmation, and takes no money, which is right because
Stripe already has it. The draft records as a `mock` payment with no capture id,
so a later refund of it must also be done in the Stripe dashboard, and its total
will not match the charge — say so in the note.

**To refund** — below — when you cannot tell what they bought.

### stripe.return.amount-mismatch — already refunded; a human must check why

The shop priced the cart at `pricedCents` when the buyer came back, Stripe had
taken `capturedCents`, and the two differed. The return leg refunded the payment
**in full**, marked the checkout `rejected` so the webhook cannot rebuild it,
wrote **no order**, and showed the buyer "Prices changed while you were paying."
Nothing is owed and nothing ships. Your job is the cause:

- A price, shipping rate or discount was edited while the buyer was on
  Stripe's page. Nothing to fix; the buyer can simply pay again.
- **Every** payment from outside the US mismatches: Stripe's Adaptive Pricing
  has been switched back on and is converting sessions into local currency.
  Turn it off (Stripe → Settings → Payments → Adaptive Pricing) —
  [card-payments](../features/card-payments.md) has the full story.

Confirm the refund landed: the payment in the Stripe dashboard reads Refunded.
If it still reads Succeeded, the automatic refund failed — refund it by hand.

### stripe.return.failed — money may or may not have moved

The alert carries `err` and `sessionId`; steps 2 and 3 settle it. No succeeded
payment in Stripe: nothing happened, the shopper can retry. Payment plus an
order: already repaired. Payment and no order: run the `checkouts` query above —
a row with status `open` means the webhook will rebuild it, so wait ten minutes
and look again; no row means treat it as **orphaned**.

⚠️ Do not ask the buyer to pay again until you know the first payment's fate. A
second payment is a second charge, and refunding one is not the same as never
taking it.

### stripe.checkout.failed — no money at risk, every visitor a lost sale

Nobody can start checkout, and nobody complains; they just leave. Read `err`: a
`401` from Stripe means the secret key is wrong, revoked or rotated; a `4xx` on
`/v1/checkout/sessions` means Stripe rejected our request. Check
<https://status.stripe.com> before assuming it is us, then that Vercel
Production still has `STRIPE_SECRET_KEY`. To test, put an item in the bag on the
live site and press pay; a good answer is Stripe's own payment page opening.
Close it without paying, since nothing is charged until the card is submitted.

### stripe.webhook.failed — the safety net itself is failing

Stripe retries and the handler is idempotent, so **one** is survivable; a run of
them means orders are being lost. Count them in the logs, not your inbox. Check
`STRIPE_WEBHOOK_SECRET` is set in Vercel Production and belongs to the endpoint
in the **same mode** as the secret key — a test-mode signing secret next to a
live key rejects every delivery with 401 and the net is silently off, which is
also why nothing would have repaired itself in step 1. Delivery history and
re-send are in the Stripe dashboard under Developers → Webhooks → the
`/api/webhooks/stripe` endpoint.

### Card dispute opened — the clock is the bank's, not ours

The order is tagged `disputed` and its timeline says why and by when. Answer in
the Stripe dashboard (Payments → the payment → the dispute) before the date in
the email: an unanswered dispute is lost by default, and the buyer keeps both
the money and the goods. Evidence that wins: the tracking number, the delivery
confirmation, and the order confirmation email. Do not refund a disputed charge
as well — the bank has already pulled the money back, and a refund would pay
the buyer twice.

## If that did not fix it

Read the raw lines: Vercel dashboard → the project → Logs, search the event
name. Each is one JSON line with the ids in fields, so a search finds every
occurrence, not only the one that was emailed.

**Refunding.** With an order, open it in the admin → Refund, which calls Stripe
and records the refund and timeline in one action. With no order (the orphan
case), refund in the Stripe dashboard: Payments → the payment → Refund. The
webhook then finds no order to update, which is expected.

⚠️ A refund cannot be undone, and Stripe does not return its processing fee.
Refund only the amount you mean to. The shop sends no refund email, so write to
the buyer yourself.

**Tell the bosses in money terms:** "a customer paid US$X on <date>; we have
their money and no order; I have refunded it / built the order by hand and it
ships as normal." They can act on that, not on an event name.

**Do not:** edit an order's payment status to Paid to silence an alert, which
hides a missing payment instead of finding it; add a rate limiter to
`/api/stripe/return`, the one public route deliberately left unlimited, because
by the time a request reaches it Stripe may already hold the money and a
refusal strands a payment with no order (it is idempotent by session id); set
`CHECKOUT_SKIP_PAYMENT` on the live site as a stopgap, which records real orders
that took no money — and the build refuses it next to a live key; or delete an
order, since orders are never hard-deleted — cancel or refund instead.

## Afterwards

- Write what you did into the order's timeline as a comment, with the Stripe
  payment id and whether you refunded or fulfilled; it is what the next person
  reads, and it outlives the logs.
- State that changes about payments goes in `docs/features/card-payments.md`,
  which owns it — not here, not SUMMARY.md.
- Anything the bosses must decide (refund or fulfil, a price that moved
  mid-checkout) goes in `agent-delivery/INBOX.md` as a new `AI-nnn` row tagged
  `OWNER-DECISION`; `npm run agent-inbox` shows the open ones and the format.
- If the same alert has now fired twice, say so there. One is an incident; two
  is a bug nobody has found yet.
