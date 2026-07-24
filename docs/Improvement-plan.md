# Scalable feature-progress system — implementation plan

I’ll implement the professional version as a deterministic, version-controlled feature registry with generated documentation and CI enforcement. No application behavior will change.

The current roadmap has about 42 leaves and only one dedicated feature document, but that is only the migration baseline. The project is expected to gain many more features. The permanent design must therefore work for hundreds or thousands of feature records without creating a central editing bottleneck.

Each feature will have its own canonical Markdown record with machine-readable front matter. Tooling will discover records recursively, validate their relationships, and generate compact dashboards and area-specific roadmaps. No single status registry will need to be edited whenever any feature changes.

## Target structure

```text
docs/features/
├── README.md                         # Instructions + generated dashboard
├── TEMPLATE.md                       # Template for new feature records
├── frontend/
│   ├── storefront/
│   │   ├── _group.md                 # Hierarchy metadata; no delivery status
│   │   ├── home.md                   # One canonical record per feature
│   │   └── shop.md
│   ├── checkout/
│   │   ├── _group.md
│   │   ├── cart.md
│   │   ├── discount-codes.md
│   │   └── paypal-capture.md
│   └── accounts/
│       └── ...
├── backend/
│   ├── admin/
│   ├── authentication/
│   ├── email/
│   └── database/
└── generated/
    ├── active.md                     # In progress, UAT, and blocked
    ├── frontend.md                   # Complete frontend roadmap
    ├── backend.md                    # Complete backend roadmap
    ├── releases.md                   # Features grouped by target
    └── completed.md                  # Verified and dropped records

scripts/features/
├── schema.mjs                        # Validation schema
├── registry.mjs                      # Recursive loading and relationship graph
├── render.mjs                        # Dashboard and roadmap rendering
└── cli.mjs                           # Create/list/generate/check commands

tests/unit/
└── feature-roadmap.test.ts           # Generator and validation tests

.github/workflows/
└── ci.yml                            # Automated quality checks
```

## 1. Establish a clean baseline

Before editing, I will:

Inspect git status and preserve all unrelated user changes.
Record the existing 42 roadmap leaves and qualifiers.
Run the existing checks:

```bash
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

This distinguishes pre-existing failures from anything introduced by the feature-tracking work.

## 2. Create distributed canonical feature records

Every feature will have one Markdown file containing structured front matter and its human-readable decision record:

```md
---
schemaVersion: 1
id: checkout-cart
kind: feature
parent: native-checkout
area: frontend
order: 10

delivery: uat
rollout: test-deployment
priority: p0
target: v1-launch
owner: charles
statusChangedAt: 2026-07-24

dependsOn: []
blockedBy: []

verification:
  automated:
    - tests/e2e/checkout.spec.ts
  human: null
---

# Shopping cart

## Context

## Decision

## Options considered

## Acceptance criteria

## Plan

## Blockers and dependencies

## Verification evidence

## Related links
```

Group records such as `_group.md` will define hierarchy without pretending that a branch has one delivery status:

```md
---
schemaVersion: 1
id: native-checkout
kind: group
parent: frontend
area: frontend
order: 20
title: Native checkout
---
```

Stable IDs will be globally unique and will not change when a feature title changes. Parent IDs, rather than folder paths alone, will define relationships so features can move without breaking references.

The loader will recursively discover all feature records. Adding the 43rd, 500th, or 5,000th feature will not require editing a central catalog.

## 3. Separate delivery progress from rollout

The registry will stop using one status to represent development, deployment, sandbox mode, and owner activation simultaneously.

Delivery stages:

```text
BACKLOG → READY → IN PROGRESS → UAT → VERIFIED
```

With:

```text
DROPPED
```

as an exit state.

Definitions:

BACKLOG: accepted for the roadmap, but the approach is not decided.
READY: approach and acceptance criteria are sufficiently defined.
IN PROGRESS: implementation is underway.
UAT: implementation and automated checks are complete; awaiting human acceptance.
VERIFIED: accepted by a human in the relevant environment.
DROPPED: considered and intentionally rejected.

Rollout states:

```text
NOT DEPLOYED
LOCAL ONLY
TEST DEPLOYMENT
DORMANT
LIVE
```

Special conditions such as “PayPal sandbox” remain explicit qualifiers instead of being hidden inside UAT.

IN REVIEW will remain a pull-request/code workflow gate rather than a roadmap stage. A feature may involve several pull requests, so moving the whole feature repeatedly into and out of review would make the roadmap noisy. Code review must be complete before entering UAT.

Blocked will remain an independent condition rather than a lifecycle stage. Dependencies and blockers will reference stable feature IDs, allowing the tooling to calculate reverse relationships and identify what is holding up multiple downstream features.

## 4. Migrate the existing roadmap without losing information

I will convert the current tree into structured entries:

TESTING becomes UAT.
STABLE becomes VERIFIED.
READY, BACKLOG, and DROPPED retain their meaning.
Existing blockers and qualifiers are preserved.
Dormant account functionality receives rollout: dormant.
Unimplemented features receive rollout: not-deployed.
The overall testing deployment is represented explicitly.
PayPal sandbox mode remains an explicit qualifier.
Ordering remains identical to the current tree.

The 42 existing leaves are the initial import, not a fixed inventory or design limit. Each will receive its own canonical record. Historical records may be concise and link to the existing specification and tests; I will not create invented decision histories merely to fill a template.

I will not invent verification dates or people. Existing STABLE entries without recorded evidence will be marked honestly as legacy imports, for example:

```yaml
verification:
  type: legacy-import
  note: Migrated from the pre-registry STABLE status; original verification date was not recorded.
