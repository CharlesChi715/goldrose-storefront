---
name: naming
description: "The ELDREVE naming rules — Figma section/frame names, `data-el` component attributes, product URL handles, and the brand name itself. Use before naming a new frame, route, component attribute or product, before renaming anything that looks like a brand string, and whenever a name must be reproducible by a different person or model. Triggers: what should I call this, frame name, route name, data-el, product handle, slug, URL segment, GoldRose vs ELDREVE, rename."
metadata:
  author: charles
  version: "1.0.0"
---

# Naming rules

All four rules live in [`docs/ixd/naming/`](../../../docs/ixd/naming/). Read the
one you need; each is the authority for its own kind of name.

| Rule                      | Doc                   | The short version                                                                                                                                    |
| ------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma sections and frames | `figma-route-rule.md` | An UPPERCASE section per top-level route segment; a frame is named for its exact route, then `·`-separated design metadata (screen, viewport, state) |
| Rendered elements         | `component-names.md`  | The `data-el` vocabulary tying an element back to its design component — ⚠️ still a **draft**; Charles authors the grammar                           |
| Product URLs              | `product-handles.md`  | v2.1, **adopted and enforced**: derive once from the title, then freeze                                                                              |
| The brand                 | `brand-name.md`       | **ELDREVE** in all copy; the `goldrose` identifiers that must never be renamed                                                                       |

## The two that will break something if ignored

- **A handle is derived once, at creation, then stored** — never a live view of
  the title. `lib/admin/product-handle.ts` derives it, collisions **throw** (no
  `-2` suffix), and a non-draft handle is frozen. Whether a redirect table
  exists to catch a changed handle is stated in `product-handles.md` §5 —
  check there rather than assuming, because a changed handle with no redirect
  is a dead URL.
- **`goldrose` is sometimes an identifier, not a stale brand.** The lowercase
  `goldrose-*` localStorage/cookie keys, `goldrose-storefront.vercel.app`, the
  `owner@goldrose.local` fixture and the noun "24K Gold Rose" all stay.
  Renaming the storage keys drops every admin session and empties every saved
  cart. The home page's `— G O L D R O S E —` eyebrow is a **kept owner
  decision** (AI-044), not a miss.

`tests/unit/product-handle.test.ts` parses `product-handles.md` directly, so the
fixtures in that doc are executable — edit it and the suite checks you.
