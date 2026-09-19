---
delivery: in-progress
rollout: live
statusChangedAt: 2026-09-19
priority: p0
---

# db-backups

## Context

The live database is on Supabase Free, which has no backups, so from the first real
order a lost database means unrecoverable orders and customers.

## Decision

Nightly dump by GitHub Actions, written to a private S3 bucket through a write-only role;
Supabase Pro joins at launch as a second copy, not a replacement. `age` encryption and an
external dead-man switch were deferred on 2026-09-19 — why: [guide](../../infra/aws/aws-backup.md).

## Where it stands — 2026-09-19

- [x] Local dump proven: 21 tables.
- [x] AWS account, root MFA, `charles-admin`, budget alarm, `aws login`.
- [x] Bucket and write-only role created from [`infra/aws/`](../../infra/aws/README.md), each setting verified.
- [x] Workflow on `main` uses OIDC and fails when unconfigured; five settings in GitHub.
- [x] **First real backup: run `35432091546`, three files under `db/2026/09/2026-09-19T0829Z/`.**
- [x] `uptime.yml` goes red when no backup has succeeded in 25 hours.
- [x] **Restore drill, 2026-09-19:** backup `2026-09-19T0829Z` restored into a throwaway Supabase project. Eight of eight counts matched live (20 orders, 21 lines, 2 products, 5 customers, 10 users, 10 identities, 33 image rows, 15 foreign keys); the web API answered identically to live. Five errors ignored, all Supabase bookkeeping. Scratch project and local files deleted. Charles ran the download and inspection; the agent ran the restore and comparison at his request. Next drill due 2026-10-19.
- [ ] The `product-images` files, which no dump contains.
- [ ] Before launch: `age` encryption, an external dead-man switch, the weekly CI restore test.

## Acceptance criteria

- [ ] An encrypted dump and the Storage files land in the bucket every night.
- [x] CI can only `PutObject`; a lifecycle rule deletes after 30 days.
- [ ] A failed or missing run alerts both partners.
- [ ] The weekly CI restore test is green.
- [ ] Charles completes one restore drill; evidence in `verification.human`.

## Options considered

| Option                          | Verdict                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| Supabase Free + dump to S3      | ✅ **chosen** — cents a month, a copy no single vendor holds   |
| Supabase Pro backups only       | ❌ one vendor holds the data and its only copy; fine as a second |
| AWS RDS or self-hosted Supabase | ❌ loses Supabase Auth and API, or makes us the ops team       |
| GitHub Actions cron             | ✅ **chosen** — free, secrets built in, runs where the code lives |
| AWS Lambda + EventBridge        | ❌ `pg_dump` needs a container image; more moving parts        |
| cron on Charles's Mac           | ❌ the Mac must be awake every night                           |

## Open questions

- OQ-1 — decided 2026-09-19: keep the three files `backup-db.sh` writes; they are what ran, locally and in CI.
- OQ-2: a spare for root sign-in that the boss can hold.

## Related links

- How: [`infra/aws/aws-backup.md`](../../infra/aws/aws-backup.md) ·
  restore: [runbook](../runbooks/restore-from-backup.md)
- Code: [`db-backup.yml`](../../.github/workflows/db-backup.yml) ·
  [`backup-db.sh`](../../scripts/backup-db.sh)
- Launch order: [SUMMARY · Release queue](../../SUMMARY.md#release-queue)
