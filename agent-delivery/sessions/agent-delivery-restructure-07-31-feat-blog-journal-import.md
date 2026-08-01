# agent-delivery-restructure · 07-31 · `feat/blog-journal-import`

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

---

## Delivered this session

- Split the single `INBOX.md` into one markdown file per agent session under
  `sessions/`, named `<session-name>-MM-DD[-branch].md` — the branch part is
  included when the session worked on a branch and omitted on `main`.
- Rewrote `INBOX.md` as an index of open matters only.
- Removed the shared `Next ID:` field — the next ID is now the highest
  `AI-nnn` found in `sessions/`, plus one. Reason: `Next ID` was a single line
  every agent had to edit, which is the classic git merge-conflict hotspot.
- Restored the two workflow steps that were dropped from `README.md`
  ("read SUMMARY.md first", "perform only approved work") and documented the
  new file naming, ID rule, and the bottom-of-file delivery section.
- Repointed the five existing in-place `AI-TAG(...)` links from
  `/agent-delivery/INBOX.md#ai-nnn` to the session file that now holds them.
- Updated `SUMMARY.md` so agents are told to **write back** to this folder, not
  only to read it.
- Added `scripts/agent-inbox.mjs` and the `inbox`, `inbox:resolve`, `inbox:check` npm
  scripts so closing a matter removes its index row, session entry, and
  in-place tag in one command instead of three hand edits.
- Made closing convenient: `npm run agent-inbox:close` with no arguments prints the
  numbered list and asks which to close, so there is no id to type and no `--`
  to remember. Ids may also be given as `4`, `ai-4`, or `AI-004`.
- Removed the delete option entirely: closing a matter now always archives it
  to `agent-delivery/archive/AI-nnn-<slug>.md` (written first, then made
  read-only `0444`), and only then clears the index row, session entry, and
  in-place tag. Ids are never reused and an already-archived id is refused.
- Marked the archive private: `.claude/settings.json` prompts before an agent
  reads it, and the rule is written into `SUMMARY.md` and both READMEs.
- Renamed the CLI to `agent-inbox` (`scripts/agent-inbox.mjs`; `npm run
  agent-inbox`, `agent-inbox:close`, `agent-inbox:check`) and added a
  "Housekeeping commands" section to `README.md` so the commands are findable
  without remembering them.
- Replaced the typed prompts with arrow-key menus: which matter, confirm, and
  why it is closed (`answered` / `done` / `dropped` / `other` → free text).
  Written directly against the terminal, no new dependency.
- Fixed the menu redraw clobbering lines in a narrow terminal: option labels
  are now truncated to the terminal width so each occupies exactly one row.
- Added a detail pane: → opens the selected matter's full entry inside the
  menu, ← returns to the list. Menus now run on the terminal's alternate screen
  buffer, so each keypress repaints the whole view and the scrollback is
  restored on exit.
- Rendered the detail pane instead of dumping markdown: `- **Label:** value`
  becomes a bold label with the wrapped value indented under it, links resolve
  to repo-relative paths, and emphasis markers are stripped.
