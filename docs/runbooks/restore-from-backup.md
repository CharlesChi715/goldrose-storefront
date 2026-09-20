# Restore the database from a backup

Open this page for the monthly **drill** — restore last night's dump into a
throwaway database and prove it is real — or for a **real restore** when the live
database is damaged. An untested backup is not a backup, it is a folder of files
nobody has ever opened, so the drill is the deliverable and most of this page is
about it.

## Symptoms

- **Drill due:** a month since the last dated entry in
  [`db-backups.md`](../features/db-backups.md), or backups were just turned on
  and no restore has ever been rehearsed.
- The **Database backup** workflow is red with
  `::error::The nightly database backup FAILED.`
- It is red with `::error::Database backup cannot run. Missing: …`: a GitHub
  secret or variable was removed, so no backup was made that night.
- **Uptime** is red with `The last successful database backup is over 25 hours
  old`: the nightly run failed or GitHub never started it.
- **Real restore:** the admin shows missing or plainly wrong data, or
  `health.database.failed` keeps appearing and Supabase reports the project
  broken rather than merely paused.

## Do this first — the drill (about 30 minutes)

Nothing here touches live data. Run it in daylight, not during an outage.

0. **Install the AWS command line and name the bucket.** It is the tool that
   reads the bucket and this Mac does not have it — nothing below works without
   it, and the failure looks like a bad bucket name rather than a missing
   program. The bucket is the Actions variable `S3_BUCKET` (Settings →
   Secrets and variables → Actions).

   ```bash
   brew install awscli
   aws login              # browser sign-in as charles-admin; no access keys exist
   aws configure set region us-west-2
   aws sts get-caller-identity
   export BACKUP_S3_BUCKET="$(gh variable get S3_BUCKET)"
   ```

   Good answer: `get-caller-identity` ends in `user/charles-admin`.
   ⚠️ Only a human login can do this. The backup job's role is write-only by
   design and cannot list or download.

1. **Fetch last night's folder and read the dump before restoring it** — that
   last check needs no database and catches a bad download in five seconds.
   Good answer: three files, `public.dump` tens of KB rather than zero, and a
   count near 21 — the number of tables the shop has, and the same check
   `scripts/backup-db.sh` makes.

   ```bash
   aws s3 ls "s3://$BACKUP_S3_BUCKET/db/$(date -u +%Y/%m)/" --recursive | tail -6
   mkdir -p "$HOME/eldreve-drill"
   aws s3 cp "s3://$BACKUP_S3_BUCKET/db/<folder from the listing>/" "$HOME/eldreve-drill" --recursive
   pg_restore --list "$HOME/eldreve-drill/public.dump" | grep -c 'TABLE DATA'
   ```

2. **Make a scratch target — a throwaway free Supabase project.** It is the only
   target that can take `platform.dump`, since only Supabase creates the `auth`
   and `storage` tables, and the only one the admin can read, because the app
   talks to Supabase's API rather than to Postgres directly
   (`lib/supabase/env.ts`). Local Postgres 17 in Docker (`docker run --rm -d -e
   POSTGRES_PASSWORD=drill -p 55432:5432 postgres:17`) is quicker but loads
   `public.dump` only — use it when you just want to prove the file opens.
   Create the project in the dashboard (`eldreve-restore-drill`, US West like
   live). The Free plan allows **two free projects in total across every
   organisation you own**, so a new organisation does not buy a third: if it
   refuses, pause or delete a free project you no longer need, or restore
   `public.dump` only into the local Docker Postgres above and skip the admin
   check for this drill. The CLI makes one too: `supabase projects create
   eldreve-restore-drill --org-id <org> --region us-west-2 --db-password <pw>`.
   Copy its **Session pooler** host from Connect: the direct host is IPv6-only
   and the transaction pooler on 6543 cannot serve `pg_restore`. ⚠️ The host is
   per project — on 2026-09-19 the scratch project sat on `aws-0-…` while live
   sits on `aws-1-…`, and the wrong one answers "Tenant or user not found". Keep
   the password out of the URL so it needs no percent-encoding, and prove the
   target is empty and is not live before writing to it — both lines must print 0:

   ```bash
   read -rs PGPASSWORD && export PGPASSWORD      # paste the scratch password; nothing is shown
   export DRILL_URL='postgresql://postgres.<scratch-ref>@<pooler-host>:5432/postgres?sslmode=require'
   echo "$DRILL_URL" | grep -c cfvsvgbldnzkcjvbwnjp
   psql "$DRILL_URL" -w -Atc "select count(*) from auth.users"
   ```

