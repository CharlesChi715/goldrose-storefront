# Feature Learning 08 — Price Math, and Who Is Allowed to Do It

Traced end to end per [README.md](README.md).
[01 — Add to cart → checkout](01-add-to-cart-checkout.md) followed the *route* a purchase takes. This doc stops at one station on that route and opens it up: **the arithmetic**. How a price is stored, in what unit, in what order the discount / shipping / tax are applied, where rounding happens, and — the part that actually matters commercially — which computer is permitted to decide what the customer pays.

## Feature Summary

**What it does**
Turns `[{variantId, quantity}]` plus a country and an optional discount code into an exact amount of money, on the server, from database prices. The result is one object, [`PricedCart`](../../lib/checkout/pricing.ts#L33-L45), and every path that charges anyone — mock checkout, PayPal create, PayPal capture, the discount preview — produces it by calling the same function, [`priceCart()`](../../lib/checkout/pricing.ts#L100).

**Why it exists**

1. **The browser cannot be trusted with money.** Anything the browser sends can be edited by whoever owns the browser. So the request carries *no prices at all* — not the unit price, not the subtotal, not the total. Just IDs and quantities. There is nothing to tamper with.
2. **One formula, one place.** Four entry points, one pricer. The moment two code paths each compute a total, they eventually disagree, and the disagreement is discovered by a customer.

Key jargon:
- **Integer cents** — money is stored as a whole number of cents (`4999`), never as `49.99`. See Step 1 for why.
- **Trust boundary** — the line between code you control (your server) and code you don't (the customer's browser). Data crossing inward must be re-checked.
- **Idempotent / authoritative** — here, "the server's number wins, always."

## Code Trace

```text
 BROWSER (untrusted)                              SERVER (authoritative)
 ───────────────────                              ──────────────────────
 localStorage["goldrose-cart-v2"]
   [{variantId, quantity}]        ← no prices ever stored
        │
        ▼
 useCart(catalog)  lib/cart/store.ts
   joins lines × DB catalog prop
   subtotal = Σ price_cents × qty        ← display only, a *mirror*
        │
        │  POST { lines:[{variantId,quantity}], country,
        │         discountCode?, note? }        ← still no prices
        ▼
   ╔══════════════ TRUST BOUNDARY ══════════════╗
                                    zod schema: no price field exists
                                             │
                                             ▼
                          lib/checkout/pricing.ts  priceCart()
                            │
                       ┌────┴─────────────────────────────────┐
                       │ 0  load variants, products, zones,   │ ← DB
                       │    tax rate  (in parallel)           │
                       │ 1  guards: empty cart? zone exists?  │
                       │ 2  per line: unit = variant.price_cents
                       │              qty  = clamp 1..20      │
                       │              line = unit × qty       │
                       │ 3  subtotal   = Σ line_total_cents   │
                       │ 4  discount   = applyDiscountCode()  │ ← on SUBTOTAL
                       │ 5  shipping   = computeShipping(     │
                       │                   zone,              │
                       │                   subtotal−discount) │ ← on DISCOUNTED
                       │ 6  tax        = round(               │
                       │                  (taxable−discount)  │
                       │                   × rate / 100)      │ ← merch only
                       │ 7  total = (subtotal−discount)       │
                       │           + shipping + tax           │
                       └────┬─────────────────────────────────┘
                            ▼
                         PricedCart ──▶ orders row / PayPal breakdown
```

### Step 1 — The unit: integer cents, everywhere

Every money column in [0001_init.sql](../../supabase/migrations/0001_init.sql) is a plain `int` named `*_cents`: `price_cents`, `subtotal_cents`, `discount_cents`, `shipping_cents`, `tax_cents`, `total_cents`, `refunded_cents`. No `numeric`, no `float`, no decimal library.

```sql
-- supabase/migrations/0001_init.sql:158-168  (the orders table)
  subtotal_cents int not null default 0,
  discount_code text,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  shipping_free boolean not null default false,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  currency text not null default 'USD',
  financial_status text not null default 'pending'
    check (financial_status in ('pending', 'paid', 'partially_refunded', 'refunded')),
  refunded_cents int not null default 0,
```

The price a variant is sold at is the same shape — one `int`:

```sql
-- supabase/migrations/0001_init.sql:61-64
  price_cents int not null default 0,
  compare_at_price_cents int,
  -- "Cost per item" — PRIVATE: must never appear in catalog_products (§7.2).
  cost_cents int,
```

