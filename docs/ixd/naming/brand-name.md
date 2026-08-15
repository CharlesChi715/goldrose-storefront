# Brand name rule — ELDREVE in copy, `goldrose` in identifiers

|                  |                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **What this is** | Which name appears where. The brand is **ELDREVE**; a handful of `goldrose` strings are identifiers and must not be renamed.                    |
| **Scope**        | Every user-visible string, asset path, key and hostname in this repository, plus the Figma file's own wording.                                  |
| **Status**       | **Adopted.** Brand resolved 2026-08-03 (SUMMARY OQ-4); rename executed 2026-08-05 on `feat/eldreve-rename` (AI-021); casing ruled by the owner. |
| **Owner**        | The bosses (brand) · Charles (implementation)                                                                                                   |
| **See also**     | [figma-route-rule.md](figma-route-rule.md) · [product-handles.md](product-handles.md) · [design-sync state](../README.md)                       |

---

## 1. The rule

- **Prose casing is all-caps ELDREVE, everywhere** (owner ruling, 2026-08-05).
  Not "Eldreve", not "EldReve" — copy, page titles, alt text, admin i18n,
  emails and error strings all use the same six capitals.
- **`goldrose.co` is superseded.** The live domain is `eldreve.com`
  (Cloudflare Registrar, boss-owned account).

## 2. What the 2026-08-05 rename changed

1. `GoldRose` / `GOLDROSE` in all copy, titles, alt text and admin i18n.
2. The title-case "Eldreve" in the Supabase auth email templates.
3. The `public/veloria/` asset namespace → `public/eldreve/`.

## 3. What keeps the old name on purpose

These are **identifiers, not copy**. Renaming them is a data migration wearing
a find-and-replace costume:

| Kept string                                         | Why renaming it is destructive                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| lowercase `goldrose-*` localStorage and cookie keys | A new key drops every admin session and empties every saved cart — the old values are still on visitors' devices under the old name |
| `goldrose-storefront.vercel.app`                    | The Vercel project hostname; it serves the same deployment as `eldreve.com`                                                         |
| `owner@goldrose.local`                              | A test fixture; the address is fictional and never sent to                                                                          |
| "24K Gold Rose"                                     | The literal noun for the product — a gold rose is what we sell, not a brand mention                                                 |
| the repo/directory name and the GitHub project      | Renaming was considered and not attempted; it breaks every local clone, worktree and remote reference for no reader's benefit       |

## 4. The sanctioned exception, and the open ones

- **The home page keeps the frame's wording** (AI-044, owner ruling
  2026-08-10): the hero eyebrow is `— G O L D R O S E —`, and two defaults went
  back to the frame's own text — `craft.workshop_title` ("Inside the GoldRose
  Workshop") and `occasion.intro` ("Find a GoldRose for every meaningful
  moment"). This partly reverses the 08-05 rename on `/`, and was raised as
  such before the ruling. All three are registry fields, so the decision is
  reversible with one save and no deploy
  ([home-content-admin](../../features/home-content-admin.md)).
- ⚠️ **AI-037 (open):** the Figma file still carries **GoldRose** and
  **VELORIA** in three frames the repo already renamed. Importing those frames
  verbatim would undo the rename — treat their wording as stale, not as design.
- ⚠️ **AI-035 (open):** two hosted `settings` rows missed the rename, so
  eldreve.com still renders the old name in places. Fixable in
  `/admin/settings` by an owner; no deploy needed.
