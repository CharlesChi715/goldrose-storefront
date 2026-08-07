<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-002 · `PLACEHOLDER` · `CLOSED`

- **Affected place:** [`/bag` route](../../app/bag/page.tsx#L8)
- **Current temporary behavior:** The screen renders the design's example line
  items. The real cart is stored separately and enters the working purchase
  flow through `/checkout`.
- **Why it matters:** A customer can see bag contents that do not match the
  products they selected.
- **Recommendation:** Wire the real cart into the approved bag design before
  launch; preserve the current visual layout while replacing the example data.
- **Charles's response:** _(write an instruction here if its priority changes)_
- **Closed:** 2026-08-07
- **Why:** done
