# Payment failing — a buyer's money is already involved

Open this when an alert arrives whose event name starts with `paypal.`, or when
a customer says they paid and got nothing. It is the only runbook where someone
else's money has already moved, so the work is always three moves: find what
PayPal did, find what the shop recorded, make the two agree.

## Symptoms

- Subject `[ELDREVE alert] paypal.capture.orphaned` — or
  `paypal.capture.amount-mismatch`, `paypal.capture.failed`,
  `paypal.create.failed`, `paypal.webhook.failed`. The body carries `Event:`,
  `Time:` and the fields; the three capture alerts include `providerOrderId`,
  the PayPal order id everything below searches on.
- One email can stand for many failures: alerts are throttled to one per event
  per 15 minutes per server instance, and the body says how many more were
  logged but not sent. Believe that number, not your inbox.
- A customer writes "I paid and never got a confirmation", or a payment sits in
  the PayPal account with no matching order in `/admin/orders`.
- A shopper reports `Could not start PayPal checkout.` (nothing began, no money
  at risk) or `Payment not completed (status: …)` (PayPal declined, and the
  shop correctly wrote no order).

## Do this first

**1. Check whether it already repaired itself.** The webhook rebuilds the order
on its own when the buyer's browser dies between paying and our response, so
many of these are resolved before you read them. Wait five minutes from the
alert's `Time:` (deliveries arrive in seconds; a retry takes a few minutes),
then search `/admin/orders` for the buyer's email or the order name — the box
matches only those two, never PayPal ids. Open the order and read its timeline;
any of these lines means it is done:

```text
Order repaired from PayPal webhook (capture completed)
Payment confirmed by PayPal webhook
Payment of $49.99 captured via paypal
```

Good answer: the order is there and its payment badge reads Paid, so skip to
**Afterwards**.

**2. Ask PayPal what happened.** Live: <https://www.paypal.com> → Activity.
Sandbox: <https://www.sandbox.paypal.com>. We put no reference of our own on the
PayPal order, so there is nothing to search — match on amount and the alert's
`Time:`. Open the transaction, copy its transaction id (that is the capture id)
and read its item list; we send the line items, so PayPal shows what was bought.
Good answer: exactly one completed payment for that amount, or none — the two
lead different ways, which is the point of the step.

**3. Ask the database whether an order exists.** Run it from the repo root,
where `.env.local` holds `SUPABASE_DB_PASSWORD`. It only reads.

```bash
cd ~/Developer/goldrose-storefront
PGPASSWORD="$(grep -m1 '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-)" \
psql -h aws-1-us-west-2.pooler.supabase.com -p 5432 \
  -U postgres.cfvsvgbldnzkcjvbwnjp -d postgres -c \
  "select name, financial_status, total_cents, provider_capture_id from orders
   where provider_order_id = 'PASTE_THE_ID';"
```

Good answer: one row (the order exists — read `financial_status`) or `(0 rows)`
(this payment has no order). **4.** Now read the section for your alert.

### paypal.capture.orphaned — highest urgency, and it will not fix itself

Money was captured and the checkout row it should have been built from is gone,
so no order exists and the buyer receives nothing. Waiting will not help: the
webhook's repair path reads that same missing row and gives up. Confirm by
re-running the step 3 command with `select id, status from checkouts where
provider_order_id = 'PASTE_THE_ID';` — `(0 rows)` confirms the orphan, a row
means it can still repair itself, so wait. Then, using the item list from step
2, either **fulfil** or **refund**.

⚠️ **Before leaving the PayPal transaction, copy the buyer's shipping address
out of it.** This is the only moment it is on screen. The draft form
(`/admin/orders/drafts/new`) takes lines, quantities, the buyer's email, a
discount code and a note — there is **no address field anywhere in the admin**,
and `priceDraft` forces `shipping_cents: 0` (`lib/admin/drafts.ts`). So a draft
alone produces an order nobody can post, at a total lower than the amount
PayPal actually took.

**To fulfil:** `/admin/orders/drafts/new` → same variants and quantities, the
buyer's email → paste the shipping address AND the shipping you charged into
the **note** → Save → **Mark as paid**. That decrements stock, writes the
timeline and sends the confirmation, and takes no money, which is right because
PayPal already has it. The draft records as a `mock` payment with no capture id,
so a later refund of it must also be done in PayPal, and its total will not
match the capture — say so in the note.

**To refund** — below — when you cannot tell what they bought.