3. **Restore the platform rows, then our tables — in that order.**
   `platform.dump` is data only, the rows of `auth.users` and `storage.objects`
   with none of their table definitions, because Supabase provisions those
   tables itself on every project and a dump carrying its own copies collides
   and dies half-done. It goes **first** because `public.dump` ends by
   re-creating foreign keys, and several of ours point at `auth.users`: with the
   users already there all 15 keys come back (drill, 2026-09-19); restored the
   other way round, those keys are validated against an empty table and are
   silently left out. `public.dump` carries schema and data together, so it
   rebuilds the shop with no migrations run.

   ⚠️ **Do not judge this by the exit code.** Good answer: it ends with
   `warning: errors ignored on restore: N` and **exits 1**. That is normal
   here, not a failure — `pg_restore` without `--exit-on-error` continues past
   errors and then exits 1 if it ignored any. The 2026-09-19 drill saw exactly
   five, all Supabase's own bookkeeping: `permission denied for table` on
   `schema_migrations`, `migrations`, `vector_indexes` and `buckets_vectors`,
   and `schema "public" already exists`. Anything naming one of **our** tables
   is a real failure. Judge the restore by the row counts in step 4. Send the
   output to a file: a failed row prints its contents, which are customer data.

   ```bash
   pg_restore -w --no-owner --no-privileges --dbname "$DRILL_URL" "$HOME/eldreve-drill/platform.dump" > "$HOME/eldreve-drill/platform.log" 2>&1
   pg_restore -w --no-owner --no-privileges --dbname "$DRILL_URL" "$HOME/eldreve-drill/public.dump" > "$HOME/eldreve-drill/public.log" 2>&1
   grep -h 'ERROR:' "$HOME"/eldreve-drill/*.log | sort | uniq -c
   ```

4. **Count what landed, and compare with live.** The live password is
   `SUPABASE_DB_PASSWORD` in `.env.local` ([`README.md`](../../README.md)); this
   query only reads. Good answer: products, customers, users and foreign keys
   match, orders match or are a few fewer, because the shop kept trading after
   the dump. The first drill matched on every count.

   ```bash
   Q="select
     (select count(*) from public.orders) as orders,
     (select count(*) from public.products) as products,
     (select count(*) from public.customers) as customers,
     (select count(*) from auth.users) as users,
     (select count(*) from storage.objects) as image_rows,
     (select count(*) from pg_constraint where contype = 'f'
        and connamespace = 'public'::regnamespace) as foreign_keys;"
   psql "$DRILL_URL" -w -c "$Q"
   PGPASSWORD="$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-)" psql -w \
     'postgresql://postgres.cfvsvgbldnzkcjvbwnjp@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require' -c "$Q"
   ```

5. **Read the copy the way the app does.** The admin reads through Supabase's
   web API, so ask the copy and live the same question and compare; this needs
   no sign-in. The scratch service key: `supabase projects api-keys --project-ref
   <scratch-ref>`. Good answer: the two replies are identical (they were, byte
   for byte, on 2026-09-19).

   ```bash
   curl -sS "https://<scratch-ref>.supabase.co/rest/v1/orders?select=name,total_cents,financial_status&order=number.desc&limit=5" \
     -H "apikey: $SCRATCH_KEY" -H "Authorization: Bearer $SCRATCH_KEY"
   ```

   Opening the admin itself is a bonus, and may not be possible: a scratch
   project cannot send the sign-in mail, and passkeys are pinned to the real
   domain. If you try it, shell values beat `.env.local`,
   so this edits no file; run it from the main repo checkout, not a worktree.
   Open `http://localhost:3000/admin/orders`, open one order, and check the
   customer, line items and total against that same order in the live admin. That
   comparison, not a green command, is what proves the backup is real; if it
   looks exactly like live the shell values did not take effect, so stop and check
   before believing anything.

   ```bash
   NEXT_PUBLIC_SUPABASE_URL='https://<scratch-ref>.supabase.co' \
   NEXT_PUBLIC_SUPABASE_ANON_KEY='<scratch anon key>' \
   SUPABASE_SERVICE_ROLE_KEY='<scratch service key>' npm run dev
   ```

⚠️ The scratch project now holds **real customer names, emails and addresses**.
Treat it as production, share nothing from it, and delete it once the drill is
recorded — that deletion is permanent, which is the point.

## The images are not in the dump

`storage.objects` holds one row per product image; the image **files** live in
Supabase's own S3 and no `pg_dump` reaches them, so a restored shop has broken
photos. Until a mirroring job exists, copy them by hand — the bucket is public
(`0001_init.sql`), so no key is needed to read it. Put them back by dragging the
folder into Storage → `product-images` on the target project, and **keep the
filenames identical**: `product_images.path` stores the object key and nothing
rewrites it, so a renamed file is a broken image forever.

```bash
psql "$LIVE_URL" -At -c "select name from storage.objects where bucket_id='product-images'" \
| while read -r key; do
    curl -fsS --create-dirs -o "$HOME/eldreve-images/$key" \
      "https://cfvsvgbldnzkcjvbwnjp.supabase.co/storage/v1/object/public/product-images/$key"
  done
aws s3 sync "$HOME/eldreve-images" "s3://$BACKUP_S3_BUCKET/storage/"
```

