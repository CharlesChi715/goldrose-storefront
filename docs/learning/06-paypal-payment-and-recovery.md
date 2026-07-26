# Feature Learning 06 — Taking Real Money, and Recovering When It Goes Wrong

Traced end to end per [learning-docs-guideline.md](learning-docs-guideline.md).
[01 — Add to cart → checkout](01-add-to-cart-checkout.md) followed the **mock** payment path, and noted where the real one branches off. This doc takes that branch. It is the only path in the repo where an irreversible thing happens to someone else's bank account, so it is also where the most careful engineering lives.

## Feature Summary

**What it does**
A buyer presses PayPal's own button on `/checkout`. The browser asks our server to open a PayPal order; PayPal collects the card or login in its own window; the browser tells our server it was approved; our server captures the money, re-prices the cart one final time, and writes the order. If any of that breaks after the money moves, a **webhook** arrives minutes later and rebuilds the missing order from what was saved before the payment started.

**Why it exists**
Because a payment is a *distributed transaction across two companies*, and it can fail in the middle. Our database and PayPal's ledger can disagree, and only one of them holds the customer's money. Everything below is a response to that single fact.

Key jargon:
- **Capture** = actually take the money. Before capture, PayPal has only an *authorization* — a promise.
- **Idempotent** = doing it twice has the same effect as doing it once. The central property in payments.
- **Webhook** = PayPal calling *us*, unprompted, to report something that happened. The safety net for when our own request path broke.
- **Fail closed / fail open** = when unsure, refuse / allow.

## Code Trace

```text
 BROWSER                       OUR SERVER                        PAYPAL
 ───────                       ──────────                        ──────
 PayPal SDK button
   │ createOrder()
   └──── POST /api/paypal/create ──▶
                                 priceCart()  ← DB prices
                                 INSERT checkouts row  ← ① memory of the cart
                                   status "open", provider_order_id null
                                 createPayPalOrder() ─────────────▶ open order
                                 UPDATE checkouts.provider_order_id ◀── {id}
   ◀──── { id } ────────────────┘
   │
   │  buyer approves in PayPal's own window (card never touches us)
   │
   │ onApprove({orderID})
   └──── POST /api/paypal/capture ─▶
                                 capturePayPalOrder() ──────────▶ 💰 MONEY MOVES
                                 mapCaptureResponse()           ◀── capture JSON
                                 completed? ─no─▶ 400
                                 find checkouts row by order id  ← ①
                                 priceCart() AGAIN, with PayPal's ship-to country
                                 amount drift? → console.error (cannot undo)
                                 createOrder()  ← idempotent on provider_order_id
   ◀──── { redirectUrl } ───────┘
   clear cart, hard-navigate to /checkout/success

 ── LATER, INDEPENDENTLY ────────────────────────────────────────────────
                                 POST /api/webhooks/paypal  ◀──── PAYMENT.CAPTURE.COMPLETED
                                 verifyWebhookSignature() → 401 if not verified
                                 order exists & paid?     → "duplicate"  (normal)
                                 order exists & pending?  → mark paid    "confirmed"
                                 no order?                → REPAIR from ① "repaired"
```

### Step 1 — Three modes, one funnel

