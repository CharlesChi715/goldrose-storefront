---
id: product-content-pipeline
area: backend

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
- If we do nothing: 120 SKUs of real content (SUMMARY OQ-3) must be entered
  one-by-one through the admin form, and most of it wouldn't display anyway.

## Decision

Not chosen yet (BACKLOG) — the shape below is the 2026-08-03 recommendation,
pending sign-off and the open questions.

Two inputs, both keyed on `handle` + `SKU` (the keys the admin and CSV already
use): **a CSV for the words**, in the format `Export` already produces, and **a
folder tree for the pictures**, uploaded straight to Supabase Storage. They
travel separately because a spreadsheet can name a file but never carry one.

## Options considered

| Option                                       | Why not / why                                                                     | Verdict        |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | -------------- |
| Admin form only (built)                      | 120 SKUs one-by-one, and most fields aren't displayed yet                          | ❌ insufficient |
| **CSV round-tripping the export**            | No second spec to drift; Export *is* the template; re-importing an untouched file is a no-op — idempotency for free. Export's 11 columns must be widened first | ✅ **chosen**  |
| A new CSV column spec                        | A second format to document and keep in step with the form; drift stays invisible until an import blanks a field | ❌             |
| `.xlsx`                                      | Needs a parsing library; Excel and WPS export CSV anyway                           | ❌             |
| Upload via a Vercel server action            | **Impossible** — Vercel caps a request body at ~4.5 MB, under one photo            | ❌             |
| **Upload browser → Supabase Storage**        | No size ceiling, no Vercel bandwidth or function time                              | ✅ **chosen**  |
| Service-role key in the browser              | Bypasses every RLS policy — release-gate violation                                 | ❌             |
| Image URLs downloaded server-side            | Photos would live on the supplier's server indefinitely                            | ❌             |

## File formats

### The CSV

**One row = one variant.** Every `products` column repeats on that product's
rows; `Handle` binds the row to its parent, `SKU` identifies the row. Columns
and their requirements: [Database.md § Table shapes](../Database.md).

Images ride on **extra rows** carrying only `Handle` plus image columns — a row
with a SKU is a variant row, a row without one is an image row.

```
Handle,Title,...,SKU,Price,Image file,Image alt
24k-gold-rose,24K Gold Rose,...,GR-ROSE-RED,49.99,,
24k-gold-rose,,...,GR-ROSE-BLU,49.99,,
24k-gold-rose,,...,,,hero.jpg,Red rose in a glass dome
24k-gold-rose,,...,,,1.jpg,Gift box open
```

`Image file` is **not** a database column — it is a lookup key the importer
resolves to the `product_images.path` the upload produced, then discards, exactly
as `Handle` resolves to `product_id`.

### The folder tree

**Depth decides scope.** Files directly in the product folder belong to the whole
product; files in a `<SKU>/` subfolder belong to that variant. A single-variant
product needs no subfolder — the common case.

```
product-images/
├── eternal-rose-in-glass-dome/      ← single variant: no SKU level
│   ├── hero.jpg
│   └── 1.jpg
└── 24k-gold-dipped-eternal-rose/
    ├── hero.jpg                      ← applies to every variant
    ├── GR-ROSE-RED/
    │   ├── hero.jpg                  ← this colour only
    │   └── 1.jpg
    └── GR-ROSE-BLU/
        └── hero.jpg
```

| Rule                        |                                                                              |
| --------------------------- | ----------------------------------------------------------------------------- |
| Product folder              | the `handle`, never the title                                                |
| Variant folder              | the `SKU` — already uppercase/digits/hyphens, so filesystem-safe              |
| Hero                        | `hero.*`, always position 0                                                  |
| The rest                    | `1.*`, `2.*` … read as **integers**; as text, `10` sorts before `2`           |
| Banned in names             | spaces, Chinese characters, `#`, `?`, `%` — they break URLs and storage keys  |
| Extensions                  | `.jpg .jpeg .png .webp .avif .gif .svg`; use `.jpg`/`.webp` for photos        |
| A folder matching no handle | **hard error**, never a silent skip — a typo is how a colour vanishes         |

Folders are named by `handle` because **titles change and handles do not**: the
handle rule freezes a handle once its product is non-draft precisely so URLs
survive renames, and a tree named after titles strands every file the first time
marketing renames something. Handle is also filesystem-safe by construction,
whereas a title may contain characters Windows forbids in a path (`\ / : * ? " < > |`).

Naming folders by title is viable if the server derives the handle with
`productHandle()` — but it must then reject a folder whose name yields no valid
handle, not skip it. `npm run handles` does the same derivation for a title
list, and fails the batch on a collision.

## Acceptance criteria

- [ ] Every product card (/, /shop) and detail page shows its own DB-driven
      image and copy — no shared placeholder art between SKUs.
- [ ] Importing a CSV + image folder creates/updates all 120 SKUs in one run.
- [ ] Re-running an import upserts in place (idempotent — safe content passes).
- [ ] Invalid rows are reported per-row; a failed row never partially writes.
- [ ] A folder or image row naming an unknown handle fails the run loudly.
- [ ] An import never deletes a variant that the file simply did not mention.
- [ ] Stock arriving via import is written as an inventory movement, not as a
      raw column write, so the ledger stays complete.