**Why not just store 49.99?** Because binary floating point cannot represent most decimal fractions exactly. In any JavaScript console:

```js
0.1 + 0.2          // 0.30000000000000004
19.99 * 100        // 1998.9999999999998
```

Add a few hundred of those together and a nightly payout report is off by a cent, which is the kind of bug that costs a day to find and destroys trust in every other number on the page. Integers below 2^53 are exact in JavaScript, so `4999 * 3` is *exactly* `14997`, forever. This is not a project quirk — Stripe, PayPal and Shopify all take amounts in the smallest currency unit for the same reason.

The rule that follows: **convert to a decimal only at the very edges** — the pixel and the wire.

Out to the screen, one function, [lib/money.ts](../../lib/money.ts#L13-L20):

```ts
// lib/money.ts:13-20
export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
```

In from an admin form, always `Math.round(dollars * 100)` — e.g. [ProductForm.tsx](../../app/admin/%28dashboard%29/products/ProductForm.tsx#L98-L105). That `Math.round` is what turns the `1998.9999999999998` above back into `1999`. Every admin input in the repo does this correctly.

```ts
// app/admin/(dashboard)/products/ProductForm.tsx:98-105
function toCents(dollars: string): number | null {
  const trimmed = dollars.trim();
  if (!trimmed) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}
```

⚠️ Worth knowing: the display conversion is *not* actually centralised. A dozen files re-implement it as `` `$${(cents / 100).toFixed(2)}` `` — CSV exports, emails, PayPal, timeline strings. Harmless today because the inputs are integers, but it means a future currency change is a dozen-file edit rather than one.

### Step 2 — The cart holds no prices

[lib/cart/store.ts](../../lib/cart/store.ts) persists exactly this to `localStorage`:

```ts
// lib/cart/store.ts:16-19
export type CartLine = {
  variantId: string;
  quantity: number;
};
```

Prices are joined in at render time from the catalog that a *server* component fetched and passed down as a prop. So `useCart()` can show a subtotal ([:224](../../lib/cart/store.ts#L224)) without any price ever having been writable by the browser.

```ts
// lib/cart/store.ts:205-224
      lines
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
    [lines, catalog],
  );

  const subtotal = lineViews.reduce((sum, line) => sum + line.lineTotal, 0);
```

It also re-clamps quantity on every read, not just on write ([:64-67](../../lib/cart/store.ts#L64-L67)):

```ts
// lib/cart/store.ts:64-67
  const clean = parsed.filter(isCartLine).map((line) => ({
    variantId: line.variantId,
    quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.floor(line.quantity))),
  }));
```

`localStorage` is a text file the user can edit. Validating on the way *out* of storage, not only on the way in, is the habit worth stealing: **treat your own persisted data as untrusted input**, because a previous version of your code (or the user) may have written it.

### Step 3 — Shipping: zone lookup, flat rate

[lib/checkout/zones.ts](../../lib/checkout/zones.ts#L26-L32) is 48 lines of pure function — no I/O, so both server and browser can run it and get identical answers.

```ts
// lib/checkout/zones.ts:26-32
export function zoneForCountry(zones: ShippingZone[], country: string): ShippingZone | null {
  return (
    zones.find((zone) => zone.countries.includes(country)) ??
    zones.find((zone) => zone.countries.includes("*")) ??
    null
  );
}
```

Exact country match, else the `"*"` catch-all zone, else `null` → *"We don't ship to XX."* Today: `US` = $5.95 free over $75; `*` = $19.95, no free threshold ([seed-data.ts](../../lib/supabase/seed-data.ts#L302-L318)).

```ts
// lib/supabase/seed-data.ts:302-318
  shipping_zones: [
    {
      id: "zone-us",
      name: "United States",
      countries: ["US"],
      rate_cents: 595,
      free_over_cents: 7500,
    },
    {
      id: "zone-row",
      name: "Rest of world",
      countries: ["*"],
      rate_cents: 1995,
      free_over_cents: null,
      placeholder: true,
    },
  ],
```

The rate itself is two lines:

```ts
// lib/checkout/zones.ts:42-48
export function computeShipping(
  zone: ShippingZone,
  subtotalCents: number,
): { amount: number; free: boolean } {
  const free = zone.free_over_cents !== null && subtotalCents >= zone.free_over_cents;
  return { amount: free ? 0 : zone.rate_cents, free };
}
```

Note `>=` — spend exactly $75.00 and shipping is free. Off-by-one decisions like this are worth being deliberate about; the inclusive form is what customers expect from "free over $75".

Naming trap: `lib/checkout/methods.ts` is **payment** methods (PayPal / card), not shipping methods. And the Standard/Express/Next-Day picker on the checkout screen is *cosmetic* — a documented owner decision at [CheckoutClient.tsx:383-391](../../app/checkout/CheckoutClient.tsx#L383-L391). Every method ships at the zone rate. Knowing which controls are real is half of reading this repo.

```tsx
// app/checkout/CheckoutClient.tsx:383-391
  /**
   * B-2's Standard / Express / Next-Day picker (755:101). Per-method shipping
   * pricing has no backend yet — every method ships at the zone rate — so on
   * the owner's explicit decision the control is cosmetic: this state moves its
   * selected ring and nothing else. It never reaches a price, a total or a
   * request body; the summary's shipping line and the total keep coming from
   * `shippingInfo`/`total` below, and the rows show no per-method price.
   */
  const [shipMethod, setShipMethod] = useState(0);
```

### Step 4 — Discounts: one code, checked in a fixed order

[`applyDiscountCode()`](../../lib/checkout/discounts.ts#L76-L144) validates in sequence, throwing a typed `DiscountError` with a `reason` on the first failure: unknown code → not yet started → expired → usage limit reached → below minimum spend → already used by this customer. Typed reasons rather than bare strings mean the UI can phrase each case itself instead of pattern-matching on English.

```ts
// lib/checkout/discounts.ts:88-110
  if (!discount) {
    throw new DiscountError("unknown", "Enter a valid discount code.");
  }

  const now = new Date();
  if (new Date(discount.starts_at) > now) {
    throw new DiscountError("not_started", "This code isn't active yet.");
  }
  if (discount.ends_at && new Date(discount.ends_at) < now) {
    throw new DiscountError("expired", "This code has expired.");
  }
  if (discount.usage_limit !== null && discount.used_count >= discount.usage_limit) {
    throw new DiscountError("usage_limit", "This code has been fully redeemed.");
  }
  // … min_purchase_cents check, then the once_per_customer check
```

Then the math ([:127-141](../../lib/checkout/discounts.ts#L127-L141)):

```ts
// lib/checkout/discounts.ts:127-141
  // Eligible amount: whole order, or only the listed products.
  const productIds = discount.applies_to?.product_ids ?? null;
  const eligible = input.lines
    .filter((line) => !productIds || productIds.includes(line.product_id))
    .reduce((sum, line) => sum + line.line_total_cents, 0);

  let discountCents = 0;
  let freeShipping = false;
  if (discount.type === "percentage") {
    discountCents = Math.round((eligible * Math.min(100, Math.max(0, discount.value))) / 100);
  } else if (discount.type === "fixed_amount") {
    discountCents = Math.min(discount.value, eligible);
  } else {
    freeShipping = true;
  }
```

`discounts.value` is deliberately overloaded — whole percent for `percentage`, cents for `fixed_amount`, unused for `free_shipping`. One column, three meanings, documented in [types.ts:221](../../lib/supabase/types.ts#L221). Compact, but it is exactly the kind of column that needs its comment.

```ts
// lib/supabase/types.ts:217-222
export type DiscountRow = {
  id: string;
  code: string;
  type: DiscountType;
  /** percent (0-100) for "percentage", cents for "fixed_amount", unused for "free_shipping". */
  value: number;
```

The percentage branch is the **only rounding in the discount path**: `4999 × 10 / 100 = 499.9 → 500`. `Math.round` is half-up, so a half-cent goes to the customer. Rounding *toward* the customer on a discount is the conventional choice — the alternative generates "you promised 10% and gave me 9.98%" support tickets.

**Stacking is impossible by construction**, not by a rule. One code string in, one code column on the order. You cannot forget to enforce a constraint that the data model cannot express.

Two real weaknesses, both worth recognising as *patterns* rather than as this project's mistakes:

- [`incrementDiscountUsage()`](../../lib/checkout/discounts.ts#L153-L164) reads `used_count`, adds one, writes it back. Two checkouts landing at the same instant both read `0` and both write `1`. A single-use code can be used twice. The database-side fix is `update … set used_count = used_count + 1`, which is atomic because Postgres performs the read and the write inside one statement. This is the classic **read-modify-write race**, and it appears in every codebase that has counters.

  ```ts
  // lib/checkout/discounts.ts:155-163
    const discounts = await store.all("discounts");
    const discount = discounts.find((row) => row.code.toLowerCase() === code.toLowerCase());
    if (discount) {
      await store.update(
        "discounts",
        { id: discount.id },
        { used_count: discount.used_count + 1 },
      );
    }
  ```

- The `once_per_customer` check is skipped entirely when no email is supplied ([:111-125](../../lib/checkout/discounts.ts#L111-L125)), and email is optional on express payment paths. A guard with an escape hatch is not a guard.

  ```ts
  // lib/checkout/discounts.ts:111-118
    if (discount.once_per_customer && input.email) {
      const orders = await store.all("orders");
      const used = orders.some(
        (order) =>
          order.email?.toLowerCase() === input.email!.toLowerCase() &&
          order.discount_code?.toLowerCase() === discount.code.toLowerCase() &&
          !order.cancelled_at,
      );
  ```

### Step 5 — Order of operations, and why it is the way it is

[pricing.ts:145-185](../../lib/checkout/pricing.ts#L145-L185):

```text
subtotal            = Σ (unit_price × quantity)
discount            = f(subtotal, code)              ← on the pre-discount subtotal
discountedSubtotal  = subtotal − discount
shipping            = zone rate, free if discountedSubtotal ≥ threshold
tax                 = round((taxable − discount) × rate / 100)   ← merchandise only
total               = discountedSubtotal + shipping + tax
```

And that same sequence in the file itself:

```ts
// lib/checkout/pricing.ts:145-172
  const subtotal = lines.reduce((sum, line) => sum + line.line_total_cents, 0);

  // Discount code (§7.8) — validated server-side, never trusted from the client.
  let discountCents = 0;
  // … applyDiscountCode() runs here when input.discountCode is non-empty
    discountCents = Math.min(applied.discount_cents, subtotal);

  // Shipping thresholds apply to the discounted merchandise total.
  const discountedSubtotal = subtotal - discountCents;
  const shippingBase = computeShipping(zone, discountedSubtotal);
  const shippingFree = discountFreeShipping || shippingBase.free;
  const shipping = shippingFree ? 0 : shippingBase.amount;

  const taxable = lines
    .filter((line) => line.charge_tax)
    .reduce((sum, line) => sum + line.line_total_cents, 0);
  const tax = Math.round((Math.max(0, taxable - discountCents) * taxRate) / 100);
```

and the total is assembled once, on the way out:

```ts
// lib/checkout/pricing.ts:178-185
    subtotal_cents: subtotal,
    discount_code: discountCode,
    discount_cents: discountCents,
    shipping_cents: shipping,
    shipping_free: shippingFree,
    tax_cents: tax,
    total_cents: discountedSubtotal + shipping + tax,
    currency: "USD",
```

The per-line arithmetic feeding that subtotal is where the quantity clamp and the DB unit price meet:

```ts
// lib/checkout/pricing.ts:131-141
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
```

Three consequences that are policy decisions, not accidents:

1. **The free-shipping threshold is tested against the *discounted* subtotal.** A 10% code on a $70 cart drops you under $75 and re-adds $5.95 shipping. The comment at [:163](../../lib/checkout/pricing.ts#L163) states it, and the e2e suite asserts it ([admin-discounts.spec.ts:91](../../tests/e2e/admin-discounts.spec.ts#L91)) — that is the right way to pin a policy: a comment says what, a test says it stays.
2. **Tax is on merchandise only**, never on shipping, and only on lines whose product has `charge_tax`.
3. **Tax is the single place a float enters the pipeline.** `rate_percent` is a decimal like `8.5`, so `taxable * 8.5 / 100` is genuine float arithmetic — contained by the `Math.round` at the end. The seeded rate is `0`, so today this branch is dormant. There is no tax provider, no jurisdiction logic, no VAT: one flat store-wide rate. Fine for a USD-only V1; the thing to know is that it is a stub, not a tax engine.

### Step 6 — The trust boundary, and how it is enforced

Three server routes can price a cart. All three call `priceCart()`, and all three validate the request with a zod schema **in which no price field exists**:

| Route                                                                          | Purpose                        |
| ------------------------------------------------------------------------------ | ------------------------------ |
| [app/api/checkout/route.ts](../../app/api/checkout/route.ts#L86-L92)           | mock / card checkout           |
| [app/api/paypal/create/route.ts](../../app/api/paypal/create/route.ts#L45-L50) | open a PayPal order            |
| [app/api/discount/route.ts](../../app/api/discount/route.ts#L38-L43)           | preview a code (advisory only) |

Here is the whole accepted shape of a checkout request — read the `lines` array and notice what is *not* in it:

```ts
// app/api/checkout/route.ts:22-38
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
  email: z.string().trim().email().max(254).optional(),
  note: z.string().trim().max(1000).optional(),
  discountCode: z.string().trim().max(64).optional(),
  visitorId: z.string().trim().max(64).optional(),
```

zod strips unknown keys by default, so an injected `price_cents` is discarded before it reaches a single line of business logic. The defence isn't a check that could be forgotten — it's the *absence of a field*, which nobody can forget.

Each route then hands those IDs straight to the pricer — the same four arguments every time:

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

And it is tested. [tests/e2e/checkout.spec.ts:130-153](../../tests/e2e/checkout.spec.ts#L130-L153) posts deliberate poison:

```ts
// tests/e2e/checkout.spec.ts:136-152
      lines: [
        {
          variantId: SIGNATURE_VARIANT,
          quantity: 1,
          // Injected garbage a tamperer might try — the schema knows no prices.
          price_cents: 1,
          unit_amount: 0.01,
        },
      ],
      country: "US",
      total: 1,
      subtotal: 1,
    },
  });
  expect(response.ok()).toBe(true);
  const result = await response.json();
  expect(result.order.total).toBe(5594); // DB price, not the tampered one
```

**Write the attack as a test.** A comment saying "we don't trust client prices" decays; a test that pays $0.01 and demands $55.94 does not.

The strongest link is PayPal capture ([capture/route.ts:50-68](../../app/api/paypal/capture/route.ts#L50-L68)): it does not even trust the totals it stored minutes earlier at create time. It re-prices from the persisted cart, and it re-resolves the country from the address PayPal actually returned:

```ts
// app/api/paypal/capture/route.ts:50-61
    // §10.3: verify the ship-to country is in a served zone; PayPal's
    // shipping address wins over the pre-checkout selection when it differs.
    const country = mapped.shipToCountry ?? checkout.cart.country ?? "US";
    const priced = await priceCart({
      lines: checkout.cart.lines.map((line) => ({
        variantId: line.variant_id,
        quantity: line.quantity,
      })),
      country,
      discountCode: checkout.discount_code,
      email: mapped.email ?? checkout.email,
    });
```

If the recomputed total disagrees with what was captured, it logs and keeps going — money has already moved, so refusing is not on the menu:

```ts
// app/api/paypal/capture/route.ts:63-68
    if (mapped.amountCents !== null && mapped.amountCents !== priced.total_cents) {
      // Amount drift (e.g. price edited mid-checkout) — keep the record, flag it.
      console.error(
        `[paypal/capture] amount mismatch: captured ${mapped.amountCents}, priced ${priced.total_cents}`,
      );
    }
```

That is the honest handling of a real distributed-systems problem: after an external side effect, you can detect divergence but not undo it. Detect, record, alert — never pretend.

### Step 7 — The mirror in the browser, and where it lies

The checkout page recomputes the same numbers client-side so the total updates instantly as you change quantity or country ([CheckoutClient.tsx:407-421](../../app/checkout/CheckoutClient.tsx#L407-L421)). Duplicated logic is accepted here on purpose: the alternative is a network round trip on every keystroke. The safety net is that this copy is *display only* — the server re-prices regardless.

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

But a mirror that drifts still shows the customer a wrong number. Look at that last line on its own — there is no tax term in it:

```tsx
// app/checkout/CheckoutClient.tsx:421
  const total = subtotal - discountCents + shippingInfo.amount;
```

The server total is `discountedSubtotal + shipping + tax`. The client's is the same **only while the tax rate is 0**. Set a non-zero rate in admin and the button reads `Pay $54.94 Securely` while PayPal charges more. Related: the applied discount is not re-validated when quantity or country changes — only the APPLY button refetches — so a stale discount can sit on screen until pay time.

Neither can overcharge anyone (the server is authoritative), but both are *disclosure* bugs, and price-versus-charge mismatches are a consumer-protection issue as much as an engineering one. The general lesson:

> Duplicating a calculation for responsiveness is legitimate. Duplicating it **without a test that pins the copy to the original** is how the copy rots.

A single unit test asserting `clientTotal(x) === priceCart(x).total_cents` over a handful of carts would have caught the missing tax term. Today **no unit test exercises `priceCart`, `applyDiscountCode`, `computeShipping` or `formatMoney` at all** — the coverage is entirely e2e. That is the biggest gap in this area, and it is cheap to close: these are pure functions with no I/O apart from a settings read.

### Step 8 — Two side paths that quietly disagree

- **Draft orders** ([lib/admin/drafts.ts:30-36](../../lib/admin/drafts.ts#L30-L36)) call `priceCart` then hand-rebuild the total, dropping shipping and hard-coding `country: "US"`. A second formula has already appeared.

  ```ts
  // lib/admin/drafts.ts:30-36
    const priced = await priceCart({ lines, country: "US", discountCode, email });
    return {
      ...priced,
      shipping_cents: 0,
      shipping_free: false,
      total_cents: priced.subtotal_cents - priced.discount_cents + priced.tax_cents,
    };
  ```

  Put that last line next to the one every paying path uses and the divergence is a single missing term — `+ shipping`:

  ```ts
  // lib/checkout/pricing.ts:184
      total_cents: discountedSubtotal + shipping + tax,
  ```

- **`/bag`** is pure Figma placeholder ([BagScreen.tsx](../../components/screens/BagScreen.tsx)) — it imports neither the cart nor `formatMoney`, and displays a hard-coded `$159.00` whatever is in your cart. Documented as such at the top of [app/bag/page.tsx](../../app/bag/page.tsx#L4-L7). The real bag lives in the checkout page's summary column.

  Its whole import list — no cart, no money helper, nothing that could produce a real number:

  ```tsx
  // components/screens/BagScreen.tsx:14-17
  import { Fragment } from "react";
  import Link from "next/link";
  import { abs } from "@/lib/figma-layout";
  import { notoSC, playfair } from "@/lib/fonts";
  ```

  So its summary rows are literal strings:

  ```tsx
  // components/screens/BagScreen.tsx:67-69
  const SUMMARY = [
    { y: 42, label: "Merchandise", labelW: 72, valueX: 337, valueW: 45, value: "$159.00", valueColor: "#3B2F2F" },
    { y: 71, label: "Gift services", labelW: 68, valueX: 351, valueW: 31, value: "$0.00", valueColor: "#3B2F2F" },
  ```

  The real summary, on the checkout page, feeds every row through `formatMoney` from live cart state:

  ```tsx
  // app/checkout/CheckoutClient.tsx:1064-1073
          <CheckoutSummaryCta
            top={T_SUMMARY}
            subtotal={formatMoney(subtotal)}
            discountLabel={discount ? `Discount (${discount.code})` : ""}
            discount={discount ? `−${formatMoney(discountCents)}` : ""}
            shippingLabel={`Shipping${zone ? ` (${zone.name})` : ""}`}
            shipping={shippingInfo.free ? "FREE" : formatMoney(shippingInfo.amount)}
            shippingColor={shippingInfo.free ? GREEN : INK}
            total={formatMoney(total)}
            barTotal={formatMoney(total)}
  ```

## Recap — the rules this feature is built on

```text
storage       integer cents everywhere      ← never floats for money
              ↑ Math.round(x*100) in       ↓ formatMoney() out
              (admin forms)                  (screen, wire)

trust         request carries IDs + quantities only
              the schema has no price field to attack
              server re-prices from the DB on every paying path
              capture re-prices AGAIN, and logs drift it can't undo

order         subtotal → discount → shipping(discounted) → tax(merch) → total
              rounding happens exactly twice: % discount, and tax
```

Five ideas that transfer to any project handling money:

1. **Integers, not floats.** Convert at the edges only. A cent lost to binary rounding is a day lost to debugging.
2. **Don't send a number you're going to recompute.** The safest input validation is a field that does not exist in the schema.
3. **Make invalid states unrepresentable.** One `discount_code` column is a stronger anti-stacking rule than any amount of validation code.
4. **Encode policy in a test, not a comment.** "Free-shipping thresholds use the discounted subtotal" is a business decision; [admin-discounts.spec.ts:91](../../tests/e2e/admin-discounts.spec.ts#L91) is what keeps it true.
5. **A mirror needs a test tying it to the original.** The client total is allowed to exist for speed; it is not allowed to drift unwatched — and right now it has, by exactly one tax term.