Before any of this, the checkout page picks a mode ([app/checkout/page.tsx:43-47](../../app/checkout/page.tsx#L43-L47)):

| Mode | When | Path |
| --- | --- | --- |
| skip-payment | `CHECKOUT_SKIP_PAYMENT=1` | `/api/checkout`, `method: "none"` |
| PayPal live | PayPal client id present | `/api/paypal/create` → `/capture` |
| mock | otherwise | `/api/checkout`, fake card |

And the mock endpoint refuses to run when PayPal is configured ([api/checkout/route.ts:62-68](../../app/api/checkout/route.ts#L62-L68)):

```ts
if (getPayPalConfig().configured && !skipPayment) {
  return NextResponse.json(
    { ok: false, error: "Mock checkout is disabled — PayPal is configured." }, { status: 400 });
}
```

That mutual exclusion matters more than it looks. A test path that stays reachable in production is how fake orders end up in a real ledger. **Make the modes exclude each other in code, not in a runbook.**

All three converge on one function, [`createOrder()`](../../lib/orders/db.ts#L150) — so stock movements, customer records, timeline events and emails behave identically whether money moved or not. Only `source` and `payment_provider` differ. One funnel means one place to fix anything about how an order comes into existence.

Also note the live-vs-sandbox switch ([client.ts:28](../../lib/paypal/client.ts#L28)):

```ts
const env = process.env.PAYPAL_ENV?.trim() === "live" ? "live" : "sandbox";
```

Anything that isn't the exact string `"live"` — a typo, an empty value, an unset variable — resolves to sandbox. The dangerous mode requires an exact, deliberate spelling. Defaults should always point at the harmless option.

### Step 2 — The card never touches us

There are no card fields in the PayPal branch, and the code says why ([CheckoutClient.tsx:1051-1060](../../app/checkout/CheckoutClient.tsx#L1051-L1060)):

> Deliberately no live card fields outside the mock branch: with PayPal live the card is collected in PayPal's own window, and a PAN typed into a field whose value goes nowhere is a PCI/security hazard.

This is the single biggest security decision in the payment path and it is made by *deleting code*. Card numbers that never reach your server cannot leak from your server, cannot land in your logs, and put you in the lightest PCI-DSS compliance tier. The main "Continue to PayPal" button doesn't even submit — it scrolls to PayPal's own button ([:1100](../../app/checkout/CheckoutClient.tsx#L1100)), because the SDK's button is the only thing permitted to start a payment.

Two smaller front-end details worth stealing:

- **The latest-ref pattern** ([:272-278](../../app/checkout/CheckoutClient.tsx#L272-L278)). PayPal's SDK registers callbacks once, at mount. Those callbacks would capture the cart as it was *at that moment*. Storing the payload builder in a ref that updates on every render means the callback always reads the current cart, country and discount. Any long-lived callback registered with a third-party SDK has this hazard.
- **The bfcache guard** ([:399-405](../../app/checkout/CheckoutClient.tsx#L399-L405)). Browsers restore a page from memory on "back", frozen mid-state — so the "Processing…" flag is cleared on the `pageshow` event. Without it, a buyer who backs out of PayPal finds a permanently spinning button.

### Step 3 — Create: write the memory *before* calling PayPal

[app/api/paypal/create/route.ts](../../app/api/paypal/create/route.ts) prices the cart, then inserts a `checkouts` row ([:52-74](../../app/api/paypal/create/route.ts#L52-L74)) — **before** contacting PayPal — and patches in the PayPal order id afterwards.

The ordering is the whole design. That row is the flow's *memory*: the server-priced cart, the note, the discount code, the email. Everything downstream — the capture route, the webhook repair path — reads it back. If PayPal is contacted first and our write fails, there is a payment in the world that we have no record of ever intending.

The failure mode of doing it this way is benign: if `createPayPalOrder` throws, an orphan row sits with `status: "open"` and `provider_order_id: null`, and shows up in the admin's abandoned-checkout list. **Prefer failure modes that leave a harmless trace over ones that leave nothing.**

One weakness, worth recognising as a pattern: the PayPal idempotency key here is a fresh UUID per request ([:76](../../app/api/paypal/create/route.ts#L76)), so it only dedupes network-level retries of that one `fetch`. A double-click makes two PayPal orders. Harmless — only one can be approved — but it inflates the abandoned list. Compare with capture, next, where the key is derived from the order id and is genuinely stable.

### Step 4 — Capture: the irreversible line

[app/api/paypal/capture/route.ts](../../app/api/paypal/capture/route.ts). The entire trusted input is one string: `{ orderID }`. Everything else is re-derived server-side.

**Line 34 is the point of no return.** Every line after it executes in a world where the customer has been charged.

```ts
const response = await capturePayPalOrder(parsed.orderID);
const mapped = mapCaptureResponse(response);
if (!mapped.completed) { /* 400 */ }
```

`completed` is deliberately strict ([mapping.ts:105](../../lib/paypal/mapping.ts#L105)):

```ts
completed: response.status === "COMPLETED" && capture?.status === "COMPLETED",
```

**Both** the order and the capture must say COMPLETED. PayPal can return a `PENDING` capture — a review hold — and treating that as paid means shipping goods against money that may never arrive. When a payment provider offers you three states, never collapse them into two.

Then the cart is recovered from the `checkouts` row, and re-priced *again*:

```ts
const country = mapped.shipToCountry ?? checkout.cart.country ?? "US";
const priced = await priceCart({ lines: …, country, … });
```

PayPal's ship-to country **overrides** what the buyer picked before checkout, because PayPal is where the address was actually entered. See [08 — Price math](08-price-math-and-trust.md) for what re-pricing means; the point here is that even the totals *we ourselves computed* three minutes ago are not trusted at capture time.

And then the most instructive six lines in the repo:

```ts
if (mapped.amountCents !== null && mapped.amountCents !== priced.total_cents) {
  // Amount drift (e.g. price edited mid-checkout) — keep the record, flag it.
  console.error(`[paypal/capture] amount mismatch: captured ${mapped.amountCents}, priced ${priced.total_cents}`);
}
```

A mismatch is detected and then **deliberately not enforced**. It cannot be: the money is already gone, and refusing to write the order would leave a charged customer with no order at all. So the code records the order and flags the discrepancy.

> **After an irreversible side effect, your only remaining options are record and alert.**
> Validation must happen *before* the irreversible step. Anything discovered afterwards is reconciliation, not enforcement.

The honest criticism: `console.error` is a weak alert. A log line in Vercel that nobody greps is not a reconciliation process. A timeline event on the order, or an admin flag, would make the mismatch visible to the person who can act on it. This is the one place in the payment path where the mechanism is thinner than the thinking behind it.

### Step 5 — Idempotency, four different ways

Payments get retried — by users, by browsers, by PayPal. Every write must survive being replayed. This repo does it four ways, which is a useful tour of the options:

1. **A stable key sent to the provider.** `capture-${orderId}` ([client.ts:169](../../lib/paypal/client.ts#L169)) — identical across retries and process restarts, so PayPal itself refuses to capture twice.
2. **Read-then-write on a natural key** ([db.ts:154-162](../../lib/orders/db.ts#L154-L162)):
   ```ts
   const existing = orders.find((o) => o.provider_order_id === input.provider_order_id);
   if (existing) { return existing; }
   ```
   Works for the common case. **Not** watertight: the read and the insert are not atomic, and nothing enforces uniqueness on `provider_order_id` in the schema, so a webhook arriving concurrently with a slow capture could in principle produce two orders. The robust version is a database unique constraint — the DB is the only component that can make "check and insert" a single indivisible act. Same lesson as the discount counter in [08](08-price-math-and-trust.md).
3. **Naturally idempotent data.** For refunds ([webhook.ts:170-177](../../lib/paypal/webhook.ts#L170-L177)) the handler prefers PayPal's *cumulative* `total_refunded_amount` over adding this event's amount. A cumulative figure applied twice gives the same answer — so out-of-order and duplicate deliveries converge on the truth by themselves. **Where you can choose, prefer "set to X" over "add X".**
4. **A marker in the timeline** — refund events dedupe by scanning `order_events` for the refund id. It works, but it couples correctness to a human-readable message string; edit the wording and in-flight redeliveries double-count.

### Step 6 — The webhook: the actual safety net

Everything so far assumes the browser stayed alive. It might not. The buyer's phone dies between approving and our capture; our own server throws after the money moved. PayPal calls us anyway.

**Authenticating the caller** ([route.ts:21-31](../../app/api/webhooks/paypal/route.ts#L21-L31)):

```ts
const rawBody = await request.text();
let verified = false;
try { verified = await verifyWebhookSignature({ headers: request.headers, rawBody }); }
catch { verified = false; }
if (!verified) { return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); }
```

Three things:

- The body is read **raw, once, before parsing**. Signature verification is over exact bytes; re-serializing JSON can reorder keys or change whitespace and invalidate a perfectly good signature.
- A *thrown* verification becomes `false`, not an exception — **fail closed**. Same in [`verifyWebhookSignature`](../../lib/paypal/client.ts#L208-L229): no `PAYPAL_WEBHOOK_ID` configured means every webhook is rejected. A forgotten env var must never mean "accept everything."
- This endpoint is deliberately *outside* the admin proxy's matcher ([proxy.ts:90-92](../../proxy.ts#L90-L92)). It has no session and needs none — **the signature is its authentication**. See [07](07-who-can-see-what.md).

**Getting the ids right** ([webhook.ts:84](../../lib/paypal/webhook.ts#L84)):

```ts
const providerOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
```

`event.resource.id` is the **capture** id; the **order** id is buried in `supplementary_data`. Reaching for the obvious `resource.id` is the classic PayPal webhook bug — the lookup then matches nothing and every payment "repairs" itself into a duplicate order. Provider payloads reward reading the docs over guessing.

**The three-way decision** ([:92-136](../../lib/paypal/webhook.ts#L92-L136)):

| State | Outcome | Why |
| --- | --- | --- |
| order exists, `paid` | `"duplicate"`, no writes | the normal case — capture route already worked |
| order exists, `pending` | mark paid → `"confirmed"` | we knew about it, PayPal confirms |
| no order at all | rebuild from the `checkouts` row → `"repaired"` | the safety net firing |

And the retry contract ([route.ts:40-47](../../app/api/webhooks/paypal/route.ts#L40-L47)):

```ts
// 500 → PayPal retries the delivery; the handler is idempotent.
return NextResponse.json({ error: "Handler failed" }, { status: 500 });
```

Returning 500 on failure is only safe *because* the handler is idempotent. The two decisions are a pair: **ask to be retried, or make retries safe — never one without the other.**

### Step 7 — Where the net still has holes

Reading a recovery mechanism honestly means asking what it *doesn't* catch. Three gaps, all real:

1. **Partial `createOrder` failure.** `createOrder` performs eight-ish sequential writes with no transaction. If the order row is inserted and then `adjustInventory` or the confirmation email throws, the buyer sees an error — but the webhook later finds an order that is already `paid` and returns `"duplicate"`. Result: an order that exists, with stock never decremented and no email sent, and nothing detects it. **A safety net keyed on "does the record exist" cannot see a half-written record.** The fix is either a real transaction or a completeness flag written last.
2. **A missing `checkouts` row** dead-ends both the capture route and the repair path: money captured, no order, one `console.error`.
3. **Repaired orders are lower fidelity.** The webhook payload carries no address or phone, and it re-prices using the pre-checkout country rather than PayPal's. A repaired order is a real order with thinner data — worth knowing before you trust one.

Also worth naming: **there are no transactions anywhere** in this flow. The local file adapter serializes writes with a mutex, which prevents interleaving but not partial failure. For a store at this volume that is a reasonable trade; it is a trade, and it is the origin of gap #1.

### Step 8 — How this is tested without touching PayPal

There are no PayPal credentials on this machine, so the real path can't be exercised. The suite deals with that by splitting the problem ([09 — The safety net](09-tests-and-ci.md) covers the machinery):

- [tests/unit/paypal-mapping.test.ts](../../tests/unit/paypal-mapping.test.ts) feeds a hand-built capture payload through `mapCaptureResponse` — including a `PENDING` variant asserting `completed === false`, and a near-empty response asserting it returns nulls rather than throwing.
- [tests/unit/paypal-webhook.test.ts](../../tests/unit/paypal-webhook.test.ts) drives the whole state machine against a real (temp-directory) database: repair → replay → partial refund → replayed refund → full refund, asserting `"repaired"`, `"duplicate"`, `"refund_synced"` and the exact `refunded_cents` at each step.

That second file is the pattern worth copying. **Idempotency claims are only real if a test replays the event.** "It's idempotent" is an assertion; sending the same webhook twice and checking `orders.length === 1` is a proof. The parts that genuinely need PayPal — signature verification, the SDK window — are the parts left to manual testing, which is the correct place to draw that line.

## Recap — what a payment integration is actually made of

```text
before the money moves     validate everything; the schema carries no prices
                           write the memory (checkouts row) FIRST
the irreversible step      capture — one line, everything after it is different
after the money moves      re-price, detect drift, RECORD — you cannot refuse
                           strict completion check (COMPLETED && COMPLETED)
when the path breaks       webhook: verify signature → repair from the memory
                           500 to be retried, idempotent so retries are safe
```

Seven ideas that transfer to anything touching an external system that changes the world:

1. **Persist your intent before the irreversible call.** The record written first is what lets you recover afterwards.
2. **Validate before, reconcile after.** Once money moves, enforcement is off the table — detect and record instead.
3. **Idempotency is a design property, not a code comment.** Stable keys, unique constraints, cumulative values; and a test that replays the event.
4. **Fail closed on authentication, and default to the harmless mode.** No webhook id → reject everything. Not exactly `"live"` → sandbox.
5. **Data you never hold cannot leak.** The strongest security decision here was deleting the card fields.
6. **Have a second, independent path to the truth.** The webhook doesn't depend on the browser, the buyer's network, or our own request path surviving.
7. **Know your net's holes.** This one can't see a half-written order — which is worth more as a written-down known gap than as a comfortable assumption.
