For agents: keep this file concise. 

1. Current Supabase. based on postgreSQL which is free and open source.
    Free tier ($0/month) covers your current scale comfortably — 500 MB of database is literally years of orders for a gift store. The next tier is ~US$25/month, and you'd only need it once traffic is real. Compare that to the Shopify subscription you're replacing (Advanced runs ~US$399/month): even the paid tier is a rounding error.

2. Rent a small server (~US$5–10/month) and install Postgres yourself

---

**DECISION (owner, 2026-07-22): Option 1 — Supabase.** No self-hosted
Postgres. The code already targets it (hosted Supabase backend + local file
fallback); what remains is the activation checklist in
[archive/BUILD-REPORT.md](archive/BUILD-REPORT.md) §5 step 1 (create the Supabase project and
set the env vars).

## Backup plan

Graduated (2026-07-25) to the feature record
[features/backend/db-backups.md](features/backend/db-backups.md) — Supabase
Free + nightly pg_dump→S3; decision, rejected options, and work items live
there.

## SKU rules (2026-07-24)

- **One physical item ↔ one SKU.** Never reuse a retired SKU (recycling mixes
  two items in sales history).
- **One listing (product page) per physical item.** Two listings sharing a SKU
  would need a shared-inventory layer we don't have — each variant row keeps its
  own `inventory_on_hand`, so counts drift and we oversell. Don't do it.
- **Bundles = new shelf item.** A gift set (rose + box + card) is pre-packed,
  physically separated stock → own SKU (e.g. `GR-SET-VAL`), own count. Rule:
  one undivided pile = one SKU; physically separated stock = new SKU.
- ⚠️ **Not yet enforced.** Schema mirrors Shopify's permissive behavior:
  `product_variants.sku` defaults `''`, no unique constraint (0001), and
  Duplicate copies SKUs verbatim (`lib/admin/products.ts`). Planned once
  confirmed: `0003` partial unique index (`where sku <> ''`), the same check in
  `lib/admin` (the local file adapter has no Postgres index), Duplicate clears
  copied SKUs, friendly admin validation + an activation gate (active products
  need non-blank SKUs; drafts may stay blank).

## SKU naming convention (2026-07-25)

**Standard pattern:** `GR-TYPE-COLOR[-ATTRIBUTE]`

For a 120-SKU line of gold-dipped roses that could look like:

| Segment | Fixed vocabulary (examples) |
| --- | --- |
| Brand | `GR` always |
| Type | `ROSE` single rose · `SET` gift set · `BOX` display box · `ACC` accessory |
| Color | `RED`, `PNK`, `BLU`, `PUR`, `WHT`, `RNB` (rainbow), `GLD` |
| ATTRIBUTE (only if needed) | `VAL` valentine, `ANN` anniversary, `L`/`S` size |

- **Pattern** — fixed segments, general → specific: `GR-TYPE-COLOR[-VARIANT]`
  (e.g. `GR-ROSE-RED`, `GR-ROSE-RNB-L`, `GR-SET-VAL`). Matches the existing
  `GR-SET-VAL` example above.
- **Vocabulary (proposed — finalize against the boss's 120-SKU product list):**
  TYPE `ROSE` single rose · `SET` gift set · `BOX` display box · `ACC`
  accessory; COLOR `RED` `PNK` `BLU` `PUR` `WHT` `GLD` `RNB` (rainbow);
  VARIANT only when needed (`VAL` valentine, `ANN` anniversary, `L`/`S` size).
  Always pick from this list — extend the list here first, never improvise a
  code (`PNK`, never sometimes `PINK`).
- **Characters:** uppercase A–Z + digits + hyphens only. No spaces/symbols. Ban
  ambiguous chars in new codes (`O`↔`0`, `I`↔`1`). **Never start a SKU with
  `0`** — Excel strips leading zeros and our 120-SKU pipeline is CSV-based.
- **Segment order is fixed even when segments are absent**: optional segments
  drop off the tail only (`GR-ROSE-RNB-L`, never `GR-ROSE-L-RNB`). Variable
  section counts coexist fine — systems treat SKUs as opaque strings; the
  consistent prefix is what makes `GR-ROSE-*` filtering work.
- **Encode only permanent, pick-relevant facts.** Price, supplier, shelf
  location change → DB columns, never the SKU. 3–4 segments max; a 5th–6th
  segment means something belongs in a column. Keep ≤20 chars (marketplace/3PL
  caps, e.g. Amazon 40).
