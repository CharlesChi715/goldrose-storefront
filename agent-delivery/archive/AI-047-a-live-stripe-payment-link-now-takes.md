<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-047 · `OWNER-DECISION` · a live Stripe rail exists, and OQ-1 says PayPal

OQ-1 was closed on 2026-07-26 in favour of **PayPal Advanced Checkout**, and
[`card-payments.md`](../../docs/features/card-payments.md) argues that choice
precisely on single-provider grounds — "one account, one payout, one refund
path, one webhook". This link is a **second acquirer, already live**, under the
same legal entity but a Stripe account that appears nowhere in the repo.

The order schema is deliberately provider-neutral (`payment_provider`,
`provider_order_id`, `provider_capture_id` — admin-design §7.4), so Stripe is
*addable* without a migration. But adding it is routes, webhook, refunds and
reconciliation work that is neither planned nor estimated, and `card-payments`
is `delivery: ready` on the PayPal design.

**Which of these is it?**

- **(a) A real checkout rail** — Stripe replaces or joins PayPal. Then OQ-1
  reopens, the decision in `card-payments.md` is superseded rather than merely
  dated, and the Stripe work needs its own feature record.
- **(b) An off-site channel** — WeChat, offline, or wholesale sales only, never
  linked from eldreve.com. Then `card-payments.md` stands untouched and the
  link needs the guard rails in AI-048.

I cannot see the Stripe dashboard, so I cannot tell whether this account is
new, who holds the login, or where the payout settles. Those three answers
belong with the decision.

**ANSWERED 2026-09-20 — (a), a real checkout rail.** Charles relayed the
boss's sign-off in-session: card revenue settles into Zhongshu Technology
Worldwide Limited's Stripe account (`acct_1U1f0EGvea4GUGR4`, CLI-verified);
the PayPal wallet rail is unchanged. Applied the same day: OQ-1 revised in
`card-payments.md` and `SUMMARY.md`, and the Stripe Checkout rail built on
branch `worktree-stripe-checkout` (routes, webhook, refunds, migration 0016,
tests). AI-048's guard rails on the naked link remain open and unchanged.
- **Closed:** 2026-09-20
- **Why:** answered: boss chose (a) real checkout rail settling to Zhongshu's Stripe; OQ-1 revised and Stripe Checkout built on worktree-stripe-checkout, 2026-09-20
