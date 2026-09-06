# AWS backup for the ELDREVE database and uploads

**Last verified 2026-09-05.** Owning record: [`docs/features/db-backups.md`](../features/db-backups.md)
(status lives there, never here). Decision history and the options that were rejected:
same record, "Options considered".

Every command below says where it runs — **Mac terminal**, **AWS console**, **Supabase dashboard**,
**GitHub UI**, **CI runner** (inside the workflow file), **healthchecks.io**. Values in
`<ANGLE_BRACKETS>` are yours to fill; no real secret appears in this file, ever.

## What you get

Every night a GitHub Actions job connects to the hosted Supabase project, takes one
`pg_dump` archive of the `public`, `auth`, `storage` and `supabase_migrations` schemas (the
last one is the CLI's migration history — without it a restored project cannot take the next
`supabase db push`), copies every file in the `product-images` Storage bucket, encrypts both
with a key that only you and the boss can open, and uploads them to a private S3 bucket in a
company AWS account that GitHub can *write to but never read from*. A monitoring service
expects that upload every day and emails both of you if it does not happen. Once a week a
second job proves the dump still restores into a fresh Postgres 17 and that the row counts
match production. Once a month you rehearse the real thing by hand. Cost: about two US cents
a month after the sign-up credits run out.

⚠️ **Not in the backup, by decision:** Supabase Vault contents — today the bosses' advisor
API keys (`admin_advisor_keys`, migration 0013, each row points at a `vault.secrets` entry).
Vault ciphertext only opens with the original project's root key, so after a restore each
boss re-enters their key in /admin (2 minutes). Cheaper and safer than exporting the root key
(decision 19).

```text
                       nightly 10:23 UTC (20:23 Sydney, 03:23 US-Pacific)
                       ─────────────────────────────────────────────────
 ┌──────────────────┐    ┌───────────────────────────────────────────┐    ┌──────────────────────┐
 │ SUPABASE (live)  │    │ GITHUB ACTIONS  .github/workflows/        │    │ AWS  us-west-2       │
 │ us-west-2        │    │                 db-backup.yml             │    │                      │
 │                  │    │                                           │    │  S3 bucket           │
 │ Postgres 17.6 ───┼──▶ │ pg_dump 17 ─▶ pg_restore --list (check)   │    │  eldreve-backups-…   │
 │  public, auth,   │    │            ─▶ age -r <PUBLIC KEY>  ───────┼──▶ │   db/…dump.age       │
 │  storage, migr.  │    │                                           │    │   db/…manifest.txt   │
 │                  │    │ aws s3 sync (download) ─▶ tar ─▶ age ─────┼──▶ │   files/…tar.age     │
 │ Storage bucket ──┼──▶ │                                           │    │                      │
 │  product-images  │    │ creds: OIDC role, PUT-only, 1 h token     │    │  lifecycle: 30 days  │
 └──────────────────┘    │                                           │    │  versioning, SSE-S3, │
                         │ curl /start ……… curl (success) / curl /fail│    │  no public access    │
                         └──────────────┬────────────────────────────┘    └──────────────────────┘
                                        │ one ping a day expected
                                        ▼
                         ┌───────────────────────────────────────────┐
                         │ HEALTHCHECKS.IO  (dead-man switch)        │
                         │ cron 23 10 * * * UTC, grace 2 h           │
                         │ no ping by 12:23 UTC ─▶ email Charles+boss│
                         └───────────────────────────────────────────┘

 DECRYPT PATH (humans only, never CI):  S3 ─▶ aws s3 cp ─▶ age -d -i <SECRET KEY> ─▶ pg_restore
```

### Why this design is the right one for us

| Candidate                          | What it would cost / need                                                     | Why not (or not alone)                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Pro backups only          | $25/month; zero build                                                         | Same vendor holds the data *and* the only copy; 7-day retention; no copy of Storage files you control. Fine as a **second** copy at launch. |
| AWS Lambda + EventBridge           | Free tier covers it; "more AWS practice"                                     | `pg_dump` needs a container image or layer; two accounts of secrets to manage; more moving parts than a 30-line workflow.              |
| cron on Charles's Mac              | Nothing                                                                       | The Mac must be awake at 03:00 every night; one laptop failure kills backups and the ability to notice. Not a professional practice.    |
| **GitHub Actions cron → S3 (this)**| Actions are free on a public repo; S3 ≈ $0.02/month                           | Runs where the code already lives; secrets manager built in; every run has a public log; the copy is encrypted before it leaves.       |

The platform decision (Supabase Free + DIY dump) and the scheduler decision (Option A,
GitHub Actions) are recorded with their alternatives in
[`docs/features/db-backups.md`](../features/db-backups.md).

### Decisions this guide makes for you

Each row is a choice the research settled. Where the research **contradicted the earlier plan**
the row says so — the guide follows the research.

| #  | Decision                                                                 | Alternative rejected                                     | One-line reason                                                                                                                                                      |
| -- | ------------------------------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | AWS **Paid account plan** at sign-up                                     | Free account plan                                        | The Free plan closes the account after 6 months and deletes everything 90 days later — fatal for a backup store. Both plans get the same $100 credit.               |
| 2  | Root = company mailbox + company card; **Charles = one IAM admin user, MFA, no access keys**, signs in with `aws login` | IAM Identity Center (SSO); IAM user with access keys | Identity Center needs an AWS Organization — the upgrade path, not the start. Access keys are the long-lived secret AWS warns about; `aws login` leaves nothing on disk. |
| 3  | Region **us-west-2 (Oregon)**                                            | us-east-1, ap-southeast-2                                | Same region as Supabase and Vercel `pdx1`; a restore into Supabase never crosses an ocean.                                                                          |
| 4  | Bucket name in the **account regional namespace** `eldreve-backups-<ACCOUNT_ID>-us-west-2-an` | `eldreve-db-backups-<RANDOM>`                 | AWS's 2026 best practice: nobody else can ever squat the name. Fallback to the random-suffix name only if your CLI lacks `--bucket-namespace`.                        |
| 5  | **Versioning on, SSE-S3, Block Public Access, ACLs disabled**, 30-day expiry + 7-day noncurrent + abort multipart | SSE-KMS; Glacier; Object Lock now   | SSE-KMS adds a key to manage for no gain (age is the real encryption); Glacier's minimums dwarf 30 days; Object Lock compliance mode is irreversible — revisit at launch. |
| 6  | **OIDC role**, trust policy pinned to repo + `main`, listing both the classic and the new immutable `sub` forms | IAM user with access keys in GitHub secrets | No long-lived key to leak; renaming/transferring the repo flips the `sub` format silently — listing both forms keeps backups alive through it.                        |
| 7  | Role may **only `s3:PutObject`** on `db/*` and `files/*`                 | Get/List/Delete too                                      | A stolen GitHub token can then add objects but never read, list or wipe history.                                                                                    |
| 8  | Upload with **`aws s3api put-object`** (one PUT per object)              | `aws s3 sync` to AWS                                     | `sync` needs `s3:ListBucket` on the destination — it would break decision 7. **Contradicts the earlier "synced separately" note.**                                   |
| 9  | Storage files: **download** with `aws s3 sync` from Supabase's S3 endpoint, then **tar + age + put-object** | supabase-js script; `supabase storage cp` | Zero code, incremental download, uses the AWS CLI already on the runner. CLI `storage cp` is `--experimental` and needs a personal Supabase token in CI.             |
| 10 | **One** `pg_dump --format=custom` archive of `public` + `auth` + `storage` + `supabase_migrations` (CLI migration history), platform migration-table *data* excluded; "data-only" for auth/storage is decided at **restore** time | Three separate dumps; baking `--no-owner --no-privileges` into the **dump** | Custom format lets `pg_restore` pick schemas/data-only later; the local drill *needs* the auth/storage DDL (4 FKs point at `auth.users`). Keep the dump complete and pass the flags at **restore** time instead — where `--no-privileges` is in fact mandatory on a Supabase target (§11.3 step 4: without it pg_restore replays `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin`, which `postgres` may not execute). Note: neither keeping nor dropping ACLs preserves migration 0001's `revoke … from anon, authenticated` in a Supabase target — Supabase's ALTER DEFAULT PRIVILEGES re-grant ALL to anon/authenticated on every table pg_restore creates, and pg_dump only emits GRANTs relative to Postgres' built-in defaults. §11.3 step 4 re-applies the revoke explicitly. **Contradicts the earlier plan.** |
| 11 | Default (gzip) compression inside the archive                            | `--compress=zstd`                                        | The Mac's `libpq` 18.6 `pg_restore` has no zstd; gzip is readable by every client you own. Size difference on 13 MB is irrelevant.                                   |
| 12 | Session pooler `…pooler.supabase.com:5432`, user `postgres.<REF>`, connection passed as **`PG*` environment variables**, not a URL | `DATABASE_URL` secret; direct host; port 6543 | Direct host is IPv6-only (runners are IPv4-only); 6543 has no session pinning and breaks `pg_dump`; a URL needs percent-encoding and leaks the password into error logs. **Replaces the "DATABASE_URL secret" wording of the earlier plan.** |
| 13 | Nightly at **10:23 UTC**                                                 | 16:23 UTC (Sydney night); top of any hour                | 10:23 UTC = 03:23 US-Pacific (customers asleep) and 20:23 Sydney (Charles awake when a failure mail lands). GitHub delays/drops top-of-hour schedules.               |
| 14 | **age**, asymmetric: CI holds the `age1…` public key only; one keypair now, secret in **both** partners' password managers | age passphrase; rely on SSE only | A passphrase encrypts *and* decrypts, so CI could read backups; SSE alone means anyone in the AWS account reads plaintext. A recipients file per partner is the later upgrade. |
| 15 | **healthchecks.io** Cron-mode check, grace 2 h, `/start` + success + `/fail` pings | GitHub failure e-mail alone; Cronitor; Better Stack | GitHub mails only the last person who edited the cron line, and a *dropped* run sends no mail at all. healthchecks.io free plan = 20 checks, e-mail to both partners. |
| 16 | Weekly **restore test** as a separate workflow with a `postgres:17` service container, testing the fresh in-job dump | Test the S3 copy from CI               | Reading S3 or decrypting from CI would need Get rights and the secret key — both deliberately absent. The S3→decrypt→restore path is the **human** monthly drill.  |
| 17 | Never `actions/upload-artifact` a dump                                   | Keep dumps as run artifacts                              | The repo is **public**: anyone can download artifacts. Dump → check → encrypt → S3 inside one job; the runner disk is wiped after.                                  |
| 18 | Optional hardening: a read-only `backup_reader` Postgres role for CI     | Always use the `postgres` operator password              | Feasible on PG 17 (`pg_read_all_data` + `BYPASSRLS`); halves the blast radius of a leaked secret. Sub-step in §7, not a blocker.                                     |
| 19 | **Vault secrets excluded**; the bosses re-enter their advisor API keys after a restore | Copy the project root encryption key via the Management API before restore | Vault ciphertext is bound to the source project's root key; exporting that key widens the blast radius for one row per boss. <https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore> |

### Time and cost

| Section                        | Where                     | Time (first time)      | Money                                                                                               |
| ------------------------------ | ------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| §2 AWS account + identity      | AWS console, Mac          | 45 min (+ up to 24 h activation wait) | $0 — Paid plan bills only for usage; $100 sign-up credit (+ up to $100 more) expires 12 months after opening |
| §3 S3 bucket                   | Mac terminal              | 15 min                 | ≈ $0.02/month: 0.55 GB stored × $0.023/GB-month (Oregon, S3 Standard) + ~90 PUTs × $0.005/1000      |
| §4 OIDC role                   | Mac terminal              | 20 min                 | $0                                                                                                  |
| §5 age key                     | Mac terminal, password manager | 10 min            | $0                                                                                                  |
| §6 healthchecks.io             | browser                   | 10 min                 | $0 (Hobbyist plan: 20 checks)                                                                       |
| §7 GitHub secrets              | Mac terminal / GitHub UI  | 15 min                 | $0                                                                                                  |
| §8–§9 workflow + first run     | editor, GitHub UI         | 30 min                 | $0 — Actions minutes are free on public repositories                                                |
| §10 restore-test workflow      | editor                    | 15 min                 | $0                                                                                                  |
| §11 manual drill               | Mac terminal (+ Supabase) | 30–45 min, monthly     | $0 (a scratch Supabase project on the Free plan; S3 egress: first 100 GB/month free)                |
| Supabase side                  | —                         | —                      | $0 — nightly dump (~13 MB) + image deltas sit far inside the Free plan's 5 GB egress               |

Price sources: <https://aws.amazon.com/s3/pricing/> (read 2026-09-05: S3 Standard US West (Oregon)
$0.023/GB-month first 50 TB; PUT $0.005 per 1,000),
<https://aws.amazon.com/free/> (S3 is **not** on the Always-Free list; it is "available on both
plans", so treat it as paid from day one and covered by credits for 12 months),
<https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions>
("GitHub Actions usage is free for … public repositories that use standard GitHub-hosted runners"),
<https://healthchecks.io/pricing/>.

## Table of contents

