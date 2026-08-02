<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-009 · `AGENT-DECISION` · `CLOSED`

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
- **Closed:** 2026-08-02
- **Why:** answered — design updated the frame to 'Pacific Time (PT)UTC-8' on 08-01 and the row now imports it verbatim (08-02 sync)
