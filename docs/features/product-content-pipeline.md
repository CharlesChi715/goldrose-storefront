---
schemaVersion: 1
id: product-content-pipeline
kind: feature
parent: product-content
area: backend
order: 10

delivery: backlog
rollout: not-deployed
statusChangedAt: 2026-07-24

dependsOn: []
blockedBy: []

verification:
  automated: []
  human: null
---

# Product content pipeline — admin editing + 120-SKU bulk import

## Context

- Teammate ask (relayed 2026-07-24, verbatim): 页面内容大部分都不对，只是定了框架；
  shop 页和商品详情页有 120 种 SKU，在 Figma 里逐个改太麻烦。可不可以在工作台改
  内容前端自动同步；或者按统一格式、统一命名放在文件夹里批量导入后台，前端跟着同步。
- What exists today: admin product edits already sync to the storefront
  near-instantly (`lib/admin/products.ts` `revalidateStorefront()`), **but only
  the designated live text boxes render DB data** — title, price, compare-at,
  promo slogan, SEO/JSON-LD. All imagery and the rest of the page copy are
  static Figma pixels; every product detail page renders the same placeholder
  design (`app/products/[slug]/page.tsx` header comment). Admin has CSV
  **export** only — no import; `scripts/seed.ts` is a clean-slate seeder that
  refuses non-empty catalogs.
- If we do nothing: 120 SKUs of real content (OQ-3) must be entered one-by-one
  through the admin form, and most of it wouldn't display anyway.

## Decision

Not chosen yet (BACKLOG). Recommendation on the table: two-stage pipeline —
(1) wire the remaining storefront content areas to the DB, images first;
(2) Shopify-style bulk import in the admin: one CSV with a fixed column spec +
an image folder named by SKU/handle. Pending owner confirmation; queued behind
the ship-critical owner activation items (target 2026-07-30).

## Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Admin form editing only (already built) | Ships today; forms cover title/price/media/variants/SEO | 120 SKUs one-by-one is slow; most fields aren't displayed on the storefront yet, so edits are invisible | ❌ alone — needed but insufficient |
| Live-wire pages + CSV/image-folder bulk import | One spreadsheet for all SKUs (Shopify's own convention — our admin is a Shopify clone); storefront syncs via existing revalidation; re-runnable for later content passes | Real build effort; import needs dry-run preview + row-level error report to avoid mass corruption; live-wiring must renegotiate the pixel-diff guard for those regions | ✅ **recommended** |

## Acceptance criteria

- [ ] Every product card (/, /shop) and detail page shows its own DB-driven
      image and copy — no shared placeholder art between SKUs.
- [ ] Importing a CSV + image folder creates/updates all 120 SKUs in one run.
- [ ] Re-running an import upserts in place (idempotent — safe content passes).
- [ ] Invalid rows are reported per-row; a failed row never partially writes.
- [ ] Storefront reflects an import without a redeploy.
- [ ] Human acceptance: teammate/owner imports real content and sees the
      storefront pages update (gates UAT → VERIFIED).

## Plan

1. Define the content spec: CSV column format + image naming convention
   (by SKU/handle), documented EN/中文 for the content team.
2. Wire storefront areas to DB: detail-page hero/gallery from `product_images`,
   description/subtitle blocks; then shop/home card images. Update or scope the
   pixel-diff guard for these regions.
3. Importer service: parse CSV, validate, dry-run preview, upsert products/
   variants by handle+SKU, upload images to the `product-images` bucket.
4. Admin Import UI (Products → Import), mirroring the existing Export.
5. Tests: unit (parser/validator/upsert) + e2e (import → storefront shows it).

## Blockers and dependencies

- SKU rules first (or together): the import upserts by handle+SKU, which
  assumes SKUs are unique and non-blank — rules + planned enforcement in
  [../Database.md § SKU rules](../Database.md).
- Not blocked, but deliberately queued behind the owner activation items
  (SUMMARY.md Release queue) and ship target 2026-07-30 — this is the delivery vehicle
  for OQ-3 (real product content), which lands after ship per SUMMARY.
- Tension to resolve during design: the pixel-diff guard assumes static pixels;
  live-wired regions need excluding or per-SKU baselines.

## Verification evidence

None yet — BACKLOG.

## Related links

- OQ-3 → [SUMMARY.md · Product decisions](../../SUMMARY.md#product-decisions)
- Current live-text wiring: `app/products/[slug]/page.tsx`, `app/shop/page.tsx`,
  `lib/admin/products.ts` (`revalidateStorefront`)
- Existing export (mirror for the import UI): `app/api/admin/products/export/route.ts`