```

Future transitions to VERIFIED will require proper evidence.

## 5. Add professional metadata and validation rules

Each feature will support:

```yaml
id:
kind:
parent:
area:
title:
delivery:
rollout:
priority:
owner:
target:
order:
qualifier:
dependsOn:
blockedBy:
statusChangedAt:
verification:
tracking:
```

The validator will enforce:

Unique IDs
Valid delivery and rollout values
Valid parent/child relationships
No circular parent relationships
No circular feature dependencies
No orphaned features
Stable ordering
Required fields
Correct date formats
Existing linked tests and documents
No status on branch-only nodes
A status on every feature node
No unsupported fields or misspellings
Verification evidence for new VERIFIED features
Stage-dependent documentation requirements
No manual drift between source records and generated dashboards

Requirements will become stricter as a feature advances:

| Delivery stage | Required information |
|---|---|
| BACKLOG | ID, title, parent, area, and context |
| READY | Decision, owner, priority, target, and acceptance criteria |
| IN PROGRESS | Implementation plan and dependencies |
| UAT | Automated verification references and test environment |
| VERIFIED | Human verifier, date, environment, and acceptance evidence |
| DROPPED | Explicit rejection reason |

Validation errors will identify the exact feature and field:

```text
docs/features/frontend/checkout/paypal-capture.md
Invalid delivery status "testing".

Expected one of:
backlog, ready, in-progress, uat, verified, dropped
```

## 6. Upgrade the feature-document format

I will add `docs/features/TEMPLATE.md` with the canonical front matter and these sections:

```md
---
schemaVersion: 1
id: example-feature
kind: feature
parent: example-group
area: frontend
delivery: backlog
rollout: not-deployed
---

# Feature name

## Context

## Decision

## Options considered

## Acceptance criteria

## Plan

## Blockers and dependencies

## Verification evidence

## Related links
```

The existing [posting-account-attribution.md (line 1)](/Users/charles/Developer/goldrose-storefront/docs/features/posting-account-attribution.md:1) will be migrated to this format.

Its front matter will be its canonical status source; the generated dashboard will display that status. No second hand-maintained status line will remain in the document body.

I will preserve its existing decision, options, reasoning, and implementation plan while adding:

Testable acceptance criteria
Explicit dependencies
Verification-evidence placeholders
A stable roadmap ID

## 7. Build the deterministic generator

The generator will:

Discover all feature records recursively.
Validate all records before doing anything.
Build an indexed relationship graph with linear traversal.
Convert delivery statuses into the existing dot meters.
Render a compact root dashboard.
Render complete area-specific roadmaps.
Render active, blocked, release, verified, and dropped views.
Include rollout, blocker, and qualifier text only where helpful.
Replace only the generated section of README.md.
Preserve all human-written instructions outside that section.
Produce byte-identical output when nothing changes.

The generated area will be protected by markers:

```md
<!-- FEATURE-ROADMAP:START -->
<!-- Generated by npm run features:generate. Do not edit manually. -->

...

<!-- FEATURE-ROADMAP:END -->
```

The meter mapping will remain familiar:

```text
○○○○ BACKLOG
●○○○ READY
●●○○ IN PROGRESS
●●●○ UAT
●●●● VERIFIED
✕ DROPPED
```

The root README will not attempt to display an indefinitely growing tree. It will show counts, active work, UAT, blockers, and the next release, with links to sharded generated views. This keeps the dashboard useful when the feature count becomes large.

## 8. Add safe package commands

I will add:

```json
{
  "scripts": {
    "features:new": "node scripts/features/cli.mjs new",
    "features:list": "node scripts/features/cli.mjs list",
    "features:generate": "node scripts/features/cli.mjs generate",
    "features:check": "node scripts/features/cli.mjs check",
    "features:validate": "node scripts/features/cli.mjs validate"
  }
}
```

Their behavior:

features:new: scaffold one correctly structured feature record from the template.
features:list: query the registry by status, area, owner, release, priority, or blocker.
features:generate: validate and update the generated README block.
features:validate: validate the registry and linked documents without generating.
features:check: generate expected output in memory and fail if the committed README differs.

features:check will never modify files.

Examples:

```bash
npm run features:list -- --delivery uat
npm run features:list -- --owner charles
npm run features:list -- --target v1-launch
npm run features:list -- --blocked
npm run features:list -- --area frontend
```

Example drift error:

```text
Feature roadmap is out of date.

