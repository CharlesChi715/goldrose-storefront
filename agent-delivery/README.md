# Agent Delivery

This folder is the visible hand-off point between AI agents and Charles. Read
this file and [`INBOX.md`](INBOX.md) after `SUMMARY.md` whenever beginning work
in this repository.

## Folder structure

```text
agent-delivery/
├── README.md       # Instructions and workflow
└── INBOX.md        # Unresolved, actionable messages
```

These repository areas have different purposes:

| Location | Purpose |
|---|---|
| `agent-delivery/` | Unresolved messages from AI agents to Charles |
| `team-deliveries/` | Incoming source files delivered by the design team or another upstream source |
| `docs/TODO/` | Detailed hand-offs and decisions belonging to a particular task |
| `.ai/WORKLOG.md` | Legacy optional work history; do not use as startup context |

Actual code, documents, images, and other deliverables stay in their proper
repository locations.

## Workflow

1. Read `SUMMARY.md`, this file, and `INBOX.md`.
2. Perform only the work Charles approved.
3. Put unresolved, actionable matters in `INBOX.md` and beside the affected
   repository location using the same `AI-nnn` ID.
4. When an inbox matter is answered and applied, remove its in-place tag and
   open inbox entry. Git history preserves the old record.

## In-place tag format

Leave one concise comment beside the affected place:

```text
AI-TAG(AI-001): OWNER-DECISION — confirm the real shipping rate. See /agent-delivery/INBOX.md#ai-001.
```

Use the comment syntax supported by the file. Never render an AI tag as
customer-facing text.

| Tag | Meaning |
|---|---|
| `OWNER-TODO` | Charles needs to perform an action. |
| `OWNER-DECISION` | Charles or the bosses need to choose between real options. |
| `AGENT-UNSURE` | The agent could not verify important information and must not guess. |
| `AGENT-BLOCKED` | Work cannot continue until an answer or external change arrives. |
| `PLACEHOLDER` | Temporary data, content, UI, or behavior is currently in use. |
| `AGENT-DECISION` | The agent made a reversible choice that Charles may veto. |

## Inbox rules

1. Create a tag only for an unresolved, actionable matter. Do not tag ordinary
   observations, temporary coding notes, or issues the agent can safely solve.
2. Use the `Next ID` recorded in `INBOX.md`; never reuse an older ID.
3. Add both parts in the same change:
   - one short `AI-TAG(...)` comment beside the affected place;
   - one detailed inbox entry with a clickable location and recommendation.
4. Never include secrets, credentials, private customer data, or hidden
   reasoning.
5. When Charles answers, record the answer and change the status to `ANSWERED`.
6. When the answer is applied or no longer relevant, remove both open records.