## The real restore

Same commands, different stakes; the order of the first two steps is what
protects you.

**Set these first, in the shell you are about to work in.** This section is the
one people jump straight to, so it cannot rely on variables the drill above
exported. The live password is `SUPABASE_DB_PASSWORD` in `.env.local`; the
bucket is the Actions variable `S3_BUCKET`. Percent-encode any
`@ : / #` in the password, and never paste these lines into a commit or a chat.

```bash
cd /Users/charles/Developer/goldrose-storefront
export LIVE_URL='postgresql://postgres.cfvsvgbldnzkcjvbwnjp:<password>@aws-1-us-west-2.pooler.supabase.com:5432/postgres'
export BACKUP_S3_BUCKET='<bucket name>'
```

1. ⚠️ **Do not drop, reset or delete the damaged project.** It is evidence, it
   probably still holds rows the backup does not, and deleting it cannot be
   undone. Dump it before touching anything else. If the script stops with
   `refusing to call that a backup`, that refusal is the finding — the database
   really is empty or truncated — so dump it anyway with `pg_dump "$LIVE_URL"
   --no-owner --no-privileges --format=custom --file "$HOME/evidence.dump"`.

   ```bash
   DATABASE_URL="$LIVE_URL" scripts/backup-db.sh "$HOME/eldreve-evidence-$(date -u +%Y%m%dT%H%MZ)"
   ```

2. **Restore into a NEW project**, exactly as in the drill, rather than over the
   damaged one, then repoint Vercel: Settings → Environment Variables →
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` → **redeploy**, because `NEXT_PUBLIC_*` is baked
   into the build and a dashboard edit alone changes nothing.
   ⚠️ Restoring over the live project instead means `pg_restore --clean
   --if-exists`, which DROPS each table with every row now in it before writing,
   and there is no undo. Consider it only with the evidence dump in hand.

3. **Finish the new project's setup** or the shop half-works: Auth → Site URL
   stays `https://eldreve.com` (the passkey RP ID is pinned to the domain),
   re-enter the Resend SMTP settings (`RESEND_SMTP_PASSWORD` lives in Supabase,
   not Vercel — see `.env.example`), and do **not** run `supabase db push` yet,
   because the CLI's migration history is not in the dump and it would replay
   everything ([database-migrations](../features/database-migrations.md)).

4. **Recover the orders the dump missed.** Stripe holds the money, so payments
   taken after the dump are unrecorded rather than lost: reconcile the Stripe
   payments after the dump's timestamp, plus any `stripe.return.orphaned`
   alert emails, and re-enter those orders by hand.

**How long:** a project provisions in minutes, this restore runs in under a
minute, the redeploy takes a couple more; budget an hour, and never rush the
evidence dump to save five of them. **Tell the bosses**, in one message and plain
words: what broke, that the shop is not taking orders while it is repaired, that
the last saved copy is from *(the time, in Sydney)*, that any payment taken after
that is safe with Stripe and will be re-entered by hand, and when you will update
them next. Do **not** promise full recovery before the counts match, do not
refund anything, and do not take orders by message as a workaround — an order
outside the system is an order nobody ships.

## If that did not fix it

- `unrecognized data block type` or `input file appears to be truncated`: the
  download is bad. Fetch it again; if the S3 copy is bad too, use the previous
  night's folder — each night is independent, so that costs a day, not the shop.
- A version complaint from `pg_dump`/`pg_restore`: your client is older than the
  server's Postgres 17, so `brew install postgresql@17` and run
  `/opt/homebrew/opt/postgresql@17/bin/pg_restore`.
- The connection hangs or is refused: you are on the direct (IPv6-only) host or
  the transaction pooler on 6543. Use the session pooler on 5432.
- Nothing in S3 at all: backups were never configured, so nothing can be
  restored. Say that plainly and go to [db-backups](../features/db-backups.md).
- Still stuck after an hour, alone, at 3 a.m.: **stop**, leave the damaged
  project untouched, and write down where you got to. A half-restored database is
  worse than a broken one, because it looks like it works.

## Afterwards

- Record the drill in [`db-backups.md`](../features/db-backups.md): tick the
  restore-drill criterion and fill `verification.human` with `by`, `date`,
  `environment` and `evidence` — the counts you compared and the order you
  opened. That evidence is the ACCEPTED gate, and a tick with nothing behind it
  is what this page exists to prevent. Keep `npm run features:check` green.
- Delete the scratch Supabase project (see the warning above).
- Anything unanswered, or a decision the owner must make, goes to
  [`agent-delivery/INBOX.md`](../../agent-delivery/INBOX.md) as an `AI-nnn` row
  (`npm run agent-inbox`).
- Add a dated line to `.ai/WORKLOG.md` and put the next drill in your calendar a
  month out. Nothing in the pipeline will remind you.