Run:
  npm run features:generate
```

## 9. Test the tracking system itself

Unit tests will cover:

Valid registry loading
Recursive record discovery
Deterministic roadmap rendering
Idempotent generation
Duplicate IDs
Invalid statuses
Invalid rollout values
Missing required fields
Missing parents
Orphaned features
Circular hierarchy and dependency graphs
Feature nodes without status
Group nodes incorrectly carrying status
Incorrect verification evidence
Preservation of README content outside generated markers
Detection of README drift
Filtering by area, owner, status, release, and blocker
A large synthetic registry of at least 1,000 features

These tests prove that the tracking system is structurally correct. They do not claim that storefront features work.

The loader and renderer will use indexed maps and linear graph traversal rather than repeated full scans. The large-registry fixture will catch hidden assumptions tied to the current project size.

## 10. Add CI with clearly separated responsibilities

The CI workflow will run on pushes and pull requests.

Documentation consistency:

```bash
npm run features:check
```

Application quality:

```bash
npm run lint
npm run test:unit
npm run build
```

Application behavior:

```bash
npm run test:e2e
```

The distinction will be documented:

| CI gate | Meaning |
|---|---|
| features:check | Feature records and generated views agree |
| Lint | Static code rules pass |
| Unit tests | Individual logic behaves correctly |
| Build | Application compiles |
| E2E | Tested user flows function |
| Human UAT | Charles accepts the deployed behavior |

The current visual snapshots are Darwin-only. I will not silently accept newly generated Linux screenshots. For CI, I will either establish and visually inspect Linux baselines in a pinned Playwright environment or initially separate visual regression from nonvisual E2E until trustworthy baselines exist.

CI will validate changed records for fast, specific feedback and will also run a full relationship check so a change cannot break another feature’s parent or dependency reference.

## 11. Document the daily workflow

The revised feature README will explain exactly how work moves:

```text
Raw idea
   ↓
Create canonical feature record: BACKLOG
   ↓
Decision record + acceptance criteria: READY
   ↓
Implementation: IN PROGRESS
   ↓
Code review + automated tests
   ↓
Owner acceptance: UAT
   ↓
Human evidence recorded: VERIFIED
   ↓
Dated completion entry in WORKLOG
```

Normal update workflow:

```bash
# 1. Create or edit one canonical feature record
# 2. Generate and validate the affected views
npm run features:generate
npm run features:check

# 3. Commit the feature record and generated views together
```

The generated README must never be manually edited.

## 12. Prepare for external issue-tracker integration

If the team and daily task volume grow substantially, implementation tasks may move to GitHub Issues, Jira, or Linear while these repository records remain the durable source for product decisions, acceptance criteria, dependencies, and verification evidence.

Feature metadata will support optional external links:

```yaml
tracking:
  issue: null
  pullRequests: []
  design: null
```

The system will always declare one status authority. It will not allow the repository and an external tracker to both claim canonical status independently.

## 13. Update project records

After implementation:

Update SUMMARY.md concisely to describe the canonical feature registry and commands.
Update its file-structure chart.
Append a dated completion entry to .ai/WORKLOG.md.
Avoid expanding SUMMARY.md with low-level implementation details.

## 14. Final verification

Before handoff, I will verify:

All 42 existing roadmap leaves were preserved.
Existing blockers and qualifiers were preserved.
New features can be added without editing a central registry.
The root dashboard remains compact as the registry grows.
Delivery and rollout are separate.
The existing feature decision record is linked correctly.
Generation is deterministic.
A second generation produces no diff.
Deliberately corrupting a fixture causes validation to fail.
README drift causes features:check to fail.
All new unit tests pass.
The synthetic 1,000-feature registry validates and renders correctly.
Existing lint, unit, build, and appropriate E2E checks pass.
No storefront behavior changed.

The finished system’s core rule will be:

Humans edit canonical feature records; tooling generates the overviews; CI detects inconsistency; automated tests check software behavior; humans decide when UAT becomes VERIFIED.

Only this planning document has been updated; the implementation described above has not started.
