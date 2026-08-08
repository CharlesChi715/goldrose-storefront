---
# VOCABULARY — every allowed key (unknown key = error
# the filename and tags own those jobs). Authority: cli.mjs schema once the
# `check` subcommand exists; this block only illustrates it.
# Presence: (r) always · (a) while ready/in-progress/uat · (v) at accepted · (o) optional
delivery: backlog # (r) backlog|ready|in-progress|uat|accepted|dropped
rollout: not-deployed # (r) not-deployed|test-deployment|live
statusChangedAt: 2026-08-08 # (r) date of last DELIVERY transition only
priority: p2 # (a) p0|p1|p2
owner: charles # (a) — OQ-1: information or ink on a 1-person team?
target: v1-launch # (a) — OQ-1 likewise
qualifier: one-line caveat # (o) rots fast — prefer absent
tags: [] # (o) grouping for generated views, replaces area/folders
dependsOn: [] # (o) record ids
blockedBy: [] # (o) record ids
verification: # (v) ACCEPTED needs human.evidence = URL/SHA/command output
  automated: []
  human: null
---

## Context

<!-- In one sentence. -->

## Plan

<!-- Numbers them: 1. 2. ... each in one sentence -->





<!-- For all the sections below, only generate on demand. -->

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