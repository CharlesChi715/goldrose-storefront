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

[app/products/[slug]/page.tsx](../../app/products/%5Bslug%5D/page.tsx) is a **server component**: for a URL like `/products/gold-rose`, it loads the whole catalog from the DB ([page.tsx:129](../../app/products/%5Bslug%5D/page.tsx#L129)), finds the product matching the slug, and picks the variant to sell — the first one in stock, else the first one ([page.tsx:138-139](../../app/products/%5Bslug%5D/page.tsx#L138-L139)).

```tsx
// app/products/[slug]/page.tsx:128-139
  try {
    const catalog = await getCatalog();
    handles = catalog.map((entry) => entry.handle);
    catalogProduct = catalog.find((entry) => entry.handle === slug) ?? null;
    promo = await getPromoSlogan();
  } catch {
    catalogProduct = null;
  }
  if (!catalogProduct) notFound();
  const product = catalogProduct;
  const variantId =
    product.variants.find((v) => v.in_stock)?.id ?? product.variants[0]?.id ?? null;
```

It passes only `variantId` and a formatted price label down to `<BuyButtons>` ([page.tsx:456-459](../../app/products/%5Bslug%5D/page.tsx#L456-L459)).

```tsx
// app/products/[slug]/page.tsx:456-459
        <BuyButtons
          variantId={variantId}
          priceLabel={formatMoney(defaultVariant?.price_cents ?? 0)}
        />
```

`revalidate = 300` ([page.tsx:30](../../app/products/%5Bslug%5D/page.tsx#L30)) means the page is cached and re-fetched from the DB at most every 5 minutes — admin price edits reach buyers without a redeploy.

```tsx
// app/products/[slug]/page.tsx:30
export const revalidate = 300;
```

### Step 2 — The click: BuyButtons → cart store → redirect

[components/BuyButtons.tsx](../../components/BuyButtons.tsx) is a **client component**. Both buttons call the same `buy()` ([BuyButtons.tsx:26-32](../../components/BuyButtons.tsx#L26-L32)): `addToCart(variantId, 1)` then `router.push("/checkout")`. If the product had no variant at all, `variantId` is `null` and the buttons are inert.

```tsx
// components/BuyButtons.tsx:26-32
  function buy() {
    if (!variantId) {
      return;
    }
    addToCart(variantId, 1);
    router.push("/checkout");
  }
```

[lib/cart/store.ts](../../lib/cart/store.ts) is the cart. Note what it does **not** store: no prices, no product names — only `{variantId, quantity}` pairs, in `localStorage` under `"goldrose-cart-v2"` ([store.ts:16-19](../../lib/cart/store.ts#L16-L19) and [store.ts:27-29](../../lib/cart/store.ts#L27-L29)).

```ts
// lib/cart/store.ts:16-19, 27-29
export type CartLine = {
  variantId: string;
  quantity: number;
};
// …
const STORAGE_KEY = "goldrose-cart-v2";
const CHANGE_EVENT = "goldrose-cart-change";
const MAX_QUANTITY = 20;
```

`addToCart` ([store.ts:149](../../lib/cart/store.ts#L149)) bumps quantity if the variant is already there, capped at 20.

```ts
// lib/cart/store.ts:149-160
export function addToCart(variantId: string, quantity = 1) {
  mutate((lines) => {
    const existing = lines.find((line) => line.variantId === variantId);
    return existing
      ? lines.map((line) =>
          line.variantId === variantId
            ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) }
            : line,
        )
      : [...lines, { variantId, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }];
  });
}
```

Every write also fires a browser event ([store.ts:117](../../lib/cart/store.ts#L117)) so any open component using the cart re-renders — that's the `useSyncExternalStore` React hook at [store.ts:200](../../lib/cart/store.ts#L200), which is React's standard way to subscribe a component to data living outside React (here, localStorage).

```ts
// lib/cart/store.ts:110-118
function writeLines(next: CartLine[]) {
  if (typeof window === "undefined") {
    return;
  }
  cachedRaw = JSON.stringify(next);
  cachedLines = next;
  window.localStorage.setItem(STORAGE_KEY, cachedRaw);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}
```

```ts
// lib/cart/store.ts:127-134, 199-200
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
// …
export function useCart(catalog: CatalogProduct[]) {
  const lines = useSyncExternalStore(subscribe, readLines, () => EMPTY);
```

### Step 3 — /checkout: server half loads facts, client half runs the UI

The page splits in two:

- **Server half** [app/checkout/page.tsx](../../app/checkout/page.tsx): fetches catalog, shipping zones, and settings from the DB. A dead DB degrades to the empty-cart screen, never a crash ([page.tsx:18-34](../../app/checkout/page.tsx#L18-L34)).

  ```tsx
  // app/checkout/page.tsx:19-34
    // A dead/unwritable DB must degrade to the empty-cart screen, never a 500.
    let catalog: Awaited<ReturnType<typeof getCatalog>> = [];
    let zones: Awaited<ReturnType<typeof getShippingZones>> = [];
    let showDiscountField = true;
    try {
      const [loadedCatalog, loadedZones, settings] = await Promise.all([
        getCatalog(),
        getShippingZones(),
        getSettingsMap(),
      ]);
      catalog = loadedCatalog;
      zones = loadedZones;
      showDiscountField = settings.checkout.discount_field_enabled;
    } catch {
      // fall through with empty catalog
    }
  ```

  It then guesses the ship-to country from Vercel's geo-IP header ([page.tsx:37-39](../../app/checkout/page.tsx#L37-L39)) and decides the payment mode: if PayPal env keys exist it passes a `paypalClientId`, otherwise `null` → **mock mode** ([page.tsx:41-47](../../app/checkout/page.tsx#L41-L47)).

  ```tsx
  // app/checkout/page.tsx:37-47
    const headerStore = await headers();
    const geo = (headerStore.get("x-vercel-ip-country") ?? "").toUpperCase();
    const defaultCountry = countries.some((country) => country.code === geo) ? geo : "US";

    // Testing-phase switch: skip payment entirely, so the PayPal buttons must
    // not mount even when the keys exist (§10.4, lib/checkout/mode.ts).
    const skipPayment = skipPaymentEnabled();
    const paypalClientId =
      !skipPayment && process.env.PAYPAL_CLIENT_ID && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
        ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
        : null;
  ```

- **Client half** [app/checkout/CheckoutClient.tsx](../../app/checkout/CheckoutClient.tsx): `useCart(catalog)` ([CheckoutClient.tsx:360-361](../../app/checkout/CheckoutClient.tsx#L360-L361)) joins the localStorage lines against the DB catalog to produce displayable lines with real prices. Cart lines whose variant no longer exists in the catalog are hidden (and the server would reject them anyway) — that filtering happens back in the cart store.

  ```tsx
  // app/checkout/CheckoutClient.tsx:359-361
    const router = useRouter();
    const { lines, rawLines, subtotal, hydrated, changeQuantity, remove, clear } =
      useCart(catalog);
  ```

  ```ts
  // lib/cart/store.ts:206-220
          .map((line) => {
            for (const product of catalog) {
              const variant = product.variants.find((entry) => entry.id === line.variantId);
              if (variant) {
                return {
                  ...line,
                  product,
                  variant,
                  lineTotal: variant.price_cents * line.quantity,
                };
              }
            }
            return null;
          })
          .filter((line): line is CartLineView => Boolean(line)),
  ```

  Shipping is computed *for display* from the selected country's zone ([CheckoutClient.tsx:407-421](../../app/checkout/CheckoutClient.tsx#L407-L421)) — a "display mirror" of the server rule; the server recomputes it regardless. The summary column carries the quantity +/− and Remove controls — this *is* the cart UI.

  ```tsx
  // app/checkout/CheckoutClient.tsx:407-421
    const zone = useMemo(() => zoneForCountry(zones, country), [zones, country]);
    const discountCents = discount ? Math.min(discount.discountCents, subtotal) : 0;
    const shippingInfo = useMemo(() => {
      if (subtotal === 0 || !zone) {
        return { amount: 0, free: false };
      }
      // Display mirror of the server's rule: threshold on the discounted
      // subtotal; free-shipping codes zero it out. The server re-prices anyway.
      const base = computeShipping(zone, subtotal - discountCents);
      if (discount?.shippingFree) {
        return { amount: 0, free: true };
      }
      return base;
    }, [zone, subtotal, discountCents, discount]);
    const total = subtotal - discountCents + shippingInfo.amount;
  ```

  Discount codes are also never trusted: typing one calls `POST /api/discount`, which validates against the DB and returns the cents off ([CheckoutClient.tsx:424-461](../../app/checkout/CheckoutClient.tsx#L424-L461)).

  ```tsx
  // app/checkout/CheckoutClient.tsx:431-455
      try {
        const response = await fetch("/api/discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            lines: rawLines.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
            })),
            country,
            ...(email.trim() ? { email: email.trim() } : {}),
          }),
        });
        const result = await response.json();
        // …
        setDiscount({
          code: result.code,
          discountCents: result.discountCents,
          shippingFree: result.shippingFree,
        });
  ```

### Step 4 — Pay: POST /api/checkout (mock mode)

Pressing "Pay $…" calls `submitMockCheckout` ([CheckoutClient.tsx:483](../../app/checkout/CheckoutClient.tsx#L483)), which POSTs the payload built by `checkoutPayload()` ([CheckoutClient.tsx:467-480](../../app/checkout/CheckoutClient.tsx#L467-L480)): lines (IDs + quantities), country, optional note/discount code/visitor ID, plus email, address, and card fields. **No prices are sent.**

```tsx
// app/checkout/CheckoutClient.tsx:467-480
  function checkoutPayload(cartLines: CartLine[]) {
    return {
      lines: cartLines.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
      })),
      country,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(discount ? { discountCode: discount.code } : {}),
      ...(typeof window !== "undefined" && getVisitorId()
        ? { visitorId: getVisitorId() }
        : {}),
    };
  }
```

```tsx
// app/checkout/CheckoutClient.tsx:493-510, 523-524
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          ...checkoutPayload(rawLines),
          ...(withForm
            ? {
                email,
                shipping,
                card: {
                  name: card.name,
                  number: card.number,
                  expiry: card.expiry,
                  cvc: card.cvc,
                },
              }
            : {}),
      // …
      clear();
      router.push(result.redirectUrl);
```

[app/api/checkout/route.ts](../../app/api/checkout/route.ts) is the API route. In order:

1. **Refuses to run if PayPal is configured** ([route.ts:62-68](../../app/api/checkout/route.ts#L62-L68)) — mock checkout exists only while there is no real payment provider.

   ```ts
   // app/api/checkout/route.ts:62-68
     const skipPayment = skipPaymentEnabled();
     if (getPayPalConfig().configured && !skipPayment) {
       return NextResponse.json(
         { ok: false, error: "Mock checkout is disabled — PayPal is configured." },
         { status: 400 },
       );
     }
   ```

2. **Validates the request shape** with `zod` ([route.ts:22-57](../../app/api/checkout/route.ts#L22-L57)) — a schema library: wrong types or oversized fields → 400 error before any logic runs.

   ```ts
   // app/api/checkout/route.ts:22-34, 70-75
   const requestSchema = z.object({
     // "none" = the CHECKOUT_SKIP_PAYMENT flow: order placed with no payment step.
     method: z.enum(["card", "paypal", "none"]),
     lines: z
       .array(
         z.object({
           variantId: z.string().min(1).max(120),
           quantity: z.number().int().min(1).max(20),
         }),
       )
       .min(1)
       .max(50),
     country: z.string().trim().length(2),
   // …
     let parsed: z.infer<typeof requestSchema>;
     try {
       parsed = requestSchema.parse(await request.json());
     } catch {
       return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
     }
   ```

3. **Re-prices the cart from the DB**: `priceCart()` (next step). Note the comment — the request carries no prices at all.

   ```ts
   // app/api/checkout/route.ts:86-92
       // Server-side re-pricing: the request carries no prices at all (§8).
       const priced = await priceCart({
         lines: parsed.lines,
         country: parsed.country.toUpperCase(),
         discountCode: parsed.discountCode ?? null,
         email: parsed.email ?? null,
       });
   ```

4. **Card-mode field checks**: email/address present, card *format* valid via [lib/checkout/card.ts](../../lib/checkout/card.ts). The card number is never stored — this is a dev-mode simulation.

   ```ts
   // app/api/checkout/route.ts:95-110
       if (parsed.method === "card") {
         if (!parsed.email) {
           fieldErrors.email = "Enter a valid email address.";
         }
         // …
         if (!parsed.card) {
           fieldErrors.cardNumber = "Enter your card details.";
         } else {
           const card = validateCard(parsed.card);
           Object.assign(fieldErrors, card.fieldErrors);
         }
   ```

   ```ts
   // lib/checkout/card.ts:124-129
     if (digits.length < 13 || digits.length > 19 || !passesLuhn(digits)) {
       fieldErrors.cardNumber = "Enter a valid card number.";
     }
     if (!expiryInFuture(card.expiry)) {
       fieldErrors.cardExpiry = "Enter a valid future expiry date (MM/YY).";
     }
   ```

5. **Inserts a `checkouts` row** with status `"open"` ([route.ts:131-154](../../app/api/checkout/route.ts#L131-L154)) — if the order never completes, this row is what the admin's "abandoned checkouts" list shows.

   ```ts
   // app/api/checkout/route.ts:131-150
       // Log the checkout row (→ abandoned list if it never completes, §7.6).
       const checkoutId = randomUUID();
       await getStore().insert("checkouts", [
         {
           id: checkoutId,
           cart: {
             lines: parsed.lines.map((line) => ({
               variant_id: line.variantId,
               quantity: line.quantity,
             })),
             // …
           },
           email: parsed.email ?? null,
           discount_code: priced.discount_code,
           subtotal_cents: priced.subtotal_cents,
           total_cents: priced.total_cents,
           provider_order_id: null,
           status: "open",
   ```

6. **Calls `createOrder()`** and responds with a `redirectUrl` to the success page.

   ```ts
   // app/api/checkout/route.ts:156-178
       const order = await createOrder({
         priced,
         source: "mock",
         payment_provider: "mock",
         financial_status: "paid",
         email: parsed.email ?? null,
         shipping_address: shippingAddress,
         note: parsed.note ?? null,
         visitor_id: parsed.visitorId ?? null,
         checkout_id: checkoutId,
       });

       const params = new URLSearchParams({
         order: order.name,
         method: parsed.method,
         total: String(order.total_cents),
         mock: "1",
       });
       return NextResponse.json({
         ok: true,
         // …
         redirectUrl: `/checkout/success?${params.toString()}`,
   ```

### Step 5 — Server re-pricing: lib/checkout/pricing.ts

`priceCart()` ([pricing.ts:100](../../lib/checkout/pricing.ts#L100)) is the single pricing authority, shared by mock checkout, PayPal create, and PayPal capture. Everything it needs comes from the store, not the request ([pricing.ts:106-121](../../lib/checkout/pricing.ts#L106-L121)).

```ts
// lib/checkout/pricing.ts:100-121
export async function priceCart(input: {
  lines: CartLineInput[];
  country: string;
  discountCode?: string | null;
  email?: string | null;
}): Promise<PricedCart> {
  const store = getStore();
  const [variants, products, zones, taxRate] = await Promise.all([
    store.all("product_variants"),
    store.all("products"),
    getShippingZones(),
    getTaxRatePercent(),
  ]);
  // …
  const zone = zoneForCountry(zones, input.country);
  if (!zone) {
    throw new Error(`We don't ship to ${input.country}.`);
  }
```

For each line it looks up the variant and product in the DB and **throws** if the variant is unknown or the product is not active ([pricing.ts:123-143](../../lib/checkout/pricing.ts#L123-L143)) — this is where a stale/tampered cart dies. Note that the unit price comes off the DB row (`variant.price_cents`), never off the request.

```ts
// lib/checkout/pricing.ts:123-143
  const lines: PricedLine[] = input.lines.map((line) => {
    const variant = variants.find((row) => row.id === line.variantId);
    const product = variant
      ? products.find((row) => row.id === variant.product_id)
      : undefined;
    if (!variant || !product || product.status !== "active") {
      throw new Error("An item in your cart is no longer available.");
    }
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.floor(line.quantity)));
    return {
      variant_id: variant.id,
      product_id: product.id,
      sku: variant.sku,
      name: product.title,
      option: variant.option_values.join(" / "),
      quantity,
      unit_amount_cents: variant.price_cents,
      line_total_cents: variant.price_cents * quantity,
      charge_tax: product.charge_tax,
    };
  });
```

It then applies, in order: discount code (validated server-side), shipping from the zone matching the ship-to country (threshold applies to the *discounted* subtotal), and tax from settings (0 while testing). Output is a `PricedCart` — the complete money breakdown in integer cents.

```ts
// lib/checkout/pricing.ts:163-172, 184
  // Shipping thresholds apply to the discounted merchandise total.
  const discountedSubtotal = subtotal - discountCents;
  const shippingBase = computeShipping(zone, discountedSubtotal);
  const shippingFree = discountFreeShipping || shippingBase.free;
  const shipping = shippingFree ? 0 : shippingBase.amount;

  const taxable = lines
    .filter((line) => line.charge_tax)
    .reduce((sum, line) => sum + line.line_total_cents, 0);
  const tax = Math.round((Math.max(0, taxable - discountCents) * taxRate) / 100);
  // …
    total_cents: discountedSubtotal + shipping + tax,
```

### Step 6 — Recording the order: lib/orders/db.ts

`createOrder()` ([db.ts:150](../../lib/orders/db.ts#L150)) is **the one path every completed checkout goes through** — mock, PayPal capture, admin "Mark as paid", and the webhook repair flow all converge here. Sequence:

1. **Idempotency**: if an order with this `provider_order_id` already exists, return it ([db.ts:154-162](../../lib/orders/db.ts#L154-L162)). A double-delivered PayPal webhook can never create a duplicate order. (Idempotent = safe to run twice with the same effect as once.)

   ```ts
   // lib/orders/db.ts:154-162
     if (input.provider_order_id) {
       const orders = await store.all("orders");
       const existing = orders.find(
         (order) => order.provider_order_id === input.provider_order_id,
       );
       if (existing) {
         return existing;
       }
     }
   ```

2. **Order number**: `nextOrderNumber()` + the prefix from settings → e.g. `#1001`.
3. **Customer upsert** ([db.ts:57](../../lib/orders/db.ts#L57)): match by lowercased email — update the existing customer or create a new one, and log `customer_events` either way.

   ```ts
   // lib/orders/db.ts:164-166
     const number = await store.nextOrderNumber();
     const name = `${await orderNumberPrefix()}${number}`;
     const customerId = await upsertCustomer(input, name);
   ```

   ```ts
   // lib/orders/db.ts:58-65, 89
     const email = input.email?.trim().toLowerCase();
     if (!email) {
       return null;
     }
     const store = getStore();
     const now = new Date().toISOString();
     const customers = await store.all("customers");
     const existing = customers.find((row) => row.email.toLowerCase() === email);
   // …
       return existing.id;
   ```

4. **Order + lines insert**: `order_lines` copy the name/SKU/price *as of purchase* — a snapshot, so later product edits don't rewrite history.

   ```ts
   // lib/orders/db.ts:206-220
     const lines: OrderLineRow[] = input.priced.lines.map((line) => ({
       id: randomUUID(),
       order_id: order.id,
       variant_id: line.variant_id,
       product_id: line.product_id,
       sku: line.sku,
       name: line.name,
       option: line.option,
       quantity: line.quantity,
       unit_amount_cents: line.unit_amount_cents,
       line_total_cents: line.line_total_cents,
     }));

     await store.insert("orders", [order]);
     await store.insert("order_lines", lines);
   ```

5. **Stock decrement**: `adjustInventory(−quantity, reason: "order")` per line, visible as a movement in admin Inventory ([db.ts:222-233](../../lib/orders/db.ts#L222-L233)).

   ```ts
   // lib/orders/db.ts:222-233
     // Sales auto-decrement stock with a visible movement (§7.3 decision).
     for (const line of lines) {
       if ((input.decrementStock ?? true) && line.variant_id) {
         await store.adjustInventory({
           variantId: line.variant_id,
           delta: -line.quantity,
           reason: "order",
           note: `Order ${order.name}`,
           createdBy: input.actor ?? null,
         });
       }
     }
   ```

6. **Timeline events**: "Order placed", "Payment … captured" → the order's Timeline card in admin.

   ```ts
   // lib/orders/db.ts:236-256
     const events = [
       {
         id: randomUUID(),
         order_id: order.id,
         kind: "system" as const,
         message: `Order placed (${order.source})`,
         created_by: input.actor ?? null,
         created_at: now,
       },
     ];
     if (order.financial_status === "paid") {
       events.push({
         // …
         message: `Payment of $${(order.total_cents / 100).toFixed(2)} captured via ${order.payment_provider}`,
         created_by: null,
         created_at: now,
       });
     }
     await store.insert("order_events", events);
   ```

7. **Close the checkout row** from step 5 above → it drops off the abandoned list.

   ```ts
   // lib/orders/db.ts:258-265
     // Close the abandoned-checkout row (§7.6).
     if (input.checkout_id) {
       await store.update(
         "checkouts",
         { id: input.checkout_id },
         { status: "completed", completed_at: now },
       );
     } else if (input.provider_order_id) {
   ```

8. **Side effects when paid**: bump discount-code usage count, send confirmation emails via [lib/email.ts](../../lib/email.ts).

   ```ts
   // lib/orders/db.ts:273-279
     if (order.financial_status === "paid") {
       if (order.discount_code) {
         await incrementDiscountUsage(order.discount_code);
       }
       await sendOrderPlacedEmails(order, lines);
     }
     return order;
   ```

Note the storage layer: everything goes through `getStore()` ([lib/supabase/store.ts:24](../../lib/supabase/store.ts#L24)), which hides *two* backends behind one interface — hosted Supabase (Postgres) in production, a local `.data` file adapter for dev/e2e. Same order logic runs against both.

```ts
// lib/supabase/store.ts:24-32
export function getStore(): TableStore {
  const holder = globalThis as Record<string, unknown>;
  if (!holder[GLOBAL_KEY]) {
    holder[GLOBAL_KEY] = getSupabaseEnv().hosted
      ? createRemoteStore()
      : createLocalStore();
  }
  return holder[GLOBAL_KEY] as TableStore;
}
```

### Step 7 — Success page

The client clears the cart and navigates to `/checkout/success?order=%231001&total=15900&mock=1`. [app/checkout/success/page.tsx](../../app/checkout/success/page.tsx) treats every URL param as untrusted input — the total is only shown if it parses as a positive number, the method label only if it's a known method ID ([success/page.tsx:36-45](../../app/checkout/success/page.tsx#L36-L45)).

```tsx
// app/checkout/success/page.tsx:36-45
  const params = await searchParams;
  const isMock = params.mock === "1";
  // Unknown/absent method (e.g. the skip-payment flow's "none") stays null so
  // the screen names no method at all rather than a phantom one.
  const methodLabel =
    params.method && isPaymentMethodId(params.method)
      ? getPaymentMethod(params.method).label
      : null;
  const totalCents = Number(params.total);
  const hasTotal = Number.isFinite(totalCents) && totalCents > 0;
```

```tsx
// app/checkout/success/page.tsx:51-56
      <OrderConfirmedScreen
        orderName={params.order ?? ""}
        total={hasTotal ? formatMoney(totalCents) : null}
        method={methodLabel}
        mock={isMock}
      />
```

### The PayPal branch (for contrast)

With PayPal keys configured, the card form disappears and `PayPalSdkButtons` ([CheckoutClient.tsx:259](../../app/checkout/CheckoutClient.tsx#L259)) loads PayPal's JS SDK instead — mounted only when `paypalClientId` came down from the server half ([CheckoutClient.tsx:759-780](../../app/checkout/CheckoutClient.tsx#L759-L780)).

```tsx
// app/checkout/CheckoutClient.tsx:759-780
              {...(paypalClientId
                ? {
                    // …
                    payButtonSlot: (
                      <PayPalSdkButtons
                        clientId={paypalClientId}
                        buildPayload={() => checkoutPayload(rawLines)}
                        onFail={setError}
                      />
                    ),
                  }
                : {
                    onPayPal: () => {
                      if (!isBusy) {
                        submitMockCheckout("paypal", false);
                      }
                    },
                  })}
```

Buttons drive `POST /api/paypal/create` (server re-prices with the *same* `priceCart()` and opens a PayPal order) then `POST /api/paypal/capture` (verifies and captures, then calls the *same* `createOrder()`). Note that `buildPayload` is the very same `checkoutPayload()` from step 4 — still IDs and quantities only, no prices.

```tsx
// app/checkout/CheckoutClient.tsx:292-316
          createOrder: async () => {
            const response = await fetch("/api/paypal/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadRef.current()),
            });
            const data = await response.json();
            // …
            return data.id;
          },
          onApprove: async (data: { orderID: string }) => {
            const response = await fetch("/api/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const result = await response.json();
            // …
            window.localStorage.removeItem("goldrose-cart-v2");
            window.location.assign(result.redirectUrl);
          },
```

A webhook at `/api/webhooks/paypal` repairs missed captures. Mock and real paths differ only in *who moves the money* — pricing and order recording are identical code.

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
