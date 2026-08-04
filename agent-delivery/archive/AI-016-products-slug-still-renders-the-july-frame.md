<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-016 · `AGENT-UNSURE` · the PDP page is still the July frame, not the Ready-for-dev redesign

- **Status:** `ANSWERED` on 2026-08-04.
- **Answer:** Charles clarified that the browser annotations must be checked
  against the complete Figma frame. Treat Ready-for-dev `1523:3971` as the
  canonical PDP and import it.
- **Where:** [`app/products/[slug]/page.tsx`](../../app/products/%5Bslug%5D/page.tsx).
- **What:** the built page is a pixel-exact copy of the **July** frame
  (`2:2`, 430×**2501**) and still declares `height={2501}`. Figma's current
  Ready-for-dev PDP is `1523:3971` in `shop二级`, 430×**1616** — a shorter,
  re-flowed page (Add to Cart / Buy Now at y1378; the ratings summary at
  y757 where ours sits at y1886). The redesign was never imported: the
  07-29 batch restyled and re-imported the PDP *drawers* (1523:4185/4215
  etc.) but left the page body on the old canvas, and this sync drift-checked
  the account cluster without re-checking the PDP.
- **Consequence:** every prototype coordinate for this screen is quoted
  against a layout we do not render, so future wiring has to be translated by
  hand (as the second reviews trigger just was). A third PDP frame exists
  too — the unmarked `2333:280` (430×2501) — so the file itself has two.
- **Recommendation:** re-import `/products/[slug]` from 1523:3971 as its own
  focused pass, and settle with the design team which of 1523:3971 / 2333:280
  is canonical before spending the effort.
- **Closed:** 2026-08-04
- **Why:** Charles selected Ready-for-dev frame 1523:3971; imported and verified at 2x on feat/figma-sync
