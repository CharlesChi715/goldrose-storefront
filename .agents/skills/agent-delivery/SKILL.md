---
name: agent-delivery
description: Follow the ELDREVE agent-delivery write-back workflow — file unresolved matters as AI-nnn (session file + INBOX row + in-place tag), record answers, close via the agent-inbox CLI. Use when finishing a session with open questions, when Charles says to write back / file a matter / check or close the inbox, or when handling AI-nnn tags.
---

# Agent-delivery write-back workflow

`agent-delivery/` is the hand-off point between agents and Charles: it holds
**messages about** work, never the work itself. This skill owns the complete
workflow; the folder's own README is just the data map and privacy rules.

## Core rule

Anything unresolved that you must not guess gets an `AI-nnn` matter recorded
in **three places in the same change**:

1. **Session file** — the detailed entry: what's open, a clickable location,
   your recommendation.
2. **`agent-delivery/INBOX.md`** — one index row, link only, no detail.
3. **In-place tag** — one short comment beside the affected code/content.

Only unresolved, **actionable** matters get tags — never ordinary
observations, temporary coding notes, or issues you can safely solve
yourself.

## In-place tag format

An in-place tag is one short comment left **inside the file the matter is
about**, so anyone editing that code sees it without having read the inbox.
It carries no detail — it names the ID and points at the session file that
holds the full entry:

```text
AI-TAG(AI-001): OWNER-DECISION — confirm the real shipping rate. See /agent-delivery/sessions/initial-inbox-07-30.md.
```

Use the comment syntax supported by the file. Never render an AI tag as
customer-facing text.

| Tag              | Meaning                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `OWNER-TODO`     | Charles needs to perform an action.                                  |
| `OWNER-DECISION` | Charles or the bosses need to choose between real options.           |
| `AGENT-UNSURE`   | The agent could not verify important information and must not guess. |
| `AGENT-BLOCKED`  | Work cannot continue until an answer or external change arrives.     |
| `PLACEHOLDER`    | Temporary data, content, UI, or behavior is currently in use.        |
| `AGENT-DECISION` | The agent made a reversible choice that Charles may veto.            |

## Choosing the next ID

There is no stored counter — a counter kept in one line of one file is a
line every agent must edit, which makes merge conflicts certain once two
agents work in parallel. The next ID is the highest `AI-nnn` currently in
`sessions/`, plus one:

```bash
grep -rho 'AI-[0-9]\{3\}' agent-delivery/sessions/ | sort -u | tail -1
```

Write IDs uppercase — `AI-007`, never `ai-007` — so an in-place tag reads as
a code marker like `TODO` and greps cleanly. Filenames stay lowercase; the
CLI accepts either case. Never reuse an ID, even after its matter is closed
and archived.

## Session files

One file per agent session, in `agent-delivery/sessions/`, named
`<session-name>-MM-DD[-branch].md`:

```text
sessions/agent-delivery-restructure-07-31-feat-blog-journal-import.md
         └──── session name ─────┘ └date┘ └────── branch ──────┘

sessions/initial-inbox-07-30.md
         └ session name ┘ └date┘        # worked on main — no branch part
```

- `<session-name>` comes first: the name of the Claude Code or Codex session,
  lowercased and hyphenated. If the session was never named, use a short
  kebab-case slug of what the session was asked to do.
- `MM-DD` is the month and day the session ran.
- `[-branch]` is the git branch the session worked on
  (`git branch --show-current`), with `/` replaced by `-`. Omit it entirely
  when the session worked on `main`. A session that starts on `main` and then
  branches names its file after the branch it ended on; if it touched two
  branches, split it into two files.
- One file per session, not one per matter — a session that raises three
  questions puts all three in its own file.
- Never edit another session's file except to record an answer or remove a
  resolved matter.

Each file holds its open matters first and a `## Delivered this session`
section last — a short bullet list of what the session actually shipped and
where it landed. Keep it brief; detailed work history belongs in
`.ai/WORKLOG.md`.

## Answering and closing

When Charles answers a matter, record the answer in its entry and mark it
`ANSWERED`. When the answer is applied or no longer relevant, close it.

A matter lives in three places at once, so closing by hand means editing
three files and silently rotting the one you forget. The CLI
(`scripts/agent-inbox.mjs`) does all three together — never close by
hand-editing:

| Command                                    | Does                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| `npm run agent-inbox:close`                | Lists the open matters, asks which to close, archives it       |
| `npm run agent-inbox`                      | Just lists them — id, tag, and one line of what it is          |
| `npm run agent-inbox:close -- 4`           | Closes the 4th matter without prompting (`AI-004`, `ai-4` too) |
| `npm run agent-inbox:close -- 4 --dry-run` | Prints exactly what would be removed and writes nothing        |
| `npm run agent-inbox:try`                  | Practice run — same menus, writes nothing                      |
| `npm run agent-inbox:check`                | Verifies every matter still has its index row, entry, and tag  |

`npm run agent-inbox:close` on its own is the everyday form: three arrow-key
menus — which matter, confirm, and why (`answered` / `done` / `dropped` /
`other`). Press **→** to read a matter's full entry without leaving the menu,
**←** to go back. It refuses to prompt when there is no terminal, so a script
or CI run fails fast instead of hanging. `--reason "shipped in PR #12"`
records why; dismissing a matter you decided not to act on is the same
command — put the "why not" in the reason. Unsure what a close will touch?
`npm run agent-inbox:try` walks the identical flow and writes nothing.

**Closing never deletes.** The matter is written to `agent-delivery/archive/`
as `AI-nnn-<slug>.md` *first* (made read-only, `0444`), and only then removed
from the index, the session file, and the code. The CLI refuses to close an
id that is already archived, and there is no delete option, by design: a
matter you dismissed is exactly the one you will want to justify six months
later.

Always run `npm run format` afterwards and read `git diff` before committing.

## Hard limits

- **Never read `agent-delivery/archive/` without asking Charles first.** It
  is his private record of decisions and dismissals, not project context.
- Never include secrets, credentials, private customer data, or hidden
  reasoning.
- Never render an AI tag as customer-facing text.
