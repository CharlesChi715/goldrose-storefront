# figma-sync · 08-01 · `feat/figma-sync-0801`

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

## AI-009 · `AGENT-DECISION` · `OPEN`

- **Affected place:** [reminders timezone row](../../components/screens/RemindersScreen.tsx)
  (search `PST (UTC−8)`)
- **The choice:** The design team asked Charles to show only Pacific Time on
  the reminders page and he accepted, but the thread never settled the UTC
  offset (the team's last word was "问了一下gpt") and the frame still says
  `EST (UTC−5)`. The page now shows `PST (UTC−8)` — Pacific standard time,
  matching the frame's own standard-offset convention (EST is −5, not EDT −4).
- **Why reversible:** one mock string; when the team updates the frame (or
  answers "UTC 几"), align to their exact wording in one commit.
- **Veto:** if you'd rather show `PDT (UTC−7)` or plain "Pacific Time", say
  so.

---

## Delivered this session

- Re-polled the file (edited 07-31 14:22): `me三级` lost its Ready-for-dev
  mark — the team pulled the reminders cluster back (edit modal growing
  548→614px, picker frames moved in as DATE-CONTROL-GROUP). Nothing
  re-imported from it.
- Applied the one comment-delegated change: reminders timezone value
  `EST (UTC−5)` → `PST (UTC−8)` (AI-009).
- Pending from design, no action: the simplified homepage now exists as a
  second frame (2024:378, 6087px) beside the old one — still unmarked, still
  ignored per the owner's ack; the login checkbox style debate is unresolved
  between Charles and the team.
- Second pass (afternoon comments, file itself unchanged): drew the
  system-default ✓ inside the login band's □ glyph, recolored to the band's
  ink — the checkbox thread's resolution ("换个颜色，这个就行了") that
  Charles accepted. The timezone thread also closed with "Ok" and no
  concrete UTC, so AI-009's `PST (UTC−8)` stands. New team directive
  "删掉Custom Archive这个框的内容" (dashboard 1523:2536) left alone —
  pending an updated frame.
- Details in [`docs/ixd/README.md`](../../docs/ixd/README.md) § "08-01
  delivery sync".
