---
delivery: uat
rollout: live
statusChangedAt: 2026-08-07
priority: p2
---

# media-spotlight

## Context

Every product photo is framed twice (2026-08-07, `worktree-media-spotlight`):
migration `0010` gives `product_images` two **spotlight areas** — a point plus a
zoom each — because one crop cannot serve two differently-shaped boxes, the PDP
viewer window (398×250) and the shop card photo (203×204).

## Decision

Nothing is ever cropped to a file. A spotlight is `object-position` for the
point and `transform: scale()` about that point for the zoom
([`lib/images/spotlight.ts`](../../lib/images/spotlight.ts)), so the original
upload stays whole and the PDP's fullscreen viewer still shows all of it.

## Tech details

- **Defaults reproduce the old centre crop exactly**, and zoom 100 emits no
  transform at all — which is why all three pixel baselines passed unchanged
  when this shipped.
- Uploading a photo opens the framing dialog on it; anything nobody has framed
  keeps a **"Needs framing"** badge, so an unconsidered crop is visible rather
  than silent.
- **The PDP ABOUT panel takes the point but not the zoom** — that zoom was
  authored against a wide box and this one is nearly square, so honouring it
  would enlarge a detail nobody chose.

## Related links

- Spec: [`admin-design.md` §9.5](../../docs/admin-design.md#95-products-adminproducts--clone)
  (and §7.1 for the stored shape)
- [`lib/images/spotlight.ts`](../../lib/images/spotlight.ts) · migration
  [`0010_product_image_spotlight.sql`](../../supabase/migrations/0010_product_image_spotlight.sql)
- The home page reuses this framer for replaced photos, storing the area in its
  own `site_content` slot rather than a column:
  [home-content-admin](home-content-admin.md)
- Tests: [`tests/unit/spotlight.test.ts`](../../tests/unit/spotlight.test.ts)
