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

⚠️ **The table above is what it WAS. The link was deactivated 2026-09-20**
(`active: false`) once the real card rail worked — Charles's call, closing
AI-048. It was the only payment link on the live account, so nothing outside
the storefront collects money now. A payment link cannot be deleted, only
deactivated; the full record is in
[`archive/AI-048-…`](../archive/AI-048-that-link-charges-79-00-collecting-no.md).
The QR poster stays filed as delivered, but it now resolves to Stripe's "no
longer active" page.

---

## Delivered this session

- Filed both artefacts raw and unparsed in `team-deliveries/inbox/` —
  `stripe-payment-link.txt` and `stripe-payment-link-qr.png`
  (`181412da69d027a49b51c7e290ee3e86cc3173f46017bcb428b14d2fa8d2d810`, byte
  identical to what was handed over).
- Ran the README's check-first rule against every `originals/*/batch.md` hash:
  new delivery, not a re-delivery.
- Established what the link charges, for what, to whom, and what it fails to
  collect — by rendering it, without paying.
