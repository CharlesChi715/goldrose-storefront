---
name: project-docs
description: "Where every kind of fact lives in the ELDREVE repo, and where to write a new one. Use when you need to find which document owns a topic, when you are about to record something and must choose the file, when asked about feature status or the roadmap, about past deliveries or the owner's ideas, or when you would otherwise grep the docs tree. Triggers: where is this documented, which doc owns, doc index, feature status, roadmap, worklog, ideas, team deliveries, where should I write this."
metadata:
  author: charles
  version: "2.0.0"
---

# Where each fact lives

Most facts about this repo are **not written down anywhere**, on purpose. A
written copy of something the repo already is will drift, and a drifted copy is
worse than no copy: it is believed.

## The test, before you write anything down

A fact may be written here only if one of these is true.

1. **It cannot rot.** A decision, the options rejected, a reason, a principle,
   or a dated historical record.
2. **A tool owns it.** Generated or verified by a command CI runs.
3. **It tells you the command, not the answer.** "Run `x`" never goes stale;
   "the answer is 21" does.

Otherwise, do not write it. Name the command that answers it.

## Ask the repo, do not read about it

| Question                            | How to answer it                          |
| ----------------------------------- | ----------------------------------------- |
| What is the schema?                 | `supabase/migrations/*.sql`               |
| Which migrations are applied?       | `supabase migration list`                 |
| What is the folder layout?          | `tree`                                    |
| Which gates run?                    | `.github/workflows/ci.yml`, `npm run check` |
| Which env vars exist?               | `.env.example` (CI checks it with `check:env`) |
| What is set in Vercel?              | `vercel env ls production`                |
| What is live in AWS?                | `infra/aws/status.sh`                     |
| Which CLIs are installed?           | `brew leaves`                             |
| How does this code work?            | Read the code. No document traces it.     |

## Writing rule — choose the home before you write

| Kind of truth                                             | Home                                                    |
| --------------------------------------------------------- | ------------------------------------------------------- |
| Startup context: goal, state index, rules                 | `SUMMARY.md` — one line per fact, then a link           |
| Where a feature stands, why the approach won, what's left | `docs/features/<id>.md` — front matter is the status DB |
| What to do when something breaks                          | `docs/runbooks/`                                        |
| How a vendor is set up, and its live state                | `infra/<vendor>/` — a script, not prose                 |
| What one delivery did; a question waiting on Charles      | `agent-delivery/sessions/` + `INBOX.md`                 |
| The owner's ideas                                         | `docs/ideas.md`, **verbatim**                           |
| What happened, dated                                      | `.ai/WORKLOG.md` (append; never startup context)        |
| History                                                   | `git log` — not a document                              |

## Feature status — never written as prose

`docs/features/<id>.md` front matter is the only status database; the roadmap
table in `docs/features/README.md` is **generated** from it.

- `npm run features:check` — validates every record (CI runs it too).
- `npm run features:roadmap` — regenerates the README table; `check` fails
  while it is stale.
- Creating a record has its own skill: `feature-new`.
- `TEMPLATE.md` is the vocabulary; `scripts/features/cli.mjs` is the authority.

A record's **Decision** and **Options considered** are the part worth keeping:
they say why, which no command can answer. Its body may go stale once the
feature is live; only the front matter must stay true.

## The rest of the map

- **`agent-delivery/`** — messages from agents to Charles (`AI-nnn`), never the
  work itself. Workflow lives in the `agent-delivery` skill.
  ⚠️ `agent-delivery/archive/` is private: **ask before reading it**.
- **`team-deliveries/`** — raw upstream files as delivered.
  `originals/` is verbatim and must never be reformatted.
- **`docs/ideas.md`** — the owner's ideas in his own words. Capture them raw;
  do not expand, tidy or interpret them.
- **`.ai/WORKLOG.md`** — do not read it without asking Charles; append a dated
  entry (`## YYYY-MM-DD HH:MM AEST — title`) when a deliverable is done.

## What was deleted, and why (2026-09-20)

`docs/learning/`, `docs/admin-design.md`, `docs/Database.md`, `docs/seo-geo/`,
`docs/ixd/` and `docs/supplier-color-charts.md` were removed, with the
`admin-spec`, `naming` and `seo-geo` skills that routed to them. They described
the code rather than deciding anything, so they drifted: an audit found 72% of
the learning docs' 314 code pointers wrong and 76% of their pasted code blocks
no longer matching the source. Read the code; it cannot be out of date. All of
it stays in `git log` if a decision needs recovering.
