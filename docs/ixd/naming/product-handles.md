# Product handle rule — one title, one handle, every time

|  |  |
| --- | --- |
| **What this is** | A deterministic algorithm for deriving `products.handle` (the `/products/<handle>` URL segment) from `products.title`. Any person or AI model following it must produce the **identical** string. |
| **Scope** | Public product URLs only. SKU naming is [`Database.md`](../../Database.md#sku-naming-convention-2026-07-25); Figma frame and section naming is [`figma-route-rule.md`](figma-route-rule.md) in this folder. |
| **Opened** | 2026-07-30 |
| **Version** | 1.0 — Proposed, awaiting Charles's sign-off |
| **Owner** | Charles |
| **Depends on** | A `product_redirects` table, which **does not exist yet** (see [§8](#8-freeze-and-redirects)) |

---

## 1. Why this document exists

`handle` is the public URL. It must be **reproducible** (same title in, same
handle out, regardless of who or what computes it) and **stable** (it never
changes after the product goes live). Anything requiring taste or context is
deliberately excluded from the algorithm — see [§7](#7-what-is-deliberately-not-automated).

**The handle is derived once, at creation, then stored.** It is not a live
view of the title. Titles change for marketing reasons; URLs must not.

---

## 2. Inputs

| Input | Required | Source | If absent |
| --- | --- | --- | --- |
| `title` | yes | `products.title` | cannot proceed |
| `option_names` | **no — not at the current stage**, see below | `products.option_names` | treat as `[]` |

**Current stage, decided 2026-07-30: derive from `title` alone.**
`option_names` is not an input yet. It is treated as `[]`, so step 9 never strips
a colour or size token. This is safe *only* because handles are not frozen yet —
the store is pre-launch with three placeholder products (OQ-3) and no inbound
links, so a wrong handle costs a rewrite rather than a redirect.

The precondition that keeps title-only correct is to **keep variant words out of
titles**: name the product `Eternal Rose`, never `Eternal Rose — Ruby Red`.
Step 9 only fires when a title contains a colour or size word, so titles that
never name a variant need no second input at all.

⚠️ **`option_names` becomes required when variants ship.** Whether a colour or
size word belongs in the handle depends on whether it is a variant axis, and that
fact lives in `option_names`, not in the title text — a model given only a title
must then ask for it, or state the assumption it used. **Re-derive every handle
before go-live**, because that is the last moment a handle is free to change
([§8](#8-freeze-and-redirects)).

---

## 3. The algorithm

Run these steps **in this exact order**. Order is load-bearing: step 3 before
step 4 turns `Valentine's` into `valentines`, not `valentine s`.

1. **Unicode normalise.** Apply NFKD, then delete all combining marks
   (`U+0300`–`U+036F`). `Rosé` → `Rose`.
2. **Lowercase.**
3. **Delete apostrophes entirely** — `'` (U+0027) and `’` (U+2019). Delete, do
   not replace with a space.
4. **Replace every run of characters outside `[a-z0-9]` with a single space**,
   then trim.
5. **Split on whitespace** into a token list.
6. **Remove boilerplate phrases** ([§4.3](#43-boilerplate-phrases)), matching
   token sequences, **longest phrase first**, repeatedly until no match remains.
7. **Remove stop-word tokens** ([§4.1](#41-stop-words)).
8. **Remove brand tokens** ([§4.2](#42-brand-tokens)).
9. **Conditionally remove variant tokens** — ⚠️ **inert at the current stage**,
   because `option_names` is treated as `[]` ([§2](#2-inputs)):
   - if `option_names` contains `Color` or `Colour` (case-insensitive) → remove
     every colour token ([§4.4](#44-colour-tokens))
   - if `option_names` contains `Size` → remove every size token
     ([§4.5](#45-size-tokens))
10. **Remove duplicate tokens**, keeping the first occurrence.
11. **Truncate:** while more than one token remains and the joined result
    exceeds **60 characters**, remove the **last** token. Never cut mid-token.
12. **Join with a single hyphen `-`.**
13. **Validate** ([§5](#5-validation)). On failure, do **not** invent a handle —
    raise the error and require a manual one.

---

## 4. Closed lists

These lists are **closed**. Extend them in this document first; never improvise
a member. (Same discipline as the SKU vocabulary in `Database.md`.)

### 4.1 Stop words

```
a  an  the  of  and  or  with  in  on  for  to  by  from  at
```

### 4.2 Brand tokens

```
goldrose
```

The brand is already in the domain. Note `gold` alone is **not** here — it is a
colour (see §4.4) and is handled by the phrase list below.

### 4.3 Boilerplate phrases

Matched as token sequences, longest first:

```
24k gold dipped
24k gold plated
gold dipped
gold plated
24k
```

This is why `gold` is not a standalone drop word: removing the *phrase* strips
the material boilerplate while leaving a standalone `gold` intact when it is a
real colour.

### 4.4 Colour tokens

Word forms of the SKU `COLOR` vocabulary, plus observed marketing words:

```
red  pink  blue  purple  white  gold  rainbow  ruby
```

### 4.5 Size tokens

```
large  small  mini  standard
```

### 4.6 Generic stems — reject, do not ship

If the final result is exactly one of these, the algorithm **fails**:

```
rose  roses  set  gift  box  bouquet  accessory
gift-set  display-box  rose-set
```

A result this generic means the title describes a *variant*, not a product
(e.g. `"24K Gold Dipped Rose — Ruby Red"` with `Color` as an option axis). Fix
the title, or set the handle manually.

---

## 5. Validation

The result must satisfy **all** of:

```
^[a-z0-9]+(-[a-z0-9]+)*$      # format
length ≥ 1  and  ≤ 60          # bounds
not a member of §4.6           # not a generic stem
unique across products         # enforced by products.handle UNIQUE
```

On any failure: **stop and report.** Never append a number (`-2`), never
truncate mid-word, never guess. A numeric suffix means two products share a
title — fix the title.

---

## 6. Fixtures — self-check

Any implementation or model must reproduce every row exactly.

| # | `title` | `option_names` | Expected handle |
| --- | --- | --- | --- |
| 1 | `24K Gold Dipped Eternal Rose` | `["Color"]` | `eternal-rose` |
| 2 | `24K Gold Dipped Rose — Valentine's Gift Set` | `["Color"]` | `rose-valentines-gift-set` |
| 3 | `Eternal Rose in Glass Dome` | `["Color"]` | `eternal-rose-glass-dome` |
| 4 | `24K Gold Dipped Rainbow Rose` | `[]` | `rainbow-rose` |
| 5 | `Rosé Éternelle` | `[]` | `rose-eternelle` |
| 6 | `Rose & Box  Set` | `[]` | `rose-box-set` |
| 7 | `Display Box, Large` | `["Size"]` | `display-box` … **fails** §4.6 → manual |
| 8 | `Eternal Rose Anniversary Keepsake Collection Gift Box Presentation Edition` | `[]` | `eternal-rose-anniversary-keepsake-collection-gift-box` |
| 9 | `24K Gold Dipped Rose — Ruby Red` | `["Color"]` | **fails** §4.6 (`rose`) → manual |
| 10 | `Gold Rose Keepsake` | `["Size"]` | `gold-rose-keepsake` |

Row 7 is the instructive one: `Large` is dropped as a size variant, leaving
`display-box`, which is a generic stem — so it fails rather than shipping a
handle that will collide with every other display box.

Row 10 shows the phrase rule working: `gold` survives because
`gold dipped` never appeared.

⚠️ **At the current stage** ([§2](#2-inputs)) only rows 4, 5, 6 and 8 can occur —
every other row carries a non-empty `option_names` and so exercises the inert
step 9. They stay in the table as the spec for when variants ship.

---

## 7. What is deliberately not automated

Removing "marketing fluff" (`premium`, `luxury`, `exclusive`, `best`) is
**not** part of the algorithm. Judging which adjectives are fluff and which are
product identity is taste, and taste is not reproducible across models — the
whole point of this document.

Those words stay in the generated handle. The merchant may edit the handle
freely **while the product is a draft**. Guidance, not algorithm.

---

## 8. Freeze and redirects

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

## 9. Enforcement

- **Format + generic-stem check:** `lib/admin/products.ts`, beside the existing
  SKU uniqueness check. Postgres `UNIQUE` covers collisions but not format, and
  the local file adapter has no constraints at all — the same reason migration
  `0003` needed an app-level SKU check.
- **Fixtures:** encode §6 as a unit test so the algorithm cannot drift.

---

## 10. Reference implementation

Normative for ties: if prose and code disagree, the **prose wins** and the code
is a bug.

```js
const STOP = new Set(["a","an","the","of","and","or","with","in","on","for","to","by","from","at"]);
const BRAND = new Set(["goldrose"]);
const PHRASES = [
  ["24k","gold","dipped"],
  ["24k","gold","plated"],
  ["gold","dipped"],
  ["gold","plated"],
  ["24k"],
];
const COLOR = new Set(["red","pink","blue","purple","white","gold","rainbow","ruby"]);
const SIZE = new Set(["large","small","mini","standard"]);
const GENERIC = new Set([
  "rose","roses","set","gift","box","bouquet","accessory",
  "gift-set","display-box","rose-set",
]);
const MAX_LENGTH = 60;

/**
 * Derives the public product handle from a product title.
 *
 * @param {string} title - products.title
 * @param {string[]} optionNames - products.option_names
 * @returns {string} the handle, matching ^[a-z0-9]+(-[a-z0-9]+)*$
 * @throws {Error} when no valid handle can be derived; set one manually
 */
function productHandle(title, optionNames = []) {
  const axes = new Set(optionNames.map((n) => n.trim().toLowerCase()));
  const dropColor = axes.has("color") || axes.has("colour");
  const dropSize = axes.has("size");

  let tokens = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  for (const phrase of PHRASES) {
    for (let i = 0; i + phrase.length <= tokens.length; ) {
      if (phrase.every((word, k) => tokens[i + k] === word)) {
        tokens.splice(i, phrase.length);
      } else {
        i++;
      }
    }
  }

  tokens = tokens.filter((t) => !STOP.has(t) && !BRAND.has(t));
  if (dropColor) tokens = tokens.filter((t) => !COLOR.has(t));
  if (dropSize) tokens = tokens.filter((t) => !SIZE.has(t));
  tokens = tokens.filter((t, i) => tokens.indexOf(t) === i);

  while (tokens.length > 1 && tokens.join("-").length > MAX_LENGTH) tokens.pop();

  const handle = tokens.join("-");
  if (
    !handle ||
    handle.length > MAX_LENGTH ||
    GENERIC.has(handle) ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)
  ) {
    throw new Error(`Cannot derive a handle from "${title}" — set it manually.`);
  }
  return handle;
}
```

---

## 11. Prompt block — paste this to any AI model

> Derive a GoldRose product handle. Follow `docs/ixd/naming/product-handles.md`
> exactly.
> Input: `title` only at the current stage — treat `option_names` as `[]`, which
> makes the variant step below inert. (When variants ship it becomes a required
> second input; see §2.)
> Steps, in order: NFKD-normalise and strip combining marks → lowercase →
> delete apostrophes → replace non-`[a-z0-9]` runs with a space → split into
> tokens → remove boilerplate phrases longest-first (`24k gold dipped`,
> `24k gold plated`, `gold dipped`, `gold plated`, `24k`) → remove stop words
> (`a an the of and or with in on for to by from at`) → remove `goldrose` →
> if `Color`/`Colour` is an option axis remove `red pink blue purple white gold
> rainbow ruby`; if `Size` is an axis remove `large small mini standard` →
> drop duplicate tokens keeping the first → while >1 token and joined length
> >60 drop the last token → join with `-`.
> Reject the result if it is empty or one of
> `rose roses set gift box bouquet accessory gift-set display-box rose-set`;
> say a manual handle is required instead. Never append a number. Output only
> the handle.
