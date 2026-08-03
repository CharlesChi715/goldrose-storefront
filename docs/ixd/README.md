# Interaction Specifications · IxD Specs

## Files

- [shop.md](shop.md) — 15 Shop page entries (N-01…N-15), still verbatim
  Chinese (translation pending)
- [homepage.md](homepage.md) — homepage entries (H-01…H-37), English working
  copy; the ids cited across `components/home/` and `tests/e2e/homepage.spec.ts`
  resolve here
- `assets/` — 52 annotated screenshots (red box = the element for that entry);
  filename = entry ID; JPEG-compressed from the originals

**Naming.** An element-level convention doc (the `data-el` grammar and
vocabulary) does not exist yet — Charles will author it; the `data-el`
attributes themselves are in code. Current naming docs:

- [naming/figma-route-rule.md](naming/figma-route-rule.md) — the **page-level
  chapter**: an UPPERCASE section per top-level route segment, and a frame named
  for its exact route followed by `·`-separated design metadata (screen,
  viewport, state). Replaced the deleted `frame-names.md` on 2026-07-30.
  ⚠️ Unlike the other naming docs it carries no status/version header, so it is
  not yet clear whether it is Proposed or Adopted
- [naming/product-handles.md](naming/product-handles.md) — the deterministic
  algorithm deriving a product's `/products/<handle>` URL segment from its
  title, so any person or model produces the identical string
- [naming/component-names.md](naming/component-names.md) — the `data-el`
  attribute vocabulary tying a rendered element back to its design component

The 2026-07-25 design-team naming guide was archived on 2026-07-31; the three
docs above supersede it. Its raw source stays in
[`team-deliveries/originals/2026-07-25-figma-naming-guide/`](../../team-deliveries/originals/2026-07-25-figma-naming-guide/).

## How to reference an entry

Entry IDs are stable. Write `implements H-09` in commits, PRs, and code
comments; search for `### H-09` within the documentation. Newer sources use
full naming-guide IDs (e.g. `implements ORDER-DETAIL-SHARE-TRACKING`);
reference them the same way.

## Status legend (target-page design progress)

| Label                                           | Meaning                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Incomplete / Not done                           | The target-page design is not ready                                     |
| To be confirmed                                 | Pending a decision from the design team                                 |
| Future iteration (not currently planned)        | Out of scope for this release, such as personalization                  |
| No separate page needed / Not currently planned | Inline interaction with no target page / deferred                       |
| —                                               | Not marked in the source table, usually because the page already exists |

Message from me to ai agents: leave placeholder in unsure things

## Items to confirm with the design team

> The `DQ-nn` question docs are not kept in the repo (git history has them).
> The findings below stay here as the record of what was discovered during
> each import.

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