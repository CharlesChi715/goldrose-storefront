-- Product reviews (2026-08-06).
--
-- Why this exists: the PDP reviews drawer renders four hardcoded mock rows;
-- this table makes reviews real data so the drawer can list, count and
-- average genuine customer reviews per product.
--
-- Moderation is content-neutral only (FTC 16 CFR Part 465): reviews are
-- never hard-deleted; rejected rows keep their status and reason as the
-- audit trail. Aggregates (avg/count) are computed live from this table —
-- there are deliberately no rating columns on products.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  author_name text, -- null = the UI renders "ELDREVE Customer"
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  photo_urls text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'published', 'rejected')),
  rejected_reason text,
  created_at timestamptz not null default now(),
  -- one review per product per purchase; NULL order_id rows are exempt
  -- because Postgres treats NULLs as distinct in unique constraints
  unique (product_id, order_id)
);

-- The PDP always asks "published reviews of this product" (list + avg/count),
-- so one partial index covers every storefront query.
create index if not exists product_reviews_product_published_idx
  on public.product_reviews (product_id, created_at desc)
  where status = 'published';

-- RLS: the anon storefront key may read published reviews only; writes go
-- through server code with the service-role key (which bypasses RLS), the
-- same pattern as orders.
alter table public.product_reviews enable row level security;

drop policy if exists "public reads published reviews" on public.product_reviews;
create policy "public reads published reviews"
  on public.product_reviews for select
  using (status = 'published');
