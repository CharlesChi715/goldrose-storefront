# Closed matters — ask before reading

One file per closed agent-inbox matter, written by `npm run agent-inbox:close`.
Closing a matter never deletes it: the record moves here first, and only then
is it removed from `INBOX.md`, its session file, and the code.

**Agents: do not read the files in this folder without asking Charles first.**
They are a private working record of decisions, dismissals, and reasons — not
project context. Nothing in here is needed to do work in this repository; if
something in here turns out to be needed, it belongs in a live doc instead.

Claude Code is configured to prompt before reading this folder
(`.claude/settings.json` → `permissions.ask`). That prompt is a reminder, not a
wall — the rule above is what matters.

## Rules

- Files are written read-only (`0444`). That is a guard against absent-minded
  edits, not security.
- Never delete a file here. Ids are never reused, so an id that appears here is
  closed forever.
- To correct one, `chmod +w` it, edit, and `chmod 444` it back — and say in the
  file why it was corrected.
- Filenames are `AI-nnn-<slug>.md`, where the slug comes from the matter's
  one-line summary at the time it was closed.
