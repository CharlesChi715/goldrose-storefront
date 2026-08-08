---
# VOCABULARY — every allowed key (unknown key = error; `id`/`area` are banned:
# the filename is the id). Authority: the cli.mjs schema once `check` exists;
# this block only illustrates it.
# Presence: (r) always · (a) while ready/in-progress/uat · (v) at accepted · (o) optional
#
# delivery states: backlog = born here, approach not chosen · ready = approach
# chosen, options recorded · in-progress = being built · uat = deployed,
# awaiting human sign-off (a queue, not an activity) · accepted = a human
# signed off on the deployed site (evidence required) · dropped = rejected;
# keep the record, the why-not is the value.
# rollout = where the code actually runs, independent of delivery.
delivery: backlog # (r) backlog|ready|in-progress|uat|accepted|dropped
rollout: not-deployed # (r) not-deployed|test-deployment|live
statusChangedAt: 2026-08-08 # (r) date of last DELIVERY transition only
priority: p2 # (a) p0|p1|p2
blockedBy: [] # (o) record ids
verification: # (v) ACCEPTED needs human.evidence = URL/SHA/command output
  automated: []
  human: null
---

<!-- Guidance comments (this one included) must be deleted as you fill each section; none may survive past backlog. -->

## Context

<!-- In one sentence. -->



<!-- For all the sections below, only generate on explicit demand. -->

## Decision

<!-- In one sentence. -->

## Plan

<!-- Numbers them: 1. 2. ... each in one sentence, if not current plan decided, skip it and move on to options field -->

## Options considered

<!-- only put options really contemplated and discussed -->

| Option | Pros | Cons | Verdict       |
| ------ | ---- | ---- | ------------- |
|        |      |      | ✅ **chosen** |
|        |      |      | ❌            |

## Tech details

<!-- Only asked for -->

## Blockers and dependencies

<!-- In bullet points with one sentence each -->

## Open questions

<!-- Choices still OURS to make. Number them OQ-1, OQ-2… -->

## Related links

<!-- links in this repo, links of public URL, ... -->