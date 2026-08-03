# archive/

Files kept for history, **not** for use.

## The rule

**Nothing in this folder is referenced anywhere in the repository.** No imports,
no markdown links, no code comments pointing here. That is the defining property
of the folder, and it is what makes it safe to ignore.

If you are reading a file in here, you are reading history. Do not link to it, do
not cite it as a source of truth, and do not restore it without deciding what it
supersedes.

## Why keep it at all

Deleted files survive in `git log` — but only if you already know they existed
and what they were called. This folder keeps superseded work findable by
browsing instead of by archaeology.

**Three folders, three rules — the difference matters:**

|                    | Version-controlled? | Referenced from the repo? | What it holds                                 |
| ------------------ | ------------------- | ------------------------- | --------------------------------------------- |
| `archive/`         | **yes**             | **never**                 | superseded repo docs, kept deliberately       |
| `team-deliveries/` | **yes**             | **constantly**            | upstream deliveries; the authority on wording |
| `trash/`           | no — gitignored     | **never**                 | scratch; deletable at any time                |

So anything worth keeping goes here or in `team-deliveries/`, never in `trash/`.
Raw material that arrived from the design team is a *delivery*, not an archive —
it belongs in `team-deliveries/`, because things in here are by definition never
cited.

## Adding a file

1. **Remove every reference first.** `grep -rn "<filename>" . | grep -v node_modules`
   should come back with nothing outside `.ai/WORKLOG.md` — the worklog is
   history and is deliberately never rewritten.
2. Move the file here.
3. Add a row to the table below saying what replaced it. An archived file with no
   successor recorded is the thing that wastes someone's afternoon later.

## Contents

| File                                   | Archived   | Superseded by                                                                          |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `from-teammates-figma-naming-guide.md` | 2026-07-31 | `docs/ixd/naming/` — `figma-route-rule.md`, `component-names.md`, `product-handles.md` |
| `figma-sync-coverage-analysis-mental-model.md` | 2026-08-03 | nothing — parked here by request, never live. A method for diagnosing why `figma-sync` under-imports (EN + 中文). If the analysis is ever run, move it to `docs/ixd/` so it can be cited. |
