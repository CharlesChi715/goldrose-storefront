# Interaction Specifications · IxD Specs

Interaction drafts from the design team covering the mechanism layer:
clickability, triggers, navigation, and states. This directory is a read-only
mirror for developers. Preserve the wording verbatim; do not edit the body
manually. Mark problems found in the source inline with `⚠️ Developer note`.

**Source:** [homepage.md](homepage.md) (English working copy) and
[shop.md](shop.md). The design team's editable original is
`temp/主页_shop页机制.numbers` (received 2026-07-25); when it updates,
re-import into this directory. The verbatim Chinese export of the homepage
sheet is archived at `temp/homepage.zh.md` — on wording disputes, the Chinese
source wins.

## Files

- [homepage.md](homepage.md) — 37 homepage entries (H-01…H-37), English
  translation of the archived Chinese export
- [shop.md](shop.md) — 15 Shop page entries (N-01…N-15), still verbatim
  Chinese (translation pending)
- `assets/` — 52 annotated screenshots (red box = the element for that entry);
  filename = entry ID; JPEG-compressed from the originals

## How to reference an entry

Entry IDs are stable. Write `implements H-09` in commits, PRs, and code
comments; search for `### H-09` within the documentation.

## Status legend (target-page design progress)

| Label | Meaning |
|---|---|
| Incomplete / Not done | The target-page design is not ready |
| To be confirmed | Pending a decision from the design team |
| Future iteration (not currently planned) | Out of scope for this release, such as personalization |
| No separate page needed / Not currently planned | Inline interaction with no target page / deferred |
| — | Not marked in the source table, usually because the page already exists |

Message from me to ai agents: leave placeholder in unsure things

## Items to confirm with the design team

1. **Routes:** H-06, H-08, H-17, H-28, H-29, H-32, and H-37 are marked
   “suggested route, pending developer confirmation.” Finalize them after
   development provides the route table.
2. **Desktop:** All prototypes use the iPhone 15 Pro Max frame. Will separate
   desktop layouts be provided? in the future yes. and the prototypes with this 
   smartphone but the page currently should be usable in all smartphones.
3. **Scope:** The Shop page mock includes a wishlist heart and star ratings,
   but the table has no corresponding entries. Are these in scope for this
   release? (The repository already has an initial `WishlistButton`.)
   no.
4. **Price display:** In the N-13 mock, the struck-through price of $189 is
   lower than the current price of $219. The promotion price should be less
   than or equal to the original price; confirm that the mock uses placeholder
   data. - yes placeholder data
5. **Assets:** The mock contains third-party brand imagery, such as the gift
   box in the N-07 banner. Replace all of it with GoldRose assets before
   launch. -- how did you tell its from third-party? yes just do it for current dev.
   `⚠️ Developer note`: the tell is the dark-green gift box in the photo — it
   carries a gold crest and a partially visible wordmark (reads "VILOW… ROSE",
   not GoldRose), so the photo is another brand's (or AI-mocked) product shot.
   The same image is already live on the deployed `/shop` hero
   (`public/veloria/shop-hero.png`). Swapping it needs a GoldRose-branded
   replacement photo (ties into OQ-3 real product content); the banner is
   pixel-diff-guarded, so the swap is an asset replacement at the same size,
   not a re-crop.
6. **Content:** Sources for the copy and images on target pages such as the
   blog, brand story, customer stories, and corporate partnerships remain to
   be determined. -- leave with placeholder.

## Route table (decided by dev 2026-07-25, per owner delegation)

Implemented in the 2026-07-25 homepage/shop import. Wired now (target exists):
H-04 cart → `/checkout` · H-05 logo → `/` · H-07 hero CTA, H-09/H-12/H-14
homepage product cards, H-10/H-13 view-all, H-19/H-22 occasion & recipient
cards, H-27 Browse All Gifts, H-36 Shop All → `/shop` · shop grid cards (N-13)
→ `/products/[slug]` (live catalog) · bottom nav Home `/`, Shop `/shop`,
Login `/account`. Everything else — H-01 menu, H-06 search (dropped from the
final header), H-08/H-16/H-28/H-29/H-30/H-37 personalization, H-15/H-26 MORI,
H-17/H-31 craft, H-20/H-23/H-35 blog/FAQ, H-24 stories, H-32 workshop,
H-33 corporate, H-34 story, Wholesale tab — renders pixel-exact but is
**not clickable** until its target page exists (per the "leave placeholder"
instruction above).

## `⚠️ Developer note` · mascot artwork needs transparent PNGs

The four AI-generated illustrations on the homepage (the MORI cat and the
pink ribbon strip) are **opaque bitmaps with a transparency checkerboard
baked into the pixels**. The Figma file hides that background with a
`DARKEN` fill blend mode, and the import now reproduces it, so the pages
match the mock — but DARKEN is a workaround, not a cutout:

- Anything lighter than the backdrop is darkened, so the same art breaks on
  any dark or coloured section (it can only ever be placed on light cream).
- A faint grey checkerboard is still visible in the mock and on the page.
- Browsers composite blend modes on the GPU, so those four boxes are not
  bit-reproducible and had to be excluded from the pixel-regression net.

**Ask:** please re-export the mascot art as real transparent PNGs (alpha
channel, no checkerboard) and drop the blend mode. Then the art can sit on
any background, the checkerboard disappears, and the pixel net can cover it
again. Same applies to any new mascot art in the screens still in progress.
