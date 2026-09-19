# infra/aws

The AWS settings behind the database backups, as files. They live in the repo so
every device has the same copy. How and why: [`docs/guides/aws-backup.md`](../../docs/guides/aws-backup.md).

| File                 | What it sets                                         | Applied with                                 |
| -------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `lifecycle.json`     | delete backups after 30 days, old versions 7 later   | `aws s3api put-bucket-lifecycle-configuration` |
| `bucket-policy.json` | refuse any request that is not HTTPS                 | `aws s3api put-bucket-policy`                |
| `trust-policy.json`  | who may become the backup role: this repo, `main` only | `aws iam create-role`                      |
| `permission-policy.json` | what the role may do: `s3:PutObject` on `db/` and `files/` | `aws iam put-role-policy`          |

Run the commands from this folder, signed in with `aws login` as `charles-admin`.

## Rules

- A file here is a copy of intent. AWS holds what is actually applied; after
  editing a file, re-run its command, or the two disagree.
- **No secrets, ever.** Names and account numbers only. Passwords, passkeys and
  the `age` private key live in the password manager.
- Per device, not in the repo: `aws login`, and the password manager.
