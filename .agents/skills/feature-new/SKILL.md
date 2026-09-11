---
name: feature-new
description: "Design a new ELDREVE feature with Charles, then create its record. Use when Charles brings a feature idea, asks to add, create, or start tracking a feature, or types /feature-new [id]. Discussion FIRST: no file is created or edited until Charles explicitly agrees the design; then scaffold with npm run features:new -- <id>, fill the record per docs/features/TEMPLATE.md, sync the roadmap, and validate with check."
metadata:
  author: charles
  version: "2.0.0"
---

# Design the feature with Charles, then record it

A record is the OUTPUT of an agreed design, never the venue for reaching
one. Nothing in the repository changes before phase 4.

## 1 · Listen and ground (no files)

- Restate the idea in your own words and let Charles correct the restatement.
- Read the roadmap in `docs/features/README.md` and scan record ids for
  overlap; open `SUMMARY.md` if the surrounding state is unclear. If a cousin
  record exists, say so early — the right outcome may be editing that record,
  not creating a new one (the CLI refuses taken ids anyway).

## 2 · Critique and explore (no files)

- Start from Charles's own design: name its strengths and risks before
  offering alternatives; never open with a finished replacement for his idea.
- Ask open text questions, one topic at a time. No AskUserQuestion menus in
  this phase — menus are reserved for the final decision.
- HARD RULE: create and edit no files while this phase runs, whatever else
  the conversation asks of you.

## 3 · Converge — the gate

- When Charles sounds ready, summarize in one place: proposed kebab-case id,
  context, the decision, options rejected and why, a rough plan, and the
  delivery stage you would assign — `backlog` if the idea is parked, `ready`
  plus a `priority` if the design is complete and buildable.
- Ask for explicit agreement (a menu is fine here). Only Charles's explicit
  yes passes the gate. Never pass it yourself — not in autonomous runs, not
  because the design "seems settled".
- If the session ends without agreement: offer to file the open question
  through the agent-delivery skill (AI-nnn) so the thread survives; if
  declined, nothing is written anywhere, and that is the correct outcome.

## 4 · Materialize (only after the gate)

1. `npm run features:new -- <id>` — it refuses invalid or taken ids; obey
   the error hints, they are written as repair instructions.
2. Read `docs/features/TEMPLATE.md` (key vocabulary and section rules) and
   fill the record from the discussion: Context, the agreed Decision, the
   options rejected, the plan. Delete each guidance comment you fulfil. A
   record is born `delivery: backlog`; move it to `ready` only if that was
   agreed at the gate — updating `statusChangedAt` and adding `priority`.
3. `npm run features:roadmap`, then `npm run features:check`; fix everything
   it reports until it prints `all rules pass`.
4. Commit the record and README together in one commit; touch nothing
   beyond them.
5. Report the record path and its roadmap row.

## Never

- Boss ideas quoted verbatim belong in `docs/ideas.md`, never in records.
- Do not advance any other record's state as a side effect of this skill.
