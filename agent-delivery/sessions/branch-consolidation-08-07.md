# branch consolidation · 2026-08-07 · `main`

Read every branch, merged the outstanding ones, and settled the conflicts.
Three merges landed: the `PdpOverlays` double-merge repair (which fixed a
parse error sitting on `main`), the admin home-sections editor, and the PDP
strapline wrap. One matter came out of the last of these.

---

## AI-036 · `OWNER-TODO` · the PDP frame and the built page disagree by 16px

Ready-for-dev frame `1523:3971` (PDP, 430×1616) no longer matches what the
site renders, and the departure is deliberate.

The product page's strapline — the first three `details` bullets — was drawn
by the frame as a single `white-space: nowrap` line that truncated with an
ellipsis. Real catalog copy does not fit it: "Genuine preserved rose · Rich
ruby-red finish · Gold-trimmed petal edges" is 71 characters against room for
roughly 59, so shoppers were losing the end of the sentence to "…". The box
now wraps to two lines and never ellipsizes; a third line is clipped whole by
the fixed height.

Wrapping costs 16px, and everything below it moves:

| Thing                | Frame | Built |
| -------------------- | ----- | ----- |
| Strapline box height | ~15.7 | 31.466 |
| Info card height     | 166   | 182   |
| Stage height         | 1616  | 1632  |

Every section below the info card shifts down by the same 16 (541→557,
706→722, 989→1005, 1192→1208, 1360→1376), and the three page-absolute hit
targets in `PdpOverlays.tsx` follow (468→484, 757→773, 1205→1221). The
original vertical rhythm inside the card is preserved exactly — 10.0px above
the stars, 8.5px above the price.

**Needed:** the design team makes the same 16px change in Figma, so the frame
and the build agree. Until they do, the next Figma sync will read `1616` and
may try to pull the page back to a layout that truncates real product copy.

**Recommendation:** relay it as a correction to the frame rather than a
question — the wrap is driven by real catalog content, not by taste, and
reverting it would reintroduce the lost text. If the design team would rather
keep one line, the answer they need to give is a shorter `details` format, not
a taller box.

Landed in `e30f9b8`, merged as `964ba65`.

**ANSWERED (Charles, 2026-08-07):** "just make it suit the content. if content
exceeds, larger is fine."

So the box sizes to the copy, and growing the frame is the accepted outcome —
the build is right and Figma is the side that moves. This is a **standing
rule, not a one-off ruling on 16px**: wherever real catalog copy will not fit
a frame's box, the box grows rather than the copy being cut. Truncation to
"…" is not an acceptable way to make content fit.

Still to do before this closes: the design team applies it to frame
`1523:3971` (430×1616 → 430×1632). Until then each Figma sync reads `1616`
and will try to pull the page back to a truncating layout, so the departure
stays recorded in the file header.

Location: [`app/products/[slug]/page.tsx`](<../../app/products/[slug]/page.tsx>)

---

## Delivered this session

- Merged eight branches into `main`: the `PdpOverlays` double-merge repair
  (which fixed a hard parse error sitting on `main`), the admin home-sections
  editor, the shop filter drawer, the coming-soon header, the PDP strapline
  wrap, the media spotlight areas, and `feat/best-for-facets`.
- Fixed the `prettier --check` failure (one trailing space in
  `scripts/features/cli.mjs`) that had `main`'s CI red for two runs; PR #35
  went green and auto-closed as merged.
- **Renumbered a colliding migration.** `worktree-media-spotlight` and
  `feat/best-for-facets` both shipped a `0009`. Neither was pushed, so
  spotlight became `0010` — and the order is load-bearing, because `0009`
  drops and recreates `catalog_products` without the spotlight columns.
  Reversing them would silently break framing on the storefront.
- Cleaned the merged branches so GitHub carries `main` only.
