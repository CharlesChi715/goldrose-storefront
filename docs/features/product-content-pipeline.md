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

Not chosen yet (BACKLOG) — but the shape below was worked out on 2026-08-03 and
is the recommendation on the table, pending owner sign-off and the two open
questions.

**Two inputs, both keyed on `handle` + `SKU` — the same keys the admin and the
CSV already use, so nothing new has to be learned or kept in sync:**

1. **A CSV for the words**, in exactly the format `Export` already produces.
2. **A folder tree for the pictures**, uploaded straight to Supabase Storage.

Bytes and words travel separately because a spreadsheet can name a file but can
never carry one.

## Options considered

| Option                                          | Pros                                                                                     | Cons                                                                                       | Verdict                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------- |
| Admin form editing only (already built)         | Ships today; forms cover title/price/media/variants/SEO                                  | 120 SKUs one-by-one is slow; most fields aren't displayed on the storefront yet             | ❌ needed but insufficient |
| **CSV round-tripping the existing export**      | No second spec to drift; Export *is* the template; re-import of an untouched file is a no-op, which is the idempotency criterion for free | Export's 11 columns are far short of the full record — must be widened first                | ✅ **chosen**              |
| A new, purpose-designed CSV column spec         | Exactly the columns we want                                                              | A second format to document, translate and keep in step with the form; drift is invisible until an import silently blanks a field | ❌                         |
| `.xlsx` instead of CSV                          | Native to what the team already edits                                                    | Needs a parsing library; Excel and WPS both export CSV anyway                               | ❌                         |
| Images uploaded through a Vercel server action  | One code path, session already available                                                 | **Impossible** — Vercel caps a serverless request body at ~4.5 MB; a single photo can exceed it | ❌                         |
| **Images uploaded browser → Supabase Storage**  | No size ceiling, no Vercel bandwidth or function time, one hop fewer                     | Needs signed upload URLs and a preview step; more moving parts                              | ✅ **chosen**              |
| Ship the service-role key to the browser        | Trivially simple                                                                         | Bypasses every RLS policy on the database — a release-gate violation, never acceptable       | ❌                         |
| Image URLs in a CSV column, downloaded server-side | No upload UI at all                                                                    | Product photos would live on the supplier's server indefinitely; `fileUrl()` would pass the foreign URL straight through | ❌                         |

## File formats

### The CSV

**One row = one variant.** Every `products` column repeats on each of that
product's variant rows; `Handle` binds the row to its parent, `SKU` identifies
the row itself. Column-by-column requirements live in
[Database.md § Table shapes](../Database.md) — that is the authoritative list,
not this file.

