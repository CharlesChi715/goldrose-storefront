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

**One upload: a spreadsheet and a folder.**

- **The spreadsheet holds the words** — `.csv` or `.xlsx`, 32 columns, one row
  per variant.
- **The folder holds the pictures** — one subfolder per product, named by its
  Title, uploaded straight to Supabase Storage.

They travel separately because a spreadsheet can name a file but never carry
one, and neither names the other: the folder is the only source for images, the
spreadsheet the only source for everything else. Both are matched on **Title →
handle**, derived server-side, so nobody uploading has to know what a handle is.

## Options considered

| Option                                       | Why not / why                                                                      | Verdict        |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | -------------- |
| Admin form only (built)                      | 120 SKUs one-by-one, and most fields aren't displayed yet                          | insufficient.  |
| **CSV round-tripping the export**            | No second spec to drift; Export *is* the template; re-importing an untouched file is a no-op — idempotency for free. Export's 11 columns must be widened first | ✅ **chosen**  |
| **Accept `.csv` and `.xlsx`**                | One dependency (SheetJS), converted to rows at the door so one parser serves both; removes the "Save as" step and the encoding trap entirely | ✅ **chosen**  |
| Upload via a Vercel server action            | **Impossible** — Vercel caps a request body at ~4.5 MB, under one photo            | ❌             |
| **Upload browser → Supabase Storage**        | No size ceiling, no Vercel bandwidth or function time                              | ✅ **chosen**  |
| Service-role key in the browser              | Bypasses every RLS policy — release-gate violation                                 | ❌             |
| Image URLs downloaded server-side            | Photos would live on the supplier's server indefinitely                            | ❌             |

## File formats

### The spreadsheet — `.csv` or `.xlsx`

`.xlsx` is converted to rows on arrival, so everything downstream sees one
shape. Two rules the converter needs: read **only the first sheet**, and reject
a file whose cells evaluate to errors rather than importing `#REF!` as a product
title.

**One row = one variant.** Every `products` column repeats on each of that
product's variant rows; `Handle` binds the row to its parent, `SKU` identifies
the row itself. Per-column database rules live in
[Database.md § Table shapes](../Database.md) — that is the authoritative list.

**32 columns, in this order.** Required first, so the columns that decide
whether an import succeeds are visible without scrolling. ▪ repeats on every row
of the product, ● varies per row.

**A — required.** Without these the row is rejected or the product cannot go
live.

| #    | Column          | Scope | Req                                   |
| ---- | --------------- | ----- | ------------------------------------- |
| 1    | Handle          | ▪     | blank ⇒ derive from Title (see below) |
| 2    | Title           | ▪     | ✓                                     |
| 3    | Description     | ▪     | ✓ if active                           |
| 4    | SKU             | ●     | ✓ if active                           |
| 5    | Price           | ●     | ✓                                     |
| 6–8  | Option1–3 name  | ▪     | ✓ if variants differ                  |
| 9–11 | Option1–3 value | ●     | ✓ if option names set                 |

**B — wanted.** Not enforced, but the storefront is visibly worse without them:
these are what customers and Google actually read.

| #  | Column           | Scope | Req                     |
| -- | ---------------- | ----- | ----------------------- |
| 12 | Status           | ▪     | ○ — defaults draft      |
| 13 | Short name       | ▪     | ○ — falls back to Title |
| 14 | Compare-at price | ●     | ○                       |
| 15 | On hand          | ●     | ○ — first import only   |
| 16 | Badge            | ▪     | ○                       |
| 17 | Best for         | ▪     | ○                       |
| 18 | Details          | ▪     | ○ — `;` separated       |
| 19 | SEO title        | ▪     | ○                       |
| 20 | SEO description  | ▪     | ○                       |
| 21 | Tags             | ▪     | ○ — `;` separated       |
| 22 | Type             | ▪     | ○                       |
| 23 | Vendor           | ▪     | ○                       |

**C — the rest.** Defaults are fine; fill them when there is a reason to.

| #  | Column                    | Scope | Req                |
| -- | ------------------------- | ----- | ------------------ |
| 24 | Charge tax                | ▪     | ○ — defaults true  |
| 25 | Requires shipping         | ▪     | ○ — defaults true  |
| 26 | Country of origin         | ▪     | ○ — ISO-2          |
| 27 | HS code                   | ▪     | ○                  |
| 28 | Barcode                   | ●     | ○                  |
| 29 | Cost                      | ●     | ○ — see OQ-4       |
| 30 | Track quantity            | ●     | ○ — defaults true  |
| 31 | Continue selling when OOS | ●     | ○ — defaults false |
| 32 | Weight (oz)               | ●     | ○                  |

**No image columns.** The folder tree is the only source for images — which
product, which variant, what order, and the alt slug all come from the paths.
Naming a file in both places would let the two disagree, and a typo would drop a
photo silently.

**Never columns:** `id`, `product_id`, `path`, `created_at`, `updated_at`, and
both `position` columns — variant order is row order, product order is set in
the admin, and the rest are generated.

