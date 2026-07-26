-- ----------------------------------------------------------------------------
-- 0003 — order-tracking carrier (features/backend/order-tracking.md) plus the
-- schema hardening agreed 2026-07-25 (docs/Database.md "Not yet enforced"):
-- SKU partial unique index, FK indexes, discounts.value sanity check.
-- ----------------------------------------------------------------------------

-- Carrier behind orders.tracking_number ('ups' | 'usps' today). Free text on
-- purpose — provider-neutral; lib/shipping/carriers.ts is the app-side list.
alter table orders add column if not exists tracking_carrier text;

-- Signed-in checkout: the buyer's auth uid stamped on the order it placed,
-- so /account shows it regardless of sign-in method (passkeys included) and
-- of the PayPal payer email. Per-ORDER on purpose — claiming the whole
-- email-keyed customer row would let a stranger surface someone else's
-- history by typing their email at checkout.
alter table orders add column if not exists auth_user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_auth_user_idx on orders (auth_user_id) where auth_user_id is not null;

-- SKU rules (docs/Database.md): non-blank SKUs are unique storewide; blank
-- drafts may coexist. lib/admin/products.ts enforces the same rule for the
-- local file adapter (which has no Postgres index) and clears SKUs on
-- Duplicate so copies can't collide.
create unique index if not exists product_variants_sku_unique
  on product_variants (sku)
  where sku <> '';

-- Postgres doesn't index FK columns automatically; these back the joins the
-- admin runs constantly (product/order detail, timelines, inventory, forum).
create index if not exists product_images_product_idx on product_images (product_id);
create index if not exists product_variants_product_idx on product_variants (product_id);
create index if not exists inventory_movements_variant_idx on inventory_movements (variant_id);
create index if not exists customer_events_customer_idx on customer_events (customer_id);
create index if not exists orders_customer_idx on orders (customer_id);
create index if not exists order_lines_order_idx on order_lines (order_id);
create index if not exists order_lines_variant_idx on order_lines (variant_id);
create index if not exists order_events_order_idx on order_events (order_id);
create index if not exists forum_posts_thread_idx on forum_posts (thread_id);

-- Percent discounts stay 0–100; every discount value is non-negative
-- (value is cents for fixed_amount, a percent for percentage — §7.8).
alter table discounts add constraint discounts_value_range
  check (value >= 0 and (type <> 'percentage' or value <= 100));
