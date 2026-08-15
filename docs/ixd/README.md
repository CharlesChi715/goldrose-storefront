# Interaction Specifications · IxD Specs

Design-facing record: where the Figma file and the repo currently stand, what
the design team still owes us, and the naming rules. Per-sync history lives in
[`agent-delivery/sessions/`](../../agent-delivery/README.md); the process lives
in the `figma-sync` skill.

## Design-sync state — 2026-08-10

- **Imported through 2026-08-10.** The home page `/` was re-imported from frame
  `2380:370` (page-wide typography pass); the stage is **5074** and
  `band.trim` is retired. Detail:
  [figma-sync-home-page-08-10](../../agent-delivery/sessions/figma-sync-home-page-08-10-claude-figma-sync-home-page-75f37e.md).
- ⚠️ **The baseline is deliberately un-stamped: 41 changed frames remain
  un-imported.** `npm run figma:baseline` was not run, so the next sync still
  sees them. Do not stamp it to "clean up" a diff.
- **`npm run figma:unbuilt` is empty** since 2026-08-07 — every Ready-for-dev
  frame has a route (`/account/addresses` was the last one).
- **Pending from design:** the 7 `/policies/*` pages, the MENU and long-form
  story redesigns, and `/gift-guide` (frame `1942:182`, no route built).
- **Sanctioned divergences** — a pixel diff will never close these, and that is
  intended: A-2's uniform card 2 (owner, 2026-08-07), the six rail CTAs the
  frame deleted on three cards (AI-043), and ~2.0–2.7% per band of font
  rasterisation. A-2 reads 8.3% for exactly that reason.
- ⚠️ **A frame carrying a pre-rename brand name is not imported verbatim**
  (AI-037) — see [naming/brand-name.md](naming/brand-name.md). The home page is
  the owner's sanctioned exception (AI-044).
- Open design matters, with the frame each one is about, are rows in
  [`agent-delivery/INBOX.md`](../../agent-delivery/INBOX.md): AI-024, AI-037,
  AI-038, AI-043, AI-045.

## Files

Only the naming docs below live here now.

**Retired 2026-08-04.** The homepage (`H-01…H-37`) and shop (`N-01…N-15`) IxD
tables and their 52 annotated screenshots are gone from the docs tree — the
interaction design is maintained in Figma now. The `H-nn`/`N-nn` ids stay
readable as ids in `components/home/` and `tests/e2e/homepage.spec.ts`. The
delivery they were parsed from is still live at
[`team-deliveries/originals/2026-07-25-home-shop-mechanism/`](../../team-deliveries/originals/2026-07-25-home-shop-mechanism/batch.md)
and remains the authority on wording. The findings further down this file are
kept as the record of what those imports surfaced.

**Naming.** The component-level doc below exists but is still a **draft** — its
`data-el` grammar and vocabulary are not written yet; Charles will author them.
The `data-el` attributes themselves are in code. Current naming docs:

- [naming/figma-route-rule.md](naming/figma-route-rule.md) — the **page-level
  chapter**: an UPPERCASE section per top-level route segment, and a frame named
  for its exact route followed by `·`-separated design metadata (screen,
  viewport, state). Replaced the deleted `frame-names.md` on 2026-07-30.
- [naming/product-handles.md](naming/product-handles.md) — the deterministic
  algorithm deriving a product's `/products/<handle>` URL segment from its
  title, so any person or model produces the identical string
- [naming/component-names.md](naming/component-names.md) — the `data-el`
  attribute vocabulary tying a rendered element back to its design component
- [naming/brand-name.md](naming/brand-name.md) — ELDREVE in all copy, and the
  `goldrose` strings that are identifiers and must never be renamed

The 2026-07-25 design-team naming guide was archived on 2026-07-31; the three
docs above supersede it. Its raw source (a translated spreadsheet) was deleted
on 2026-08-07 as superseded — recover it from git history if it is ever needed.

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
   box in the N-07 banner. Replace all of it with ELDREVE assets before
   launch. -- how did you tell its from third-party? yes just do it for current dev.
   `⚠️ Developer note`: the tell is the dark-green gift box in the photo — it
   carries a gold crest and a partially visible wordmark (reads "VILOW… ROSE",
   not ELDREVE), so the photo is another brand's (or AI-mocked) product shot.
   The same image is already live on the deployed `/shop` hero
   (`public/eldreve/shop-hero.png`). Swapping it needs a ELDREVE-branded
   replacement photo (ties into OQ-3 real product content); the banner is
   pixel-diff-guarded, so the swap is an asset replacement at the same size,
   not a re-crop.
6. **Content:** Sources for the copy and images on target pages such as the
   blog, brand story, customer stories, and corporate partnerships remain to
   be determined. -- leave with placeholder.