# Customer path tests — 2026-07-29

Common shopper journeys, walked end to end and recorded. Re-run this list after
any storefront change.

**Environment:** local `npm run dev` against hosted Supabase, with
`CHECKOUT_SKIP_PAYMENT=1` (mock orders, nothing charged). Two test orders were
created: `#1011`, `#1012`.

## Results

| # | Path | Steps | Result |
|---|---|---|---|
| 1 | Browse and buy | home → shop → product → ADD TO CART → checkout → Place order | **Pass** — order saved, number increments (#1011 → #1012) |
| 2 | Buy now | product → BUY NOW → checkout | **Pass** — item lands in checkout |
| 3 | Order confirmation | Place order → `/checkout/success` | **Partial** — real order number and total; buyer, address, date, card are hard-coded design data |
| 4 | Track an order | confirmation → VIEW ORDER STATUS → `/orders/track` | **Fail** — static demo timeline (`#VL20250821`, UPS); no order lookup, order number is not passed through |
| 5 | Sign in | `/account` → email → EMAIL ME A SIGN-IN LINK | **Pass** — Supabase accepts the request (inbox delivery not verified) |
| 6 | Create account | `/account/signup` | **Fail** — form is a picture; no real inputs or submit |
| 7 | My orders | `/account/orders` → VIEW DETAILS | **Fail** — opens without signing in and shows fixed demo orders |
| 8 | Search / sort / filter | `/shop` → Search, New, Filters | **Fail** — `?q=` and `?sort=` change nothing; the three buttons have no effect |
| 9 | Customer care | `/care` → Chat with us → `/care/chat` | **Fail** — fixed transcript, no message box |
| 10 | Wholesale enquiry | `/business/wholesale` → fill form → SUBMIT | **Partial** — 8 fields accept typing; SUBMIT is a placeholder with no backend |

## Main issues

1. **Tracking is not real** (paths 3, 4). A customer who orders cannot see their
   own order — the confirmation and tracking screens show someone else's demo
   data.
2. **Account area is unprotected** (path 7). Every `/account/*` page opens
   signed-out with demo persona data ("Olivia Carter", "David").
3. **Sign-up is not wired** (path 6), so sign-in is the only way in.
4. **Shop search, sort and filter do nothing** (path 8) — worth checking as a
   regression from the 07-29 redesign.
5. **`/orders` redirects to `/admin/login`** — already Release queue item 4.
6. **No shipping address is collected** in `CHECKOUT_SKIP_PAYMENT` mode: the
   address fields only render when neither PayPal nor the skip flag is set.
7. Homepage product cards link to `/shop`, not to the product pages.

## What the database stores for a test order

The `orders` table has `email`, `phone`, `shipping_address` and
`billing_address` — all nullable. A test order actually saves:

```
email    "pathtest@gmail.com"   note/money/lines  saved
phone    null                   shipping_address  null
                                billing_address   null
```

So the order is paid-and-unshippable: we know who to email, not where to send
the rose. Who fills those columns depends on the mode:

| Mode | Address form | Validation |
|---|---|---|
| `CHECKOUT_SKIP_PAYMENT=1` (now) | none rendered | none — nulls are accepted |
| Mock card (no PayPal keys, no skip flag) | real inputs | email + recipient + street required |
| PayPal live | PayPal's own | PayPal returns payer email + shipping address at capture |

**Gap to plan for:** the address form only renders when *neither* PayPal nor the
skip flag is set. Adding PayPal keys removes it, leaving PayPal as the only
address source — and we never set `shipping_preference`, so PayPal defaults to
`GET_FROM_FILE`: the address is one the *payer* picks from their own PayPal
address book. We sell gifts, where the recipient is usually someone else, so
that is the wrong address by default. It also lets the ship-to country differ
from the country we priced shipping from; `app/api/paypal/capture/route.ts:52`
re-prices and only logs the mismatch, keeping the order.

One fix covers all of it: collect the address on our checkout page always, and
send it to PayPal as `shipping_preference: "SET_PROVIDED_ADDRESS"`. That also
gives OQ-1's Advanced Cards path (card typed on our page, no PayPal address) the
address form it needs.

## Notes

- Supabase rejects `@example.com` sign-in addresses (`email_address_invalid`) —
  use a real domain when testing.
- Paths 3, 4, 6, 7, 8, 9, 10 are imported design screens that were never wired
  to a backend, not broken code.
