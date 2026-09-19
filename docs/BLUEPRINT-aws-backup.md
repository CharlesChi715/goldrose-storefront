# BLUEPRINT — AWS backup

## 1. Design

- Demand: recover any missing database data from a backup. AWS only stores the backup files (S3) and locks who may touch them (IAM); the database stays in Supabase.

## 2. ASCII chart

```text
every night, on GitHub's temporary computer

pg_dump ──connects──▶ SUPABASE (pooler, port 5432)
   │
   │  1. freezes one moment in time   (the shop keeps running normally)
   │  2. reads the table definitions  (orders, customers, products, logins …)
   │  3. reads every row of every table, as of that frozen moment (This way is invented by Postgres team and aligned by Supabase. )
   │  4. packs and compresses it all
   ▼
eldreve.dump        one file, a few MB
   │
   ▼
next steps of the job:  check the file ─▶ encrypt ─▶ upload to AWS S3
```

## 3. Parked

