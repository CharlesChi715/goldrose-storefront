# payment-learning · 2026-09-20 · `worktree-stripe-checkout`

The session that revised OQ-1 (cards → Stripe Checkout, boss-approved) and
built the whole card rail. One matter stays open: the rail is dark until its
keys exist, and only Charles can mint them.

## AI-049 · `OWNER-TODO` · paste the Stripe keys and push 0016 to light the card rail

The code ships inert: `/checkout` shows the card CTA only when
`STRIPE_SECRET_KEY` is set, and the webhook rejects every delivery until
`STRIPE_WEBHOOK_SECRET` is set. The CLI's own login can't stand in — its key
lives in the keychain and expires in 90 days, so the app needs keys of its
own, and dashboard key access is Charles's alone.

In order:

1. **Push migration `0016`** from the MAIN repo dir (pre-push dump first —
   the [database-migrations](../../docs/features/database-migrations.md)
   `0016` note has the exact reasoning and ordering).
2. **Test keys, locally:** Stripe dashboard → toggle to the test/sandbox
   environment → Developers → API keys → copy the secret key into
   `.env.local` as `STRIPE_SECRET_KEY`. Run
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy
   its printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`. Buy something with
   `4242 4242 4242 4242`.
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
