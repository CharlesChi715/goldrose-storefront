# Operator guides

Step-by-step, copy-pasteable instructions for setting up a vendor or running a
drill. A guide is a **procedure**; it is not where status lives (that is the
feature record's front matter) and not where a mechanism is specified (that is
`docs/admin-design.md`). Each guide names the record that owns its status.

| Guide                                | Owning record                                     | Outcome                                                                      |
| ------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| [aws-backup.md](aws-backup.md)       | [db-backups](../features/db-backups.md)           | Nightly encrypted database + uploads copy in a private S3 bucket, with alerts |
| [paypal-wiring.md](paypal-wiring.md) | [card-payments](../features/card-payments.md) · [paypal-wallet](../features/paypal-wallet.md) | Sandbox → webhooks → on-page card fields → owner-only live cutover           |

## Writing rule

- Every command states the machine it runs on (Mac terminal, AWS console,
  PayPal dashboard, GitHub UI, CI runner, Vercel dashboard).
- Secrets are placeholders in `<ANGLE_BRACKETS>`; a real value never lands in a
  guide.
- ⚠️ marks every step that costs money, is irreversible, or touches live
  customers, followed by the rollback.
- A vendor claim carries the official doc URL beside it and the guide's
  "Last verified" date at the top, so a stale step can be re-checked rather
  than trusted.
