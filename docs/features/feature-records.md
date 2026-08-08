---
delivery: in-progress
rollout: not-deployed
statusChangedAt: 2026-08-08
priority: p1
---

# feature-records

## Context

The 2026-08-01 generator teardown left the scheme with no tooling: every rule
lives as README prose nothing enforces, and the hand-maintained roadmap table
has already failed twice.

## Decision

Dated 2026-08-08:

- Flat directory — all records directly in `docs/features/`, no subfolders.
- id = bare filename; the filesystem enforces uniqueness. `id:`/`area:` keys banned (derivable = two places to disagree).
- Key vocabulary is closed with state-conditional presence — `delivery,
  rollout, statusChangedAt` always; `priority` while active; `verification`
  at accepted; unknown keys are errors. Canonical key order = the `KEYS`
  array in cli.mjs. `owner`/`target`/`qualifier`/`dependsOn`/`tags` cut:
  ink, not information, on a one-person team (tags may return — OQ-1).
- Terminal delivery state renamed VERIFIED → ACCEPTED: the name states the
  gate — a human signed off on the deployed site, with recorded evidence.
- TEMPLATE.md illustrates the vocabulary, the cli.mjs schema is the
  authority. Template trimmed: tail sections are generate-on-demand;
  verification evidence lives in front matter, not a body section; guidance
  comments are deleted as sections fill and never survive past backlog.
- Tool errors follow message/detail/hint with `file:` prefixes and exit
  codes 0/1/2; hints are agent playbooks (did-you-mean via edit distance).
- Migration is check-driven: no codemod — the validator's report IS the SOP,
  and every rule written for it keeps guarding afterwards.
- Records conform to the CURRENT template (owner, 2026-08-08, settling the
  A/B-experiment divergence): when a record is migrated or materially edited,
  legacy sections are folded into template sections or deleted — compact over
  conservative. Mutability still protects untouched bodies; it never protects
  a fossil through an edit.

## Plan

1. [x] `new` — scaffold born-backlog records (usage/kebab/collision guards).
2. [x] `check` — links, key vocabulary and order, presence tiers, evidence
       gate, H1 = id, comment survival; collector report, exit 1 on any.
3. [x] Migrate the 9 legacy records on a branch, file by file, re-running
       `check` between files until `all rules pass`.
4. [x] After each `git mv` out of `backend/`: repo-wide
       `grep -rn "features/backend" --include="*.md" .` and fix referrers —
       SUMMARY.md's links are outside check's scope.
5. [ ] Seal: `"features:check"` npm script + CI step beside `check:migrations`.
6. [ ] `roadmap --write` / `--verify` splicing README's marker block; retire
       the "not built yet" interim line when it lands.

## Open questions

- OQ-1: should `tags:` return for journey grouping (e.g. the four checkout
  records), and if so is its vocabulary a closed list (like
  `lib/catalog/facets.ts`) or free-form? Until then the roadmap lists flat.
- ~~OQ-2~~ answered 2026-08-08 during the migration: four legacy records
  (`posting-account-attribution`, `engagement-tracking`, `order-tracking`,
  `region-alignment`) moved `test-deployment` → `live` — their code ships in
  the eldreve.com production deployment, and rollout states where code runs,
  not whether anyone has exercised it yet. Each records the judgment in its
  own Context. `paypal-wallet` stays `test-deployment`: its code is live but
  runs against PayPal sandbox, which is the state the value names.

## Related links

- [scripts/features/cli.mjs](../../scripts/features/cli.mjs) — the tool this record tracks
- [README.md](README.md) — commands and the roadmap marker block
- [TEMPLATE.md](TEMPLATE.md) — vocabulary illustration and body shape
