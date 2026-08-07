# initial-inbox · 07-30

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

## AI-001 · `OWNER-DECISION` · `OPEN`

- **Affected place:** [Rest-of-world rate in the seed settings](../../lib/supabase/seed-data.ts#L331)
- **What is uncertain:** `$19.95` is explicitly a placeholder. The real
  international shipping price has not been decided.
- **Why it matters:** Checkout totals cannot be launch-ready until the real rate
  is known and entered.
- **Recommendation:** Obtain the real fulfilment cost and business-approved
  customer price before launch, then replace the placeholder and test checkout
  totals.
- **Charles's response:** _(write the answer here)_

## AI-004 · `OWNER-TODO` · `OPEN`

- **Affected place:** [Routing table in the team deliveries README](../../team-deliveries/README.md#L50)
- **What Charles needs to do:** Write the rules that say where each kind of
  delivery's parse output is filed — which content goes to `docs/ixd/`, which to
  components, which to `assets/`, and so on.
- **Why it matters:** Without the table, two agents will file the same delivery
  in two different places and neither result will be findable later. Until it
  exists an agent must stop and ask rather than choose a destination.
- **Recommendation:** Fill the table in as deliveries arrive rather than trying
  to predict every case up front; one row per kind of content actually received.
- **Charles's response:** _(write the routing rules in `team-deliveries/README.md`)_

---

## Delivered this session

- Seeded the five matters above and their in-place `AI-TAG(...)` comments.
