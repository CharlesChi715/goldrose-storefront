-- Product image focal point (2026-08-06).
--
-- Why this exists: every storefront photo box is a fixed design rectangle and
-- the photos are not that shape, so they are drawn with object-fit: cover and
-- the browser crops to the CENTRE. On a rose standing beside its box that
-- centre is the gap between them — the subject sits off to one side and gets
-- cut. There was no way to say which part of a photo matters.
--
-- focal_x / focal_y are percentages fed straight to CSS object-position, so
-- 50/50 is exactly today's behaviour and every existing row keeps its current
-- crop. The admin sets them by dragging the photo inside a frame the size of
-- the PDP hero (398x250); one point serves every box, because object-position
-- re-solves per box size.

alter table public.product_images
  add column if not exists focal_x smallint not null default 50
    check (focal_x between 0 and 100),
  add column if not exists focal_y smallint not null default 50
    check (focal_y between 0 and 100);

comment on column public.product_images.focal_x is
  'CSS object-position X percentage (0-100); 50 = centre crop.';
comment on column public.product_images.focal_y is
  'CSS object-position Y percentage (0-100); 50 = centre crop.';

-- The storefront reads photos only through catalog_products, so the view has
-- to carry the point too. REPLACE, not drop-and-create: the column list is
-- unchanged (only the jsonb the `images` column builds), so Postgres accepts
-- a replace — which keeps the view's grants and never leaves a moment where
-- the storefront's only readable object does not exist.
create or replace view public.catalog_products as
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
      'path', i.path, 'alt', i.alt, 'position', i.position,
      'focal_x', i.focal_x, 'focal_y', i.focal_y
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

-- A replace keeps the existing grants, but re-stating them costs nothing and
-- documents what the storefront depends on: views run with their owner's
-- rights, so this grant — not RLS — is what lets the anon key read the
-- catalog at all (0001 §7.13).
grant select on public.catalog_products to anon, authenticated;
