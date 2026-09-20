# payment-learning · 2026-09-20 · `worktree-stripe-checkout`

The session that revised OQ-1 (cards → Stripe Checkout, boss-approved) and
built the whole card rail. One matter stays open: the rail is dark until its
keys exist, and only Charles can mint them.

## AI-050 · `OWNER-TODO` · three refunded sandbox orders hold 4 units of live stock

The 2026-09-20 walkthrough placed three real sandbox orders in the **live
database** — `#1018`, `#1019`, `#1021`. Every payment was refunded in full at
Stripe and the webhook synced each to `refunded`, so no money is outstanding.
The stock is: `GR-ROSE-RED-SOL-RUBY` is **down 4 units** on three `order`
movements, and refunding never restocks.

House rule D13 (sandbox orders are cancelled and restocked, tagged `sandbox`,
then archived — never hard-deleted) needs an admin session, which an agent
does not have. In `/admin` → each order → **Cancel**, tick *Restock items*,
then tag `sandbox` and archive.

Location: [`docs/features/card-payments.md`](../../docs/features/card-payments.md)
(walkthrough evidence).

## AI-049 · `OWNER-TODO` · paste the Stripe keys and push 0016 to light the card rail

The code ships inert: `/checkout` shows the card CTA only when
`STRIPE_SECRET_KEY` is set, and the webhook rejects every delivery until
`STRIPE_WEBHOOK_SECRET` is set. The CLI's own login can't stand in — its key
lives in the keychain and expires in 90 days, so the app needs keys of its
own, and dashboard key access is Charles's alone.

Steps 1 and 2 were **done on 2026-09-20** (migration pushed after a dump to
`~/before-0016.dump`; test key and `whsec_` in `.env.local`; three purchases
and four refunds walked through). What is left is Vercel and the live
cutover:

1. ~~Push migration `0016`~~ — applied to hosted 2026-09-20, verified by
   `\d orders`.
2. ~~Test keys locally~~ — in `.env.local`. Note `CHECKOUT_SKIP_PAYMENT` was
   **commented out there** so the card rail could render; the Vercel copy is
   untouched and still on.
3. **Same test keys in Vercel** (Preview + Production while pre-launch),
   plus a dashboard webhook endpoint for
   `https://eldreve.com/api/webhooks/stripe` → its signing secret becomes
   the Vercel `STRIPE_WEBHOOK_SECRET`.
4. **Live keys are the owner's switch** (SUMMARY one-way door): `sk_live_…`
   only at cutover, with the live webhook endpoint's secret.

Location: [`.env.example`](../../.env.example) (the `STRIPE_SECRET_KEY`
block) · [card-payments](../../docs/features/card-payments.md) Decision
revision lists what "done" looks like.

## Delivered this session

- OQ-1 revised with the boss's sign-off (cards settle to Zhongshu's Stripe;
  PayPal keeps the wallet) — recorded in `card-payments.md`, `SUMMARY.md`,
  and AI-047 closed as answered.
- Built the Stripe Checkout card rail on `worktree-stripe-checkout`:
  `lib/stripe/{client,verify,mapping,webhook}.ts`, `lib/payments/provider.ts`
  refund dispatch, `/api/stripe/checkout`, `/api/stripe/return` (amount-drift
  hard stop with automatic refund), `/api/webhooks/stripe`, checkout card
  CTA, admin/receipt card surfacing, migration `0016` (written, NOT pushed),
  env validation rules, 25 unit tests — `npm run check` fully green.
- Stripe CLI installed + authenticated on this Mac; the live payment link
  `plink_1U7snAGvea4GUGR4sk0kQcWK` confirmed via API as shipping-blind
  (hard evidence under AI-048, which stays open).
- Applied migration `0016` to hosted after a `pg_dump` safety copy, and drove
  the full sandbox walkthrough in a real browser: three card purchases
  (Visa and Mastercard), a partial refund, three full refunds, all synced by
  the webhook. Two defects found and fixed on
  `worktree-stripe-race-fixes` (PR #56): the webhook lost the card brand and
  last four when it beat the return leg, and the losing path threw on the
  unique index so a paid buyer saw an error page.
