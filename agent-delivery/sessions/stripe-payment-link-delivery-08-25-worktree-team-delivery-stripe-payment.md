# stripe payment link delivery · 2026-08-25 · `worktree-team-delivery-stripe-payment`

Charles was handed two artefacts by someone the bosses had do "the payment
job": a Stripe payment link and a 扫码付款 QR poster. Both are filed raw in
[`team-deliveries/inbox/`](../../team-deliveries/inbox) and **not parsed** —
the delivery routing table is still empty (AI-004), and its README is explicit
that an agent must not choose a destination on its own.

Not a re-delivery: neither file's sha256 matches an "as received" hash in
`originals/*/batch.md`, and before today the repo contained **no `stripe`
reference of any kind** outside prose weighing it as an option.

## What the link actually is

Verified 2026-08-25 by rendering the page read-only. **No payment was made and
no field was filled in.**

| | |
| ---------------- | ------------------------------------------------------------------------ |
| Merchant         | **Zhongshu Technology Worldwide Limited** — matches `settings.store.legal_name` in [`seed-data.ts`](../../lib/supabase/seed-data.ts#L372), so the payee is our own entity |
| Mode             | **Live.** No `test_` in the slug, and a real card form renders             |
| Item             | "Gold-Dipped Roses", brand ELDREVE, quantity adjustable                   |
| Price            | **US $79.00** (shown as A$114.00 from Australia; the switcher offers AU/US at 1 USD = 1.4430 AUD) |
| Methods          | Card — Visa, Mastercard, Amex, UnionPay, JCB, Discover, Diners — and Link |
| Collects         | email, card number, cardholder name, billing country, phone (Link)        |
| Does **not** collect | a shipping address                                                    |

The QR decodes to exactly that URL (CoreImage `CIDetectorTypeQRCode`), so the
poster and the link are one artefact, not two.

---

## AI-048 · `OWNER-TODO` · the link takes $79 with no address and no order

Independent of the rail decision (AI-047, closed 2026-09-20: answered (a), a
real checkout rail) — this bites as soon as the QR is shown to a customer.

- **A payment through it is invisible to the storefront.** It writes no
  `orders` row, so it reaches no admin screen, decrements no inventory, sends
  no confirmation email and creates no tracking. Whoever watches the Stripe
  dashboard *is* the fulfilment system.
- **It sells a physical gift and collects no delivery address.** On the
  evidence of the page a customer can pay $79 and we will not know where to
  send the rose. Stripe payment links can collect one; it is switched off.
- **$79.00 is not a catalog price.** The nearest is `premium-gift-bundle` at
  **$79.99**, and "Gold-Dipped Roses" is not a handle we ship. Same brand,
  different price, is a claim the live site contradicts.
- **Discounts, tax and shipping are Stripe's settings**, not our `discounts`
  table — and not the real shipping rates OQ-2 still has not answered.

SUMMARY's hard gate reads: anything a stranger's money or identity touches is
real *before* the switch. This is money, and it is live now.

**Recommended before the QR is given to anyone else:** turn on shipping-address
collection, set the price to the catalog price, and name the person who
reconciles Stripe payments into orders by hand.

## Delivered this session

- Filed both artefacts raw and unparsed in `team-deliveries/inbox/` —
  `stripe-payment-link.txt` and `stripe-payment-link-qr.png`
  (`181412da69d027a49b51c7e290ee3e86cc3173f46017bcb428b14d2fa8d2d810`, byte
  identical to what was handed over).
- Ran the README's check-first rule against every `originals/*/batch.md` hash:
  new delivery, not a re-delivery.
- Established what the link charges, for what, to whom, and what it fails to
  collect — by rendering it, without paying.
