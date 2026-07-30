# GoldRose Agent Inbox

This file contains only unresolved, actionable messages for Charles or a future
AI agent. Read [`README.md`](README.md) for the tag definitions and workflow.

**Next ID:** `AI-006`

## Open tags

| ID | Tag | Status | Short message | Location |
|---|---|---|---|---|
| [`AI-001`](#ai-001) | `OWNER-DECISION` | `OPEN` | Confirm the real rest-of-world shipping rate. | [Shipping seed setting](../lib/supabase/seed-data.ts#L314) |
| [`AI-002`](#ai-002) | `PLACEHOLDER` | `OPEN` | The `/bag` screen shows designed example items instead of the real cart. | [Bag route](../app/bag/page.tsx#L8) |
| [`AI-003`](#ai-003) | `OWNER-TODO` | `OPEN` | Supply and approve the real privacy-policy content. | [Privacy-policy route](../app/account/privacy-policy/page.tsx#L5) |
| [`AI-004`](#ai-004) | `OWNER-TODO` | `OPEN` | The delivery routing table is empty, so agents cannot file a parse result. | [Team deliveries README](../team-deliveries/README.md) |
| [`AI-005`](#ai-005) | `AGENT-UNSURE` | `OPEN` | Unclear whether the Figma naming spreadsheet is an incoming delivery or a generated export. | [Naming-guide batch](../team-deliveries/originals/2026-07-25-figma-naming-guide/batch.md) |

### AI-001

- **Tag:** `OWNER-DECISION`
- **Status:** `OPEN`
- **Created:** 2026-07-30
- **Affected place:** [Rest-of-world rate in the seed settings](../lib/supabase/seed-data.ts#L314)
- **What is uncertain:** `$19.95` is explicitly a placeholder. The real
  international shipping price has not been decided.
- **Why it matters:** Checkout totals cannot be launch-ready until the real rate
  is known and entered.
- **Recommendation:** Obtain the real fulfilment cost and business-approved
  customer price before launch, then replace the placeholder and test checkout
  totals.
- **Charles's response:** _(write the answer here)_

### AI-002

- **Tag:** `PLACEHOLDER`
- **Status:** `OPEN`
- **Created:** 2026-07-30
- **Affected place:** [`/bag` route](../app/bag/page.tsx#L8)
- **Current temporary behavior:** The screen renders the design's example line
  items. The real cart is stored separately and enters the working purchase
  flow through `/checkout`.
- **Why it matters:** A customer can see bag contents that do not match the
  products they selected.
- **Recommendation:** Wire the real cart into the approved bag design before
  launch; preserve the current visual layout while replacing the example data.
- **Charles's response:** _(write an instruction here if its priority changes)_

### AI-003

- **Tag:** `OWNER-TODO`
- **Status:** `OPEN`
- **Created:** 2026-07-30
- **Affected place:** [Privacy-policy route](../app/account/privacy-policy/page.tsx#L5)
- **What Charles needs to do:** Supply or approve legally reviewed privacy-policy
  content for the launch markets.
- **Why it matters:** The current page contains design-mock summaries, not an
  approved public policy.
- **Recommendation:** Have the business's qualified legal adviser review the
  final policy before it becomes public or indexable.
- **Charles's response:** _(record the content source or next action here)_

### AI-004

- **Tag:** `OWNER-TODO`
- **Status:** `OPEN`
- **Created:** 2026-07-30
- **Affected place:** [Routing table in the team deliveries README](../team-deliveries/README.md)
- **What Charles needs to do:** Write the rules that say where each kind of
  delivery's parse output is filed — which content goes to `docs/ixd/`, which to
  components, which to `assets/`, and so on.
- **Why it matters:** Without the table, two agents will file the same delivery
  in two different places and neither result will be findable later. Until it
  exists an agent must stop and ask rather than choose a destination.
- **Recommendation:** Fill the table in as deliveries arrive rather than trying
  to predict every case up front; one row per kind of content actually received.
- **Charles's response:** _(write the routing rules in `team-deliveries/README.md`)_

### AI-005

- **Tag:** `AGENT-UNSURE`
- **Status:** `OPEN`
- **Created:** 2026-07-30
- **Affected place:** [2026-07-25 naming-guide batch](../team-deliveries/originals/2026-07-25-figma-naming-guide/batch.md)
- **What is uncertain:** Whether `Figma_UI_Naming_Guide_GoldRose.xlsx` is the
  spreadsheet the design team **sent us** on 2026-07-25, or one **we generated
  for them** later. The since-retired element-names doc called it "a spreadsheet exported for the design team — generated", but the
  file's modification time is 25 Jul, before the 2026-07-29 correction that made
  the markdown the master.
- **Why it matters:** An incoming delivery belongs in `team-deliveries/originals/`; a
  generated export is regenerable and belongs in `trash/`, since the convention
  is "version-control the text; generate the binary."
- **Recommendation:** Kept in `team-deliveries/originals/` for now — it is 12 KB, and
  wrongly keeping a regenerable file is cheaper than wrongly deleting a received
  source. Confirm which it is and move it if needed.
- **Charles's response:** _(write the answer here)_
