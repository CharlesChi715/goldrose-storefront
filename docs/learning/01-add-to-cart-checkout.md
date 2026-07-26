# Feature Learning 01 — Add to Cart → Checkout → Order

Traced end to end per [learning-docs-guideline.md](learning-docs-guideline.md).
This trace follows the **mock-payment path** (no PayPal keys configured — how local dev runs today). Where the real PayPal path branches off, it is noted.

## Feature Summary

**What it does**
A visitor taps ADD TO CART (or BUY NOW) on a product page. The item goes into a cart stored in the browser, they land on `/checkout`, see the summary with live shipping, and press "Pay". The server re-checks every price from the database, records an order, reduces stock, creates/links the customer, writes timeline events, and sends confirmation emails. The visitor ends on a "Thank you" page.

**Why it exists**
This is the money path of the whole store — the reason the storefront exists. Two design decisions shape everything:

1. **There is no cart page.** The checkout's order-summary column *is* the cart (quantity +/−, remove). One less screen between desire and payment.
2. **The browser is never trusted with prices.** The cart only stores *variant IDs + quantities*. Every price is looked up from the database — once for display, and again on the server when paying. A tampered browser cannot change what a customer pays.

Key jargon used below:
- **Variant** = one buyable version of a product (e.g. a specific color/size). Each has its own ID, SKU, and price. The cart references variants, not products.
- **Server Component vs Client Component** (Next.js): server components run on the server and can query the DB; files starting with `"use client"` run in the browser and handle clicks/state. Data flows server → client as props.
- **`localStorage`** = a small key-value store inside the browser that survives page reloads. The cart lives there, so it persists without any account or server session.

## Code Trace

```text
 USER ACTION                          BROWSER (client)                              SERVER
 ───────────                          ────────────────                              ──────
 visits /products/gold-rose  ───────────────────────────────────────────▶  app/products/[slug]/page.tsx
                                                                           │  getCatalog() ← DB (products, variants, prices)
                                                                           │  picks default in-stock variantId
                                                                           ▼
                                      ◀─── HTML + <BuyButtons variantId price> ────┘
 taps "ADD TO CART" ────────────▶  components/BuyButtons.tsx  buy()
                                      │
                                      ├─▶ lib/cart/store.ts  addToCart(variantId, 1)
                                      │     └─ writes [{variantId, quantity}] to
                                      │        localStorage["goldrose-cart-v2"]
                                      │
                                      └─▶ router.push("/checkout")
                                                                        ┌──────────────────────────────┐
 lands on /checkout  ──────────────────────────────────────────────────▶│ app/checkout/page.tsx (server)│
                                                                        │  getCatalog(), getShippingZones(),
                                                                        │  getSettingsMap(), geo-IP country
                                                                        └──────────────┬───────────────┘
                                      ◀── props: catalog, zones, countries ───────────┘
                                   app/checkout/CheckoutClient.tsx ("use client")
                                      │  useCart(catalog) ← joins localStorage lines
                                      │    with DB catalog → line views + subtotal
                                      │  zoneForCountry() + computeShipping()   (display only)
                                      │
 edits qty / country / note           │  (all local state; totals recompute live)
                                      │
 presses "Pay $…" ──────────────▶  submitMockCheckout("card", true)
                                      │
                                      └── POST /api/checkout {lines, country, card, …NO prices}
                                                                        ┌──────────────────────────────┐
                                                                        │ app/api/checkout/route.ts     │
                                                                        │ 1 refuse if PayPal configured │
                                                                        │ 2 zod-validate request shape  │
                                                                        │ 3 priceCart()  ← DB, re-price │
                                                                        │ 4 validateCard() (format only)│
                                                                        │ 5 insert "checkouts" row      │
                                                                        │ 6 createOrder()               │
                                                                        └──────────────┬───────────────┘
                                                                           lib/orders/db.ts createOrder()
                                                                           │ idempotency check (provider_order_id)
                                                                           │ nextOrderNumber() → "#1001"
                                                                           │ upsertCustomer() + customer_events
                                                                           │ insert orders + order_lines (price snapshot)
                                                                           │ adjustInventory(−qty, reason:"order")
                                                                           │ insert order_events (timeline)
                                                                           │ mark checkouts row "completed"
                                                                           │ incrementDiscountUsage(), send emails
                                                                           ▼
                                      ◀── { ok, redirectUrl: /checkout/success?… } ──┘
                                   clear() cart  →  router.push(redirectUrl)
 sees "Thank you" ─────────────────  app/checkout/success/page.tsx (validates URL params)
```

### Step 1 — Entry point: the product page renders the buttons

