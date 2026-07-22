-- ============================================================================
-- GoldRose admin schema — design doc §7 (docs/admin-design.md)
--
-- Source of truth for the hosted Supabase project. Run this file first in the
-- Supabase SQL editor (or `supabase db push`), then seed with `npm run seed`
-- (with the hosted env vars set).
--
-- Conventions: all money is INTEGER CENTS; orders are never hard-deleted;
-- RLS is deny-by-default on every base table — the only anon-readable
-- objects are the catalog_products view and site_content (§7.13).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Products & variants (§7.1, §7.2)
-- ----------------------------------------------------------------------------

create table products (
  id text primary key,
  handle text not null unique,
  title text not null,
  short_name text not null default '',
  description text not null default '',
  vendor text not null default 'GoldRose',
  product_type text not null default '',
  tags text[] not null default '{}',
  charge_tax boolean not null default true,
  requires_shipping boolean not null default true,
  country_of_origin text,
  hs_code text,
  seo_title text,
  seo_description text,
  best_for text not null default '',
  badge text not null default '',
  details text[] not null default '{}',
  option_names text[] not null default '{}'
    check (coalesce(array_length(option_names, 1), 0) <= 3),
  status text not null default 'draft'
    check (status in ('active', 'draft', 'archived')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  path text not null,
  alt text not null default '',
  position int not null default 0
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  position int not null default 0,
  option_values text[] not null default '{}',
  sku text not null default '',
  barcode text not null default '',
  price_cents int not null default 0,
  compare_at_price_cents int,
  -- "Cost per item" — PRIVATE: must never appear in catalog_products (§7.2).
  cost_cents int,
  track_quantity boolean not null default true,
  inventory_on_hand int not null default 0,
  continue_selling_when_oos boolean not null default false,
  weight_oz numeric
);

-- ----------------------------------------------------------------------------
-- Inventory movement log (§7.3) — append-only; stock is never edited directly
-- ----------------------------------------------------------------------------

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in (
    'correction', 'count', 'received', 'return_restock',
    'damaged', 'theft_or_loss', 'promotion_or_donation', 'order'
  )),
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create function adjust_inventory(
  p_variant_id uuid,
  p_delta int,
  p_reason text,
  p_note text default null,
  p_created_by text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update product_variants
    set inventory_on_hand = inventory_on_hand + p_delta
    where id = p_variant_id;
  insert into inventory_movements (variant_id, delta, reason, note, created_by)
    values (p_variant_id, p_delta, p_reason, p_note, p_created_by);
end $$;

-- ----------------------------------------------------------------------------
-- Customers (§7.7) — auto-created from paid orders
-- ----------------------------------------------------------------------------

create table customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  default_address jsonb,
  note text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table customer_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  kind text not null check (kind in ('system', 'comment')),
  message text not null,
  created_by text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Orders (§7.4) — provider-neutral payment columns (OQ-1); never hard-deleted
-- ----------------------------------------------------------------------------

create sequence order_number_seq start 1001;

create function next_order_number() returns int
language sql
security definer
set search_path = public
as $$ select nextval('order_number_seq')::int $$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  name text not null, -- display name, e.g. "#1001" (prefix from settings)
  source text not null check (source in ('mock', 'site', 'draft')),
  customer_id uuid references customers(id) on delete set null,
  payment_provider text not null default 'mock',
  -- Idempotency key: webhook redeliveries upsert on this, never duplicate.
  provider_order_id text unique,
  provider_capture_id text,
  email text,
  phone text,
  shipping_address jsonb,
  billing_address jsonb,
  subtotal_cents int not null default 0,
  discount_code text,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  shipping_free boolean not null default false,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  currency text not null default 'USD',
  financial_status text not null default 'pending'
    check (financial_status in ('pending', 'paid', 'partially_refunded', 'refunded')),
  refunded_cents int not null default 0,
  fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in ('unfulfilled', 'fulfilled')),
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  visitor_id text,
  note text not null default '',
  tags text[] not null default '{}',
  archived_at timestamptz,
  placed_at timestamptz not null default now(),
  raw jsonb
);

create table order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  -- Snapshot columns (sku/name/option) keep history intact if the product goes.
  variant_id uuid references product_variants(id) on delete set null,
  product_id text,
  sku text not null default '',
  name text not null,
  option text not null default '',
  quantity int not null check (quantity > 0),
  unit_amount_cents int not null,
  line_total_cents int not null
);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  kind text not null check (kind in ('system', 'comment')),
  message text not null,
  created_by text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Checkouts — abandoned checkout list (§7.6)
-- ----------------------------------------------------------------------------

