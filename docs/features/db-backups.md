---
delivery: in-progress
rollout: not-deployed
statusChangedAt: 2026-09-07
priority: p0
---

# db-backups

## Context

The live database is on Supabase Free, which has no backups, so from the first real
order a lost database means unrecoverable orders and customers.

## Decision

Nightly dump by GitHub Actions, encrypted with `age`, written to a private S3 bucket
through a write-only role; Supabase Pro joins at launch as a second copy, not a replacement.

## Where it stands — 2026-09-19

- [x] Script and workflow on `main` — **dormant**: green in 10 seconds, uploads nothing.
- [x] Local dump proven: 21 tables.
- [x] AWS account, root MFA, `charles-admin`, budget alarm, `aws login`.
- [x] Settings and scripts written: [`infra/aws/`](../../infra/aws/README.md).
- [ ] `./bucket.sh`, then `./role.sh`.
- [ ] `age` key held by both partners · healthchecks.io · GitHub secrets.
- [ ] Replace the workflow: OIDC, encryption, and the `product-images` files no dump contains.
- [ ] Restore drill. Until then there is no backup, only files.

## Acceptance criteria

- [ ] An encrypted dump and the Storage files land in the bucket every night.
- [ ] CI can only `PutObject`; a lifecycle rule deletes after 30 days.
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

- OQ-1: `backup-db.sh` writes three files; the guide was designed around one archive.
- OQ-2: a spare for root sign-in that the boss can hold.

## Related links

- How: [`infra/aws/aws-backup.md`](../../infra/aws/aws-backup.md) ·
  restore: [runbook](../runbooks/restore-from-backup.md)
- Code: [`db-backup.yml`](../../.github/workflows/db-backup.yml) ·
  [`backup-db.sh`](../../scripts/backup-db.sh)
- Launch order: [SUMMARY · Release queue](../../SUMMARY.md#release-queue)
