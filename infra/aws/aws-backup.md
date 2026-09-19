# AWS backup

Status: [`db-backups`](../../docs/features/db-backups.md) · files: [README](README.md) · full
version: `git show d3e7a35:docs/guides/aws-backup.md` · state: ask `aws` and `gh`, never a document.

```text
[ DATA ]→[ COPY ]→[ OFFSITE ]→[ ENCRYPTED ]→[ MONITORED ]→[ RESTORED ]
 Supabase  pg_dump    S3           age        dead-man      only the drill proves it
```

- A 10-second green run backed up nothing: the guard step skipped everything.
- CI writes to the bucket; it never reads, lists or deletes. It encrypts with a public key only.
- Secrets: people → password manager · programs → `.env.local` · workflow → GitHub secrets ·
  the repo → never (public, and git never forgets).

## No CLI knows this

- Root `aws@eldreve.com` is a Cloudflare catch-all into the company Gmail. Emergencies only.
- Passkeys live in Charles's iCloud Keychain. ⚠️ TODO: a root spare the boss can hold.
- ⚠️ Lose the `age` secret key and every backup is unreadable forever. Both partners hold it.

## Why

| Choice                               | Reason                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Role address as root                 | Ownership, permanent. Card and phone are replaceable. |
| Work as `charles-admin`              | Root can revoke it; nobody can revoke root.           |
| OIDC and `aws login`, no access keys | Nothing long-lived to steal.                          |
| `put-object`, never `sync`           | `sync` needs `ListBucket`, which breaks write-only.   |
| Asymmetric `age`                     | A passphrase would let CI decrypt.                    |
| Dead-man switch                      | A dropped or disabled cron sends no failure mail.     |
| No dump as a run artifact            | The repo is public.                                   |

## Steps

1. `./bucket.sh` — name and region are permanent.
2. `./role.sh` — trust is pinned to this repo and `main`; never add `environment:` to the job.
3. `age-keygen` (never `-pq`) · healthchecks.io `23 10 * * *` UTC, grace 2 h · GitHub secrets.
4. Replace `db-backup.yml`: it uses long-lived keys, uploads unencrypted, skips Storage files.
   Open: `backup-db.sh` writes three files, the full version one archive.
5. Weekly CI restore test; monthly drill by hand, recorded in the feature record.

New device: `brew install awscli`, `aws login`, `aws configure set region us-west-2` (the
prompt defaults to `us-east-1`). Never `source .env.local`; `grep` one value out.

## Restore traps

- `schema "public" already exists` → TOC lines end with the owner: filter `' SCHEMA - public '`, never `$`.
- `identities_user_id_fkey` → the pooler drops `PGOPTIONS`; `set session_replication_role = replica` inside `psql`.
- `must be member of role "supabase_admin"` → `--no-privileges`, then re-run the REVOKEs.
- `permission denied for schema auth` → auth and storage are data only, never DDL.
- Postgres 17 client, always `-d` and `--exit-on-error`. Restore into a **new** project, then re-point Vercel.

RPO 24 h · RTO 1–3 h · no run at all means the workflow was disabled after 60 quiet days.
