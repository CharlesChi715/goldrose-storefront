# AWS backup

Status: [`db-backups`](../../docs/features/db-backups.md). Full version with sources and
workflow YAMLs: `git show d3e7a35:docs/guides/aws-backup.md`.

```text
[ DATA ]→[ COPY ]→[ OFFSITE ]→[ ENCRYPTED ]→[ MONITORED ]→[ RESTORED ]
 Supabase  pg_dump    S3           age        dead-man      only the drill proves it
```

- A 10-second green run backed up nothing: the guard step skipped everything.
- CI may write to the bucket. It may never read, list or delete.
- Encrypt before upload. CI holds only the public key.

## State — ask the CLI, never a document

`aws sts get-caller-identity` · `aws s3api list-buckets` · `aws iam list-users` ·
`aws budgets describe-budgets --account-id <id>` · `gh secret list` · `gh variable list`

Written here only because no CLI knows it:

- Root is `aws@eldreve.com`, a Cloudflare catch-all into the company Gmail. Emergencies only.
- Both passkeys live in Charles's iCloud Keychain. ⚠️ TODO: a spare for root the boss can hold.
- `us-west-2`, beside Supabase and Vercel, so a restore never crosses an ocean.

## Why

| Choice                              | Reason                                                     |
| ----------------------------------- | ---------------------------------------------------------- |
| Root email is a role address        | It is the ownership, and permanent. The card is replaceable. |
| Paid plan                           | Free closes the account after 6 months.                    |
| Daily work as `charles-admin`       | Root can revoke it. Nobody can revoke root.                |
| `aws login`, OIDC, no access keys   | Nothing long-lived exists to steal.                        |
| `put-object`, never `sync` to AWS   | `sync` needs `ListBucket`, which breaks write-only.        |
| `age`, asymmetric                   | A passphrase would let CI decrypt.                         |
| Dead-man switch                     | A dropped or disabled cron sends no failure mail.          |
| Pooler port 5432                    | Direct host is IPv6-only; 6543 breaks `pg_dump`.           |
| Settings and scripts in the repo    | Several devices. Names are not secrets.                    |
| No dump as a run artifact           | The repo is public.                                        |

## Secrets — who reads it?

| Reader               | Home                                                       |
| -------------------- | ---------------------------------------------------------- |
| A person             | password manager                                           |
| A program on the Mac | `.env.local`                                               |
| The workflow         | GitHub secrets, referenced by name                         |
| Nobody               | **the repo, never** — public, and git never forgets        |

## Steps

1. Prove the dump locally with `scripts/backup-db.sh`; delete the output.
2. Account, root MFA, billing access for IAM, `charles-admin`, `aws login`.
   `aws configure set region us-west-2` — the login prompt defaults to `us-east-1`.
3. `./bucket.sh` — name and region are permanent.
4. `./role.sh` — trust is pinned to this repo and `main`. Never add `environment:` to the job.
5. `age-keygen` (classic keys, never `-pq`) · healthchecks.io, cron `23 10 * * *` UTC, grace 2 h
   · GitHub secrets and variables · sync Storage files separately, no dump contains them.
   - ⚠️ Lose the `age` secret key and every backup is unreadable forever. Both partners hold it.
   - ⚠️ Replace `db-backup.yml`: it uses long-lived keys and uploads unencrypted.
   - Open: `backup-db.sh` writes three files; the full version uses one archive.
6. Weekly CI restore test. Monthly drill by hand, recorded in the feature record.

## Restore traps

| Error                                     | Fix                                                        |
| ----------------------------------------- | ---------------------------------------------------------- |
| `schema "public" already exists`          | TOC lines end with the owner: filter `' SCHEMA - public '`, never `$`. |
| `identities_user_id_fkey` violated        | The pooler drops `PGOPTIONS`. `set session_replication_role = replica` inside `psql`. |
| `must be member of role "supabase_admin"` | `--no-privileges`, then re-run the REVOKEs.                |
| `permission denied for schema auth`       | auth and storage: data only, never DDL.                    |

Use the Postgres 17 client, always `-d` and `--exit-on-error`.

## Operations

- No run at all: workflow disabled after 60 quiet days, or a dropped schedule. Run it by hand.
- RPO 24 h, RTO 1–3 h. Restore into a **new** project, re-point Vercel, rebuild later orders from PayPal.
- Postgres major upgrade: dump client ≥ server, restore client = target.

## Shell

| Symptom                             | Cause                                                      |
| ----------------------------------- | ---------------------------------------------------------- |
| `.env.local: parse error near '&'`  | A dotenv file is not shell. `grep` one value out, never `source`. |
| Is the secret loaded?               | `echo ${#PW}` prints its length.                           |
| A program cannot see a variable     | `VAR=x cmd` one command · `VAR=x` this shell · `export` children too. |
| `unexpected spaces found in "543 2"` | A long pasted line wrapped inside quotes.                 |
| Variables vanish                    | The `!` prefix is a new shell each time, and its output lands in the chat. |
