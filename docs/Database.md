For agents: keep this file concise. 

1. Current Supabase. based on postgreSQL which is free and open source.
    Free tier ($0/month) covers your current scale comfortably — 500 MB of database is literally years of orders for a gift store. The next tier is ~US$25/month, and you'd only need it once traffic is real. Compare that to the Shopify subscription you're replacing (Advanced runs ~US$399/month): even the paid tier is a rounding error.

2. Rent a small server (~US$5–10/month) and install Postgres yourself

---

**DECISION (owner, 2026-07-22): Option 1 — Supabase.** No self-hosted
Postgres. The code already targets it (hosted Supabase backend + local file
fallback); what remains is the activation checklist in
[archive/BUILD-REPORT.md](archive/BUILD-REPORT.md) §5 step 1 (create the Supabase project and
set the env vars).

## Backup plan (2026-07-22): Supabase Free + DIY backups on AWS

Supabase's built-in daily backups are Pro-only ($25/mo). Instead, during the
testing/startup phase:

- **Supabase Free** for the database ($0).
- **Nightly `pg_dump` → AWS S3** (scheduled job + lifecycle rule deleting
  dumps >30 days). Cost at our scale: **cents/month** — S3 storage is tiny,
  the scheduler fits free tiers.
- Restores are on us: test a restore periodically — an untested backup
  doesn't count.
- Side benefit: real AWS practice for Charles (S3, IAM least-privilege,
  scheduling) — useful résumé/interview material.
- **At launch:** upgrade to Pro anyway (never-pauses + managed one-click
  restores + support) and keep the S3 pipeline as the independent second
  copy.
- **After S3 pipeline mature** Cancel Supabase Pro to save money. (S3 pipeline is way more cheaper)

Also considered and rejected: raw AWS RDS / Azure Postgres (no free tier,
loses Supabase Auth/API — weeks of rebuild), self-hosting the Supabase stack
(we become the ops team). Supabase hosted runs on AWS anyway and is standard
Postgres underneath — data migrates out cleanly if ever needed.