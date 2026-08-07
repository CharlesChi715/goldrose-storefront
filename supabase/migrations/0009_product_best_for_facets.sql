-- `best_for` becomes the shop's filter vocabulary (2026-08-07).
--
-- WHY THIS EXISTS
-- The /shop filter drawer (Figma frame 923:252) draws eleven chips under
-- Collections, Occasion and Recipient, and every one of them was cosmetic:
-- the catalog had no field to filter on, so tapping a chip changed nothing.
-- `best_for` was the nearest thing — a single sentence ("Anniversaries,
-- birthdays, and classic romantic gifting.") that no page ever rendered.
--
-- It becomes the list instead: text -> text[], holding slugs from
-- lib/catalog/facets.ts. A product may carry ANY number of values across the
-- three groups, including none (owner ruling, 2026-08-07).
--
-- WHAT HAPPENS TO THE OLD TEXT
-- Prose is dropped, not guessed at: a wrong guess is worse than a blank,
-- because it puts a product under a filter the owner never chose. The one
-- exception is a value that is ALREADY a chip name — the free-text box invited
-- that, and both hosted products say "Classic Collection" verbatim. An exact,
-- case-insensitive match on a label is a translation rather than a guess, so
-- those carry across; everything else starts empty and is re-picked in the
-- admin, where the chips are now a multi-select. Nothing is lost that a page
-- was showing — the column was dormant on the storefront.
--
-- NO CHECK CONSTRAINT ON THE VALUES
-- The vocabulary is enforced in lib/catalog/facets.ts (`assertBestFor`), on
-- the one path that writes this column. Repeating the eleven values in SQL
-- would mean a migration every time the design team renames a chip, and the
-- two lists would drift the first time one was forgotten.

-- The view has to go first: Postgres will not retype a column another object
-- selects, and `create or replace view` cannot change a column's type either.
-- Dropping it takes the anon grant with it, so both are restated below.
drop view if exists public.catalog_products;

alter table public.products
  alter column best_for drop default;

-- One row per chip, so the mapping is readable and auditable rather than a
-- clever string transform. Anything not listed becomes an empty list.
alter table public.products
  alter column best_for type text[] using (
    case lower(btrim(best_for))
      when 'jewel collection'   then array['jewel']
      when 'classic collection' then array['classic']
      when 'sparkle collection' then array['sparkle']
      when 'anniversary'        then array['anniversary']
      when 'birthday'           then array['birthday']
      when 'wedding'            then array['wedding']
      when 'valentine''s'       then array['valentines']
      when 'valentine’s'        then array['valentines']
      when 'wife'               then array['wife']
      when 'girlfriend'         then array['girlfriend']
      when 'mother'             then array['mother']
      when 'friends'            then array['friends']
      else '{}'::text[]
    end
  );

alter table public.products
  alter column best_for set default '{}'::text[];

comment on column public.products.best_for is
  'Merchandising facets for the /shop filter drawer — slugs from lib/catalog/facets.ts (collection/occasion/recipient). Unbounded; empty means the product appears only when those groups are unfiltered.';

-- Recreated with two changes: `best_for` is now an array, and each variant
-- carries `stocked` beside `in_stock`. The pair is what the Availability chips
-- need and it is still no stock COUNT (§7.2) — two booleans, not a number:
--   in_stock = can be bought at all (includes sell-when-out-of-stock)
--   stocked  = has units on hand right now (untracked variants count as yes)
-- so "Pre-Order" is in_stock AND NOT stocked, and "Ready to Ship" is every
-- variant stocked.
create view public.catalog_products as
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
      'in_stock', (not v.track_quantity) or v.continue_selling_when_oos or v.inventory_on_hand > 0,
      'stocked', (not v.track_quantity) or v.inventory_on_hand > 0
    ) order by v.position)
    from product_variants v where v.product_id = p.id
  ), '[]'::jsonb) as variants
from products p
where p.status = 'active';

-- Views run with their owner's rights, so this grant — not RLS — is what lets
-- the storefront's anon key read the catalog at all (0001 §7.13). The drop
-- above removed it with the view, so it is not optional here.
grant select on public.catalog_products to anon, authenticated;