**Handle is optional but not derived-only.** Blank means "derive from Title",
which is right when creating. It must still be *accepted*, because it is the
match key: with Handle present you can change a Title and update the existing
product, whereas deriving from Title alone means any edited title produces a new
handle and therefore a duplicate product rather than a rename. This mirrors
`SaveProductInput`, where `handle: null` means derive on create.

```
Handle,Title,Description,SKU,Price,Option1 name,Option1 value,Status
,24K Gold Dipped Eternal Rose,A real rose…,GR-ROSE-RED,49.99,Color,Red,active
,24K Gold Dipped Eternal Rose,A real rose…,GR-ROSE-BLU,49.99,Color,Blue,active
,Eternal Rose in Glass Dome,Preserved…,GR-BOX-WHT,64.99,,,draft
```

### The folder tree

One upload: a spreadsheet and a folder. **Each product subfolder is named by
the product's Title**, which the server converts to a handle with
`productHandle()` — the supplier never has to know what a handle is.

**Depth decides scope.** Files directly in the product folder belong to the
whole product; files in a `<SKU>/` subfolder belong to that variant. A
single-variant product needs no subfolder — the common case.

**File name = `<order>-<alt>.<ext>`.** The order prefix is `hero`, then `1`,
`2`, … The rest is an alt-text slug and is optional; `hero.jpg` is valid.

```
product-images/
├── Eternal Rose in Glass Dome/                ← Title, single variant
│   ├── hero-rose-in-glass-dome.jpg
│   └── 1-gift-box-open.jpg
└── 24K Gold Dipped Eternal Rose/
    ├── hero-gold-rose-on-marble.jpg           ← applies to every variant
    ├── GR-ROSE-RED/
    │   ├── hero-red-rose-in-glass-dome.jpg    ← this colour only
    │   └── 1-red-stem-detail.jpg
    └── GR-ROSE-BLU/
        └── hero-blue-rose-in-glass-dome.jpg
```

| Rule                     |                                                                             |
| ------------------------ | --------------------------------------------------------------------------- |
| Product folder           | the **Title**, converted server-side to the handle                          |
| Variant folder           | the `SKU` — already uppercase/digits/hyphens, so filesystem-safe            |
| Order prefix             | `hero` = position 0, then `1`, `2`, … read as **integers**; as text, `10` sorts before `2` |
| Alt slug                 | everything after the first `-`; optional, hyphen-separated                  |
| Banned in file names     | spaces, Chinese characters, `#`, `?`, `%` — they break URLs and storage keys |
| Extensions               | `.jpg .jpeg .png .webp .avif .gif .svg`; use `.jpg`/`.webp` for photos       |
| Folder matching no row   | **hard error** naming the folder — never a silent skip                      |

Alt text comes from the slug: `1-red-stem-detail` becomes "Red stem detail".
That is all the alt a folder can carry — no commas, no proper-noun capitals, no
Chinese — so alt is expected to be refined in the admin afterwards. The point is
that a blank alt never ships.

**Titles must be unique — and more than merely different.** Two products cannot
share a folder name, and beyond that two *different* titles can still normalise
to one handle ("Rose & Box Set" and "Rose, Box Set" both give `rose-box-set`),
which Postgres rejects on `products.handle UNIQUE`. `npm run handles` checks a
title list for exactly this before anyone names a folder.

Titles are also not always legal folder names: Windows forbids `\ / : * ? " < > |`
in a path, so a title containing one cannot be a folder at all. The importer must
say so by name rather than skipping the folder — losing a product's photos
silently is the failure that costs a day to notice.

Naming folders by handle instead would sidestep both problems, since a handle is
filesystem-safe by construction and frozen once a product is non-draft. It was
rejected because it asks the supplier to learn a concept that exists only inside
this system.

## Upload flow

Vercel sees the folder **names**; it never sees the **bytes**.

```
1. browser reads the folder  → manifest of relative paths (text, a few KB)
2. → Vercel   derive handles from folder names, check each exists, validate
              SKU subfolders, mint one signed upload URL per file
3. ← Vercel   the URLs, or an error naming the offending folder
4. browser → Supabase Storage   the bytes, direct
```

Step 2 is where every judgement call lands, and it has to be on the server
anyway — that is what holds the key that mints the URLs.

The spreadsheet takes the opposite route: it is a few hundred KB, so it posts to
Vercel and is parsed there, because validating a row needs the database.

| What            | Goes to          | Why                                                    |
| --------------- | ---------------- | ------------------------------------------------------ |
| spreadsheet     | Vercel           | small; every row needs a database check                |
| image manifest  | Vercel           | needs `productHandle()` and the database               |
| image bytes     | Supabase Storage | far over the ~4.5 MB cap, and needs no validation      |

## Acceptance criteria

- [ ] Every product card (/, /shop) and detail page shows its own DB-driven
      image and copy — no shared placeholder art between SKUs.
- [ ] Importing a CSV + image folder creates/updates all 120 SKUs in one run.
- [ ] Re-running an import upserts in place (idempotent — safe content passes).
- [ ] Invalid rows are reported per-row; a failed row never partially writes.
- [ ] A folder matching no row in the spreadsheet fails the run loudly, naming
      the folder.
- [ ] Two titles that normalise to one handle are reported before anything is
      written.
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