create table checkouts (
  id uuid primary key default gen_random_uuid(),
  cart jsonb not null, -- { lines, note, country, visitor_id }
  email text,
  discount_code text,
  subtotal_cents int not null default 0,
  total_cents int not null default 0,
  provider_order_id text,
  status text not null default 'open' check (status in ('open', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ----------------------------------------------------------------------------
-- Discounts (§7.8) — code method: percentage / fixed amount / free shipping
-- ----------------------------------------------------------------------------

create table discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null check (type in ('percentage', 'fixed_amount', 'free_shipping')),
  value int not null default 0, -- percent (0-100) or cents, by type
  applies_to jsonb, -- null = whole order; { product_ids: [...] } otherwise
  min_purchase_cents int,
  usage_limit int,
  once_per_customer boolean not null default false,
  used_count int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- Codes are unique case-insensitively (§7.8).
create unique index discounts_code_ci on discounts (lower(code));

-- ----------------------------------------------------------------------------
-- First-party visitor analytics (§7.12) — anonymous, cookieless
-- ----------------------------------------------------------------------------

create table page_views (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  path text not null,
  referrer text,
  utm jsonb,
  country text,
  created_at timestamptz not null default now()
);

create index page_views_created_at on page_views (created_at);
create index page_views_visitor on page_views (visitor_id, created_at);

-- One row per session: the beacon assigns session ids client-side with a
-- 30-minute inactivity rule; this view aggregates them for the analytics UI.
create view page_view_sessions as
select
  visitor_id,
  session_id,
  min(created_at) as started_at,
  max(created_at) as ended_at,
  count(*)::int as page_view_count,
  (array_agg(path order by created_at))[1] as landing_path,
  (array_agg(referrer order by created_at))[1] as referrer,
  (array_agg(utm order by created_at))[1] as utm,
  (array_agg(country order by created_at))[1] as country
from page_views
group by visitor_id, session_id;

-- ----------------------------------------------------------------------------
-- Visitor feedback / ideas (owner request 2026-07-23): submitted from the
-- storefront's concierge panel via /api/feedback (service role — no anon
-- write policy), read in the admin under Content → Ideas.
-- ----------------------------------------------------------------------------

create table feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text,
  message text not null,
  path text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Testing-phase discussion forum (owner request 2026-07-22): threads +
-- replies inside the admin, identified by nickname only. Written server-side
-- (service role) like feedback — no anon policies.
-- ----------------------------------------------------------------------------

create table forum_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  nickname text not null,
  created_at timestamptz not null default now()
);

create table forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references forum_threads(id) on delete cascade,
  nickname text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Site content slots (§7.9) + settings (§7.10) + admin allowlist (§7.11)
-- ----------------------------------------------------------------------------

create table site_content (
  key text primary key,
  value jsonb not null,
  default_value jsonb not null, -- powers "Reset to original" + the §11 PNG rule
  label text not null default '',
  help text not null default '',
  updated_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null
);

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default ''
);

-- ----------------------------------------------------------------------------
-- Inventory math view (§7.2): On hand = stored; Committed = paid-but-
-- unfulfilled order lines; Available = on hand − committed; Unavailable = 0.
-- Derived in one place so the numbers can't drift.
-- ----------------------------------------------------------------------------

create view variant_inventory as
select
  v.id as variant_id,
  v.inventory_on_hand as on_hand,
  coalesce((
    select sum(l.quantity)
    from order_lines l
    join orders o on o.id = l.order_id
    where l.variant_id = v.id
      and o.financial_status in ('paid', 'partially_refunded')
      and o.fulfillment_status = 'unfulfilled'
      and o.cancelled_at is null
  ), 0)::int as committed,
  0 as unavailable
from product_variants v;

-- ----------------------------------------------------------------------------
-- Storefront catalog view (§6.3, §7.13): ACTIVE products only, safe columns
-- only — no cost, no stock counts. `in_stock` is the only inventory-derived
-- fact exposed. This is the single object the storefront's anon key can read
-- besides site_content.
-- ----------------------------------------------------------------------------

create view catalog_products as
select
  p.id,
  p.handle,
  p.title,
  p.short_name,
  p.description,
  p.best_for,
  p.badge,
  p.details,
  p.tags,
  p.option_names,
  p.position,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'path', i.path, 'alt', i.alt, 'position', i.position
    ) order by i.position)
    from product_images i where i.product_id = p.id
  ), '[]'::jsonb) as images,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', v.id,
      'option_values', v.option_values,
      'sku', v.sku,
      'position', v.position,
      'price_cents', v.price_cents,
      'compare_at_price_cents', v.compare_at_price_cents,
      'in_stock', (not v.track_quantity) or v.continue_selling_when_oos or v.inventory_on_hand > 0
    ) order by v.position)
    from product_variants v where v.product_id = p.id
  ), '[]'::jsonb) as variants
from products p
where p.status = 'active';

-- ----------------------------------------------------------------------------
-- Row-level security (§7.13): enable everywhere, deny by default. The service
-- role bypasses RLS (server-only code); anon gets exactly two readable objects.
-- ----------------------------------------------------------------------------

alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table inventory_movements enable row level security;
alter table customers enable row level security;
alter table customer_events enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;
alter table order_events enable row level security;
alter table checkouts enable row level security;
alter table discounts enable row level security;
alter table page_views enable row level security;
alter table feedback enable row level security;
alter table forum_threads enable row level security;
alter table forum_posts enable row level security;
alter table site_content enable row level security;
alter table settings enable row level security;
alter table admin_users enable row level security;

-- No table policies exist except this one: anon may read site content slots.
create policy site_content_public_read on site_content
  for select to anon, authenticated using (true);

-- Views execute with their owner's rights, so these grants (not RLS) are the
-- control. Lock the API roles down to exactly the safe surface.
revoke all on all tables in schema public from anon, authenticated;
grant select on catalog_products to anon, authenticated;
grant select on site_content to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Storage: public bucket for product media (§9.5). Safe to run repeatedly.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- keep products.updated_at fresh on every edit
create function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_touch_updated_at
  before update on products
  for each row execute function touch_updated_at();
