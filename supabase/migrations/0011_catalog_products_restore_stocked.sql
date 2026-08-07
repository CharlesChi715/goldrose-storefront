-- Restore `stocked` to the catalog view (2026-08-07).
--
-- 0009 and 0010 were authored on separate branches and each rebuilt
-- `catalog_products` from the definition it could see. 0009 added `stocked`
-- beside `in_stock`; 0010, written against the pre-0009 view, added the image
-- spotlight fields and — without meaning to — reissued the variant object
-- without `stocked`. Renumbering made 0010 run last, so the field 0009 added
-- was silently dropped again. This is the same hazard SUMMARY.md records in
-- the other direction (0009 dropping 0010's spotlight columns); the sequence
-- guard only catches duplicate version numbers, so nothing flagged it.
--
-- Nothing here changes a table. The view is restated once with BOTH sets of
-- fields, which is the only definition that satisfies both features:
--   images  → focal_* and card_* (0010, the PDP and shop-card framing)
--   variant → in_stock and stocked (0009, the Availability chips)
--
-- The pair is what the Availability chips read (lib/catalog/facets.ts):
--   in_stock = orderable now (untracked, backorderable, or units on hand)
--   stocked  = has units on hand right now (untracked variants count as yes)
-- so "Pre-Order" is in_stock AND NOT stocked, and "Ready to Ship" is every
-- variant stocked. Without `stocked` the storefront read undefined for both:
-- "Ready to Ship" matched nothing and "Pre-Order" matched everything sellable.
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
      'in_stock', (not v.track_quantity) or v.continue_selling_when_oos or v.inventory_on_hand > 0,
      'stocked', (not v.track_quantity) or v.inventory_on_hand > 0
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
