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

# Optional fields — uncomment as the feature advances (required while delivery is ready/in-progress/uat):
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

<!-- The "why not X" record — only put the dismissed options here. -->

| Option | Pros | Cons | Verdict       |
| ------ | ---- | ---- | ------------- |
|        |      |      | ✅ **chosen** |
|        |      |      | ❌            |

## Acceptance criteria

<!-- Testable checkboxes. The last one is usually the human acceptance that gates UAT → VERIFIED. -->

- [ ]

## Plan

<!-- Work items. Historical record of intent — do NOT retro-edit after shipping; "Verification evidence" describes reality. -->

## Tech details

<!-- OPTIONAL. What we learned about the TERRAIN while planning this: which APIs
     or libraries we chose and why, platform constraints, and the traps that cost
     us time to find. Reference material for whoever builds it.

     Test for what belongs: whose fact is it?
       - a fact about the PLATFORM ("background tabs throttle setInterval";
         "IntersectionObserver reports geometry, not occlusion") — keep it, it
         stays true no matter how we write our code.
       - a fact about OUR CODE ("the handler lives in X.tsx, shaped like Y") —
         leave it out, it rots at the first refactor. Post-ship description of
         how the system works belongs in docs/admin-design.md.

     Cite sources for non-obvious platform claims so they can be re-checked. -->

## Blockers and dependencies

<!-- Prose explanation only (the WHY). The ids themselves belong in dependsOn/blockedBy above — never list ids only here. -->

## Open questions

<!-- OPTIONAL. Choices still OURS to make — unlike "Blockers", which are someone
     else's to clear. Number them OQ-1, OQ-2… (same convention as SUMMARY.md).
     State the options and recommend one; do not write it as decided.
     Every OQ must have an exit: it either graduates into "Decision" above (we
     chose), or into SUMMARY.md "Product decisions" (it turned out to be a
     cross-feature business call). Delete it from here when it exits. -->

## Verification evidence

<!-- Automated: which tests ran green, and when. Human: who verified, date, environment, what they saw. No evidence = not VERIFIED. -->

## Related links

<!-- Specs and learning docs. -->