Images ride on **extra rows** carrying only `Handle` plus the image columns
(Shopify's convention). A row with a SKU is a variant row; a row without one is
an image row.

```
Handle,Title,...,SKU,Price,Image file,Image alt
24k-gold-rose,24K Gold Rose,...,GR-ROSE-RED,49.99,,
24k-gold-rose,,...,GR-ROSE-BLU,49.99,,
24k-gold-rose,,...,,,hero.jpg,Red rose in a glass dome
24k-gold-rose,,...,,,1.jpg,Gift box open
```

`Image file` is **not** a database column. It is a lookup key: the importer
resolves it to the `product_images.path` the upload produced, then discards it —
exactly as `Handle` resolves to `product_id` and is discarded.

### The folder tree

**Depth decides scope.** Files directly in the product folder belong to the
whole product; files in a `<SKU>/` subfolder belong to that variant only. A
single-variant product therefore needs no subfolder at all, which is the common
case.

```
product-images/
├── eternal-rose-in-glass-dome/      ← single variant: no SKU level needed
│   ├── hero.jpg
│   └── 1.jpg
└── 24k-gold-dipped-eternal-rose/
    ├── hero.jpg                      ← applies to every variant
    ├── 1.jpg
    ├── GR-ROSE-RED/
    │   ├── hero.jpg                  ← this colour only
    │   └── 1.jpg
    └── GR-ROSE-BLU/
        └── hero.jpg
```

| Rule                   |                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Product folder         | the `handle` — never the title (see below)                                          |
| Variant folder         | the `SKU`; already uppercase A–Z, digits and hyphens by the SKU rule, so it is filesystem-safe |
| Hero                   | `hero.*` — always position 0                                                        |
| The rest               | `1.*`, `2.*`, `3.*` … read as **integers**, never sorted as text (`10` sorts before `2` as text) |
| Banned in names        | spaces, Chinese characters, `#`, `?`, `%` — they break URLs and storage keys         |
| Extensions             | `.jpg .jpeg .png .webp .avif .gif .svg` are accepted; use `.jpg`/`.webp` for photos  |
| A folder matching no handle | a **hard error**, never a silent skip — a typo is how a whole colour vanishes    |

Folders are named by `handle` rather than by title for one decisive reason:
**titles change and handles do not.** The handle rule freezes a handle once its
product is non-draft precisely because URLs must survive marketing renames; a
tree named after titles goes stale the first time a product is renamed, and then
several hundred files point at nothing. Handle is also filesystem-safe by
construction (`^[a-z0-9]+(-[a-z0-9]+)*$`) whereas a title may contain spaces,
punctuation, or characters Windows forbids outright (`\ / : * ? " < > |`).

If the team would rather name folders by title anyway, the server can derive the
handle from the folder name with `productHandle()` — but it must then reject a
folder whose name cannot yield a valid handle, rather than skipping it.

`npm run handles` derives handles from a title list for exactly this purpose,
and fails the batch when two titles collide.

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

- **Vercel caps a serverless function's request body at ~4.5 MB.** This is what
  forces direct-to-Storage uploads; it is not a preference. A folder of a few
  hundred photos is orders of magnitude over the limit, and a single modern
  phone photo can exceed it on its own.
- **Signed upload URLs** are the way to let a browser write to Storage without
  holding a credential: the server calls `createSignedUploadUrl(path)` with the
  service key and returns a token; the browser calls
  `uploadToSignedUrl(path, token, file)`. The capability is scoped to one path
  and expires, so a leak costs one object rather than the database.
- **Uploads are renamed on the way in.** `safeKey()` in `lib/admin/files.ts`
  prefixes 8 random hex characters, so the stored key is never the filename that
  was uploaded. Anything matching a CSV row to a file must therefore carry a
  filename → key map out of the upload step; matching on the stored path will
  not work.
- **`product_images` has no `variant_id`.** Images are product-level, so colour
  variants share one gallery today. See OQ-1.
- **`inventory_on_hand` is not a writable column in practice.** The save path
  keeps the existing value and routes changes through `adjustInventory()` as
  logged movements. An importer that writes the column directly desynchronises
  the stock number from its ledger.
- **`saveProduct` deletes variants missing from its input.** Correct for a form,
  where the screen always shows every variant; lethal for an import, where a
  partial file would silently delete the variants it did not mention. See OQ-2.
- **Postgres owns uniqueness, TypeScript owns derivation.** `products.handle
  UNIQUE` and the partial `product_variants_sku_unique` index are the only
  layers that can guarantee uniqueness under concurrent writes. Handle
  *derivation* stays in `lib/admin/product-handle.ts` as the single
  implementation — a Postgres rewrite would need to reproduce NFKD normalisation
  exactly (`unaccent` does not), and two implementations that disagree produce a
  handle that depends on which code path created the product.

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
single gallery. With a SKU vocabulary of `RED PNK BLU PUR WHT GLD RNB`, a
customer selecting Blue would be shown the red photographs.

- **(a)** Accept the shared gallery — no work, wrong for a colour-led catalogue.
- **(b)** One product per colour — no schema change, but no colour switcher on a
  single page, and 120 products instead of ~40.
- **(c)** Add `variant_id` to `product_images` and wire the PDP gallery to the
  variant selector — a migration plus frontend work.

Recommend **(c)**, decided *before* the supplier names several hundred files.
Until it lands, the importer should use product-level files and **warn about
SKU folders it is ignoring** rather than flattening seven heroes into one
gallery.

### OQ-2 — does a partial file update or replace a product's variants?

- **(a)** A handle's rows must be complete; any partial set is rejected. Safe,
  but a price-only edit means exporting and re-uploading everything.
- **(b)** Rows present are updated, absent variants are left alone, and deletion
  happens only in the admin form. Friendlier, but the file no longer describes
  the whole product, and the importer cannot hand its rows to `saveProduct`
  untouched — it must load current variants and merge.

Recommend **(b)**: partial bulk edits are the entire point of a spreadsheet.

### OQ-3 — batch or per-file signed upload URLs?

- **(a)** Mint all URLs in one request — simple, but a slow uploader can outlive
  the token expiry mid-run.
- **(b)** One request per file — survives long uploads, at the cost of one extra
  round trip per photo.

### OQ-4 — does `cost_cents` belong in the export?

Cost per item is commented **private** in the schema (§7.2, never in
`catalog_products`). Including it makes bulk margin edits possible; it also
means cost leaves the admin in a downloadable file.

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
