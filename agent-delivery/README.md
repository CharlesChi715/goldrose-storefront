# Agent Delivery

This folder is the visible hand-off point between AI agents and Charles, 
golden rules of how agent delivery outcome. Read
this file and [`INBOX.md`](INBOX.md) after `SUMMARY.md` whenever beginning work
in this repository, and write back here before finishing.

## Folder structure

```text
agent-delivery/
├── README.md       # Instructions and workflow
├── INBOX.md        # Index of every open matter — links only, no detail
├── sessions/       # One markdown file per agent session
│   └── <session-name>-MM-DD[-branch].md
└── archive/        # Closed matters, read-only — ask Charles before reading
    └── AI-nnn-<slug>.md
```

These repository areas have different purposes:

| Location           | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `agent-delivery/`  | Unresolved messages from AI agents to Charles                                 |
| `team-deliveries/` | Incoming source files delivered by the design team or another upstream source |
| `.ai/WORKLOG.md`   | Legacy optional work history; do not use as startup context                   |

Actual code, documents, images, and other deliverables stay in their proper
repository locations. This folder holds only the message about them.

## Workflows

### Task-specific workflows → skills

Recurring, task-specific workflows live as **skills** (load-on-demand), not in
this always-loaded README — so an agent pulls in only the one its task needs.

