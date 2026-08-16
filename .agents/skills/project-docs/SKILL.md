---
name: project-docs
description: "Where every kind of fact lives in the ELDREVE repo, and where to write a new one. Use when you need to find which document owns a topic, when you are about to record something and must choose the file, when asked about feature status or the roadmap, about past deliveries or the owner's ideas, or when you would otherwise grep the docs tree. Triggers: where is this documented, which doc owns, doc index, feature status, roadmap, worklog, ideas, learning docs, team deliveries, where should I write this."
metadata:
  author: charles
  version: "1.0.0"
---

# Where each fact lives

The repo keeps **one home per kind of truth**. Read the home; never restate it
somewhere else, because two copies drift and the next reader must load both to
learn which is current.

## Writing rule — choose the home before you write

| Kind of truth                                             | Home                                                    |
| --------------------------------------------------------- | ------------------------------------------------------- |
| Startup context: goal, state index, structure, rules      | `SUMMARY.md` — one line per fact, then a link           |
| Where a feature stands, why the approach won, what's left | `docs/features/<id>.md` — front matter is the status DB |
| How a built thing works (mechanism, spec, geometry)       | `docs/admin-design.md` `§` — see the `admin-spec` skill |
| What one delivery did; a question waiting on Charles      | `agent-delivery/sessions/` + `INBOX.md`                 |
| Design-file state, what the design team owes us           | `docs/ixd/README.md`                                    |
| Naming conventions                                        | `docs/ixd/naming/` — see the `naming` skill             |
| Database shapes, SKU rules, migrations                    | `docs/Database.md` — see the `database` skill           |
| SEO/GEO plan and gates                                    | `docs/seo-geo/` — see the `seo-geo` skill               |
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

## The rest of the map

- **`agent-delivery/`** — messages from agents to Charles (`AI-nnn`), never the
  work itself. Workflow lives in the `agent-delivery` skill.
  ⚠️ `agent-delivery/archive/` is private: **ask before reading it**.
- **`team-deliveries/`** — raw upstream files as delivered.
  `originals/` is verbatim and must never be reformatted.
- **`docs/learning/`** — end-to-end traces written for Charles to learn from;
  read `README.md` there for the reading order.
- **`docs/ideas.md`** — the owner's ideas in his own words. Capture them raw;
  do not expand, tidy or interpret them.
- **`docs/Database.md`** — change **only on explicit request**, and keep it
  concise.
- **`.ai/WORKLOG.md`** — do not read it without asking Charles; append a dated
  entry (`## YYYY-MM-DD HH:MM AEST — title`) when a deliverable is done.
