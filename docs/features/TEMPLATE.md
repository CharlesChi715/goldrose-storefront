---
schemaVersion: 1
id: example-feature            # globally unique, stable — never changes when the title changes
kind: feature                  # feature | group (groups live in _group.md and carry NO delivery/rollout)
parent: example-group          # parent group's id — an id, not a folder path
area: frontend                 # frontend | backend
order: 10                      # display order among siblings (10, 20, 30… leaves room to insert)

delivery: backlog              # backlog | ready | in-progress | uat | verified | dropped
rollout: not-deployed          # not-deployed | local-only | test-deployment | dormant | live
statusChangedAt: 2026-01-01    # update whenever delivery changes

# Optional fields — uncomment as the feature advances (required from READY onward):
# priority: p1                 # p0 | p1 | p2
# owner: charles
# target: v1-launch
# title:                       # only if the dashboard label must differ from the H1 below
# qualifier:                   # short caveat ONLY when the bare status would mislead (e.g. "sandbox until launch")

dependsOn: []                  # feature ids this needs first — ids live HERE (machine truth); prose below only explains why
blockedBy: []                  # feature ids currently blocking this

verification:
  automated: []                # test file paths that prove the acceptance criteria
  human: null                  # required for VERIFIED — { by, date, environment, evidence }

# tracking:                    # optional links to external trackers — repo stays the status authority
#   issue: null
#   pullRequests: []
#   design: null
---

# Feature name

<!-- Status lives ONLY in the front matter above — never write a status line in the body. -->

## Context

<!-- Why this exists: the problem, who asked for it, what happens if we do nothing. -->

## Decision

<!-- What we chose, in one or two sentences. Required from READY. -->

## Options considered

<!-- The "why not X" record — the most valuable section six months from now. -->

| Option | Pros | Cons | Verdict |
|---|---|---|---|
|  |  |  | ✅ **chosen** |
|  |  |  | ❌ |

## Acceptance criteria

<!-- Testable checkboxes. The last one is usually the human acceptance that gates UAT → VERIFIED. -->

- [ ]

## Plan

<!-- Work items. Historical record of intent — do NOT retro-edit after shipping; "Verification evidence" describes reality. -->

## Blockers and dependencies

<!-- Prose explanation only (the WHY). The ids themselves belong in dependsOn/blockedBy above — never list ids only here. -->

## Verification evidence

<!-- Automated: which tests ran green, and when. Human: who verified, date, environment, what they saw. No evidence = not VERIFIED. -->

## Related links

<!-- Specs, learning docs, TESTER-GUIDE sections. -->
