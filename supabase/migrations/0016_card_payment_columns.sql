-- 0016 — card payment columns (docs/features/card-payments.md, decision
-- revised 2026-09-20: cards via Stripe Checkout).
--
-- Provider-neutral on purpose: these columns describe the instrument, not
-- the processor — Stripe today, any future provider tomorrow. 0004 first
-- proposed them and was abandoned (scripts/check-migrations.mjs
-- KNOWN_SKIPPED), so everything here is idempotent in case a hosted column
-- survived.

alter table orders
  add column if not exists payment_method_kind text
    check (payment_method_kind is null or payment_method_kind in ('wallet', 'card'));

-- Brand exactly as the provider reports it ('VISA', 'MASTERCARD', …), and
-- the last four digits — never more of the number than that, anywhere.
alter table orders add column if not exists card_brand text;
alter table orders
  add column if not exists card_last4 text
    check (card_last4 is null or card_last4 ~ '^[0-9]{4}$');

-- A checkout whose payment was refunded-and-rejected (amount drift) must not
-- be rebuilt by the webhook repair path: give it a terminal state distinct
-- from 'completed'.
alter table checkouts drop constraint if exists checkouts_status_check;
alter table checkouts
  add constraint checkouts_status_check
    check (status in ('open', 'completed', 'rejected'));
