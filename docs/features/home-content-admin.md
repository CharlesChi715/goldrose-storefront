---
delivery: uat
rollout: live
statusChangedAt: 2026-08-10
priority: p1
---

# home-content-admin

## Context

Content → Home page (`/admin/content/home`) makes every string, photo, link and
band of the pixel-exact home page editable by a teammate who has never seen the
code. Built across four deliveries (2026-08-07 → 2026-08-10) and live in the
admin; it awaits the owner acceptance walkthrough.

**The mechanism is specified in
[`admin-design.md` §9.8.1](../../docs/admin-design.md#981-content--home-page)**
— registry, field kinds, character budgets, show/hide re-stacking, the section
map, the previews, the picker, framing and the scroll rules. This record keeps
the status, the rulings and the costs, and does not restate any of it.

## Decision

`lib/home-content/registry.ts` is the schema: it declares ~180 fields with the
**design's own wording as the default**, and `site_content` stores *only
overrides* — a row exists if and only if the value differs from the design.
There is no migration, no seed, and a Figma re-sync silently updates every
field nobody has touched.

## Plan

1. [x] Registry + the eight sections in page order, with a show/hide switch per
       Figma band (2026-08-07).
2. [x] Photos (`image`) and the shared rail speed (`number`), each photo paired
       with a description (2026-08-07).
3. [x] "Jump to a section" drawn as the page itself, at map scale (2026-08-08).
4. [x] Every section previews itself as a window on the real page (2026-08-08).
5. [x] Point at the page to edit the field under the pointer (2026-08-08).
6. [x] A replaced photo is framed, not centre-cropped (2026-08-08).
7. [x] The promo bar takes five lines and plays them; the header is pinned
       (2026-08-10).

## Tech details

Only what §9.8.1 does not cover:

- **Colours were declined** (owner, 2026-08-07). Appearance stays with the
  design team, and the brand gold and ink are painted into the exported
  ornament SVGs — so a token change would leave a half-recoloured page rather
  than a re-themed one.
- **A photo path must point at this site.** Remote origins, `data:` URLs and
  protocol-relative `//host` values are refused **at the write**, not at
  render: an editable field that accepts a URL is an editable field that can
  load a stranger's tracker onto the home page.
- **Two rails were literals no screen could reach.** `BestSellersRail` and
  `ReviewsRail` took no props at all, so 2 product titles, 2 prices, 3 review
  quotes and "Verified Purchase" were hard-coded while the registry claimed
  they were "managed elsewhere". Both are wired and both pointers corrected —
  the same class of bug as the hero's four dots, which fell through to
  `/placeholder` while claiming to back four slides.
- ⚠️ **One pixel baseline moved on purpose** (2026-08-08). Routing the review
  photos through `HomePhoto` applied its `maxWidth: none`, and review card 1's
  132×170 bleed had been silently clamped to its 122px opening by Tailwind
  preflight; it now renders at the width Figma traced. Its registry `box` was
  corrected 132×170 → 122×69 — the opening is what the framer frames against.
- ⚠️ **An accepted cost** (owner, 2026-08-08): the standalone
  `/preview/home/[section]` route is deleted, so a **switched-off section can
  no longer be previewed without switching it on** — and the switch publishes
  immediately. The card says so rather than showing the wrong band. With the
  route went its robots rule and its `/api/beacon` guard, leaving one durable
  rule — *is this document framed* (`window.self !== window.top`) — which,
  unlike a URL marker, cannot be destroyed by a click. `?adminPreview` stays on
  the iframes as a readable marker and is deliberately **not** the test: on its
  own it would be an analytics kill switch anyone could type into a URL bar.
- `promo.slogan` moved here from `/admin/content`; the flat slot list now
  filters out `home.*` and `promo.*` so the two screens cannot both own a slot.

## Blockers and dependencies

- Owner acceptance walkthrough
  ([§14.3](../../docs/admin-design.md#143-final-acceptance)) — the ACCEPTED gate
  for this record.
- ⚠️ **The rule that must not be broken when editing this screen:** the frame
  loop lives in a leaf (`picker/PickerLayer.tsx`), never on the screen
  component. Polaris' `Page` re-measures its header actions from a `useEffect`
  on every render and `setState`s inside it, and cannot be stopped from
  outside — a 60Hz publisher above it is the nested-update storm that killed
  this screen with "Maximum update depth exceeded". §9.8.1 explains why.

## Related links

- Spec: [`admin-design.md` §9.8.1](../../docs/admin-design.md#981-content--home-page)
- Registry and maths: [`lib/home-content/registry.ts`](../../lib/home-content/registry.ts) ·
  [`layout.ts`](../../lib/home-content/layout.ts) ·
  [`preview.ts`](../../lib/home-content/preview.ts) ·
  [`frames.ts`](../../lib/home-content/frames.ts) ·
  [`promo.ts`](../../lib/home-content/promo.ts)
- Storefront side: [`components/home/HomePhoto.tsx`](../../components/home/HomePhoto.tsx) ·
  [`components/home/HomeBand.tsx`](../../components/home/HomeBand.tsx)
- Framing is shared with product photos: [media-spotlight](media-spotlight.md)
- Tests: [`tests/unit/home-content.test.ts`](../../tests/unit/home-content.test.ts),
  [`home-preview.test.ts`](../../tests/unit/home-preview.test.ts),
  [`home-frames.test.ts`](../../tests/unit/home-frames.test.ts),
  [`promo-bar.test.ts`](../../tests/unit/promo-bar.test.ts),
  [`tests/e2e/admin-home-content.spec.ts`](../../tests/e2e/admin-home-content.spec.ts),
  [`admin-home-picker.spec.ts`](../../tests/e2e/admin-home-picker.spec.ts)
