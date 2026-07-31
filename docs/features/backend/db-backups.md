---
schemaVersion: 1
id: db-backups
kind: feature
parent: supabase-db
area: backend
order: 30

delivery: backlog
rollout: not-deployed
statusChangedAt: 2026-07-25

dependsOn: []
blockedBy: []

verification:
  automated: []
  human: null
---

# DB backups — Supabase Free + nightly pg_dump→S3

## Context

- Supabase's built-in daily backups are **Pro-only ($25/mo)**; we are on Free,
  so the hosted project (**LIVE data**, ref `cfvsvgbldnzkcjvbwnjp`) currently
  has **no backups at all**.
- Acceptable pre-ship — everything is test data and `npm run seed -- --reset`
  rebuilds it. From the first real order on, a lost DB = unrecoverable
  orders/customers. Ship target 2026-07-30 → this should land at/near launch,
  not sit deep in the backlog.
- Plan decided 2026-07-22 (recorded in Database.md); graduated to this record
  2026-07-25.
- Side benefit: real AWS practice for Charles (S3, IAM least-privilege,
  scheduled jobs) — useful résumé/interview material.

## Decision

Platform level, decided 2026-07-22: **Supabase Free + nightly `pg_dump` → AWS
S3**, lifecycle rule deleting dumps >30 days. Cost at our scale:
**cents/month**. Restores are on us — a periodic restore drill is part of the
feature; an untested backup doesn't count. **At launch:** upgrade to Pro anyway
(never-pauses + managed one-click restores + support) and keep the S3 pipeline
as the independent second copy. **After the pipeline is proven:** cancel Pro to
save money (re-check the Free-tier pause policy then — Pro is more than
backups).

Still open — keeps this BACKLOG: **where the nightly job runs** (scheduler
table below; Option A proposed, awaiting sign-off).

## Options considered

Platform (decided 2026-07-22, moved from Database.md):

| Option                         | Pros                                                      | Cons                                                      | Verdict                              |
| ------------------------------ | --------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------ |
| Supabase Pro backups only      | zero build                                                | $25/mo during testing; same vendor holds data AND backups | ❌ now — at launch yes, alongside S3 |
| Supabase Free + DIY pg_dump→S3 | cents/month; vendor-independent second copy; AWS practice | restores + monitoring are on us                           | ✅ **chosen**                        |
| Raw AWS RDS / Azure Postgres   | full control                                              | no free tier; loses Supabase Auth/API — weeks of rebuild  | ❌                                   |
| Self-host the Supabase stack   | —                                                         | we become the ops team                                    | ❌                                   |

(Supabase hosted runs on AWS and is standard Postgres underneath — data
migrates out cleanly if ever needed.)

Scheduler (open):

| Option                         | Pros                                                                   | Cons                                                                                                                          | Verdict               |
| ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| A. GitHub Actions nightly cron | free; built-in secrets manager; a red run emails us; ~30-line workflow | runners are IPv4-only → must dump via the Supabase **session pooler** URL (direct connection is IPv6); cron can drift minutes | ✅ **proposed**       |
| B. AWS EventBridge + Lambda    | max AWS practice                                                       | `pg_dump` binary needs a Lambda layer/container image; more moving parts                                                      | ❌ V1 — revisit later |
| C. cron on Charles's Mac       | trivial                                                                | machine must be awake nightly; not professional practice                                                                      | ❌                    |

## Acceptance criteria

- [ ] Nightly dump of the FULL hosted DB (all schemas incl. `auth`,
      `--format=custom`) lands in a private S3 bucket (SSE on, public access
      blocked).
- [ ] Lifecycle rule deletes dumps older than 30 days; the job's IAM user can
      `s3:PutObject` to this bucket only — nothing else.
- [ ] A failed nightly run is loud (red workflow → email), never silent.
- [ ] Restore drill: a dump restored into scratch Postgres (local or throwaway
      Supabase project) and the admin app reads it — documented as a runbook,
      repeated monthly.
- [ ] Human acceptance: Charles completes one full restore drill and records
      the evidence below.

## Plan

| #   | Work item                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | S3 bucket (private, SSE, block-public-access) + 30-day lifecycle rule                                                                              |
| 2   | IAM user for the job, least-privilege `s3:PutObject` on the bucket path; keys + session-pooler `DATABASE_URL` → GitHub Actions secrets             |
| 3   | Workflow `.github/workflows/db-backup.yml`: nightly cron → `pg_dump --format=custom` (client pinned to the server's Postgres major) → upload to S3 |
| 4   | Restore runbook + first drill; monthly reminder                                                                                                    |
| 5   | At launch: owner upgrades to Pro (managed second copy); after the pipeline is proven, decide Pro cancellation                                      |

## Blockers and dependencies

None on other features. Needs an AWS account (Charles) and the hosted
project's session-pooler connection string. Gotcha worth repeating: Supabase
direct connections are IPv6-only — from GitHub-hosted runners the dump must go
through the session pooler.

## Verification evidence

None yet — BACKLOG.

## Related links

- Origin + platform decision: [Database.md](../../Database.md) (now points back here)
- Launch-time Pro upgrade sits with the owner activation work:
  [SUMMARY.md · Release queue](../../../SUMMARY.md#release-queue)