- **Processing a Figma delivery** (which frames/comments/prototype to read, and
  which of Charles's comments to act on) → the `process-figma-delivery` skill.
  Source of truth: [`.claude/skills/process-figma-delivery/SKILL.md`](../.claude/skills/process-figma-delivery/SKILL.md)  
  (Codex reads the same file via a symlink at `.agents/skills/`).

### General Rule

1. Put unresolved, actionable matters in your session file and beside the
   affected repository location using the same `AI-nnn` ID, then add one row to
   the `INBOX.md` index.
2. When an inbox matter is answered and applied, remove its in-place tag, its
   session-file entry, and its index row. Use `npm run agent-inbox:close`, which
   archives the matter first and then removes all three together.

### Session files

One file per agent session, in `sessions/`, named
`<session-name>-MM-DD[-branch].md`:

```text
sessions/agent-delivery-restructure-07-31-feat-blog-journal-import.md
         └──── session name ─────┘ └date┘ └────── branch ──────┘

sessions/initial-inbox-07-30.md
         └ session name ┘ └date┘        # worked on main — no branch part
```

- `<session-name>` comes first: it is the name of the Claude Code or Codex
  session, lowercased and hyphenated. If the session was never named, use a
  short kebab-case slug of what the session was asked to do.
- `MM-DD` is the month and day the session ran.
- `[-branch]` is the git branch the session worked on, with `/` replaced by `-`
  (`feat/blog-journal-import` → `feat-blog-journal-import`). Omit this part
  entirely when the session worked on `main`. Read it with:

  ```bash
  git branch --show-current
  ```

  A session that starts on `main` and then branches names its file after the
  branch it ended on; if it touched two branches, split it into two files.
- One file per session, not one per matter. A session that raises three
  questions puts all three in its own file.
- Never edit another session's file except to record an answer or remove a
  resolved matter.

Each file holds its open matters first and a `## Delivered this session`
section last — a short bullet list of what the session actually shipped and
where it landed. The delivered list is the lower-value half of the file; keep
it brief. Detailed work history still belongs in `.ai/WORKLOG.md`.

### Closing a matter — `npm run agent-inbox`

A matter lives in three places at once, so closing it by hand means editing
three files and silently rotting the one you forget. The CLI
([`scripts/agent-inbox.mjs`](../scripts/agent-inbox.mjs)) does all three together:

| Command                             | Does                                                           |
| ----------------------------------- | -------------------------------------------------------------- |
| `npm run agent-inbox:close`             | Lists the open matters, asks which to close, archives it       |
| `npm run agent-inbox`                     | Just lists them — id, tag, and one line of what it is          |
| `npm run agent-inbox:close -- 4`        | Closes the 4th matter without prompting (`AI-004`, `ai-4` too) |
| `npm run agent-inbox:close -- 4 --dry-run` | Prints exactly what would be removed and writes nothing      |
| `npm run agent-inbox:try`                 | Practice run — same menus, writes nothing                      |
| `npm run agent-inbox:check`               | Verifies every matter still has its index row, entry, and tag  |

`npm run agent-inbox:close` on its own is the everyday form — no id to type, no
`--` to remember. It walks three arrow-key menus: which matter, confirm, and
why it is closed (`answered` / `done` / `dropped` / `other`, where `other` lets
you type your own). Move with ↑/↓ or `j`/`k`, jump with a digit, choose with
Enter, cancel with Esc or Ctrl+C. Press **→ to read the matter's full entry**
without leaving the menu, and **←** to go back to the list. Long summaries are
truncated to one row each; the detail pane shows the whole entry, wrapped, plus
which session file it came from. It refuses to prompt when there is no
terminal, so a script or CI run fails fast instead of hanging.

**Closing never deletes.** The matter is written to
[`archive/`](archive/README.md) as `AI-nnn-<slug>.md` *first*, and only then
removed from the index, the session file, and the code. The archived file is
made read-only (`0444`), ids are never reused, and the CLI refuses to close an
id that is already archived. There is no delete option, by design: a matter you
dismissed is exactly the one you will want to justify six months later.

`--reason "shipped in PR #12"` records why it was closed; the interactive form
asks for it. Dismissing a matter you decided not to act on is the same command
— put the "why not" in the reason.

### Never read the archive uninvited

`agent-delivery/archive/` is Charles's private working record of decisions and
dismissals. **An agent must ask before reading anything in it.** It is not
project context: nothing needed to do work in this repository lives there, and
if something does turn out to be needed, it belongs in a live doc instead.
Claude Code is configured to prompt on reads of that folder
(`.claude/settings.json` → `permissions.ask`), but the rule stands regardless of
tooling.

To try the menus without changing anything, run `npm run agent-inbox:try` — it
walks the identical flow and stops before writing, printing exactly what it
would have done. Use it whenever you are unsure what a close will touch.

Always run `npm run format` afterwards and read `git diff` before committing.

### Choosing the next ID

There is no stored counter. The next ID is the highest `AI-nnn` currently in
`sessions/`, plus one:

```bash
grep -rho 'AI-[0-9]\{3\}' agent-delivery/sessions/ | sort -u | tail -1
```

A counter kept in one line of one file is a line every agent must edit, which
makes merge conflicts certain once two agents work in parallel. Scanning avoids
that. Never reuse an ID, even after its matter is closed and archived.

## In-place tag format

An in-place tag is one short comment left **inside the file the matter is
about**, so anyone editing that code sees it without having read the inbox. It
carries no detail — it names the ID and points at the session file that holds
the full entry:

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

## Inbox rules

1. Create a tag only for an unresolved, actionable matter. Do not tag ordinary
   observations, temporary coding notes, or issues the agent can safely solve.
2. Take the next unused ID by scanning `sessions/`; never reuse an older ID.
   Write IDs uppercase — `AI-007`, never `ai-007` — so an in-place tag reads as
   a code marker like `TODO` and greps cleanly. Filenames stay lowercase; the
   CLI accepts either case when you type it.
3. Add all three parts in the same change:
   - one short `AI-TAG(...)` comment beside the affected place;
   - one detailed entry in the session file, with a clickable location and a
     recommendation;
   - one row in the `INBOX.md` index.
4. Never include secrets, credentials, private customer data, or hidden
   reasoning.
5. When Charles answers, record the answer and change the status to `ANSWERED`.
6. When the answer is applied or no longer relevant, close it with
   `npm run agent-inbox:close`. It archives the matter, then removes all three
   records. Nothing is ever deleted outright.
