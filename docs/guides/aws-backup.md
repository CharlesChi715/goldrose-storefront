# AWS backup — short guide

Status lives in [`db-backups`](../features/db-backups.md), never here. Settings files:
[`infra/aws/`](../../infra/aws/README.md). The full verified version (sources, both workflow
YAMLs, every command) is in git: `git show d3e7a35:docs/guides/aws-backup.md`.

## Model

```text
[ DATA ]→[ COPY ]→[ OFFSITE ]→[ ENCRYPTED ]→[ MONITORED ]→[ RESTORED ]
 Supabase  pg_dump    S3           age        dead-man      THE DRILL — only this proves it
```

- **Green is not backed up.** A 10-second green run is the guard step skipping everything.
- CI may **write** to the bucket. It may never read, list or delete.
- Encrypt **before** upload; CI holds only the public key.
- An untested backup is a file, not a backup.

## Facts

| Item        | Value                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Account     | `780564622532` (ELDREVE), Paid plan, Basic support, created 2026-09-19        |
| Root        | `aws@eldreve.com` → Cloudflare catch-all → company Gmail. Passkey (iCloud Keychain) |
| Daily user  | `charles-admin`, group `Admins`, passkey, **no access keys**                 |
| Sign-in URL | `https://780564622532.signin.aws.amazon.com/console`                         |
| Region      | `us-west-2` (next to Supabase and Vercel `pdx1`)                             |
| Bucket      | `eldreve-backups-780564622532-us-west-2-an`                                  |
| Database    | `aws-1-us-west-2.pooler.supabase.com:5432`, user `postgres.cfvsvgbldnzkcjvbwnjp` |
| Budget      | `eldreve-backups-5usd`                                                       |

## Decisions

| Choice                                   | Why                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Root email is a role address             | Permanent, and it is the ownership. Card, phone, address: replaceable.  |
| **Paid** plan                            | Free closes the account after 6 months. Same credits either way.        |
| Card, not PayPal                         | AWS refuses PayPal and virtual cards.                                   |
| Root used a few times a year             | Nobody can restrict or revoke root. `charles-admin` can be killed by root. |
| Passkey for `charles-admin`              | Best protection for one person; root resets it if lost.                 |
| Root needs a spare others can hold       | ⚠️ TODO: authenticator app as 2nd device, or share the passkey with the boss. |
| $5 budget                                | Silent when healthy, loud when broken. Lower = alert fatigue.           |
| `aws login`, no access keys              | 12-hour token; nothing on disk to steal.                                |
| Session pooler, port 5432                | Direct host is IPv6-only; 6543 breaks `pg_dump`.                        |
| GitHub OIDC role, `s3:PutObject` only    | No long-lived key; a stolen token cannot read or wipe history.          |
| `put-object`, not `s3 sync`/`cp` to AWS  | `sync` needs `ListBucket`, which breaks put-only.                       |
| `age`, asymmetric                        | A passphrase would let CI decrypt. SSE alone lets AWS-side readers in.  |
| healthchecks.io dead-man switch          | A dropped or disabled cron sends no failure mail at all.                |
| 30-day lifecycle + versioning            | Real retention 37 days. Lifecycle is the only thing that deletes.       |
| Settings in `infra/aws/`                 | Several devices; a file on one Mac cannot be reproduced.                |
| Never upload a dump as a run artifact    | The repo is public.                                                     |

## Where a secret lives — who reads it?

| Reader                 | Home                          | Examples                                   |
| ---------------------- | ----------------------------- | ------------------------------------------ |
| A person, in a browser | password manager              | AWS passwords, `age` secret key            |
| A program on the Mac   | `.env.local`                  | `SUPABASE_DB_PASSWORD`                     |
| The workflow           | GitHub secrets, named only    | `${{ secrets.BACKUP_PGPASSWORD }}`         |
| Nobody                 | **the repo — never**          | Public, and git never forgets. Pushed = stolen. |

Names and account numbers are not secrets. Delete any credentials `.csv` after use.

## Steps

**1. Prove the dump locally**

```bash
cd ~/Developer/goldrose-storefront
PW="$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-)"; echo ${#PW}
H=aws-1-us-west-2.pooler.supabase.com; U=postgres.cfvsvgbldnzkcjvbwnjp
PGPASSWORD="$PW" \
DATABASE_URL="postgresql://$U@$H:5432/postgres" \
scripts/backup-db.sh /tmp/eldreve-backup-test
rm -rf /tmp/eldreve-backup-test; unset PW
```

Expect `ok — 21 tables` and `public.dump`, `platform.dump`, `schema.sql`. Slow from Sydney
(hundreds of round trips to Oregon); a 0-byte file for a minute is normal.

**2. Account** — sign up (advanced flavour, Paid, Business contact, Basic support) → root MFA →
Account → *IAM user and role access to Billing* → Activate → create `charles-admin` in `Admins`
(`AdministratorAccess`, the plain one) → budget → CLI:

```bash
brew install awscli && aws login
aws configure set region us-west-2      # the login prompt defaults to us-east-1
aws sts get-caller-identity             # "who am I?" — the first command when AWS acts oddly
```

**3. Bucket** — name and region are permanent.