[app/products/[slug]/page.tsx](../../app/products/%5Bslug%5D/page.tsx) is a **server component**: for a URL like `/products/gold-rose`, it loads the whole catalog from the DB ([page.tsx:131](../../app/products/%5Bslug%5D/page.tsx#L131)), finds the product matching the slug, and picks the variant to sell — the first one in stock, else the first one ([page.tsx:139-140](../../app/products/%5Bslug%5D/page.tsx#L139-L140)). It passes only `variantId` and a formatted price label down to `<BuyButtons>` ([page.tsx:453-456](../../app/products/%5Bslug%5D/page.tsx#L453-L456)). `revalidate = 300` means the page is cached and re-fetched from the DB at most every 5 minutes — admin price edits reach buyers without a redeploy.

### Step 2 — The click: BuyButtons → cart store → redirect

[components/BuyButtons.tsx](../../components/BuyButtons.tsx) is a **client component**. Both buttons call the same `buy()` ([BuyButtons.tsx:26-32](../../components/BuyButtons.tsx#L26-L32)): `addToCart(variantId, 1)` then `router.push("/checkout")`. If the product had no variant at all, `variantId` is `null` and the buttons are inert.

[lib/cart/store.ts](../../lib/cart/store.ts) is the cart. Note what it does **not** store: no prices, no product names — only `{variantId, quantity}` pairs, in `localStorage` under `"goldrose-cart-v2"` ([store.ts:16-19](../../lib/cart/store.ts#L16-L19)). `addToCart` ([store.ts:108](../../lib/cart/store.ts#L108)) bumps quantity if the variant is already there, capped at 20. Every write also fires a browser event ([store.ts:89](../../lib/cart/store.ts#L89)) so any open component using the cart re-renders — that's the `useSyncExternalStore` React hook at [store.ts:147](../../lib/cart/store.ts#L147), which is React's standard way to subscribe a component to data living outside React (here, localStorage).

### Step 3 — /checkout: server half loads facts, client half runs the UI

The page splits in two:

- **Server half** [app/checkout/page.tsx](../../app/checkout/page.tsx): fetches catalog, shipping zones, and settings from the DB, guesses the ship-to country from Vercel's geo-IP header ([page.tsx:36-38](../../app/checkout/page.tsx#L36-L38)), and decides the payment mode: if PayPal env keys exist it passes a `paypalClientId`, otherwise `null` → **mock mode** ([page.tsx:40-43](../../app/checkout/page.tsx#L40-L43)). A dead DB degrades to the empty-cart screen, never a crash ([page.tsx:18-33](../../app/checkout/page.tsx#L18-L33)).

- **Client half** [app/checkout/CheckoutClient.tsx](../../app/checkout/CheckoutClient.tsx): `useCart(catalog)` ([CheckoutClient.tsx:184](../../app/checkout/CheckoutClient.tsx#L184)) joins the localStorage lines against the DB catalog to produce displayable lines with real prices. Cart lines whose variant no longer exists in the catalog are hidden (and the server would reject them anyway). Shipping is computed *for display* from the selected country's zone ([CheckoutClient.tsx:220-234](../../app/checkout/CheckoutClient.tsx#L220-L234)) — a "display mirror" of the server rule; the server recomputes it regardless. The summary column carries the quantity +/− and Remove controls — this *is* the cart UI.

  Discount codes are also never trusted: typing one calls `POST /api/discount`, which validates against the DB and returns the cents off ([CheckoutClient.tsx:237-274](../../app/checkout/CheckoutClient.tsx#L237-L274)).

### Step 4 — Pay: POST /api/checkout (mock mode)

Pressing "Pay $…" calls `submitMockCheckout` ([CheckoutClient.tsx:296](../../app/checkout/CheckoutClient.tsx#L296)), which POSTs the payload built by `checkoutPayload()` ([CheckoutClient.tsx:280-293](../../app/checkout/CheckoutClient.tsx#L280-L293)): lines (IDs + quantities), country, optional note/discount code/visitor ID, plus email, address, and card fields. **No prices are sent.**

[app/api/checkout/route.ts](../../app/api/checkout/route.ts) is the API route. In order:

1. **Refuses to run if PayPal is configured** ([route.ts:59-64](../../app/api/checkout/route.ts#L59-L64)) — mock checkout exists only while there is no real payment provider.
2. **Validates the request shape** with `zod` ([route.ts:21-55](../../app/api/checkout/route.ts#L21-L55)) — a schema library: wrong types or oversized fields → 400 error before any logic runs.
3. **Re-prices the cart from the DB**: `priceCart()` (next step).
4. **Card-mode field checks**: email/address present, card *format* valid via [lib/checkout/card.ts](../../lib/checkout/card.ts). The card number is never stored — this is a dev-mode simulation.
5. **Inserts a `checkouts` row** with status `"open"` ([route.ts:120-142](../../app/api/checkout/route.ts#L120-L142)) — if the order never completes, this row is what the admin's "abandoned checkouts" list shows.
6. **Calls `createOrder()`** and responds with a `redirectUrl` to the success page.

### Step 5 — Server re-pricing: lib/checkout/pricing.ts

`priceCart()` ([pricing.ts:78](../../lib/checkout/pricing.ts#L78)) is the single pricing authority, shared by mock checkout, PayPal create, and PayPal capture. For each line it looks up the variant and product in the DB and **throws** if the variant is unknown or the product is not active ([pricing.ts:101-121](../../lib/checkout/pricing.ts#L101-L121)) — this is where a stale/tampered cart dies. It then applies, in order: discount code (validated server-side), shipping from the zone matching the ship-to country (threshold applies to the *discounted* subtotal), and tax from settings (0 while testing). Output is a `PricedCart` — the complete money breakdown in integer cents.

### Step 6 — Recording the order: lib/orders/db.ts

`createOrder()` ([db.ts:125](../../lib/orders/db.ts#L125)) is **the one path every completed checkout goes through** — mock, PayPal capture, admin "Mark as paid", and the webhook repair flow all converge here. Sequence:

1. **Idempotency**: if an order with this `provider_order_id` already exists, return it ([db.ts:129-137](../../lib/orders/db.ts#L129-L137)). A double-delivered PayPal webhook can never create a duplicate order. (Idempotent = safe to run twice with the same effect as once.)
2. **Order number**: `nextOrderNumber()` + the prefix from settings → e.g. `#1001`.
3. **Customer upsert** ([db.ts:47](../../lib/orders/db.ts#L47)): match by lowercased email — update the existing customer or create a new one, and log `customer_events` either way.
4. **Order + lines insert**: `order_lines` copy the name/SKU/price *as of purchase* — a snapshot, so later product edits don't rewrite history.
5. **Stock decrement**: `adjustInventory(−quantity, reason: "order")` per line, visible as a movement in admin Inventory ([db.ts:197-207](../../lib/orders/db.ts#L197-L207)).
6. **Timeline events**: "Order placed", "Payment … captured" → the order's Timeline card in admin.
7. **Close the checkout row** from step 5 above → it drops off the abandoned list.
8. **Side effects when paid**: bump discount-code usage count, send confirmation emails via [lib/email.ts](../../lib/email.ts).

Note the storage layer: everything goes through `getStore()` ([lib/supabase/store.ts](../../lib/supabase/store.ts)), which hides *two* backends behind one interface — hosted Supabase (Postgres) in production, a local `.data` file adapter for dev/e2e. Same order logic runs against both.

### Step 7 — Success page

The client clears the cart and navigates to `/checkout/success?order=%231001&total=15900&mock=1`. [app/checkout/success/page.tsx](../../app/checkout/success/page.tsx) treats every URL param as untrusted input — the total is only shown if it parses as a positive number, the method label only if it's a known method ID.

### The PayPal branch (for contrast)

With PayPal keys configured, the card form disappears and `PayPalSdkButtons` ([CheckoutClient.tsx:85](../../app/checkout/CheckoutClient.tsx#L85)) loads PayPal's JS SDK instead. Buttons drive `POST /api/paypal/create` (server re-prices with the *same* `priceCart()` and opens a PayPal order) then `POST /api/paypal/capture` (verifies and captures, then calls the *same* `createOrder()`). A webhook at `/api/webhooks/paypal` repairs missed captures. Mock and real paths differ only in *who moves the money* — pricing and order recording are identical code.

## Tests covering this path

[tests/e2e/checkout.spec.ts](../../tests/e2e/checkout.spec.ts) (Playwright, runs against a production build on the file adapter):

- `mock checkout: cart → pay → success → order recorded with note + movement` — the full happy path of this trace.
- `non-US address gets its zone's shipping rate (Rest of world)` — step 3's zone pricing.
- `tampered client prices are ignored — the server prices from the DB` — the core security property of steps 4–5.
- `an admin price edit changes the checkout total` — proves prices come from the DB, not the page.

Unit tests: [tests/unit/abandoned.test.ts](../../tests/unit/abandoned.test.ts) (checkouts-row lifecycle), [tests/unit/paypal-webhook.test.ts](../../tests/unit/paypal-webhook.test.ts) (the repair flow that also ends in `createOrder()`).

## Ideas worth stealing from this feature

- **One authority per concern**: one pricing function, one order-creation function — every path funnels through them, so a fix lands everywhere at once.
- **Client displays, server decides**: the client recomputes totals only so the UI feels live; the server's numbers are the only ones that count.
- **Degrade, don't crash**: DB down → product page still renders the design, checkout shows the empty-cart screen.
