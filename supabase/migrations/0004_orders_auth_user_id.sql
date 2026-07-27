-- 0004: stamp the signed-in buyer's auth uid on orders.
--
-- Split out of 0003 — that migration was already applied to the hosted
-- project on 2026-07-25, and Supabase never re-runs an applied migration,
-- so statements added to it later silently never reach the database.

-- Signed-in checkout: the buyer's auth uid stamped on the order it placed,
-- so /account shows it regardless of sign-in method (passkeys included) and
-- of the PayPal payer email. Per-ORDER on purpose — claiming the whole
-- email-keyed customer row would let a stranger surface someone else's
-- history by typing their email at checkout.
alter table orders add column if not exists auth_user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_auth_user_idx on orders (auth_user_id) where auth_user_id is not null;
