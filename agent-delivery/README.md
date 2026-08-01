# Agent Delivery

This folder is the visible hand-off point between AI agents and Charles. It
holds **messages about** work — unresolved `AI-nnn` matters waiting on him —
never the work itself. Read this file and [`INBOX.md`](INBOX.md) after
`SUMMARY.md` whenever beginning work in this repository, and write back here
before finishing.

**The complete workflow lives in the `agent-delivery` skill**
([`.claude/skills/agent-delivery/SKILL.md`](../.claude/skills/agent-delivery/SKILL.md);
Codex reads a mirror at `.agents/skills/agent-delivery/`): how to file a
matter (session file + INBOX row + in-place tag), pick the next ID, record
answers, and close via `npm run agent-inbox:close`. Load the skill before
filing or closing anything here.

## Folder structure

```text
agent-delivery/
├── README.md       # This map; workflow lives in the agent-delivery skill
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

Other task-specific workflows are also skills (load-on-demand), e.g.
`process-figma-delivery` for design-team deliveries.

## Never read the archive uninvited

`agent-delivery/archive/` is Charles's private working record of decisions
and dismissals. **An agent must ask before reading anything in it.** It is
not project context: nothing needed to do work in this repository lives
there, and if something does turn out to be needed, it belongs in a live doc
instead. Claude Code is configured to prompt on reads of that folder
(`.claude/settings.json` → `permissions.ask`), but the rule stands regardless
of tooling.
