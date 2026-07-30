-- Link orders to the signed-in buyer (2026-07-29).
--
-- Why this exists: /account previously found a customer's orders only via
-- customers.auth_user_id or an email string match, and both paths are gated
-- on Google/Apple sign-in (lib/account/data.ts EMAIL_VERIFIED_PROVIDERS).
-- Today's only live sign-in is emailed OTP (provider "email"), so every
-- signed-in customer saw an empty order list. Stamping the auth uid straight
-- onto the order is sign-in-method agnostic and needs no email to match.
--
-- An earlier 0004 added this same column and was later deleted from the repo
-- while the column stayed behind on the hosted database. This file is written
-- to be idempotent so it is a no-op there and correct on a fresh database.

alter table public.orders
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create index if not exists orders_auth_user_idx
  on public.orders (auth_user_id)
  where auth_user_id is not null;