### paypal.capture.amount-mismatch — nothing is broken, a human must decide

The order **was** recorded, at the price the shop computes now (`pricedCents`),
not the amount PayPal took (`capturedCents`), so the total on screen is not
necessarily the amount charged; usually a price was edited mid-checkout.
Captured more than priced: the buyer overpaid, so open the order → **Refund**,
enter the difference in dollars, leave restock unticked — that calls PayPal for
real. Captured less: ship it and absorb the gap rather than chase a customer for
money, and take the price change to the bosses.

⚠️ Never refund more than `capturedCents`. The box caps you at the order total,
the wrong number in this alert, and PayPal rejects a refund larger than its own
capture.

### paypal.capture.failed — money may or may not have moved

The alert carries `err` (PayPal's status and body when the failure was theirs)
and `providerOrderId`; steps 2 and 3 settle it. No payment in PayPal: nothing
happened, the shopper can retry. Payment plus an order: already repaired.
Payment and no order: run the `checkouts` query above — a row means the webhook
will rebuild it, so wait ten minutes and look again; no row means treat it as
**orphaned**.

⚠️ Do not capture the order again, from PayPal or by asking the buyer to pay
again. A second capture is a second charge, and refunding one is not the same as
never taking it.

### paypal.create.failed — no money at risk, every visitor a lost sale

Nobody can start checkout, and nobody complains; they just leave. Read `err`:
`PayPal auth failed (401)` means credentials wrong or rotated, a
`/v2/checkout/orders failed (4xx)` means PayPal rejected our request. Check
<https://www.paypal-status.com> before assuming it is us, then that Vercel
Production still has `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`,
`NEXT_PUBLIC_PAYPAL_CLIENT_ID` and `PAYPAL_ENV` — the `NEXT_PUBLIC_` one is
baked into the build, so changing it does nothing until the next deploy. To
test, put an item in the bag on the live site and press the PayPal button; a
good answer is PayPal's own window opening. Close it without approving, since
nothing is charged until you approve and the capture then runs.

### paypal.webhook.failed — the safety net itself is failing

PayPal retries and the handler is idempotent, so **one** is survivable; a run of
them means orders are being lost. Count them in the logs, not your inbox. Check
`PAYPAL_WEBHOOK_ID` is set in Vercel Production — without it every delivery is
rejected with 401 and the net is silently off, which is also why nothing would
have repaired itself in step 1. Delivery history and re-send are in the PayPal
Developer Dashboard under Webhooks Events.

## If that did not fix it

Read the raw lines: Vercel dashboard → the project → Logs, search the event
name. Each is one JSON line with the ids in fields, so a search finds every
occurrence, not only the one that was emailed.

**Refunding.** With an order, open it in the admin → Refund, which calls PayPal
and records the refund and timeline in one action. With no order (the orphan
case), refund in PayPal: Activity → the transaction → Refund.

⚠️ A refund cannot be undone, and the processing fee is not always returned.
Refund only the amount you mean to. The shop sends no refund email; PayPal
notifies the buyer but explains nothing, so write to them yourself.

**Tell the bosses in money terms:** "a customer paid US$X on <date>; we have
their money and no order; I have refunded it / built the order by hand and it
ships as normal." They can act on that, not on an event name.

**Do not:** capture the same PayPal order twice by hand; edit an order's payment
status to Paid to silence an alert, which hides a missing payment instead of
finding it; add a rate limiter to `/api/paypal/capture`, the one public write
route deliberately left unlimited, because by the time a request reaches it
PayPal may already hold the money and a refusal strands a payment with no order
(it is idempotent by PayPal order id, and PayPal throttles upstream); set
`CHECKOUT_SKIP_PAYMENT` on the live site as a stopgap, which records real orders
that took no money; or delete an order, since orders are never hard-deleted —
cancel or refund instead.

## Afterwards

- Write what you did into the order's timeline as a comment, with the PayPal
  transaction id and whether you refunded or fulfilled; it is what the next
  person reads, and it outlives the logs.
- State that changes about payments goes in `docs/features/paypal-wallet.md`,
  which owns it — not here, not SUMMARY.md.
- Anything the bosses must decide (refund or fulfil, a price that moved
  mid-checkout) goes in `agent-delivery/INBOX.md` as a new `AI-nnn` row tagged
  `OWNER-DECISION`; `npm run agent-inbox` shows the open ones and the format.
- If the same alert has now fired twice, say so there. One is an incident; two
  is a bug nobody has found yet.