```bash
cd infra/aws; export AWS_REGION=us-west-2
BUCKET="eldreve-backups-780564622532-us-west-2-an"
aws s3api create-bucket --bucket "$BUCKET" --bucket-namespace account-regional \
  --region us-west-2 --create-bucket-configuration LocationConstraint=us-west-2
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
aws s3api put-bucket-ownership-controls --bucket "$BUCKET" \
  --ownership-controls "Rules=[{ObjectOwnership=BucketOwnerEnforced}]"
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$BUCKET" --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" \
  --lifecycle-configuration file://lifecycle.json
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file://bucket-policy.json
```

Verify with the matching `get-*` calls, then put one test object under `db/` and delete it **by
version id** (a plain delete only adds a marker).

**4. Role for GitHub** — trust pinned to this repo and `main`, in both `sub` forms (a repo
rename flips the form silently). Never add `environment:` to the job.

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com
aws iam create-role --role-name eldreve-backup-writer --max-session-duration 3600 \
  --assume-role-policy-document file://trust-policy.json
aws iam put-role-policy --role-name eldreve-backup-writer \
  --policy-name PutOnlyBackups --policy-document file://permission-policy.json
```

**5. Encrypt, monitor, wire up**

```bash
brew install age && mkdir -p ~/.config/age && chmod 700 ~/.config/age
age-keygen -o ~/.config/age/eldreve-backup.txt     # classic keys only, never -pq
```

- ⚠️ **Lose the secret key and every backup is unreadable, forever.** Whole file → password
  manager, held by both partners. Prove a round trip before trusting it.
- healthchecks.io: cron `23 10 * * *` UTC, grace 2 h, mail both partners. The ping URL is a secret.
- Secrets: `BACKUP_PGPASSWORD`, `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`,
  `HC_PING_URL`. Variables: `AWS_ROLE_ARN`, `S3_BUCKET`, `AGE_RECIPIENT`, `BACKUP_PGHOST`,
  `BACKUP_PGUSER`, `SUPABASE_PROJECT_REF`. Pass `PG*` variables, never a URL with the password.
- Storage files are in **no** dump: `aws s3 sync` them down from Supabase's S3 endpoint, tar, encrypt.
- ⚠️ **Replace today's workflow.** `db-backup.yml` on `main` uses long-lived keys, uploads
  unencrypted and needs `ListBucket`. Target YAML: full version §8. Runs only from `main`.
- **Open:** `backup-db.sh` writes three files; the full guide uses one archive. Decide here.
- Later hardening: a read-only `backup_reader` role (`pg_read_all_data` + `bypassrls`).

**6. Prove it restores**

- Weekly CI: fresh dump → `postgres:17` container → row counts (full version §10). It tests the
  procedure; reading S3 from CI would need the rights and the key CI must not have.
- Monthly, by hand: download → `age -d` → checksum against the manifest → restore → counts →
  record in `db-backups.md` → `rm -rf ~/drill`.
- Use the **17** client (`brew install postgresql@17`), always `-d` and `--exit-on-error`.

| Restore trap                                  | Fix                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `schema "public" already exists`              | TOC lines end with the owner: filter `' SCHEMA - public '`, never `$`.   |
| `identities_user_id_fkey` violated            | The pooler drops `PGOPTIONS`. `set session_replication_role = replica` inside `psql`. |
| `must be member of role "supabase_admin"`     | `--no-privileges` on any restore into Supabase, then re-run the REVOKEs. |
| `permission denied for schema auth`           | Never restore auth/storage **DDL** into Supabase — data only.            |

## Operations

- **Failure:** the red step names the layer. No run at all → workflow disabled after 60 quiet
  days (`gh workflow enable db-backup.yml`) or a dropped schedule. Project paused → resume it.
- **Monthly:** pings without gaps · newest object is last night · bill ≈ $0.02 · restore test
  green · drill recorded · each quarter decrypt with the vault copy of the key.
- **Postgres major upgrade:** dump client ≥ server; restore client = target. Bump both workflows.
- **Rotate:** DB password, `age` key (keep the old one 37 days), Supabase S3 keys, ping URL. OIDC: nothing.
- **Disaster:** RPO 24 h, RTO 1–3 h. Newest green stamp → restore into a **new** project →
  re-point Vercel's three Supabase values → rebuild orders after the RPO from PayPal →
  passkeys and advisor keys are re-entered (not restorable).
- **Supabase Pro at launch** as a managed second copy; this pipeline stays the independent one.

## Shell lessons

| Symptom                              | Cause and fix                                                          |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `.env.local: parse error near '&'`   | A dotenv file is not shell. Never `source` it; `grep` out one value.    |
| Is the secret loaded?                | `echo ${#PW}` prints its length, not the secret.                        |
| Variable missing in a program        | `VAR=x cmd` lasts one command · `VAR=x` stays in the shell (`unset`) · `export` reaches children. |
| `unexpected spaces found in "543 2"` | A long pasted line wrapped inside quotes. Keep lines short.             |
| Variables vanish between commands    | The `!` prefix is a fresh shell each time, and its output lands in the chat — never view a secret that way. |
| Console shows *Data unavailable*     | A new account has no cost data for 24 hours. Not a permissions fault.   |
