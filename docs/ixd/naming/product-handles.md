# Product handle rule — one title, one handle, every time

|                    |                                                                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What this is**   | A deterministic algorithm for deriving `products.handle` (the `/products/<handle>` URL segment) from `products.title`. Any person or AI model following it must produce the **identical** string.                                                              |
| **Scope**          | Public product URLs only. SKU naming is [`Database.md`](../../Database.md#sku-naming-convention-2026-07-25); Figma frame and section naming is [`figma-route-rule.md`](figma-route-rule.md) in this folder.                                                    |
| **Status**         | **Adopted** — this is the final rule for new ELDREVE product handles.                                                                                                                                                                                         |
| **Version**        | 2.1 — full-title slugification with stop words retained, adopted 2026-07-30. Replaced v1.0, which stripped boilerplate, stop words, brand and variant tokens and truncated at 60 chars.                                                                        |
| **Owner**          | Charles                                                                                                                                                                                                                                                        |
| **Implementation** | `productHandle()` in [`lib/admin/product-handle.ts`](../../../lib/admin/product-handle.ts); the fixtures below are enforced by [`tests/unit/product-handle.test.ts`](../../../tests/unit/product-handle.test.ts), which parses this file (`npm run test:unit`) |
| **Depends on**     | A `product_redirects` table, which **does not exist yet** (see [§5](#5-freeze-and-redirects))                                                                                                                                                                  |

---

## 1. Why this document exists

`handle` is the public URL. It must be **reproducible** (same title in, same
handle out, regardless of who or what computes it) and **stable** (it never
changes once the product is live). **It is derived once, at creation, then
stored** — not a live view of the title. Titles change for marketing reasons;
URLs must not.

**A good handle:** stable, unique, lowercase, hyphen-separated, descriptive, and
readable. Google recommends readable words and hyphens in URLs; it does not
recommend deleting stop words. Shopify's default product handle is likewise
based on the product title.

**That is why the whole title is kept.** Automatically deleting common words
can make a handle less natural, introduces an arbitrary language-specific list,
and increases collisions. Page titles, headings, product copy, structured data,
internal links, and canonical tags remain more important SEO controls than
trying to prune individual URL words.

For now a colour or size word is a variant axis. (same products with diff colour and size
doesnt move to a diff product page)

---

## 2. The algorithm

Input: title of products (`products.title`). Nothing else.

1. **Unicode normalise.** Apply NFKD, then delete all combining marks
   (`U+0300`–`U+036F`). `Rosé` → `Rose`.
2. **Lowercase.**
3. **Delete apostrophes entirely** — `'` (U+0027) and `’` (U+2019).
4. **Replace every run of characters outside `[a-z0-9]` with a single `-`.**
5. **Trim leading and trailing `-`.**
6. **Validate** ([§3](#3-validation)). On failure, do **not** invent a handle —
   raise the error and require a manual one.

---

## 3. Validation

```
^[a-z0-9]+(-[a-z0-9]+)*$      # format
length ≤ 120                   # sanity bound; the column itself is unbounded
unique across products         # enforced by products.handle UNIQUE
```

On any failure: **stop and report.** Never append a number (`-2`), never
truncate. A collision means two titles normalise to the same handle — revise the
title or set a deliberate, unique manual handle.

---

## 4. Fixtures — self-check

Any implementation or model must reproduce every row exactly.

⚠️ **Every title below is an invented test input, not a product name.** No
ELDREVE product title is decided yet (OQ-3), and none of these is a proposal.
Each row exists only to pin one behaviour of the algorithm:

| Row | Pins                                                                   |
| --- | ---------------------------------------------------------------------- |
| 1   | digits and letters in one token (`24k`)                                |
| 2   | apostrophe deleted, not hyphenated; em dash as a separator             |
| 3   | stop word retained (deliberate, see [§1](#1-why-this-document-exists)) |
| 4   | NFKD — diacritics stripped, not turned into separators                 |
| 5   | a run of space + `&` + double space collapsing to a single `-`         |
| 6   | comma as a separator; size word retained                               |
| 7   | colour word retained — the v1.0 contrast case                          |
| 8   | length: 74 characters, not truncated                                   |

**Keep these rows when real titles arrive.** A fixture's job is to lock the
algorithm, not to describe the catalogue — swapping in real product names would
lose the edge cases and make the table go stale every time marketing renames
something. Add rows for genuinely new edge cases instead.

| #   | `title`                                                                      | Expected handle                                                              |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `24K Gold Dipped Eternal Rose`                                               | `24k-gold-dipped-eternal-rose`                                               |
| 2   | `24K Gold Dipped Rose — Valentine's Gift Set`                                | `24k-gold-dipped-rose-valentines-gift-set`                                   |
| 3   | `Eternal Rose in Glass Dome`                                                 | `eternal-rose-in-glass-dome`                                                 |
| 4   | `Rosé Éternelle`                                                             | `rose-eternelle`                                                             |
| 5   | `Rose & Box  Set`                                                            | `rose-box-set`                                                               |
| 6   | `Display Box, Large`                                                         | `display-box-large`                                                          |
| 7   | `24K Gold Dipped Rose — Ruby Red`                                            | `24k-gold-dipped-rose-ruby-red`                                              |
| 8   | `Eternal Rose Anniversary Keepsake Collection Gift Box Presentation Edition` | `eternal-rose-anniversary-keepsake-collection-gift-box-presentation-edition` |

Row 5 shows a run of spaces, `&` and spaces collapsing to one `-`. Row 8 is 74
characters and is **not** truncated. No row requires a manual handle.

---

## 5. Freeze and redirects

| `products.status`(0001_init.sql) | Handle                     |
| -------------------------------- | -------------------------- |
| `draft`                          | generated, freely editable |
| `active`                         | **frozen**                 |
| `archived`                       | frozen                     |

Changing an active product's handle requires a `product_redirects` row
(`old_handle → product_id`) so the old URL returns 301, not 404.

⚠️ **product_redirects does not exist.** Until it does, an active handle cannot be
changed safely at all. Add the migration before the 120-SKU import, not after.
