-- Product image spotlight areas (2026-08-07).
--
-- Why this exists: 0008 gave every photo a focal POINT, which says which pixel
-- must survive the cover-crop but not how much of the photo to show. On a wide
-- packshot the rose is a fifth of the frame, so the PDP viewer shows it small
-- wherever the point sits, and the square-ish shop card — a different shape
-- again — cannot be served well by the same single choice.
--
-- A spotlight AREA is that point plus a zoom, and there are two of them
-- because there are two windows the owner frames independently:
--
--   spotlight  focal_x / focal_y / focal_zoom        PDP viewer window 398x250
--   card area  card_focal_x / card_focal_y / card_zoom   shop card photo 203x204
--
-- The zoom is a percentage over the cover-fit scale, fed to CSS transform
-- scale() about the focal point (lib/images/spotlight.ts), so 100 is exactly
-- the pre-0009 crop and every existing row keeps the picture it has today.
-- Nothing here writes a cropped image file: the original is stored whole, so
-- the PDP's fullscreen viewer still has every pixel to show.

alter table public.product_images
  -- Spotlight zoom. NOT NULL with a default because the PDP window always has
  -- a spotlight — an unframed photo's spotlight is simply the whole photo.
  add column if not exists focal_zoom smallint not null default 100
    check (focal_zoom between 100 and 400),
  -- Card area. NULLABLE on purpose: null means "never framed for the card",
  -- which the storefront reads as the spotlight's point at no zoom — the
  -- card's exact pre-0009 behaviour. A framed card writes all three together.
  add column if not exists card_focal_x smallint
    check (card_focal_x between 0 and 100),
  add column if not exists card_focal_y smallint
    check (card_focal_y between 0 and 100),
  add column if not exists card_zoom smallint
    check (card_zoom between 100 and 400),
  -- Whether an admin has actually chosen this photo's areas. Distinct from
  -- "the values are 50/50/100", which is also what an unframed photo reads
  -- as, so the Media card can keep asking until someone really has looked.
  add column if not exists framed boolean not null default false;

comment on column public.product_images.focal_zoom is
  'Spotlight zoom percentage (100-400) over the cover-fit scale; 100 = no zoom.';
comment on column public.product_images.card_focal_x is
  'Shop-card object-position X percentage (0-100); null = inherit focal_x.';
comment on column public.product_images.card_focal_y is
  'Shop-card object-position Y percentage (0-100); null = inherit focal_y.';
comment on column public.product_images.card_zoom is
  'Shop-card zoom percentage (100-400); null = no zoom.';
comment on column public.product_images.framed is
  'True once an admin has confirmed this photo''s spotlight in the Media card.';

-- The storefront reads photos only through catalog_products, so the view has
-- to carry the areas too. REPLACE, not drop-and-create, for the same reason
-- 0008 gave: the view's own column list is unchanged (only the jsonb the
-- `images` column builds), so Postgres accepts a replace — which keeps the
-- view's grants and never leaves a moment where the storefront's only
-- readable object does not exist.
--
-- `framed` is deliberately NOT exposed: it is an admin workflow flag, and the
-- storefront's crop is fully described by the numbers beside it.
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
      'focal_x', i.focal_x, 'focal_y', i.focal_y, 'focal_zoom', i.focal_zoom,
      'card_focal_x', i.card_focal_x, 'card_focal_y', i.card_focal_y,
      'card_zoom', i.card_zoom
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