1. [Before you start](#1-before-you-start)
2. [AWS account bootstrap](#2-aws-account-bootstrap)
3. [S3 bucket](#3-s3-bucket)
4. [IAM role for GitHub OIDC](#4-iam-role-for-github-oidc)
5. [age key pair](#5-age-key-pair)
6. [Dead-man switch (healthchecks.io)](#6-dead-man-switch-healthchecksio)
7. [GitHub repository secrets and variables](#7-github-repository-secrets-and-variables)
8. [The nightly workflow — db-backup.yml](#8-the-nightly-workflow--githubworkflowsdb-backupyml)
9. [First run](#9-first-run)
10. [Automated restore test — db-restore-test.yml](#10-automated-restore-test--githubworkflowsdb-restore-testyml)
11. [Manual restore drill runbook (monthly)](#11-manual-restore-drill-runbook-monthly)
12. [Operations](#12-operations)
13. [Troubleshooting](#13-troubleshooting)
14. [Glossary](#14-glossary)
15. [Repo bookkeeping after it ships](#15-repo-bookkeeping-after-it-ships)

---

## 1. Before you start

### 1.1 Prerequisites checklist

| ✓ | Need                                                                                   | Where it lives / how to get it                                                                                                        |
| - | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ☐ | A **business mailbox both partners can read** for the AWS root user (e.g. `aws@eldreve.com`) and a **company payment card** | ⚠️ Money and ownership are the bosses' call — agree this in writing before §2. Fallback: Charles's card now, migrate the payment method later (Billing → Payment preferences). |
| ☐ | A phone that can receive an SMS during AWS sign-up                                     | Charles's; AWS verifies identity by SMS once.                                                                                          |
| ☐ | A password manager vault **shared between Charles and the boss**                       | 1Password / Bitwarden shared vault. Holds root credentials, MFA backup, the age secret key, healthchecks login.                        |
| ☐ | GitHub account `CharlesChi715` with admin rights on `CharlesChi715/goldrose-storefront` | Already true. `gh` may need `gh auth login` first (its API token was invalid on 2026-07-27 — see SUMMARY.md).                          |
| ☐ | Supabase dashboard access to project `cfvsvgbldnzkcjvbwnjp`                            | Already true.                                                                                                                         |
| ☐ | The operator database password                                                          | `SUPABASE_DB_PASSWORD` in the **main checkout's** `/Users/charles/Developer/goldrose-storefront/.env.local` (worktrees have no `.env.local`). Never printed, never in Vercel. |
| ☐ | Mac tools                                                                               | `brew install awscli age` now; `brew install postgresql@17` before the first drill (§11). `psql`/`pg_dump` 18.6 from `libpq` are already there. **No Docker needed.** |
| ☐ | A healthchecks.io account                                                               | Sign up at <https://healthchecks.io/> with the business mailbox (free plan).                                                          |

### 1.2 Credentials this build creates — and who holds each

```text
 credential                              created in   stored where                                  who can use it
 ─────────────────────────────────────── ──────────── ───────────────────────────────────────────── ────────────────────────
 AWS root e-mail + password + MFA        §2.1–2.2     shared vault (MFA QR/secret backed up too)    boss + Charles, root tasks only
 IAM user charles-admin password + MFA   §2.4         Charles's vault                               Charles (console + aws login)
 IAM role eldreve-backup-writer          §4           nothing to store — assumed via OIDC           the workflow on main, 1 h at a time
 age keypair  age1… / AGE-SECRET-KEY-1…  §5           public: GitHub variable; SECRET: both vaults  humans decrypt; CI encrypts only
 healthchecks ping URL (contains a UUID) §6           GitHub secret HC_PING_URL + vault             the workflow
 Supabase S3 access key + secret         §7.2         GitHub secrets only (secret shown once)        the workflow (download bucket)
 BACKUP_PGPASSWORD                        §7           GitHub secret (value = SUPABASE_DB_PASSWORD, or the backup_reader password after §7.4) | the workflow
```

> **Why (industry practice):** a credential inventory is the first thing an auditor or a
> new colleague asks for. Write it down while you create them, not after an incident.

---

## 2. AWS account bootstrap

Everything in this section is done once. Budget 45 minutes plus a possible wait for
activation.

### 2.1 Create the account — AWS console (browser)

Doc: <https://docs.aws.amazon.com/accounts/latest/reference/getting-started.html> and
<https://docs.aws.amazon.com/accounts/latest/reference/sign-up-for-aws.html>.

1. Open <https://signin.aws.amazon.com/signup?request_type=register>. AWS now offers two
   sign-up flavours; use **"Sign up for AWS (advanced)"** — the classic account with a root
   user and full IAM. (The "(new)" flavour uses a Builder ID and an AWS-managed Organization;
   its docs and service list are still limited.)
2. **Root user email address** = the business mailbox from §1.1. **AWS account name** =
   `ELDREVE`. Click **Verify email address**, enter the code.
3. Set the **root password** (8–128 characters, 3 of 4 character classes). Save it in the
   shared vault immediately.
4. **Choose your account plan** → ⚠️ **Paid account plan**. The Free plan *closes the account
   after 6 months* (or when credits run out) and deletes the data 90 days later — a backup
   bucket cannot live there. Both plans get the same USD 100 credit (+ up to 100 more), which
   expires 12 months after creation.
   <https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html>
   ⚠️ A valid card is required to continue; nothing is charged beyond real usage (≈ $0.02/month
   here) — the $5 budget in §2.5 is the tripwire.
5. Contact information → **Business**; accept the Customer Agreement; billing information;
   SMS identity verification; **Support plan → Basic (free)**; **Complete sign up**.
   Activation takes minutes, occasionally up to 24 hours (you get an e-mail).

> **Why (industry practice):** the root user can do anything, including closing the account
> and deleting every backup. It belongs to the company, not to an individual mailbox, so that
> a departure or a lost phone never orphans the account.

### 2.2 Root MFA — AWS console

Doc: <https://docs.aws.amazon.com/IAM/latest/UserGuide/enable-virt-mfa-for-root.html>.
MFA on root is mandatory ("Users must register MFA within 35 days of their first sign-in") —
<https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html>.

1. Sign in as root → top-right account name → **Security credentials**.
2. **Multi-Factor Authentication (MFA)** → **Assign MFA device** → device name `eldreve-root`
   → **Authenticator app** → **Next**.
3. **Show QR code**; scan it with the password manager's authenticator (so the boss can add
   it to the shared vault too), enter **MFA code 1**, wait ~30 s, enter **MFA code 2** → **Add MFA**.
4. ⚠️ Also click **Show secret key** and store that text in the shared vault. Losing the only
   MFA device plus the phone means a support ticket to get back in. AWS allows up to 8 MFA
   devices on root — adding a second one (the boss's phone) is the professional move.
5. Never create root access keys. Use root only for the two root-only tasks below (§2.3) and
   for billing emergencies.

### 2.3 Let IAM identities see billing — AWS console, as root, once

Doc: <https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/control-access-billing.html>.
Without this the admin user created next cannot open Budgets or Bills.

Top-right account name → **Account** → scroll to **IAM user and role access to Billing
information** → **Edit** → tick **Activate IAM Access** → **Update**.

### 2.4 Charles's daily identity: one IAM admin user, MFA, no access keys — AWS console

Decision 2. Adapted from AWS's own admin-user procedure
<https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started-emergency-iam-user.html>;
user creation reference <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html>.

1. As root: <https://console.aws.amazon.com/iam/> → **Users** → **Create user**.
2. **User name** `charles-admin`. Tick **Provide user access to the AWS Management Console** →
   choose **I want to create an IAM user** (not the "Specify a user in Identity Center" radio —
   that is the SSO path for later).
3. **Console password** → Autogenerated; keep **User must create a new password at next sign-in**.
4. **Set permissions** → **Add user to group** → **Create group** → name `Admins`, tick the
   `AdministratorAccess` policy → **Create user group** → select it → **Next** → **Create user**.
5. **Download .csv** — it contains the console sign-in URL
   `https://<ACCOUNT_ID>.signin.aws.amazon.com/console`. Put URL + password in Charles's vault.
6. Sign out of root. Sign in as `charles-admin`, set the new password, then IAM → **Users** →
   `charles-admin` → **Security credentials** → **Assign MFA device** (same wizard as §2.2).
   <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html>
7. **Do not create access keys** for this user. The CLI signs in through the browser (§2.6).

> **Why (industry practice):** AWS's best practice is "human users use federation, not IAM
> users with long-term credentials". This setup has *no* long-term credentials — the console
> password is MFA-protected and the CLI receives 12-hour temporary tokens. When a second human
> needs access, graduate to IAM Identity Center (it creates an AWS Organization, which is why
> it is the upgrade path and not the start:
> <https://docs.aws.amazon.com/singlesignon/latest/userguide/identity-center-instances.html>).

### 2.5 Budget alert — AWS console, as charles-admin

Docs: <https://docs.aws.amazon.com/cost-management/latest/userguide/budget-templates.html>,
<https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/> (budgets themselves are free).

1. <https://console.aws.amazon.com/cost-management/> → **Budgets** → **Create budget**.
2. **Budget setup** → **Use a template (simplified)** → **Monthly cost budget** ("notifies you
   if you exceed, or are forecasted to exceed, the budget amount").
3. Name `eldreve-backups-5usd`, amount `5`, e-mail recipients: **both partners**.
   AWS does not document the template's pre-filled alert thresholds
   (<https://docs.aws.amazon.com/cost-management/latest/userguide/budget-templates.html> only
   says "notifies you if you exceed, or are forecasted to exceed, the budget amount"). Read the
   alerts shown on screen before clicking **Create budget**; make sure at least one
   **Forecasted** alert at 100 % and one **Actual** alert exist — if not, **Template settings →
   Custom** lets you add them (up to 5 alerts per budget).
4. Optional second tripwire: the **Zero spend budget** template ("notifies you after your
   spending exceeds AWS Free Tier limits").

### 2.6 AWS CLI v2 on the Mac — Mac terminal

Docs: <https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html>,
`aws login` (CLI ≥ 2.32.0): <https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html>.
Homebrew ships 2.36.x (<https://formulae.brew.sh/formula/awscli>).

```bash
brew install awscli
aws --version                          # aws-cli/2.36.x …  (needs >= 2.32.0 for `aws login`)

aws login                              # prompts "AWS Region [us-east-1]:" -> type: us-west-2
                                       # a browser tab opens: sign in as charles-admin (+ MFA)
aws sts get-caller-identity            # must print "Arn": "arn:aws:iam::<ACCOUNT_ID>:user/charles-admin"
aws configure get region               # us-west-2
```

`aws login` caches temporary credentials in `~/.aws/login/cache`, refreshes them every 15 min
for up to 12 h, and writes `login_session` + `region` into `~/.aws/config`. `aws logout` ends it.
If a firewall blocks the browser callback, use `aws login --remote` and paste the code.

Keep the two values you will need everywhere:

```bash
export AWS_REGION=us-west-2
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "$ACCOUNT_ID"                     # 12 digits
```

---

## 3. S3 bucket

All commands: **Mac terminal**, after `aws login`. Bucket names and regions cannot be changed
after creation.

```text
 ┌─ Working folder + variables ───────────────────────────────────────────────────────────┐
 │ Shell variables live only in the terminal window that set them. §2 may end with a      │
 │ 24 h activation wait and §9/§11 happen days later — so:                                │
 │                                                                                        │
 │   NEW TERMINAL WINDOW = RE-RUN THESE FOUR LINES FIRST.                                 │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

```bash
mkdir -p ~/aws-setup && cd ~/aws-setup          # scratch files live here, never in the repo
export AWS_REGION=us-west-2
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export BUCKET="eldreve-backups-${ACCOUNT_ID}-us-west-2-an"   # after §3.1: the name you actually got
```

§4, §9 and §11 all point back to this block. If a command answers `Invalid bucket name ""` or
`aws: error: argument --bucket: expected one argument`, the variables are gone — re-run the four lines.
Doc for the defaults you get for free on a new bucket (Block Public Access all on, Object
Ownership = bucket owner enforced, SSE-S3 default encryption; versioning **off** by default):
<https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html>.

### 3.1 Create the bucket

Account-regional namespace (decision 4):
<https://docs.aws.amazon.com/AmazonS3/latest/userguide/gpbucketnamespaces.html>.

```bash
export BUCKET="eldreve-backups-${ACCOUNT_ID}-us-west-2-an"     # same line as the block above

aws s3api create-bucket \
  --bucket "$BUCKET" \
  --bucket-namespace account-regional \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
```

`LocationConstraint` is required for every region except us-east-1
(<https://docs.aws.amazon.com/cli/latest/reference/s3api/create-bucket.html>).
If your CLI answers `Unknown options: --bucket-namespace`, run `brew upgrade awscli` and retry;
if it still does not know the flag, fall back to a globally unique name and drop the flag:

```bash
export BUCKET="eldreve-db-backups-$(openssl rand -hex 4)"      # e.g. eldreve-db-backups-9f3a1c2e
aws s3api create-bucket --bucket "$BUCKET" --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
```

Write the final bucket name into your notes — you need it in §4, §7 and §11. If you took the
fallback name, also change the `export BUCKET=…` line of the "Working folder + variables"
block to that name for every future terminal window.

### 3.2 Lock it down (idempotent — safe to re-run)

```bash
# Block every form of public access (already the default; stating it makes the intent auditable)
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# ACLs disabled: the bucket owner owns every object, whoever uploaded it
aws s3api put-bucket-ownership-controls --bucket "$BUCKET" \
  --ownership-controls "Rules=[{ObjectOwnership=BucketOwnerEnforced}]"

# Versioning: an overwrite or delete keeps the previous version for 7 more days (lifecycle below)
aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

# Server-side encryption at rest with S3-managed keys (defence in depth; age is the real lock)
aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

Refs: <https://docs.aws.amazon.com/cli/latest/reference/s3api/put-public-access-block.html>,
<https://docs.aws.amazon.com/cli/latest/reference/s3api/put-bucket-ownership-controls.html>,
<https://docs.aws.amazon.com/cli/latest/reference/s3api/put-bucket-encryption.html>.

### 3.3 Lifecycle: 30-day retention

Create `lifecycle.json` in the working folder `~/aws-setup` (not in the repo). The `cat > …
<<'EOF'` form writes everything up to the closing `EOF` line into the file:

```bash
cd ~/aws-setup
cat > lifecycle.json <<'EOF'
{
  "Rules": [
    {
      "ID": "expire-backups-30d",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Expiration": { "Days": 30 },
      "NoncurrentVersionExpiration": { "NoncurrentDays": 7 },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" \
  --lifecycle-configuration file://lifecycle.json
```

How to read it: 30 days after an object is written, S3 puts a *delete marker* on it (it
disappears from listings); because the bucket is versioned the bytes become a *noncurrent
version* and are physically removed 7 days later. **Real retention is therefore 37 days.**
Half-finished multipart uploads are cleaned up after 7 days (our uploads are single PUTs, so
this is only a backstop).
<https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html>

> **Why (industry practice):** retention is a *rule the platform enforces*, not a cron job you
> hope keeps running. The CI role cannot delete anything (§4), so lifecycle is the only thing
> that ever removes a backup — and it removes them on a schedule you can read in one JSON file.

### 3.4 Refuse plain-HTTP requests

Create `bucket-policy.json` in `~/aws-setup` (verbatim AWS example; `sed` then substitutes
the bucket name):

```bash
cd ~/aws-setup
cat > bucket-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RestrictToTLSRequestsOnly",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::<BUCKET>",
        "arn:aws:s3:::<BUCKET>/*"
      ],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    }
  ]
}
EOF

sed -i '' "s/<BUCKET>/$BUCKET/g" bucket-policy.json
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file://bucket-policy.json
```

A Deny-only policy is not a "public" policy, so Block Public Access accepts it.
<https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html#example-bucket-policies-HTTP-HTTPS>

### 3.5 Verify, then test with one object

```bash
aws s3api get-bucket-versioning   --bucket "$BUCKET"          # "Status": "Enabled"
aws s3api get-public-access-block --bucket "$BUCKET"          # four trues
aws s3api get-bucket-encryption   --bucket "$BUCKET"          # AES256
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET"
aws s3api get-bucket-policy       --bucket "$BUCKET" --query Policy --output text

echo "hello from $(date -u)" > /tmp/s3-test.txt
aws s3api put-object --bucket "$BUCKET" --key db/s3-test.txt --body /tmp/s3-test.txt
# prints {"ETag": "...", "VersionId": "<VERSION_ID>", "ServerSideEncryption": "AES256"}
aws s3 ls "s3://$BUCKET/db/"
# remove the test object completely (a specific version deletes for real; a plain `rm` would only add a delete marker)
aws s3api delete-object --bucket "$BUCKET" --key db/s3-test.txt --version-id "<VERSION_ID>"
aws s3 ls "s3://$BUCKET/db/"                                   # empty again
```

Console check (**AWS console** → S3 → bucket → **Properties**): Bucket Versioning *Enabled*,
Default encryption *SSE-S3*, Object Lock *Disabled* (decision 5: revisit at launch —
governance mode, 30-day default retention, can be enabled on an existing bucket:
<https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-configure.html>).

---

## 4. IAM role for GitHub OIDC

**OIDC in two sentences.** When the workflow runs, GitHub hands it a short-lived signed token
that says "I am repository X running on branch Y"; AWS is told to trust GitHub's signature and
to swap *exactly that* token for one-hour AWS credentials. Nothing long-lived is stored
anywhere — there is no access key to leak, rotate or forget.
Docs: <https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws>,
<https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html>.

All commands: **Mac terminal**, logged in as `charles-admin`, in `~/aws-setup` with the four
lines of the §3 "Working folder + variables" block re-run (new window = re-run them).

### 4.1 Tell AWS to trust GitHub's token issuer (once per account)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
# -> "OpenIDConnectProviderArn": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
aws iam list-open-id-connect-providers
```

No thumbprint is needed any more — AWS verifies GitHub's certificate through its own trusted
CA library (same doc as above). `--thumbprint-list` is optional — the CLI reference says "This
parameter is optional. If it is not included, IAM will retrieve and use the top intermediate
certificate authority (CA) thumbprint of the OpenID Connect identity provider server
certificate" and AWS verifies GitHub through its trusted-CA library first
(<https://docs.aws.amazon.com/cli/latest/reference/iam/create-open-id-connect-provider.html>).
If an old CLI still demands the flag, `brew upgrade awscli` rather than inventing a value.

### 4.2 Confirm what GitHub will put in the token's `sub`

The trust policy matches the token's **subject** (`sub`). Repositories created before
2026-07-15 emit the classic form; renamed/transferred repos (and new ones) emit an *immutable*
form with numeric IDs. Our repo was created 2026-06-25 and reports `use_immutable_subject=false`
today — but a rename to "eldreve" would flip it silently, so the policy lists **both**.
<https://docs.github.com/actions/reference/openid-connect-reference>,
<https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens/>

```bash
gh auth status || gh auth login
gh api repos/CharlesChi715/goldrose-storefront/actions/oidc/customization/sub
# {"use_default":true,"use_immutable_subject":false,"sub_claim_prefix":"repo:CharlesChi715/goldrose-storefront"}
gh api repos/CharlesChi715/goldrose-storefront --jq '{id:.id,owner:.owner.id}'
# {"id":1279916967,"owner":96568777}
```

Scheduled runs always execute on the default branch, and `workflow_dispatch` from `main`
produces the same `sub` — so `ref:refs/heads/main` is exactly right. A dispatch from any
other branch is *meant* to be refused. ⚠️ Never add `environment:` to the backup job: the
`sub` then becomes `repo:…:environment:NAME` and AssumeRole fails.

### 4.3 Trust policy (who may assume the role)

Create `trust-policy.json` in `~/aws-setup` (`<ACCOUNT_ID>` is substituted by `sed` in §4.5):

```bash
cd ~/aws-setup
cat > trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": [
            "repo:CharlesChi715/goldrose-storefront:ref:refs/heads/main",
            "repo:CharlesChi715@96568777/goldrose-storefront@1279916967:ref:refs/heads/main"
          ]
        }
      }
    }
  ]
}
EOF
```

`sub` is case-sensitive — a wrong-case owner name is the most common cause of
"Not authorized to perform sts:AssumeRoleWithWebIdentity". IAM refuses a GitHub trust policy
whose `sub` condition is missing or a bare wildcard
(<https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html#idp_oidc_Create_GitHub>).

### 4.4 Permission policy (what the role may do): PutObject only, two prefixes

Create `permission-policy.json` in `~/aws-setup` (`<BUCKET>` is substituted by `sed` in §4.5):

```bash
cd ~/aws-setup
cat > permission-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PutOnlyBackups",
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": [
        "arn:aws:s3:::<BUCKET>/db/*",
        "arn:aws:s3:::<BUCKET>/files/*"
      ]
    }
  ]
}
EOF
```

No `s3:GetObject`, `s3:ListBucket`, `s3:DeleteObject`. A single-object `aws s3api put-object`
is exactly one PUT and needs nothing else
(<https://docs.aws.amazon.com/cli/latest/reference/s3api/put-object.html>). This is why the
workflow does **not** use `aws s3 sync` towards AWS — `sync` needs `s3:ListBucket`
(<https://docs.aws.amazon.com/cli/latest/reference/s3/cp.html>, decision 8).

### 4.5 Create the role and record its ARN

```bash
cd ~/aws-setup                             # $ACCOUNT_ID and $BUCKET: §3 "Working folder + variables" block
sed -i '' "s/<ACCOUNT_ID>/$ACCOUNT_ID/g" trust-policy.json
sed -i '' "s/<BUCKET>/$BUCKET/g"          permission-policy.json
grep -c '<' trust-policy.json permission-policy.json   # both must print 0: no placeholder left

aws iam create-role --role-name eldreve-backup-writer \
  --assume-role-policy-document file://trust-policy.json \
  --max-session-duration 3600 \
  --description "GitHub Actions db-backup.yml: PutObject-only into the backup bucket"

aws iam put-role-policy --role-name eldreve-backup-writer \
  --policy-name PutOnlyBackups --policy-document file://permission-policy.json

aws iam get-role --role-name eldreve-backup-writer --query Role.Arn --output text
# arn:aws:iam::<ACCOUNT_ID>:role/eldreve-backup-writer   <- this goes into the GitHub variable AWS_ROLE_ARN (§7)
```

Console alternative (**AWS console** → IAM → Roles → Create role → **Web identity** → provider
`token.actions.githubusercontent.com`, audience `sts.amazonaws.com`, GitHub organization
`CharlesChi715`, repository `goldrose-storefront`, branch `main`). The wizard writes only the
classic `sub`; edit the trust policy afterwards to add the immutable line.

> **Why (industry practice):** "least privilege" means the identity a job runs as can do the
> one thing the job needs and nothing else. A backup writer that could also *read* or *delete*
> would turn a leaked CI token into a data breach or a ransomware lever. Put-only + lifecycle +
> versioning is the standard shape for an append-only backup target.

---

## 5. age key pair

`age` is a small, modern file-encryption tool (<https://github.com/FiloSottile/age>, v1.3.2,
2026-08-29). It has a **public key** (`age1…`, safe to publish — it can only *lock*) and a
**secret key** (`AGE-SECRET-KEY-1…`, the only thing that *unlocks*). CI gets the public key;
humans keep the secret key. Man pages: <https://github.com/FiloSottile/age/blob/main/doc/age-keygen.1.ronn>,
<https://github.com/FiloSottile/age/blob/main/doc/age.1.ronn>.

### 5.1 Generate on the Mac — Mac terminal

```bash
brew install age                                   # 1.3.2; installs age, age-keygen, age-inspect
mkdir -p ~/.config/age && chmod 700 ~/.config/age
age-keygen -o ~/.config/age/eldreve-backup.txt     # prints "Public key: age1…"; refuses to overwrite an existing file
chmod 600 ~/.config/age/eldreve-backup.txt
cat ~/.config/age/eldreve-backup.txt
```

The file has three lines:

```text
# created: 2026-09-05T20:41:12+10:00
# public key: age1<...>
AGE-SECRET-KEY-1<...>
```

⚠️ Do **not** use `age-keygen -pq` (post-quantum keys): the runner's apt `age` is 1.1.1 and
cannot encrypt to them. Classic X25519 keys are interoperable across every age version.

### 5.2 Where each half goes

| Half                                    | Goes to                                                                                                   | Never goes to                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `age1…` public key                      | GitHub **variable** `AGE_RECIPIENT` (§7). Also paste it into the vault note so the pair can be matched.    | — (it is public by design)                                  |
| Whole 3-line file (contains the secret) | A **secure note in the shared vault, visible to both partners** ("ELDREVE backup age key — age1…"). Charles keeps `~/.config/age/eldreve-backup.txt` for drills. | GitHub (secret *or* variable), Vercel, the repo, `.env.local`, e-mail, chat |

⚠️ **Lose the secret key and every backup ever written is unreadable — permanently.** Nobody,
including AWS support, can help. Check the vault note exists and opens *from the boss's
account* before continuing. Losing the *public* key is harmless: `age-keygen -y ~/.config/age/eldreve-backup.txt`
regenerates it from the secret.

### 5.3 Prove the key works (round trip on the Mac)

```bash
RECIPIENT=$(age-keygen -y ~/.config/age/eldreve-backup.txt)
echo "$RECIPIENT"                                            # age1…  — this exact string becomes AGE_RECIPIENT
echo "drill $(date -u)" > /tmp/age-test.txt
age -r "$RECIPIENT" -o /tmp/age-test.txt.age /tmp/age-test.txt
age -d -i ~/.config/age/eldreve-backup.txt /tmp/age-test.txt.age     # prints the line back
rm /tmp/age-test.txt /tmp/age-test.txt.age
```

`age` exits 0 only if the whole input was encrypted/decrypted successfully — which is what
lets the workflow rely on `set -e`.

> **Why (industry practice):** "encrypt at the source with a key the storage provider never
> sees" is called client-side encryption. Combined with the put-only role it means a breach of
> GitHub *or* of the AWS account yields ciphertext only. The price is key custody — hence the
> vault ritual above and the quarterly decrypt check in §12.

---

## 6. Dead-man switch (healthchecks.io)

A dead-man switch inverts monitoring: instead of the job shouting when it fails, a third party
expects a daily "I succeeded" ping and shouts when it does **not** arrive. It catches every
silent failure mode: GitHub dropping the scheduled run (documented: "some queued jobs may be
dropped"), GitHub auto-disabling the cron after 60 days without repository activity (our repo
is public), a deleted secret, a paused Supabase project, a cancelled run.
Docs: <https://healthchecks.io/docs/>, <https://healthchecks.io/docs/http_api/>,
<https://healthchecks.io/docs/signaling_failures/>, <https://healthchecks.io/docs/measuring_script_run_time/>.

### 6.1 Create the check — healthchecks.io (browser)

1. Sign up at <https://healthchecks.io/> with the business mailbox (Hobbyist plan, $0, 20 checks).
2. **Add Check** → name `eldreve db-backup nightly`, tags `eldreve backup`.
3. **Schedule** → choose **Cron** → expression `23 10 * * *` → timezone **UTC** (must equal the
   GitHub cron in §8, which is UTC). **Grace Time: 2 hours**.
   Result: the check turns *late* at 10:23 UTC and *down* (alert) at 12:23 UTC if no success
   ping arrived; a run that pinged `/start` but never finished within 2 h also alerts. That is
   the concrete form of the earlier "~25 h" idea: 24 h period + 2 h grace.
4. **Integrations** → e-mail is on for the signup address; add the boss's e-mail as a second
   e-mail integration (they must click the verification link). Optionally Slack/Telegram.
5. Copy the **ping URL** `https://hc-ping.com/<UUID>`. ⚠️ Treat the UUID as a secret
   (healthchecks' own rule: "treat check UUIDs and project Ping keys as secrets") — it goes into
   the GitHub **secret** `HC_PING_URL` (§7) and into the vault, nowhere else.

### 6.2 Test from the Mac — Mac terminal

```bash
curl -fsS -m 10 --retry 5 -o /dev/null "https://hc-ping.com/<UUID>"
```

The check's page shows a green ping within a second. (Rate limit: 5 pings/minute.)

The workflow (§8) sends three kinds of ping: `…/start` when it begins, the bare URL with the
manifest as body on success, `…/fail` on any failed step. `/fail` marks the check down
immediately — you do not wait for the grace window.

---

## 7. GitHub repository secrets and variables

**Secrets** are encrypted, never shown again, and redacted from logs (exact-string match only).
**Variables** are plain text, visible to anyone who can read the repository — the repo is public,
so put only genuinely public values there.
Docs: <https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets>,
<https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/store-information-in-variables>.

### 7.1 The table

| Kind     | Name                            | Value / source                                                                                   | Who can see it                          |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------- |
| secret   | `BACKUP_PGPASSWORD`             | the value of `SUPABASE_DB_PASSWORD` from the main checkout's `.env.local` (later: the `backup_reader` password, §7.4) | nobody after saving; the workflow only  |
| secret   | `SUPABASE_S3_ACCESS_KEY_ID`     | Supabase dashboard → Storage → Settings → **S3 Connection** → New access key (§7.2)               | same                                    |
| secret   | `SUPABASE_S3_SECRET_ACCESS_KEY` | shown once at creation, same screen                                                              | same                                    |
| secret   | `HC_PING_URL`                   | `https://hc-ping.com/<UUID>` from §6                                                             | same                                    |
| variable | `AWS_ROLE_ARN`                  | `arn:aws:iam::<ACCOUNT_ID>:role/eldreve-backup-writer` (§4.5)                                    | anyone (harmless without GitHub's token)|
| variable | `S3_BUCKET`                     | the bucket name from §3.1                                                                        | anyone (the bucket is private)          |
| variable | `AGE_RECIPIENT`                 | `age1…` from §5.3                                                                                | anyone (public key by design)           |
| variable | `BACKUP_PGHOST`                 | `aws-1-us-west-2.pooler.supabase.com` — ⚠️ copy it from **Supabase dashboard → Connect → Session pooler**; some projects are `aws-0-…`; a wrong host says "Tenant or user not found" | anyone |
| variable | `BACKUP_PGUSER`                 | `postgres.cfvsvgbldnzkcjvbwnjp` (later: `backup_reader.cfvsvgbldnzkcjvbwnjp`)                    | anyone                                  |
| variable | `SUPABASE_PROJECT_REF`          | `cfvsvgbldnzkcjvbwnjp`                                                                           | anyone (it is in every public API URL)  |

Why no `DATABASE_URL`: the connection is passed as separate `PG*` environment variables (libpq
reads them natively), so the password is never inside a URL that would need percent-encoding and
would be echoed into a public log by a connection error — GitHub's redaction matches the raw
secret string only. GitHub's own advice: "Avoid passing secrets between processes from the
command line" (<https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#using-secrets-in-a-workflow>).

### 7.2 Supabase S3 access keys — Supabase dashboard

<https://supabase.com/docs/guides/storage/s3/authentication>. Dashboard → project
`cfvsvgbldnzkcjvbwnjp` → **Storage** → **Settings** → **S3 Connection**: note the endpoint
(`https://cfvsvgbldnzkcjvbwnjp.storage.supabase.co/storage/v1/s3`, region `us-west-2`) → **New
access key** → description `github-actions db-backup` → copy **Access key ID** and **Secret
access key** (the secret is shown once). These keys are project-wide and bypass RLS — the docs
call them server-only; they rank with the service-role key.

No plan gate is documented for the S3 protocol; if the **S3 Connection** section is missing on
the Free plan, use the fallback in §13 (T-20).

### 7.3 Set them — Mac terminal (or GitHub UI → Settings → Secrets and variables → Actions)

```bash
cd /Users/charles/Developer/goldrose-storefront
gh auth status || gh auth login

# secrets: gh prompts for the value — paste, press Enter. Nothing lands in shell history.
gh secret set BACKUP_PGPASSWORD
gh secret set SUPABASE_S3_ACCESS_KEY_ID
gh secret set SUPABASE_S3_SECRET_ACCESS_KEY
gh secret set HC_PING_URL

# variables
gh variable set AWS_ROLE_ARN         --body "arn:aws:iam::<ACCOUNT_ID>:role/eldreve-backup-writer"
gh variable set S3_BUCKET            --body "<BUCKET>"
gh variable set AGE_RECIPIENT        --body "<age1...>"
gh variable set BACKUP_PGHOST        --body "aws-1-us-west-2.pooler.supabase.com"
gh variable set BACKUP_PGUSER        --body "postgres.cfvsvgbldnzkcjvbwnjp"
gh variable set SUPABASE_PROJECT_REF --body "cfvsvgbldnzkcjvbwnjp"

gh secret list && gh variable list
```

### 7.4 Hardening sub-step (optional, recommended after the first green week): a read-only `backup_reader` role

Today CI holds the `postgres` operator password — full read/write and the power to run
`supabase db push`. A role that can *only read* halves the blast radius of a leaked secret.
Feasible because Supabase's `postgres` has `CREATEROLE`, `BYPASSRLS` and (PG ≥ 16)
`pg_read_all_data WITH ADMIN OPTION`. `BYPASSRLS` is mandatory: RLS is on for `storage.objects`
and ~20 `public` tables, and `pg_dump` refuses tables it cannot bypass.
<https://www.postgresql.org/docs/17/predefined-roles.html>,
<https://www.postgresql.org/docs/17/sql-createrole.html>.

**Mac terminal**, `psql` as `postgres` through the session pooler (never the web SQL editor).
The password is read straight out of `.env.local` into the environment — it never appears on a
command line, so it never lands in `~/.zsh_history`:

```bash
export PGPASSWORD="$(grep -m1 '^SUPABASE_DB_PASSWORD=' /Users/charles/Developer/goldrose-storefront/.env.local | cut -d= -f2-)"
psql "host=aws-1-us-west-2.pooler.supabase.com port=5432 user=postgres.cfvsvgbldnzkcjvbwnjp dbname=postgres sslmode=require" -w
```

```sql
create role backup_reader with login password '<BACKUP_READER_PASSWORD>' bypassrls;
grant pg_read_all_data to backup_reader;
alter role backup_reader set statement_timeout = 0;   -- a long COPY must not be cut by a default timeout
select rolname, rolcanlogin, rolbypassrls, rolsuper from pg_roles where rolname = 'backup_reader';
```

Wait a minute (the pooler learns new roles asynchronously), then prove it reads everything:

```bash
read -rs PGPASSWORD && export PGPASSWORD         # type the backup_reader password; nothing is echoed or logged
psql "host=aws-1-us-west-2.pooler.supabase.com port=5432 user=backup_reader.cfvsvgbldnzkcjvbwnjp dbname=postgres sslmode=require" -w \
  -Atc "select count(*) from auth.users; select count(*) from storage.objects; select count(*) from public.orders;"
unset PGPASSWORD                                 # when done
```

Three numbers, no `permission denied` → switch CI: `gh secret set BACKUP_PGPASSWORD` (new
password) and `gh variable set BACKUP_PGUSER --body backup_reader.cfvsvgbldnzkcjvbwnjp`, then
run the workflow by hand (§9). Honest caveat: read-only is not low-value — it reads
`auth.users` password hashes too. Record the role in `docs/features/db-backups.md` (it is cluster
state that no migration file creates; a fresh project will not have it). Rotate with
`alter role backup_reader password '<NEW>'`; drop with `drop role backup_reader;`.

---

## 8. The nightly workflow — `.github/workflows/db-backup.yml`

Create the file below in the repo (feature branch → PR → squash-merge to `main`, per the repo's
branch workflow). Before committing, run
`npx prettier --write .github/workflows/db-backup.yml .github/workflows/db-restore-test.yml`
(or `npm run format`) — CI's `npm run format:check` covers workflow YAML (`.prettierignore`
excludes only `*.md`), and a PR whose YAML is not prettier-clean is red on the formatting step.
Nothing runs until the file is on `main`: schedules only fire from the default branch, and the
OIDC trust (§4.3) only accepts `main`.

**Why this hour.** `23 10 * * *` = 10:23 UTC = 03:23 US-Pacific (PDT; 02:23 PST) when the US
customers the shop serves are asleep and Supabase load is lowest; 20:23 Sydney (AEST; 21:23
AEDT) so a failure mail reaches Charles while he is awake; 18:23 in China. Minute 23, not 00:
GitHub says top-of-hour schedules "can be delayed … some queued jobs may be dropped"
(<https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule>).
The cron stays in UTC (no `timezone:` key) so it can never disagree with the healthchecks cron.

```yaml
# Nightly encrypted backup of the hosted Supabase project (DB + product-images bucket) to S3.
# How to operate it: docs/guides/aws-backup.md. Status: docs/features/db-backups.md.
#
# Security shape (do not weaken without reading the guide):
#   * the AWS role can only PutObject — no Get/List/Delete;
#   * CI holds only the age PUBLIC key — it can encrypt, never decrypt;
#   * no actions/upload-artifact anywhere: the repo is public and artifacts are world-readable;
#   * secrets travel as environment variables, never on a command line or inside a URL.
name: db-backup

on:
  schedule:
    # 10:23 UTC = 20:23 Sydney (AEST) = 03:23 US-Pacific (PDT). Odd minute: GitHub
    # delays or drops top-of-hour schedules. Keep in sync with the healthchecks.io cron.
    - cron: "23 10 * * *"
  workflow_dispatch: {}

# One backup at a time; a late run queues behind a running one instead of killing it.
concurrency:
  group: db-backup
  cancel-in-progress: false

jobs:
  backup:
    runs-on: ubuntu-24.04 # pinned: -latest migrates to new Ubuntu majors silently; bump on purpose (§12.3)
    timeout-minutes: 30 # a hung pooler connection fails fast, not after 6 h
    permissions:
      id-token: write # lets the job request GitHub's OIDC token for AWS
      contents: read
    env:
      HC_URL: ${{ secrets.HC_PING_URL }}
      AWS_PAGER: "" # never let the AWS CLI wait on a pager in CI
    steps:
      # The monitor must never be able to prevent the backup it monitors: a lost ping is a
      # warning, and a missing success ping is exactly what healthchecks alerts on.
      - name: Dead-man switch — started
        shell: bash
        run: |
          [[ -n "$HC_URL" ]] || echo "::warning::HC_PING_URL secret is empty — job continues unmonitored"
          curl -fsS -m 10 --retry 5 -o /dev/null "$HC_URL/start" || echo "::warning::healthchecks /start ping failed; backup continues"

      # Ubuntu 24.04 ships PostgreSQL 16 tools; pg_dump refuses a newer server
      # ("aborting because of server version mismatch"), so install the PGDG client 17.
      - name: Install PostgreSQL 17 client tools and age
        shell: bash
        run: |
          set -euo pipefail
          sudo apt-get update
          sudo apt-get install -y postgresql-common age
          sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
          sudo apt-get install -y postgresql-client-17
          /usr/lib/postgresql/17/bin/pg_dump --version
          age --version

      # One custom-format archive: public (schema+data), auth + storage (schema+data, minus
      # the platform migration tables' rows), supabase_migrations (the CLI's migration history,
      # so a restored project can take the next `supabase db push`). "data-only" for
      # auth/storage is chosen at RESTORE time, so the archive stays complete for both local
      # and Supabase targets.
      - name: Dump the database
        shell: bash
        env:
          PGHOST: ${{ vars.BACKUP_PGHOST }}
          PGPORT: "5432" # session pooler; 6543 (transaction pooler) breaks pg_dump
          PGUSER: ${{ vars.BACKUP_PGUSER }}
          PGDATABASE: postgres
          PGSSLMODE: require
          PGPASSWORD: ${{ secrets.BACKUP_PGPASSWORD }}
        run: |
          set -euo pipefail
          PG=/usr/lib/postgresql/17/bin
          STAMP=$(date -u +%Y%m%dT%H%MZ)
          echo "STAMP=$STAMP" >> "$GITHUB_ENV"
          mkdir -p out
          echo "server: $($PG/psql -w -tAc 'show server_version;')"
          $PG/pg_dump -w --format=custom \
            --schema=public --schema=auth --schema=storage --schema=supabase_migrations \
            --exclude-table-data='auth.schema_migrations' \
            --exclude-table-data='storage.migrations' \
            --exclude-table-data='storage.buckets_vectors' \
            --exclude-table-data='storage.vector_indexes' \
            --file "out/eldreve-$STAMP.dump"
          # Integrity: the table of contents must parse, and must list our key tables.
          $PG/pg_restore --list "out/eldreve-$STAMP.dump" > out/toc.txt
          grep -q 'TABLE DATA public orders ' out/toc.txt
          grep -q 'TABLE DATA auth users ' out/toc.txt
          # Manifest (row counts, sizes, checksum — no customer data). Uploaded in plain text
          # so a drill can check the decrypted file against it.
          {
            echo "stamp=$STAMP"
            echo "server_version=$($PG/psql -w -tAc 'show server_version;')"
            for t in public.orders public.customers public.products auth.users storage.objects; do
              echo "$t=$($PG/psql -w -tAc "select count(*) from $t")"
            done
            echo "table_data_entries=$(grep -c 'TABLE DATA' out/toc.txt)"
            echo "dump_bytes=$(stat -c %s "out/eldreve-$STAMP.dump")"
            echo "dump_sha256=$(sha256sum "out/eldreve-$STAMP.dump" | cut -d' ' -f1)"
          } > "out/eldreve-$STAMP.manifest.txt"
          cat "out/eldreve-$STAMP.manifest.txt"

      # Storage file bytes are in no database dump — only their metadata rows are. Download
      # the bucket through Supabase's S3-compatible endpoint (Supabase keys, this step only),
      # then pack it into ONE tar so the AWS side stays a single put-only PUT.
      - name: Copy the product-images bucket from Supabase Storage
        shell: bash
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.SUPABASE_S3_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.SUPABASE_S3_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-west-2
          SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}
        run: |
          set -euo pipefail
          mkdir -p files/product-images
          aws s3 sync "s3://product-images" files/product-images \
            --endpoint-url "https://$SUPABASE_PROJECT_REF.storage.supabase.co/storage/v1/s3" \
            --no-progress
          echo "product_images_files=$(find files/product-images -type f | wc -l)" >> "out/eldreve-$STAMP.manifest.txt"
          tar -C files -cf "out/product-images-$STAMP.tar" product-images
          echo "product_images_tar_bytes=$(stat -c %s "out/product-images-$STAMP.tar")" >> "out/eldreve-$STAMP.manifest.txt"

      # Client-side encryption. Only the age1… public key is here; plaintext is deleted
      # before anything leaves the runner.
      - name: Encrypt with age
        shell: bash
        env:
          AGE_RECIPIENT: ${{ vars.AGE_RECIPIENT }}
        run: |
          set -euo pipefail
          [[ "$AGE_RECIPIENT" == age1* ]] || { echo "::error::AGE_RECIPIENT variable missing or not an age1… key"; exit 1; }
          age -r "$AGE_RECIPIENT" -o "out/eldreve-$STAMP.dump.age"        "out/eldreve-$STAMP.dump"
          age -r "$AGE_RECIPIENT" -o "out/product-images-$STAMP.tar.age"  "out/product-images-$STAMP.tar"
          rm -f "out/eldreve-$STAMP.dump" "out/product-images-$STAMP.tar" out/toc.txt
          rm -rf files
          ls -l out

      # Swap GitHub's OIDC token for 1-hour AWS credentials for the put-only role. This step
      # must come AFTER the Supabase download so the two sets of S3 credentials never coexist.
      - name: Get temporary AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: us-west-2
          role-session-name: db-backup-${{ github.run_id }}

      # aws s3api put-object = exactly one PUT per object; it is the only S3 call the role allows.
      - name: Upload to S3
        shell: bash
        env:
          S3_BUCKET: ${{ vars.S3_BUCKET }}
        run: |
          set -euo pipefail
          aws s3api put-object --bucket "$S3_BUCKET" --key "db/eldreve-$STAMP.dump.age"          --body "out/eldreve-$STAMP.dump.age"
          aws s3api put-object --bucket "$S3_BUCKET" --key "files/product-images-$STAMP.tar.age" --body "out/product-images-$STAMP.tar.age"
          aws s3api put-object --bucket "$S3_BUCKET" --key "db/eldreve-$STAMP.manifest.txt"      --body "out/eldreve-$STAMP.manifest.txt"

      - name: Dead-man switch — success (manifest as the ping body)
        shell: bash
        run: |
          curl -fsS -m 10 --retry 5 -o /dev/null --data-binary "@out/eldreve-$STAMP.manifest.txt" "$HC_URL" || echo "::warning::success ping failed — S3 upload succeeded, check healthchecks manually"

      - name: Dead-man switch — failed
        if: failure()
        shell: bash
        run: curl -fsS -m 10 --retry 5 -o /dev/null "$HC_URL/fail" || echo "::warning::/fail ping failed — healthchecks will alert on the missing success ping instead"
```

### 8.1 What each block does, one line each

| Block                                   | Why it is there                                                                                                                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schedule` + `workflow_dispatch`        | Nightly at 10:23 UTC; the **Run workflow** button / `gh workflow run` for the first run and re-runs.                                                                                                                                       |
| `concurrency … cancel-in-progress: false` | Two runs never overlap; a late run waits rather than killing a half-written dump. <https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency>                                     |
| `timeout-minutes: 30`                   | The job is normally ~3 min; a hang fails in 30, not 360. A timeout is a *cancel*, so `if: failure()` does not fire — the `/start` ping + 2 h grace covers it.                                                                             |
| `permissions: id-token: write`          | Required for `configure-aws-credentials` to fetch the OIDC token; without it: "Unable to get ACTIONS_ID_TOKEN_REQUEST_URL".                                                                                                                |
| `AWS_PAGER: ""`                         | Disables the CLI's pager so no step can block on it. <https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-pagination.html#cli-usage-pagination-clientside>                                                                          |
| `shell: bash` + `set -euo pipefail`     | `shell: bash` makes GitHub run `bash --noprofile --norc -eo pipefail`; the explicit `set` line repeats it so the intent is visible. Without `pipefail` a failing `pg_dump` in a pipe would upload an empty file as green. <https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html> |
| `/start` ping                           | Tells healthchecks a run began; if no success follows within the grace time it alerts even when the job was cancelled.                                                                                                                    |
| Pings never fail the job (`\|\| echo "::warning::…"`, no `set -e` in the ping steps) | A monitoring outage must not cancel a backup; a missing success ping is exactly what the check alerts on. An empty `HC_PING_URL` is a warning in the log, not a stop.                                                    |
| `runs-on: ubuntu-24.04`                 | Pinned on purpose: GitHub moves the `-latest` label to a new Ubuntu major silently over 1–2 months, and the PGDG install step needs PGDG to publish for that release. Bump deliberately (§12.3). <https://github.com/actions/runner-images> ("specify a specific OS version in the yaml file … to avoid unwanted migration") |
| PGDG install                            | Runner image = Ubuntu 24.04 with PostgreSQL **16.15** tools; server is **17.6**. <https://www.postgresql.org/download/linux/ubuntu/>, <https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md>              |
| `PG*` env + `-w`                        | libpq reads `PGHOST/PGUSER/PGPASSWORD/PGSSLMODE` natively; `-w` fails in ~1 s on a bad secret instead of prompting on a TTY-less runner. <https://www.postgresql.org/docs/17/app-pgdump.html>                                             |
| `pg_dump --format=custom -n … --exclude-table-data …` | Custom format = compressed, `--list`-checkable, restore-time selection of schemas/data-only. Platform migration tables' rows (`auth.schema_migrations`, `storage.migrations`) are excluded because they are platform state that must never land in another Supabase project. Definitions are kept so a vanilla-Postgres drill has every table. Because the schemas are selected explicitly, the archive **always carries a `CREATE SCHEMA public` entry** (pg_dump skips it only when no `--schema` filter is given) — every restore in this guide filters that one TOC line with `-L`. |
| `--schema=supabase_migrations`          | The CLI's own history table (`supabase_migrations.schema_migrations`, 13 rows for 0001–0014, owned by `postgres`). Restored with `public` in §11.3, it lets `supabase db push` continue on the restored project instead of re-applying 0001 onto existing tables. Harmless in the vanilla restore test. <https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore> |
| `pg_restore --list` + two `grep -q`     | A truncated or empty archive fails `--list`; the greps assert the two tables that matter most are in it. Runs in seconds, no server needed.                                                                                              |
| Manifest                                | Row counts, byte size and SHA-256 of the plaintext dump — what the drill compares against. Contains no customer data, so it may be stored unencrypted.                                                                                    |
| `aws s3 sync` from Supabase             | Storage bytes are in no dump (<https://supabase.com/docs/guides/platform/backups>). Endpoint/keys per <https://supabase.com/docs/guides/storage/s3/authentication>; incremental after the first night. Step-scoped credentials.            |
| `tar` + `age -r`                        | One object per night per kind; public key only; plaintext removed. `age` exits non-zero on any partial failure.                                                                                                                             |
| `configure-aws-credentials@v6`          | v6.2.4 (Node 24) as of 2026-08-31; default audience `sts.amazonaws.com`, 1 h session. <https://github.com/aws-actions/configure-aws-credentials>                                                                                          |
| `aws s3api put-object` ×3               | One PUT each; keys under `db/` and `files/`, exactly the two prefixes the role allows. Prints `VersionId` as evidence.                                                                                                                     |
| Success ping with body                  | The manifest lands in the healthchecks log too — a second, independent record of what was backed up.                                                                                                                                      |
| `if: failure()` → `/fail`               | Immediate alert on any red step (<https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#failure>).                                                                                                               |

> **Why (industry practice):** a backup job has three properties or it is theatre — it *verifies*
> what it wrote (`--list`, greps, manifest), it *fails loudly* (`set -euo pipefail`, `/fail`,
> dead-man switch), and it *cannot be turned against you* (put-only, encrypt-only). Every line in
> the file serves one of the three.

---

## 9. First run

1. **GitHub UI**: merge the PR that adds `.github/workflows/db-backup.yml` to `main`.
2. **Mac terminal** (or GitHub UI → **Actions** → *db-backup* → **Run workflow** → branch `main`):

   ```bash
   cd /Users/charles/Developer/goldrose-storefront
   gh workflow run db-backup.yml --ref main
   gh run list --workflow db-backup.yml --limit 1
   gh run watch                                  # pick the run; streams the log
   ```

   ⚠️ Dispatch from `main` only — any other branch produces a different OIDC `sub` and the
   AWS step fails by design.

3. **What green looks like** (the log, top to bottom): `pg_dump (PostgreSQL) 17.x` and an `age`
   version → `server: 17.6` → the manifest with five counts and a `dump_sha256` → `download:`
   lines from the bucket sync → `ls -l out` showing two `.age` files and one `.manifest.txt`
   → `Assuming role with OIDC` → three JSON blobs with `"VersionId"` → the success ping step.
   Runtime ~2–4 minutes.

4. **Verify in S3 — Mac terminal**, as `charles-admin` (the *human* identity may list and read;
   CI may not):

   ```bash
   aws login                                        # if the 12 h session expired
   # $BUCKET: re-run the four lines of the §3 "Working folder + variables" block in this window first
   aws s3 ls "s3://$BUCKET/db/"                     # eldreve-<STAMP>.dump.age + .manifest.txt
   aws s3 ls "s3://$BUCKET/files/"                  # product-images-<STAMP>.tar.age
   aws s3 cp "s3://$BUCKET/db/eldreve-<STAMP>.manifest.txt" - | cat
   ```

   **AWS console** → S3 → bucket → *Objects*: same three keys; open one → *Properties* →
   Server-side encryption *SSE-S3*.

5. **healthchecks.io**: the check shows a *start* event and a green success ping whose body is
   the manifest; status **Up**; next expected ping shown in UTC.

6. **GitHub failure e-mail — GitHub UI**: profile photo → **Settings** → **Notifications** →
   under **System → Actions** → tick **Email**, optionally **Only notify for failed workflows**.
   Remember GitHub mails only the user who last edited the cron line (Charles) — the bosses get
   theirs from healthchecks.io.
   <https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications>

7. Decrypt the first object once on the Mac (§11.1 steps 1–4) before you trust the pipeline.
   A backup you have never opened is a hope, not a backup.

---

## 10. Automated restore test — `.github/workflows/db-restore-test.yml`

Weekly, separate from the nightly job so a flaky service container can never block an upload.
It takes a **fresh** dump with the same command as §8, restores it into a throwaway
`postgres:17` container, and asserts row counts for `orders`, `customers`, `products` and
`auth.users`. **It tests the procedure, not the stored artifact** — by design: reading the S3
copy would need `s3:GetObject` and decrypting it would need the secret key, and CI must have
neither (decision 16). The S3 → decrypt → restore path is the human drill in §11.

Two repo-specific facts shape it (verified in `supabase/migrations/`):

- four `public` foreign keys reference `auth.users(id)` in the live catalog —
  `admin_users.user_id` (0001), `orders.auth_user_id` (0006), `product_reviews.user_id` (0007),
  `admin_advisor_keys.user_id` (0013); `customers.auth_user_id` (0002) exists as a column but
  carries no FK on the hosted project — so the `auth` schema **must** be restored for the
  foreign keys to validate; the single archive carries its DDL and data;
- RLS policies name the roles `anon` and `authenticated` (0001 `site_content_public_read`;
  `revoke … from anon, authenticated`), which do not exist in vanilla Postgres → create them
  first. `--no-privileges` skips the grants themselves.

Verified against the live catalog on 2026-09-05: nothing in the `auth` or `storage` DDL depends
on a schema outside pg_catalog/auth/storage — no column default, column type, trigger function
or function body references `extensions.*`, `vault.*` or `public.*`, and all 21 functions are
plain SQL/plpgsql. The only cross-schema reference in the whole archive is `vault.*` inside the
two `public` function bodies from 0013, which pg_restore loads with `check_function_bodies =
false`, so they restore without validation. The `create schema extensions` + two `create
extension` lines below are therefore belt-and-braces only (they mirror the hosted project, where
`pgcrypto` and `uuid-ossp` live in `extensions`). If a future platform migration adds such a
dependency, the first run fails inside the auth/storage DDL with `function … does not exist` /
`schema "…" does not exist` — see §13 T-15 for the fallback.

```yaml
# Weekly proof that the nightly dump command produces an archive that restores into a fresh
# Postgres 17 with the right row counts. Guide: docs/guides/aws-backup.md §10.
# Deliberately does NOT read S3 or decrypt anything: CI has no Get rights and no secret key.
name: db-restore-test

on:
  schedule:
    # Sundays 11:07 UTC = 21:07 Sydney (AEST) = 04:07 US-Pacific (PDT); after the nightly run.
    - cron: "7 11 * * 0"
  workflow_dispatch: {}

concurrency:
  group: db-restore-test
  cancel-in-progress: false

jobs:
  restore-test:
    runs-on: ubuntu-24.04 # pinned: -latest migrates to new Ubuntu majors silently; bump on purpose (§12.3)
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:17 # same major as the hosted 17.6 server
        env:
          POSTGRES_PASSWORD: postgres # scratch container that lives 30 minutes; not a real secret
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - name: Install PostgreSQL 17 client tools
        shell: bash
        run: |
          set -euo pipefail
          sudo apt-get update
          sudo apt-get install -y postgresql-common
          sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
          sudo apt-get install -y postgresql-client-17
          /usr/lib/postgresql/17/bin/pg_dump --version

      - name: Fresh dump of production (same command as the nightly job)
        shell: bash
        env:
          PGHOST: ${{ vars.BACKUP_PGHOST }}
          PGPORT: "5432"
          PGUSER: ${{ vars.BACKUP_PGUSER }}
          PGDATABASE: postgres
          PGSSLMODE: require
          PGPASSWORD: ${{ secrets.BACKUP_PGPASSWORD }}
        run: |
          set -euo pipefail
          PG=/usr/lib/postgresql/17/bin
          mkdir -p out
          TABLES="public.orders public.customers public.products auth.users"
          # Counts before and after the dump bracket the truth: a row written during the dump
          # must not turn into a false alarm.
          for t in $TABLES; do $PG/psql -w -tAc "select count(*) from $t" > "out/before.$t"; done
          $PG/pg_dump -w --format=custom \
            --schema=public --schema=auth --schema=storage --schema=supabase_migrations \
            --exclude-table-data='auth.schema_migrations' \
            --exclude-table-data='storage.migrations' \
            --exclude-table-data='storage.buckets_vectors' \
            --exclude-table-data='storage.vector_indexes' \
            --file out/eldreve.dump
          for t in $TABLES; do $PG/psql -w -tAc "select count(*) from $t" > "out/after.$t"; done
          $PG/pg_restore --list out/eldreve.dump > /dev/null
          ls -l out/eldreve.dump

      - name: Restore into the scratch Postgres 17
        shell: bash
        env:
          PGHOST: localhost
          PGPORT: "5432"
          PGUSER: postgres
          PGPASSWORD: postgres
        run: |
          set -euo pipefail
          PG=/usr/lib/postgresql/17/bin
          $PG/psql -w -d postgres -v ON_ERROR_STOP=1 -c "create database restore_test"
          # Roles named by RLS policies, and the schema Supabase keeps extensions in.
          $PG/psql -w -d restore_test -v ON_ERROR_STOP=1 -c "
            create role anon nologin;
            create role authenticated nologin;
            create role service_role nologin bypassrls;
            create schema extensions;
            create extension if not exists \"uuid-ossp\" schema extensions;
            create extension if not exists pgcrypto schema extensions;"
          # The archive always carries CREATE SCHEMA public (explicit --schema selection); the
          # target already has it, so drop that one TOC line or --exit-on-error stops there.
          # A TOC line is "id; catalogId oid DESC namespace tag OWNER" — the OWNER is printed
          # last, e.g. "26; 2615 2200 SCHEMA - public pg_database_owner". So the pattern must
          # end in a SPACE; anchoring with $ matches nothing and the filter silently does
          # nothing. https://www.postgresql.org/docs/17/app-pgrestore.html
          # --exit-on-error: without it pg_restore exits 0 after 'errors ignored on restore: N'.
          $PG/pg_restore --list out/eldreve.dump \
            | grep -v -E ' SCHEMA - public | COMMENT - SCHEMA public ' > out/restore.toc
          test "$(grep -c ' SCHEMA - public ' out/restore.toc)" = "0"   # filter really fired
          $PG/pg_restore -w -d restore_test -L out/restore.toc --no-owner --no-privileges --exit-on-error out/eldreve.dump
          $PG/psql -w -d restore_test -c "analyze"

      - name: Row-count assertions
        shell: bash
        env:
          PGHOST: localhost
          PGPORT: "5432"
          PGUSER: postgres
          PGPASSWORD: postgres
        run: |
          set -euo pipefail
          PG=/usr/lib/postgresql/17/bin
          fail=0
          for t in public.orders public.customers public.products auth.users; do
            a=$(cat "out/before.$t"); b=$(cat "out/after.$t")
            if (( a <= b )); then lo=$a; hi=$b; else lo=$b; hi=$a; fi
            got=$($PG/psql -w -d restore_test -tAc "select count(*) from $t")
            echo "$t: production before=$a after=$b restored=$got"
            if (( got < lo || got > hi )); then echo "::error::row count mismatch on $t"; fail=1; fi
          done
          # Views and the storage metadata must be queryable too.
          $PG/psql -w -d restore_test -v ON_ERROR_STOP=1 -tAc "select count(*) from public.catalog_products" > /dev/null
          echo "storage.objects in product-images: $($PG/psql -w -d restore_test -tAc "select count(*) from storage.objects where bucket_id = 'product-images'")"
          rm -rf out                      # plaintext never outlives the job
          exit $fail
```

Sources: service containers
<https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/creating-postgresql-service-containers>,
image env <https://github.com/docker-library/docs/blob/master/postgres/README.md>,
`pg_restore --exit-on-error` <https://www.postgresql.org/docs/17/app-pgrestore.html>.

First run: merge, then `gh workflow run db-restore-test.yml --ref main && gh run watch`. Green
= four lines `production before=N after=N restored=N` and a storage count. It has no
healthchecks ping on purpose: it is not the safety-critical job, and GitHub's failure mail
(step 6 of §9) covers it. Add a second check later if you want it watched too.

> **Why (industry practice):** "restore tests" are the difference between a backup *policy* and
> a backup *capability*. Automating the cheap half weekly (does the archive restore, are the
> counts right) leaves the human drill to test the only things a machine cannot: key custody
> and the person.

---

## 11. Manual restore drill runbook (monthly)

Monthly, 30–45 minutes, on the Mac. Option A proves the stored copy opens and restores
(every month). Option B is the full disaster rehearsal into a second Supabase project with the
admin app on top (first month, then quarterly). Record the result in
`docs/features/db-backups.md` under `verification.human` (§15).

Both options start with the same download-and-decrypt.

### 11.1 Get and open the latest backup — Mac terminal

```bash
brew install postgresql@17 age awscli            # once; postgresql@17 is 17.11, keg-only
brew services start postgresql@17                # once; local cluster on port 5432, trust auth
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"   # EVERY drill session: use PG17's psql/pg_restore, not libpq 18.6
pg_restore --version                             # pg_restore (PostgreSQL) 17.x

aws login                                        # charles-admin, MFA in the browser
# $BUCKET: re-run the four lines of the §3 "Working folder + variables" block in this window first
aws s3 ls "s3://$BUCKET/db/" | sort | tail -4     # pick the newest STAMP
STAMP="<STAMP>"                                  # e.g. 20260906T1024Z
mkdir -p ~/drill && cd ~/drill
aws s3 cp "s3://$BUCKET/db/eldreve-$STAMP.dump.age" .
aws s3 cp "s3://$BUCKET/db/eldreve-$STAMP.manifest.txt" .
cat "eldreve-$STAMP.manifest.txt"

# 1. the secret key still matches what CI encrypts to
age-keygen -y ~/.config/age/eldreve-backup.txt   # must equal the GitHub variable AGE_RECIPIENT
# 2. decrypt
age -d -i ~/.config/age/eldreve-backup.txt -o "eldreve-$STAMP.dump" "eldreve-$STAMP.dump.age"
# 3. checksum equals the manifest's dump_sha256
shasum -a 256 "eldreve-$STAMP.dump"
# 4. the archive parses
pg_restore --list "eldreve-$STAMP.dump" | head -30
```

⚠️ From here on `~/drill/eldreve-<STAMP>.dump` is **customer data in plain text** on your disk.
Delete it at the end of the drill (§11.4). Never copy it into the repo, a chat or a cloud drive.

Do the same decrypt once a quarter with the key opened *from the vault note* (not from
`~/.config/age`), so you know the copy the boss holds actually works.

### 11.2 Option A — restore into a local Postgres 17 (monthly, ~15 min)

```bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
cd ~/drill

# roles named by RLS policies (cluster-wide; "already exists" on later drills is fine)
psql -d postgres -c "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;"

dropdb --if-exists eldreve_drill
createdb eldreve_drill
psql -d eldreve_drill -v ON_ERROR_STOP=1 -c "create schema extensions; create extension if not exists \"uuid-ossp\" schema extensions; create extension if not exists pgcrypto schema extensions;"

# the archive always carries CREATE SCHEMA public (explicit --schema selection) and the target has it: drop that TOC line.
# A TOC line ends with the OWNER — "26; 2615 2200 SCHEMA - public pg_database_owner" — so the
# pattern ends in a SPACE. Anchoring with $ would match nothing and the restore would then die
# on 'schema "public" already exists'. The grep -c line proves the filter fired.
pg_restore --list "eldreve-$STAMP.dump" \
  | grep -v -E ' SCHEMA - public | COMMENT - SCHEMA public ' > restore.toc
grep -c ' SCHEMA - public ' restore.toc   # must print 0
pg_restore -d eldreve_drill -L restore.toc --no-owner --no-privileges --exit-on-error "eldreve-$STAMP.dump"
psql -d eldreve_drill -c "analyze"

# counts — compare with the manifest, then with LIVE (next block)
psql -d eldreve_drill -At <<'SQL'
select 'public.orders',    count(*) from public.orders
union all select 'public.customers', count(*) from public.customers
union all select 'public.products',  count(*) from public.products
union all select 'auth.users',       count(*) from auth.users
union all select 'storage.objects',  count(*) from storage.objects;
SQL
psql -d eldreve_drill -Atc "select count(*) from public.catalog_products;"    # the storefront's view works
psql -d eldreve_drill -Atc "select name, financial_status, fulfillment_status, placed_at from public.orders order by placed_at desc limit 3;"
```

Compare with live (read-only; the operator password is read from the main checkout's
`.env.local` into the environment — never typed on a command line, so never in shell history):

```bash
export PGPASSWORD="$(grep -m1 '^SUPABASE_DB_PASSWORD=' /Users/charles/Developer/goldrose-storefront/.env.local | cut -d= -f2-)"
psql "host=aws-1-us-west-2.pooler.supabase.com port=5432 user=postgres.cfvsvgbldnzkcjvbwnjp dbname=postgres sslmode=require" -w -Atc \
  "select 'orders', count(*) from public.orders union all select 'customers', count(*) from public.customers union all select 'products', count(*) from public.products union all select 'auth.users', count(*) from auth.users;"
unset PGPASSWORD                 # when done
```

Live counts ≥ the manifest's (rows added since last night) and the manifest's = the restored
ones → **pass**. Why `--no-owner --no-privileges` here: the Supabase roles that own and are
granted these objects do not exist locally (`supabase_auth_admin`, `service_role`…). Why the
admin app is *not* run against this database: the app talks to Supabase (PostgREST + Auth),
not to raw Postgres — that check belongs to Option B.

### 11.3 Option B — full DR rehearsal into a throwaway Supabase project (~30 min)

Order matters: **auth + storage data first, then public** — the `public` foreign keys to
`auth.users` are validated when they are created, so the users must already be there.
Official recipe this follows (and its `session_replication_role = replica` trick):
<https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore>.

1. **Supabase dashboard** → **New project** → same organization, name `eldreve-drill`, region
   **West US (Oregon)**, generate a strong database password → save it in your vault. Wait until
   the project is ready. ⚠️ Free plan = 2 active projects and the scratch one pauses after a
   week of inactivity (<https://supabase.com/pricing>) — delete it at the end (step 8).
   **Do not** run `supabase db push` against it: the restore brings the schema, and 0001 would
   pre-insert the `product-images` bucket row and collide.
2. Dashboard → **Connect** → **Session pooler**: copy the host (`aws-0-…` or `aws-1-…`) and note
   the new ref `<NEWREF>`. Confirm the major version matches the dump:

   ```bash
   export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
   cd ~/drill
   export NEW="host=<NEW_POOLER_HOST> port=5432 user=postgres.<NEWREF> dbname=postgres sslmode=require"
   read -rs PGPASSWORD && export PGPASSWORD         # type the NEW project's database password; nothing echoed, nothing in history
   psql "$NEW" -w -Atc "show server_version;"      # 17.x expected (new projects are created on 17)
   ```

   ⚠️ **Live-project guard — run this first, every time.** Step 3 writes into whatever `$NEW`
   points at with FK and trigger checks off. If `$NEW` were the live project (same
   `aws-1-us-west-2` pooler host, only the ref differs), it would insert duplicate `auth`/`storage`
   rows into PRODUCTION:

   ```bash
   [[ "$NEW" != *cfvsvgbldnzkcjvbwnjp* ]] || { echo "REFUSING: \$NEW points at the LIVE project"; false; }
   psql "$NEW" -w -Atc "select count(*) from auth.users;"   # must print 0 — a fresh project
   ```

3. **auth + storage rows, data-only**, with triggers and FK checks off for the session, all in
   **one transaction.** Write the rows to a `.sql` file first, then load them through `psql` so
   the session parameter can be set as SQL:

   ```bash
   # auth + storage rows as SQL (COPY blocks inline)
   pg_restore --data-only --schema=auth --schema=storage --no-owner \
     -f "auth-storage-$STAMP.sql" "eldreve-$STAMP.dump"
   # one session, one transaction: SET replica (FK checks + triggers off), then load
   psql "$NEW" -w -v ON_ERROR_STOP=1 --single-transaction \
     -c "set session_replication_role = replica" -f "auth-storage-$STAMP.sql"
   psql "$NEW" -w -Atc "select count(*) from auth.users; select count(*) from storage.objects;"
   ```

   ⚠️ **Do not use `PGOPTIONS` here.** `session_replication_role` must be set as SQL *inside*
   the session, because the Supabase pooler drops libpq's `options`/`PGOPTIONS` startup
   parameter (only `search_path` survives — verified 2026-09-05 against the session pooler, and
   <https://github.com/supabase/supavisor/issues/206> is still open). With `PGOPTIONS` the
   parameter silently stays `origin`, FK checks fire, and because `--data-only` loads tables in
   alphabetical TOC order `auth.identities` arrives before `auth.users` and the whole step rolls
   back with `violates foreign key constraint "identities_user_id_fkey"`. `psql` runs `-c` and
   `-f` in the order given, in one session; `--single-transaction` plus `ON_ERROR_STOP=1` rolls
   *everything* back on any error, so a half-loaded project can never be the base for step 4
   (<https://www.postgresql.org/docs/17/app-psql.html>). This is the form Supabase's own recipe
   uses. Never `pg_restore --disable-triggers` here — it needs table ownership and fails with
   "must be owner of table users". Never restore auth/storage **DDL** into Supabase: the
   platform owns those schemas and since 2025-04-21 `postgres` cannot create objects there
   (<https://github.com/orgs/supabase/discussions/34270>).

   ⚠️ `auth-storage-$STAMP.sql` is **plaintext customer data** — every email address and
   password hash in the project. It lives in `~/drill` and §11.4 deletes it.

4. **public schema + migration history, definitions + data, then re-apply the API-role
   hardening.** The archive always carries `CREATE SCHEMA public` (explicit `--schema`
   selection) and a new project already has it, so that one TOC line is filtered out (`-L` and
   `--schema` intersect, so the filter still applies). As in §11.2 the pattern ends in a **space**,
   because a TOC line ends with the owner name:

   ```bash
   psql "$NEW" -w -v ON_ERROR_STOP=1 -c "create schema if not exists supabase_migrations;"
   pg_restore --list "eldreve-$STAMP.dump" \
     | grep -v -E ' SCHEMA - (public|supabase_migrations) | COMMENT - SCHEMA public ' > restore.toc
   grep -c ' SCHEMA - public ' restore.toc   # must print 0
   pg_restore -d "$NEW" -w --schema=public --schema=supabase_migrations -L restore.toc --no-owner --no-privileges --exit-on-error "eldreve-$STAMP.dump"
   psql "$NEW" -w -Atc "select count(*) from public.orders; select count(*) from public.catalog_products;"
   ```

   ```bash
   psql "$NEW" -w -v ON_ERROR_STOP=1 <<'SQL'
   -- pg_dump cannot carry a REVOKE against Supabase's default privileges; replay 0001/0013/0014 by hand
   revoke all on all tables    in schema public from anon, authenticated;
   revoke all on all sequences in schema public from anon, authenticated;
   grant select on public.catalog_products, public.site_content to anon, authenticated;
   revoke all on function public.advisor_key_save(uuid, text), public.advisor_key_read(uuid) from anon, authenticated;
   -- verify: no anon/authenticated entry except the two SELECT grants
   select relname, relacl from pg_class where relnamespace='public'::regnamespace and relkind in ('r','v') and relacl::text ~ '(anon|authenticated)=' order by 1;
   SQL
   ```

   `--no-privileges` is **required** on this cross-project restore. Without it pg_restore replays
   the archive's three `DEFAULT ACL … supabase_admin` entries, and
   `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin` needs membership of `supabase_admin`, a
   Supabase superuser role `postgres` never gets — so `--exit-on-error` aborts the public restore
   mid-way. With the flag, the restored tables come up with the *target's* defaults instead
   (`pg_default_acl` for `postgres`: ALL to `anon`, `authenticated`, `service_role`), which is
   exactly why the REVOKE block below must run immediately after.

   Why the extra block: verified 2026-09-05, `pg_default_acl` on the hosted project grants
   `anon`/`authenticated` ALL on every new `public` table, and pg_dump emits privileges only as
   GRANT/REVOKE relative to Postgres' built-in defaults, never relative to a target's
   `ALTER DEFAULT PRIVILEGES` (`-x` in <https://www.postgresql.org/docs/17/app-pgdump.html>). So
   whichever flag you pass, the restored tables come up with `anon`/`authenticated` granted ALL
   until this block runs. RLS is on for all `public` tables, so this is defence in depth — but
   the guide promises 0001's hardening, and only this block delivers it.

   4b. **Migration history — Mac terminal, main checkout** (the CLI link only works there):

   ```bash
   cd /Users/charles/Developer/goldrose-storefront
   supabase link --project-ref <NEWREF>
   supabase migration list          # 13 rows, all Local = Remote
   ```

   Now future `supabase db push` runs work against the restored project instead of trying to
   re-apply 0001 onto restored tables. ⚠️ After the drill, `supabase link --project-ref cfvsvgbldnzkcjvbwnjp`
   to point the CLI back at the live project (step 8).

5. **Files.** Download and decrypt the tarball, create S3 keys on the **new** project
   (Storage → Settings → S3 Connection → New access key), upload to the same keys (the restored
   `storage.objects` rows are refreshed by the upload; `product_images.path` stores the bucket
   key, so nothing else needs fixing — see `lib/admin/files.ts`):

   ```bash
   aws s3 cp "s3://$BUCKET/files/product-images-$STAMP.tar.age" .
   age -d -i ~/.config/age/eldreve-backup.txt -o "product-images-$STAMP.tar" "product-images-$STAMP.tar.age"
   mkdir -p files && tar -C files -xf "product-images-$STAMP.tar"
   AWS_ACCESS_KEY_ID="<NEW_S3_KEY_ID>" AWS_SECRET_ACCESS_KEY="<NEW_S3_SECRET>" AWS_DEFAULT_REGION=us-west-2 \
     aws s3 sync files/product-images "s3://product-images" \
       --endpoint-url "https://<NEWREF>.storage.supabase.co/storage/v1/s3"
   ```

   If a checksum error appears on upload (AWS CLI ≥ 2.23 sends CRC checksums some S3-compatible
   services reject), prefix the command with
   `AWS_REQUEST_CHECKSUM_CALCULATION=when_required AWS_RESPONSE_CHECKSUM_VALIDATION=when_required`
   (<https://docs.aws.amazon.com/cli/latest/topic/s3-faq.html>).

6. **Point a local dev server at the scratch project.** New project → **Project Settings → Data
   API** (copy the Project URL) and **Project Settings → API Keys** → **Legacy API keys** tab
   (copy `anon` and `service_role`; the app still uses these JWT keys — Supabase lists them as
   legacy, deprecating by end of 2026, so if the tab is gone use the `sb_publishable_…` /
   `sb_secret_…` keys instead). <https://supabase.com/docs/guides/api/api-keys>
   Inline variables beat `.env.local` (Next's env loader never overrides a variable that is
   already set), so nothing in `.env.local` changes:

   ```bash
   cd /Users/charles/Developer/goldrose-storefront
   NEXT_PUBLIC_SUPABASE_URL="https://<NEWREF>.supabase.co" \
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<NEW_ANON_KEY>" \
   SUPABASE_SERVICE_ROLE_KEY="<NEW_SERVICE_ROLE_KEY>" \
   npm run dev
   ```

   Open <http://localhost:3000/> — products and images render from the restored data. Open
   <http://localhost:3000/admin> and sign in → **Orders** lists the restored orders. Sign-in on
   the scratch project depends on its Auth settings (Site URL `http://localhost:3000`, e-mail
   provider; passkeys will not work — their RP ID is pinned to the live domain). If the sign-in
   mail does not arrive, that is an Auth-configuration difference, not a data problem: the SQL
   counts in steps 3–4 are the data verdict; the admin screen is the bonus. The advisor page
   shows no API key — expected: Vault secrets are not restored (decision 19).

7. Write the evidence (counts, STAMP, date, what you saw) into `docs/features/db-backups.md`
   `verification.human` (§15).

8. **Tear down.** ⚠️ Supabase dashboard → the **`eldreve-drill`** project (check the ref is
   `<NEWREF>`, **not** `cfvsvgbldnzkcjvbwnjp`) → Project Settings → General → **Delete project**.
   Stop the dev server. Re-link the CLI to the live project if you did step 4b
   (`supabase link --project-ref cfvsvgbldnzkcjvbwnjp` in the main checkout). Then §11.4.

### 11.4 Clean the Mac

```bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
dropdb --if-exists eldreve_drill
rm -rf ~/drill                                    # plaintext dump, tarball, extracted images
unset PGPASSWORD NEW
```

### 11.5 Expected vs. unexpected messages during a drill

| Message                                                                                   | Fine? | Meaning / action                                                                                                              |
| ----------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ERROR: role "anon" already exists` (Option A, roles line)                                | ✅    | Left over from the previous drill. Continue.                                                                                  |
| `NOTICE: extension "pgcrypto" already exists, skipping`                                   | ✅    | Idempotent pre-step.                                                                                                          |
| `pg_restore: warning: errors ignored on restore: N`                                       | ❌    | Should never appear — we pass `--exit-on-error`. If you dropped the flag, the restore is not trustworthy; redo with it.        |
| `ERROR: relation "auth.users" does not exist` (Option B)                                  | ❌    | `public` restored before `auth` data, or step 3 skipped. Recreate the project and follow the order.                            |
| `duplicate key value violates unique constraint "buckets_pkey"` (Option B step 3)         | ❌    | `supabase db push` was run on the scratch project first. Delete it and start again without pushing.                            |
| `duplicate key value violates unique constraint "schema_migrations_pkey"` / `"migrations_pkey"` | ❌ | Migration-table rows are in the archive — the dump lost its `--exclude-table-data` lines. Fix §8 and re-dump.                 |
| `permission denied for schema auth` / `must be owner of table users` (Option B)          | ❌    | You are restoring auth/storage **DDL** into Supabase (missing `--data-only`), or used `--disable-triggers`.                    |
| `pg_dump: aborting because of server version mismatch` / `pg_restore: error: unsupported version (1.16) in file header` | ❌ | Wrong client: export `PATH` to Homebrew's `postgresql@17/bin` first.                                                         |
| `age: error: no identity matched any of the recipients`                                   | ❌    | Wrong secret key for this file — check `age-keygen -y` against `AGE_RECIPIENT`; after a rotation, old files need the old key. |
| `schema "public" already exists`                                                          | ❌    | `restore.toc` still holds the `SCHEMA - public` line. Almost always the grep pattern: a TOC line ends with the **owner** (`26; 2615 2200 SCHEMA - public pg_database_owner`), so it must read `' SCHEMA - public '` with a trailing space — never `$`. Rebuild `restore.toc`, confirm `grep -c ' SCHEMA - public ' restore.toc` prints 0, re-run the `pg_restore … -L restore.toc …` line. |
| `function extensions.uuid_generate_v4() does not exist`                                    | ❌    | The extensions pre-step was skipped; run it and retry the restore into a fresh database.                                        |

---

## 12. Operations

### 12.1 When a failure arrives

You will see one or both of: a **healthchecks.io** e-mail "eldreve db-backup nightly is DOWN"
(sent to both partners; body shows the last ping time and, for `/fail`, the failing run's
manifest is absent), and a **GitHub** e-mail "Run failed: db-backup — main" (Charles only).
First three things to check, in order:

1. **GitHub UI → Actions → db-backup → the red run.** The step name tells you the layer:
   *Install* = apt/PGDG outage (re-run); *Dump* = Supabase (password, host, paused project,
   version); *Copy the product-images bucket* = Supabase S3 keys; *Get temporary AWS
   credentials* = OIDC trust (§4, T-06…T-09); *Upload* = bucket/policy (T-10). Match the last
   error line against §13.
2. **No run at all** (healthchecks says *late/down*, GitHub shows nothing since yesterday):
   Actions → left sidebar → is *db-backup* greyed out with "This scheduled workflow is
   disabled"? Public-repo 60-day inactivity rule — click **Enable workflow** (or
   `gh workflow enable db-backup.yml`) and run it by hand. Otherwise GitHub dropped the
   schedule: just run it by hand.
3. **Supabase dashboard**: is the project *paused* (Free plan, ~1 week of inactivity)? Click
   **Resume project** (<https://supabase.com/docs/guides/platform/free-project-pausing>; a paused
   Free project can be resumed for up to 1 year); the site itself would be down too, so this is
   the bigger fire.

Then `gh workflow run db-backup.yml --ref main && gh run watch`; healthchecks turns green on
the success ping.

### 12.2 Monthly checklist (15 min + the drill)

```text
 ☐ healthchecks.io: 28–31 green pings, no gaps                 (dashboard)
 ☐ AWS console → S3 → bucket: newest object is from last night; oldest ≈ 30 days
 ☐ AWS console → Billing → Bills: this month ≈ $0.02 (credits absorb it in year 1)
 ☐ GitHub → Actions → db-restore-test: last 4 Sunday runs green
 ☐ §11 drill done, evidence written into docs/features/db-backups.md
 ☐ every 3rd month: decrypt using the key copied OUT OF THE VAULT NOTE, not ~/.config/age
 ☐ `brew upgrade awscli age postgresql@17`; `aws --version`
```

### 12.3 When Supabase upgrades Postgres (major version)

Supabase announces majors in the dashboard (**Project Settings → Infrastructure**) and by e-mail.
The rule: dump client major ≥ server major; restore client major = target major. When the server
becomes 18:

- `db-backup.yml` and `db-restore-test.yml`: `postgresql-client-17` → `postgresql-client-18`,
  `/usr/lib/postgresql/17/bin` → `/18/bin`, service `image: postgres:17` → `postgres:18`;
- Mac: `brew install postgresql@18`, and change the `PATH` line in §11;
- archives written before the upgrade restore with the **17** client into a **17** server —
  keep `postgresql@17` installed until they have expired (37 days).
- Runner image: when GitHub deprecates `ubuntu-24.04` (announcements land as warnings in every
  run's log and at <https://github.com/actions/runner-images>), change both `runs-on` lines
  (§8, §10) to the next LTS and re-run by hand. The pin exists so this happens on purpose, not
  overnight.

Check the server any time: `psql "<conn>" -Atc "show server_version;"`.

### 12.4 Adding a second Storage bucket

Duplicate the "Copy the product-images bucket" step with the new bucket name and a second tar,
add one more `put-object` under `files/`, add `product_images_files`-style lines to the manifest.
No IAM change: the role already allows `files/*`.

### 12.5 Rotating secrets

| Secret                        | How                                                                                                                                                                                   | Then                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Database password             | If §7.4 is done: `alter role backup_reader password '<NEW>'` via `psql` — nothing else is affected. If CI still uses `postgres`: Supabase dashboard → Database → **Reset database password** ⚠️ also update `.env.local` (`SUPABASE_DB_PASSWORD`) and expect `supabase db push` to ask for it; Vercel is unaffected (it never held it). | `gh secret set BACKUP_PGPASSWORD`, run the workflow by hand.                                             |
| age key                       | `age-keygen -o ~/.config/age/eldreve-backup-2.txt`; vault note for the new file; `gh variable set AGE_RECIPIENT --body <NEW age1…>`.                                                     | ⚠️ Keep the **old** secret key in the vault for ≥ 37 days — objects written before the switch need it.  |
| Supabase S3 keys              | Storage → Settings → S3 Connection: create new, update both GitHub secrets, run by hand, then revoke the old key.                                                                     | —                                                                                                        |
| healthchecks URL              | Check → **Settings → Regenerate UUID**; `gh secret set HC_PING_URL`.                                                                                                                    | —                                                                                                        |
| AWS role                      | Nothing to rotate — OIDC tokens last one hour. Review the trust policy if the repo is renamed/transferred (§4.2).                                                                       | —                                                                                                        |

### 12.6 Money

**AWS console → Billing and Cost Management → Bills** once a month. Expected: S3 ≈ $0.02,
everything else $0.00. The `eldreve-backups-5usd` budget mails both partners if anything is
forecast to exceed $5 — that would mean a mistake (a runaway loop, a huge object), not this
workload. Credits: **Billing → Credits** shows the remaining sign-up credit and its expiry.

### 12.7 When to add Supabase Pro

At launch, as decided: Pro ($25/month) gives daily managed backups with 7-day retention and a
project that never pauses (<https://supabase.com/docs/guides/platform/backups>). The S3
pipeline stays as the independent, longer (37-day), encrypted copy that includes the Storage
files. Point-in-time recovery is an add-on (≈ $100/month per 7 days) — not before real order
volume justifies it.

### 12.8 Changing retention

Edit `Expiration.Days` in `lifecycle.json` (§3.3) and re-run `put-bucket-lifecycle-configuration`.
Retention is enforced by S3 within a day; nothing in the workflow changes. 90 days ≈ $0.06/month.

### 12.9 The day disaster strikes — honest numbers

- **RPO (how much you can lose): up to 24 hours** — everything written since 10:23 UTC of the
  last green night. Orders placed after that exist only in PayPal's ledger and Resend's sent
  mail; reconstruct them from there.
- **RTO (how long to be back): 1–3 hours** for the database + files with Option B of §11
  practised; plus DNS/Vercel env changes if the project ref changes.

```text
 1. STOP the bleeding      Supabase dashboard: is the live project gone/paused/corrupt?  Pause
                           merchant traffic if orders would be lost (owner decision).
 2. PICK the copy          Newest green night's STAMP from S3 (§11.1). Check its manifest counts.
 3. RESTORE                §11.3 into a NEW project (never on top of the damaged one).
 4. RE-POINT the app       Vercel → Project → Settings → Environment Variables: the three
                           Supabase values (URL, anon key, service-role key) → Redeploy.
                           Supabase Auth on the new project: Site URL https://eldreve.com,
                           redirect URLs, custom SMTP (RESEND_SMTP_PASSWORD), ⚠️ passkeys are
                           pinned to the old RP ID — customers re-register them.
                           Mac, main checkout: `supabase link --project-ref <NEWREF>` then
                           `supabase migration list` — 13 rows, Local = Remote (§11.3 step 4b);
                           only then is `supabase db push` safe again.
 5. RECONCILE              Orders after the RPO: PayPal → Activity → export; re-enter.
                           Ask each boss to re-enter their advisor API key in /admin — Vault
                           secrets are not restored (decision 19).
 6. WRITE IT UP            docs/features/db-backups.md + .ai/WORKLOG.md: what failed, when
                           noticed, RPO/RTO achieved, what to change.
```

> **Why (industry practice):** RPO and RTO are stated *before* the incident and tested by the
> drill, so nobody discovers the 24-hour gap while customers wait. If a 24 h RPO ever becomes
> unacceptable, the answer is PITR (§12.7) or a second daily run — not a longer night.

---

## 13. Troubleshooting

| #    | Symptom (as printed)                                                                                                     | Cause                                                                                                                                                          | Fix                                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01 | `could not connect to server: Network is unreachable` / `ENETUNREACH` / connection to `db.<ref>.supabase.co` hangs         | Direct host is IPv6-only; GitHub runners are IPv4-only (<https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP>) | Use the session pooler host (`BACKUP_PGHOST`), port 5432. No IPv4 add-on needed.                                                              |
| T-02 | `FATAL: Tenant or user not found`                                                                                        | Wrong pooler host (`aws-0` vs `aws-1`), username without the `.<ref>` suffix, role created seconds ago, or project paused                                       | Copy the host from Dashboard → Connect → Session pooler; user is `postgres.cfvsvgbldnzkcjvbwnjp`; wait a minute after creating a role; resume the project. |
| T-03 | `password authentication failed for user "postgres.cfvsvgbldnzkcjvbwnjp"`                                                | Wrong secret, or a password inside a URL with unencoded `@ : / # ? %`                                                                                          | `gh secret set BACKUP_PGPASSWORD` again; never build a URL — use `PG*` variables.                                                              |
| T-04 | `prepared statement "…" already exists` / `does not exist`                                                                | Port 6543 (transaction pooler) — no session pinning                                                                                                             | Port 5432.                                                                                                                                     |
| T-05 | `pg_dump: server version: 17.6; pg_dump version: 16.15` … `aborting because of server version mismatch`; or a suspiciously tiny archive | Client older than the server (the runner's default `pg_dump` is 16)                                                                                | Install `postgresql-client-17` and call `/usr/lib/postgresql/17/bin/pg_dump` by absolute path (already in §8). The two `grep -q` lines catch an empty dump. |
| T-06 | `Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity`                         | Trust policy `sub` mismatch: wrong-case owner/repo, run from a non-`main` branch, job has `environment:`, repo renamed/transferred (immutable `sub`), wrong account | `gh api repos/CharlesChi715/goldrose-storefront/actions/oidc/customization/sub`; compare with §4.3; dispatch from `main`; remove `environment:`. |
| T-07 | `No OpenIDConnect provider found in your account for https://token.actions.githubusercontent.com`                        | §4.1 not done, done in another account, or `AWS_ROLE_ARN` has the wrong account id                                                                             | `aws iam list-open-id-connect-providers`; fix the ARN variable.                                                                                |
| T-08 | `Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable` / `Credentials could not be loaded`                             | `permissions: id-token: write` missing, or static keys given together with `role-to-assume`                                                                    | Restore the `permissions:` block exactly as in §8.                                                                                            |
| T-09 | `Incorrect token audience` / `InvalidIdentityToken`                                                                        | Audience changed from `sts.amazonaws.com`, or a transient GitHub key-fetch blip                                                                                 | Remove any `audience:` input; re-run.                                                                                                          |
| T-10 | `An error occurred (AccessDenied) when calling the PutObject operation: … is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::…/other/key" because no identity-based policy allows …` | Key outside `db/*` or `files/*`, bucket-name typo in `S3_BUCKET`, or policy not attached | `aws iam get-role-policy --role-name eldreve-backup-writer --policy-name PutOnlyBackups`; fix the variable.                                     |
| T-11 | `AccessDenied` on `aws s3 ls` / `sync` / `HeadObject` **from CI**                                                         | Expected — the role is put-only                                                                                                                                 | Nothing; list and read from the Mac as `charles-admin`.                                                                                        |
| T-12 | `AccessControlListNotSupported`                                                                                            | An `--acl` flag was added; ACLs are disabled on the bucket                                                                                                     | Remove `--acl`.                                                                                                                                |
| T-13 | Mac: `ExpiredToken … The provided token has expired` right after `aws login`                                              | An old access key in `~/.aws/credentials` shadows the login session                                                                                            | `aws configure list` must show TYPE `login`; delete the stale key block.                                                                        |
| T-14 | Mac: Budgets page says "You need permissions"                                                                              | Root has not clicked **Activate IAM Access** (§2.3)                                                                                                            | Do §2.3 as root.                                                                                                                              |
| T-15 | Restore test: `pg_restore: error: could not execute query: ERROR: function … does not exist` / `schema "…" does not exist` inside `auth`/`storage` DDL | A platform object in those schemas now depends on something vanilla Postgres lacks (none did on 2026-09-05 — see §10) | Fallback: restore `public` only and drop its FKs to `auth.users` from the TOC: `pg_restore --list out/eldreve.dump \| grep -v -E ' SCHEMA - public \| COMMENT - SCHEMA public ' \| grep -v -E 'FK CONSTRAINT public [a-z_]+ [a-z_]+user_id_fkey ' > toc.txt` then `pg_restore -w -d restore_test --schema=public -L toc.txt --no-owner --no-privileges --exit-on-error out/eldreve.dump`; drop the `auth.users` assertion. |
| T-16 | `pg_restore: error: unsupported version (1.16) in file header`                                                            | `pg_restore` older than the `pg_dump` that wrote the file                                                                                                      | Use PG 17's `pg_restore` (Homebrew `postgresql@17`, PATH line in §11).                                                                        |
| T-17 | `ERROR: role "anon" does not exist` during a local restore                                                                 | RLS policies name Supabase roles                                                                                                                               | Create `anon`, `authenticated`, `service_role` first (§10/§11).                                                                                |
| T-18 | `age: error: no identity matched any of the recipients`                                                                    | Wrong secret key; or the file predates a key rotation                                                                                                          | `age-keygen -y <keyfile>` must equal the `AGE_RECIPIENT` that was current when the file was written; keep old keys ≥ 37 days.                 |
| T-19 | `::error::AGE_RECIPIENT variable missing or not an age1… key`                                                               | Variable unset or pasted with quotes/whitespace                                                                                                                | `gh variable set AGE_RECIPIENT --body "<age1…>"`.                                                                                             |
| T-20 | `aws s3 sync` from Supabase: `InvalidAccessKeyId` / `SignatureDoesNotMatch` / 403; or the S3 Connection section is absent in the dashboard | Regenerated keys, wrong endpoint URL, or the S3 protocol not available on this plan (no plan gate is documented — confirm in the dashboard) | Recreate keys, check `https://<ref>.storage.supabase.co/storage/v1/s3`. Fallback download: `supabase storage cp -r ss:///product-images ./files/product-images --experimental` after `supabase link --project-ref <ref>` with a `SUPABASE_ACCESS_TOKEN` secret (<https://supabase.com/docs/reference/cli/supabase-storage-cp>). |
| T-21 | Workflow silently stopped running; healthchecks says *down*, GitHub shows no runs                                          | Public-repo 60-day inactivity auto-disable, or GitHub dropped the scheduled run                                                                                | `gh workflow enable db-backup.yml`; `gh workflow run db-backup.yml --ref main`. This is exactly what the dead-man switch is for.               |
| T-22 | Run green but healthchecks *down*                                                                                          | `HC_PING_URL` wrong/regenerated, or the check's cron/timezone differs from the GitHub cron                                                                       | Check → Settings: `23 10 * * *`, UTC, grace 2 h; `gh secret set HC_PING_URL`.                                                                  |
| T-23 | `connection not available and request was dropped from queue after 10000ms` / `Max client connections reached`             | The project's pooler is saturated at that moment                                                                                                                | Re-run later; if recurring, move the cron a few minutes or reduce app connections.                                                              |
| T-24 | `IllegalLocationConstraintException` / `InvalidBucketName` at bucket creation                                             | Missing `LocationConstraint=us-west-2`, or an account-regional name not ending `-<12-digit-account>-us-west-2-an`                                             | Re-run the §3.1 command exactly.                                                                                                              |
| T-25 | Option B step 3: `insert or update on table "identities" violates foreign key constraint "identities_user_id_fkey"`        | `session_replication_role` is still `origin` — the Supabase pooler drops `PGOPTIONS`, so setting it that way does nothing and `--data-only` loads `auth.identities` before `auth.users` | Use the §11.3 step 3 form: `pg_restore … -f auth-storage-$STAMP.sql`, then `psql … -c "set session_replication_role = replica" -f auth-storage-$STAMP.sql`. `--single-transaction` already rolled the failed attempt back, so just re-run. |
| T-26 | Option B step 4: `permission denied to change default privileges` / `must be member of role "supabase_admin"`              | `--no-privileges` missing — pg_restore is replaying the archive's `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin` entries, which `postgres` may not execute | Add `--no-privileges` to the step-4 `pg_restore` line, then run the REVOKE block that follows it (that block, not the archive, is what restores 0001's hardening). |

Sources for the wording: AWS S3 403 troubleshooting
<https://docs.aws.amazon.com/AmazonS3/latest/userguide/troubleshoot-403-errors.html>; Supabase pooler
messages <https://github.com/orgs/supabase/discussions/30107>, <https://github.com/orgs/supabase/discussions/25904>;
`aws login` <https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html>;
`configure-aws-credentials` README.

---

## 14. Glossary

| Term                      | Meaning here                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RPO**                   | Recovery Point Objective — the most data you accept losing, measured in time. Ours: 24 h (nightly).                                                                |
| **RTO**                   | Recovery Time Objective — how long until the service is back. Ours: 1–3 h with a practised drill.                                                                   |
| **Logical backup**        | A dump of SQL definitions and rows (`pg_dump`). Portable across Postgres installs and versions; slower than physical for huge databases — irrelevant at 13 MB.      |
| **Physical backup**       | A copy of the database files/WAL (what Supabase Pro and PITR do). Fast, exact, tied to one server version and provider.                                              |
| **Custom format** (`-Fc`) | pg_dump's archive format: compressed, has a table of contents (`--list`), lets `pg_restore` choose schemas, tables, or data-only at restore time.                    |
| **Session pooler**        | Supabase's shared connection proxy on port 5432 that gives one client one dedicated server connection — needed by `pg_dump`. Reachable over IPv4.                   |
| **Transaction pooler**    | Same proxy on port 6543, sharing connections between statements. Breaks `pg_dump`.                                                                                  |
| **RLS / BYPASSRLS**       | Row Level Security filters rows per role; `BYPASSRLS` lets a role (like `postgres` or `backup_reader`) read everything, which a dump must.                           |
| **OIDC**                  | OpenID Connect — GitHub signs a short-lived token describing the running workflow; AWS trusts that signature and issues one-hour credentials. No stored keys.       |
| **`sub` claim**           | The token field naming repo + branch; the trust policy pins it to `…goldrose-storefront:ref:refs/heads/main`.                                                        |
| **IAM role / trust policy / permission policy** | Who may become this identity (trust) and what it may do (permission).                                                                             |
| **Least privilege**       | Give each identity only the actions it needs — here `s3:PutObject` on two prefixes.                                                                                |
| **SSE-S3**                | Server-side encryption with keys S3 manages. Protects disks, not against anyone with read access to the bucket — that is what `age` is for.                          |
| **Client-side encryption**| Encrypting before upload with a key the storage provider never sees (`age`).                                                                                       |
| **age / recipient / identity** | The tool; the `age1…` public key you encrypt *to*; the `AGE-SECRET-KEY-1…` you decrypt *with*.                                                                 |
| **Versioning**            | S3 keeps prior versions of an overwritten/deleted object until lifecycle removes them (7 days here).                                                                |
| **Lifecycle rule**        | S3's own scheduler for expiring objects — our 30-day retention.                                                                                                     |
| **Delete marker**         | What "expiring" a versioned object writes; the bytes become a noncurrent version and vanish `NoncurrentDays` later.                                                 |
| **Object Lock**           | Write-once storage; governance mode can be overridden by an admin, compliance mode cannot be undone by anyone. Deferred to launch.                                    |
| **Dead-man switch**       | A monitor that alerts when an expected heartbeat does **not** arrive (healthchecks.io).                                                                             |
| **Grace time**            | How late a ping may be before the alert; also the maximum `start`→`success` duration.                                                                               |
| **Cron**                  | `m h dom mon dow` schedule syntax; `23 10 * * *` = every day at 10:23.                                                                                             |
| **PGDG**                  | The PostgreSQL Global Development Group's apt repository — where the runner gets client 17.                                                                         |
| **Manifest**              | Our plain-text file of counts, sizes and the SHA-256 of each night's dump.                                                                                          |
| **Drill**                 | A rehearsed restore, done when nothing is wrong, so the real one is boring.                                                                                          |

---

## 15. Repo bookkeeping after it ships

One fact, one home (SUMMARY.md rule). Update, in this order:

1. **`docs/features/db-backups.md`** (the status database — CI runs `npm run features:check`):
   - front matter: `delivery: in-progress` + `priority: p0` while building; `uat` +
     `rollout: live` after the first green nightly run on `main`; `accepted` only after the §11
     drill, with `verification.human` filled (by / date / environment / evidence: the STAMP, the
     count lines, the run URL). Update `statusChangedAt` on each delivery transition.
   - "Still open — keeps this BACKLOG" paragraph → the scheduler is decided (Option A, this guide).
   - **Acceptance criteria**: tick the boxes as each becomes true; reword box 2 from "IAM user"
     to "OIDC role, `s3:PutObject` only on `db/*` and `files/*`".
   - **Plan** table: item 2 becomes "OIDC provider + role (no keys); connection as `PG*`
     variables, no `DATABASE_URL`"; add the Storage-bucket tar step and the weekly restore test;
     note the optional `backup_reader` role as cluster state if §7.4 was done.
   - `verification.automated`: the two workflow paths.
2. **`SUMMARY.md` → Release queue item 4**: once nightly + weekly are green and the drill is
   recorded, the "turn on database backups" clause is done — leave the link, drop the verb.
   Environment section: `aws` and `age` are now installed Mac CLIs.
3. **`README.md`** → "Tooling and connection checks": the sentence "no code, script or CI job
   reads it" about `SUPABASE_DB_PASSWORD` is no longer true — say that `.github/workflows/db-backup.yml`
   and `db-restore-test.yml` read a copy as the GitHub secret `BACKUP_PGPASSWORD` (or the
   `backup_reader` password after §7.4).
4. **`docs/guides/README.md`**: already lists this guide — no change.
5. **NOT `.env.example`**: `BACKUP_PGPASSWORD`, the Supabase S3 keys and `HC_PING_URL` are
   CI-only secrets; no app code reads them, so they do not belong in the app's variable list.
6. **`.ai/WORKLOG.md`**: one dated entry — what shipped, first green run URL, drill result.
