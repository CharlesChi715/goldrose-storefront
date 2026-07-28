# docs/TODO — owner-decision hand-offs

When an AI agent finishes (or half-finishes) a task Charles assigned, anything
that needs **Charles's input** gets recorded here as one file per task:
assumptions made, things mocked, decisions the agent took on its own, and big
decisions it deliberately left for Charles.

## When to create a file

Create one **only if** the task produced at least one of:

- an assumption or self-made decision Charles should be able to veto,
- a mock/placeholder or halfway-done piece and what activates it,
- a decision the agent could not make and needs Charles for.

Task fully done with nothing to escalate → no file. Long-lived **product**
decisions graduate to `SUMMARY.md` → Product decisions (OQ-n numbering); this
folder is for per-task hand-offs only.

## Standing docs (the one exception)

Some questions are not owned by any single task and never stop arriving.
Those live in a permanent, undated file that is emptied rather than deleted:

- [`design-team-questions.md`](design-team-questions.md) — every open question
  for the front-end design team: which page a Figma frame belongs to, where a
  button is meant to go, missing states, and design conflicts. **If you cannot
  tell from the frames where something navigates or what a state should look
  like, add an entry there instead of guessing.**

## Naming

`YYYY-MM-DD-<kebab-task-name>.md` — date is when the task was assigned.
Example: `2026-07-28-customer-signin-smtp.md`. Standing docs above are the
exception and carry no date.

## Rules

- **Every entry is dated.** Times are Sydney local, `YYYY-MM-DD HH:MM` format.
- Questions are numbered `Q1, Q2…`; self-made decisions `D1…`; mocks `M1…` —
  so replies can say "Q2: option B".
- Each question states its options **and a recommendation with a reason** —
  never a bare open question.
- Charles answers inline under **Your answer**, with a date; the agent that
  applies the answer records it in the Resolution log and updates Status.
- When Status reaches 🟢 (everything answered and applied), **delete the
  file** — history stays in git, same as the rest of `docs/`.

## Template — copy everything below into a new file

```markdown
# TODO: <short task name>

|                        |                                                       |
| ---------------------- | ----------------------------------------------------- |
| **Task (as assigned)** | "<the ask, verbatim or near-verbatim>"                |
| **Assigned**           | 2026-07-28                                            |
| **Work window**        | 2026-07-28 14:00 → 16:30                              |
| **Agent / session**    | <e.g. Claude Code background job>                     |
| **Branch / commits**   | `main` · `abc1234`                                    |
| **Status**             | 🔴 needs decisions · 🟡 decided, not applied · 🟢 done |

## 1. What shipped

- One bullet per delivered piece, with file paths.

## 2. Decisions I made myself (veto window)

| #   | Decision | Why | Where       |
| --- | -------- | --- | ----------- |
| D1  | …        | …   | `path:line` |

## 3. Mocked or halfway

| #   | What | Current state | What activates it |
| --- | ---- | ------------- | ----------------- |
| M1  | …    | …             | …                 |

## 4. Needs your decision

### Q1 — <one-line question> (blocking: yes/no)

- **Context:** why this came up, in 1–3 lines.
- **Options:** A) … B) …
- **Recommendation:** A, because …
- **Your answer:** _(Charles writes here, with date)_

## 5. Resolution log

- 2026-07-29 — Q1 answered "A"; applied in `def5678`.
```
