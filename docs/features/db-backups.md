---
delivery: in-progress
rollout: live
statusChangedAt: 2026-09-19
priority: p0
---

# db-backups

## Context

Supabase Free has no backups, so from the first real order a lost database means
unrecoverable orders and customers.

## Decision

Nightly dump by GitHub Actions into a private S3 bucket through a write-only role.
Supabase Pro joins at launch as a second copy, not a replacement.

```text
[ DATA ]→[ COPY ]→[ OFFSITE ]→[ MONITORED ]→[ RESTORED ]
 Supabase  pg_dump    S3        uptime.yml    only the drill proves it
```

- CI writes to the bucket; it never reads, lists or deletes.
- A green run means a backup exists: missing settings are an error, not a warning.
- State: run [`infra/aws/status.sh`](../../infra/aws/status.sh), never trust a document. It asks
  `aws` and `gh`, prints seven lines, and exits 1 if any check fails. Settings and scripts:
  [`infra/aws/`](../../infra/aws/README.md).

## Where it stands — 2026-09-19

- [x] Live, nightly at 10:23 UTC. First backup: run `35432091546`, `db/2026/09/2026-09-19T0829Z/`.
- [x] `uptime.yml` goes red when no backup has succeeded in 25 hours.
- [x] Restore drill 2026-09-19: 8 of 8 counts and all 15 foreign keys matched live, and the
      web API answered identically. Charles downloaded and inspected; the agent restored and
      compared at his request. Next due 2026-10-19.
- [ ] The `product-images` files, which no dump contains.
- [ ] Before launch: `age` encryption, an external dead-man switch, the weekly CI restore test.

## Acceptance criteria

- [ ] An encrypted dump and the Storage files land in the bucket every night.
- [x] CI can only `PutObject`; a lifecycle rule deletes after 30 days.
- [ ] A failed or missing run alerts both partners.
- [ ] The weekly CI restore test is green.
- [ ] Charles completes one restore drill; evidence in `verification.human`.

## Why

| Choice                               | Reason                                                              |
| ------------------------------------ | ------------------------------------------------------------------- |
| Supabase Free + dump to S3           | Cents a month, and a copy no single vendor holds. Pro alone is not. |
| GitHub Actions cron                  | Free, secrets built in. Lambda needs a container image; a Mac sleeps. |
| Role address as root                 | Ownership, permanent. Card and phone are replaceable.               |
| Work as `charles-admin`              | Root can revoke it; nobody can revoke root.                         |
| OIDC and `aws login`, no access keys | Nothing long-lived to steal.                                        |
| `put-object`, never `sync`           | `sync` needs `ListBucket`, which breaks write-only.                 |
| Three files from `backup-db.sh`      | They are what ran, locally and in CI.                               |
| `age` deferred                       | Lose the key, lose every backup. Until then an AWS sign-in reads the dumps. |
| Watchman inside GitHub               | Catches a crashed or skipped run. Only an external switch survives GitHub disabling every schedule. |
| No dump as a run artifact            | The repo is public.                                                 |

## No CLI knows this

- Root `aws@eldreve.com` is a Cloudflare catch-all into the company Gmail. Emergencies only.
- Passkeys live in Charles's iCloud Keychain. **Open:** a root spare the boss can hold.
- Secrets: people → password manager · programs → `.env.local` · workflow → GitHub secrets ·
  the repo → never (public, and git never forgets).

## Rebuild, or a new device

1. `./bucket.sh` — name and region are permanent.
2. `./role.sh` — trust is pinned to this repo and `main`; never add `environment:` to the job.
3. Five GitHub settings: `gh variable list`, `gh secret list`.

New device: `brew install awscli`, `aws login`, `aws configure set region us-west-2` (the
prompt defaults to `us-east-1`). Never `source .env.local`; `grep` one value out.

## Restore

[Runbook](../runbooks/restore-from-backup.md). `platform.dump` before `public.dump` · auth and
storage are data only, never DDL · the pooler host differs per project · restore into a **new**
project, then re-point Vercel. RPO 24 h · RTO 1–3 h.

## Related links

- Code: [`db-backup.yml`](../../.github/workflows/db-backup.yml) ·
  [`backup-db.sh`](../../scripts/backup-db.sh) · [`uptime.yml`](../../.github/workflows/uptime.yml)
- The first, long guide with its sources: `git show d3e7a35:docs/guides/aws-backup.md`
- Launch order: [SUMMARY · Release queue](../../SUMMARY.md#release-queue)