- [ ] The service-role key never reaches the browser.
- [ ] Storefront reflects an import without a redeploy.
- [ ] Human acceptance: teammate/owner imports real content and sees the
      storefront pages update (gates UAT → VERIFIED).

## Plan

1. Widen `Export` to the full round-trip column set, so import and export share
   one format and a round trip loses nothing.
2. Wire storefront areas to DB: detail-page hero/gallery from `product_images`,
   description/subtitle blocks; then shop/home card images. Update or scope the
   pixel-diff guard for these regions.
3. Upload plumbing: a server action that authenticates the admin and mints
   signed upload URLs; the browser uploads directly to Storage; a second action
   records `product_images` rows once the bytes have landed.
4. Folder → data: parse the tree, resolve folder names to handles and SKUs,
   validate, and **preview before writing**.
5. Importer service: parse CSV, validate, dry-run preview, upsert products and
   variants by handle + SKU.
6. Admin Import UI (Products → Import), replacing the inert placeholder modal.
7. Tests: unit (parser/validator/upsert) + e2e (import → storefront shows it).

## Tech details

- **Vercel caps a serverless request body at ~4.5 MB.** This is what forces
  direct-to-Storage uploads — a single modern phone photo can exceed it.
- **Signed upload URLs** let a browser write to Storage without holding a
  credential: the server calls `createSignedUploadUrl(path)` with the service
  key, the browser calls `uploadToSignedUrl(path, token, file)`. Scoped to one
  path and expiring, so a leak costs one object, not the database.
- **Uploads are renamed on the way in.** `safeKey()` prefixes 8 random hex
  characters, so the stored key is never the uploaded filename — anything
  matching CSV rows to files must carry a filename → key map out of the upload
  step.
- **`product_images` has no `variant_id`** — colour variants share one gallery
  today. See OQ-1.
- **`inventory_on_hand` is not writable in practice.** The save path routes
  changes through `adjustInventory()` as logged movements; writing the column
  directly desynchronises stock from its ledger.
- **`saveProduct` deletes variants missing from its input** — correct for a
  form, lethal for a partial import. See OQ-2.
- **Postgres owns uniqueness, TypeScript owns derivation.** The `UNIQUE`
  constraints are the only layer that holds under concurrent writes; handle
  derivation stays single-implementation, because a Postgres rewrite would have
  to reproduce NFKD exactly (`unaccent` does not) and a disagreement makes the
  handle depend on which code path created the product.

## Blockers and dependencies

- SKU rules first (or together): the import upserts by handle+SKU, which
  assumes SKUs are unique and non-blank — rules + enforcement in
  [../Database.md § SKU rules](../Database.md).
- **`product_redirects` does not exist.** An active product's handle cannot be
  changed safely without it, and the handle rule says to add the migration
  before the 120-SKU import, not after.
- Not blocked, but deliberately queued behind the owner activation items
  (SUMMARY.md Release queue) — this is the delivery vehicle for SUMMARY OQ-3
  (real product content), which lands after ship.
- Tension to resolve during design: the pixel-diff guard assumes static pixels;
  live-wired regions need excluding or per-SKU baselines.

## Open questions

### OQ-1 — do images attach to a product or to a variant?

`product_images` has `product_id` only, so every colour of one rose shares a
gallery. With a `RED PNK BLU PUR WHT GLD RNB` vocabulary, a customer selecting
Blue is shown the red photographs.

- **(a)** Accept the shared gallery — no work, wrong for a colour-led catalogue.
- **(b)** One product per colour — no schema change, no colour switcher, 120
  products instead of ~40.
- **(c)** Add `variant_id` and wire the PDP gallery to the variant selector.

Recommend **(c)**, decided *before* the supplier names several hundred files.
Until it lands the importer should use product-level files and **warn about SKU
folders it ignores**, not flatten seven heroes into one gallery.

### OQ-2 — does a partial file update or replace a product's variants?

- **(a)** Reject any incomplete set — safe, but a price-only edit means
  re-uploading everything.
- **(b)** Update rows present, leave absent variants alone, delete only in the
  form — but then the importer cannot hand rows to `saveProduct` untouched; it
  must load current variants and merge.

Recommend **(b)**: partial bulk edits are the point of a spreadsheet.

### OQ-3 — batch or per-file signed upload URLs?

**(a)** All URLs in one request — simple, but a slow upload can outlive the
token. **(b)** One per file — survives long uploads, one extra round trip each.

### OQ-4 — does `cost_cents` belong in the export?

Cost is commented **private** (§7.2, never in `catalog_products`). Including it
enables bulk margin edits; it also means cost leaves the admin in a downloadable
file.

## Verification evidence

None yet — BACKLOG.

## Related links

- SUMMARY OQ-3 → [SUMMARY.md · Product decisions](../../SUMMARY.md#product-decisions)
- Column-by-column requirements: [Database.md § Table shapes](../Database.md)
- Handle rule and its fixtures: [product-handles.md](../ixd/naming/product-handles.md)
- Current live-text wiring: `app/products/[slug]/page.tsx`, `app/shop/page.tsx`,
  `lib/admin/products.ts` (`revalidateStorefront`)
- Existing export (mirror for the import UI): `app/api/admin/products/export/route.ts`
- Handle derivation CLI: `scripts/product-handle.ts` (`npm run handles`)
