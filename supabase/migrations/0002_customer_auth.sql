-- Customer accounts (owner request 2026-07-23): storefront visitors can now
-- sign in (Google / Apple OAuth, then passkeys). A signed-in customer links
-- to the existing email-keyed customers row; account-first sign-ins create
-- one. Passkey credentials themselves live inside Supabase Auth — no table
-- of ours is involved.
--
-- Already-created hosted databases: run this file in the SQL editor once
-- (it is written to be idempotent).

alter table public.customers
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists customers_auth_user_id_key
  on public.customers (auth_user_id)
  where auth_user_id is not null;
