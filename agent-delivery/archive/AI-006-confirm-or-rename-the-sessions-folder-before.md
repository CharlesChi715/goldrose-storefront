<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-006 · `OWNER-DECISION` · `CLOSED`

- **Affected place:** [`agent-delivery/sessions/`](../sessions) and its
  [README description](../README.md#L10)
- **What needs deciding:** The folder holding these per-session files is
  currently named `sessions/`. Charles said he would pick the proper name
  later, so this is a placeholder choice, not a settled convention.
- **Why it matters:** The name appears in every in-place `AI-TAG(...)` link in
  the codebase, so renaming later means a repo-wide find-and-replace. Cheap
  today (7 links), more expensive every week it waits.
- **Recommendation:** Keep `sessions/` — it says exactly what one file is (one
  agent session's hand-off) and does not repeat the parent folder's word
  "delivery". Alternatives considered: `inbox/` (collides with the index file's
  own name), `notes/` (too vague), `handoffs/` (accurate but longer). If you
  prefer a different word, say it and the rename is one commit.
- **Charles's response:** _(write the chosen folder name here, or "keep")_
- **Closed:** 2026-08-01
- **Why:** Charles confirmed the sessions/ folder name is good (2026-08-01)
