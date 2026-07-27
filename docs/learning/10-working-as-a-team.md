# Feature Learning 10 — Working as a Team: The Life of One Change

Traced end to end per [README.md](README.md).
The other docs trace what the code does. This one traces how a change travels *between people* — from "we should build X" to code on `main` that everyone trusts. It came out of a conversation (2026-07-27) about why small teams feel disorganized even when every member is capable, and it uses this repo's own workflow as the working example.

## Feature Summary

**What it does**
Turns "several people editing the same code" into a system where, at any moment, anyone can answer three questions *without asking anyone*:

1. What is the current truth?
2. Who is doing what, and what does "done" mean?
3. How does my work join everyone else's without breaking it?

**Why it exists**
Teams don't feel "off" because people lack skill or effort. They feel off because of **ambiguity** — nobody is quite sure which version is real, whether Tuesday's decision was final, or whether "handle the login page" included error handling. Professional teams are not smoother because they are smarter; they are smoother because their habits **remove ambiguity and make work visible**. Every practice in this doc is that one idea applied to a different place.

Key jargon:
- **Source of truth** = the one agreed home for a kind of information. If it isn't written there, it didn't happen.
- **PR (pull request)** = "here is my change, look before it joins the real code." The unit of team integration.
- **CI (continuous integration)** = a server that runs the checks on every push, so correctness doesn't depend on anyone remembering ([doc 09](09-tests-and-ci.md)).
- **Squash-merge** = collapse a branch's messy work-in-progress commits into one clean commit on `main`.
- **Definition of done** = one written sentence saying what finished looks like, agreed *before* the work starts.
- **Standup** = a short sync: what I did, what I'm doing, what's blocking me. Ten minutes, then stop.
- **Retro(spective)** = the team regularly asks "what felt off, and what one thing do we change?"

## The three ambiguities

| Ambiguity | How it feels day to day | The habit that removes it |
| --- | --- | --- |
| What is the current truth? | "Is this the latest version?" "Didn't we decide the opposite last week?" | One home per kind of truth: `main` for code, one task list for work, one doc per topic for decisions |
| Who owns what, and what is "done"? | Two people build overlapping things; "done" work is missing half its cases | Small written tasks, one owner each, with a one-sentence definition of done |
| How does work integrate? | Merge fights, giant two-week branches, "it works on my machine" | Short-lived branch → small PR → CI → review → squash-merge; robots enforce style so humans review substance |

Big vague tasks are where collaboration goes to die: nobody can see progress, so nobody can help. Small tasks are the underrated fix — a day or two of work, visible, finishable.

## Code Trace

The life of one change in this repo, from words to production:

```text
 IDEA                           WORK                              TRUTH
 ────                           ────                              ─────
 owner's words                  git switch -c feat/x              main
 docs/ideas.md (verbatim)       edit, commit, push                (always deployable;
        │                            │                             auto-deploys to Vercel)
        ▼                            ▼                                   ▲
 scoped task,                   pull request on GitHub                   │
 "done means: …"                     ├─ CI: lint, typecheck, unit tests  │
                                     │    (.github/workflows/ci.yml)     │
                                     ├─ Vercel preview URL — click it,   │
                                     │    try the change like a customer │
                                     └─ review / owner sign-off          │
                                            │                            │
                                            ▼                            │
                                squash-merge → one clean commit ─────────┘
                                delete the branch
                                (each cycle ends with main only)
```

### Step 1 — Truth lives in files, not in heads

Intern teams keep truth in memory and in chat scrollback, and it evaporates. This repo keeps one home per kind of truth, and [SUMMARY.md](../../SUMMARY.md) states the rule outright:

> Give each documentation topic one authoritative owner.

So: `SUMMARY.md` is where any newcomer starts, [`docs/project-state.md`](../project-state.md) owns current blockers and open decisions, [`docs/ideas.md`](../ideas.md) holds the owner's ideas verbatim, and `main` is always the real, working code. Nobody has to ask "which version is current?" — the answer is structural, not social. **If it isn't written in the home, it didn't happen.**

### Step 2 — Work is small, written, and owned

"Can you handle the login page?" is how duplicate and half-finished work gets made. The professional version is a task small enough to finish in a day or two, with one owner and a written definition of done: *"user can log in, wrong password shows a message, works on mobile."* Now "done" is a checkable fact instead of an opinion, progress is visible, and teammates can actually help.

### Step 3 — Integration is a pipeline, not a negotiation

Nothing is edited on `main` directly. A change rides a short-lived branch into a PR, and the PR must survive three kinds of checking before it may land:

1. **Robots check the mechanical layer.** CI runs lint, typecheck, and unit tests on every push (traced in [doc 09](09-tests-and-ci.md)). A formatter and linter mean no human ever spends review time on spacing again — review stays about substance.
2. **A real environment checks behavior.** Vercel builds a preview URL for the branch, so the change can be *tried*, not imagined — by a reviewer or a non-technical owner.
3. **A person checks intent.** Review or owner sign-off answers the one question robots can't: is this the right change?

Then squash-merge produces one clean commit on `main` and the branch is deleted. You can see the shape in the history — `feat(orders): … (#9)` is a whole branch of work landing as a single commit. Long-lived branches are the enemy: the longer a branch lives, the further `main` drifts from it, and the merge pain grows faster than linearly.

### Step 4 — Rhythm: sync short, retro honest

Two meetings, both small:

- **Standup** (daily or every other day, ten minutes): what I did, what I'm doing, what's blocking me. Its real product is surfacing blockers early — a teammate blocked for three silent days is a process failure, not a personal one.
- **Retro** (weekly or per milestone): "what felt off, and what *one* thing do we change?" This habit is the actual engine of improvement — teams that retro fix themselves; teams that don't accumulate friction and quietly blame each other. This very doc is the output of a retro question.

## What a bigger team adds — and when

A task board with columns, required reviewers, branch-protection settings, a staging environment, an on-call rotation. All real, all eventually useful, and all *costs*. The rule is the same one doc 09 applies to test frameworks: **add process when the pain is real, not in anticipation of it.** A small team that installs everything at once drowns in ceremony and then abandons all of it. Pick the single ambiguity that hurts most — for intern teams it is usually "no single task list" or "giant messy merges" — fix only that, and let the next retro pick the next one.

## Recap — transferable ideas

- Ambiguity, not skill, is what makes a team feel "off". Name which of the three ambiguities a friction belongs to, and the fix usually names itself.
- One home per kind of truth; if it isn't written in the home, it didn't happen.
- Tasks: small, written, one owner, one sentence of "done".
- `main` always works. Changes join through short branches and small PRs; robots check the mechanical layer so humans review substance and intent.
- Standups exist to surface blockers; retros exist to improve the process itself.
- Process is a cost. Adopt one habit at a time, chosen by the current worst pain.
