# Product handle rule — one title, one handle, every time

|  |  |
| --- | --- |
| **What this is** | A deterministic algorithm for deriving `products.handle` (the `/products/<handle>` URL segment) from `products.title`. Any person or AI model following it must produce the **identical** string. |
| **Scope** | Public product URLs only. SKU naming is [`Database.md`](../../Database.md#sku-naming-convention-2026-07-25); Figma frame and section naming is [`figma-route-rule.md`](figma-route-rule.md) in this folder. |
| **Status** | **Adopted** — this is the final rule for new GoldRose product handles. |
| **Version** | 2.1 — full-title slugification with stop words retained, adopted 2026-07-30. Replaced v1.0, which stripped boilerplate, stop words, brand and variant tokens and truncated at 60 chars. |
| **Owner** | Charles |
| **Depends on** | A `product_redirects` table, which **does not exist yet** (see [§6](#6-freeze-and-redirects)) |

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

Sources:

- [Google URL structure best practices](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- [Shopify product URL handles](https://help.shopify.com/en/manual/products/import-export/using-csv)

**That is why the whole title is kept.** Automatically deleting common words
can make a handle less natural, introduces an arbitrary language-specific list,
and increases collisions. Page titles, headings, product copy, structured data,
internal links, and canonical tags remain more important SEO controls than
trying to prune individual URL words.

It also removes the need for a second input. v1.0 had to know whether a colour
or size word was a variant axis (`products.option_names`) before it could decide
whether to strip it. Nothing is stripped now, so that fact is never needed —
including when variants ship.

> **Guidance, not algorithm:** keep variant words out of titles — `Eternal Rose`,
> not `Eternal Rose — Ruby Red`. A title naming one colour while the page shows a
> colour picker contradicts itself, but that is a product-data problem to fix in
> the title, not something the handle rule compensates for.

---

## 2. The algorithm

Input: `products.title`. Nothing else.

1. **Unicode normalise.** Apply NFKD, then delete all combining marks
   (`U+0300`–`U+036F`). `Rosé` → `Rose`.
2. **Lowercase.**
3. **Delete apostrophes entirely** — `'` (U+0027) and `’` (U+2019).
4. **Replace every run of characters outside `[a-z0-9]` with a single `-`.**
5. **Trim leading and trailing `-`.**
6. **Validate** ([§4](#4-validation)). On failure, do **not** invent a handle —
   raise the error and require a manual one.

Order is load-bearing: step 3 before step 4 turns `Valentine's` into
`valentines`, not `valentine-s`.

---

## 3. Stop words are retained

Do **not** maintain or apply a stop-word list. Words such as these remain when
they appear in `products.title`:

```text
a  an  the  of  and  or  with  in  on  for  to  by  from  at
```

Examples:

- `Eternal Rose in Glass Dome` → `eternal-rose-in-glass-dome`
- `A Rose for You` → `a-rose-for-you`
- `Rose with Display Box` → `rose-with-display-box`

This is deliberate, not an exception. Stop-word removal is technically
possible, but it is not a required SEO standard and it weakens the promise that
the handle is simply the URL-safe form of the stored title.

---

## 4. Validation

```
^[a-z0-9]+(-[a-z0-9]+)*$      # format
length ≤ 120                   # sanity bound; the column itself is unbounded
unique across products         # enforced by products.handle UNIQUE
```

On any failure: **stop and report.** Never append a number (`-2`), never
truncate. A collision means two titles normalise to the same handle — revise the
title or set a deliberate, unique manual handle.

---

## 5. Fixtures — self-check

Any implementation or model must reproduce every row exactly.

⚠️ **Every title below is an invented test input, not a product name.** No
GoldRose product title is decided yet (OQ-3), and none of these is a proposal.
Each row exists only to pin one behaviour of the algorithm:

| Row | Pins |
| --- | --- |
| 1 | digits and letters in one token (`24k`) |
| 2 | apostrophe deleted, not hyphenated; em dash as a separator |
| 3 | stop word retained ([§3](#3-stop-words-are-retained)) |
| 4 | NFKD — diacritics stripped, not turned into separators |
| 5 | a run of space + `&` + double space collapsing to a single `-` |
| 6 | comma as a separator; size word retained |
| 7 | colour word retained — the v1.0 contrast case |
| 8 | length: 74 characters, not truncated |

**Keep these rows when real titles arrive.** A fixture's job is to lock the
algorithm, not to describe the catalogue — swapping in real product names would
lose the edge cases and make the table go stale every time marketing renames
something. Add rows for genuinely new edge cases instead.

| # | `title` | Expected handle |
| --- | --- | --- |
| 1 | `24K Gold Dipped Eternal Rose` | `24k-gold-dipped-eternal-rose` |
| 2 | `24K Gold Dipped Rose — Valentine's Gift Set` | `24k-gold-dipped-rose-valentines-gift-set` |
| 3 | `Eternal Rose in Glass Dome` | `eternal-rose-in-glass-dome` |
| 4 | `Rosé Éternelle` | `rose-eternelle` |
| 5 | `Rose & Box  Set` | `rose-box-set` |
| 6 | `Display Box, Large` | `display-box-large` |
| 7 | `24K Gold Dipped Rose — Ruby Red` | `24k-gold-dipped-rose-ruby-red` |
| 8 | `Eternal Rose Anniversary Keepsake Collection Gift Box Presentation Edition` | `eternal-rose-anniversary-keepsake-collection-gift-box-presentation-edition` |

Row 5 shows a run of spaces, `&` and spaces collapsing to one `-`. Row 8 is 74
characters and is **not** truncated. No row requires a manual handle.

---

## 6. Freeze and redirects

| `products.status` | Handle |
| --- | --- |
| `draft` | generated, freely editable |
| `active` | **frozen** |
| `archived` | frozen |

Changing an active product's handle requires a `product_redirects` row
(`old_handle → product_id`) so the old URL returns 301, not 404.

⚠️ **That table does not exist.** Until it does, an active handle cannot be
changed safely at all. Add the migration before the 120-SKU import, not after.

---

## 7. Enforcement

⚠️ **Not enforced today, and the shipping code disagrees with this document.**
`slugify` / `uniqueHandle` in `lib/admin/products.ts` is what actually derives
handles, and it:

- **appends `-2`, `-3` on collision** — forbidden by [§4](#4-validation);
- falls back to the literal `"product"` on empty input instead of failing;
- skips NFKD and apostrophe deletion, so `Rosé Éternelle` → `ros-ternelle` and
  `Valentine's` → `valentine-s`;
- truncates mid-token at 60 characters.

Under v1.0 those were four bugs plus a wholly different token pipeline. Under
this version the gap is small: steps 1 and 3 and the failure behaviour. Port
[§8](#8-reference-implementation) into `lib/admin/products.ts`, make collisions
throw, and encode §5 as a unit test so prose and code cannot drift — the pattern
`tests/unit/element-names.test.ts` already uses. Do it **before** the 120-SKU
import.

---

## 8. Reference implementation

Normative for ties: if prose and code disagree, the **prose wins** and the code
is a bug.

⚠️ **This block is a specification artifact, not shipped code.** Nothing imports
it and nothing in the app runs it. It exists to remove ambiguity for whoever
implements the real function — a person or an AI model — and to give the §5
fixtures something exact to check against. The production implementation belongs
in `lib/`; once it exists, replace this block with a pointer to it
([§7](#7-enforcement)).

```js
const MAX_LENGTH = 120;

/**
 * Derives the public product handle from a product title.
 *
 * @param {string} title - products.title
 * @returns {string} the handle, matching ^[a-z0-9]+(-[a-z0-9]+)*$
 * @throws {Error} when no valid handle can be derived; set one manually
 */
function productHandle(title) {
  const handle = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (handle.length > MAX_LENGTH || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)) {
    throw new Error(`Cannot derive a handle from "${title}" — set it manually.`);
  }
  return handle;
}
```

Uniqueness is not checked here — it is the caller's job, against
`products.handle UNIQUE`. On collision, **throw**; do not disambiguate.
