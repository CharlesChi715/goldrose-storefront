# Runbook: a quota or service limit was hit

Open this when email has stopped going out, when a customer says their sign-in
code never arrived, or when something is refused a database connection. Three
faults that are usually one: a free-tier allowance we have spent. We have done
it once already — on **2026-08-07 a single full e2e run exhausted Resend's DAILY
quota**, which would have blocked real customers' sign-in codes. That is why
`playwright.config.ts` blanks `RESEND_API_KEY`, `RESEND_FROM` and the Supabase
variables for the test server. Do not remove those lines.

## Symptoms

- In the production logs, from `lib/email.ts`: `[email] Resend 429:` followed by
  `daily_quota_exceeded`, `monthly_quota_exceeded` or `rate_limit_exceeded`.
- A customer on `/account/signup` sees **"We couldn't email that address. Check
  it, or try again in a minute."** `components/screens/SignupScreen.tsx` shows
  that one sentence for every send failure, on purpose, so it equally means
  "Supabase's mail was refused" — it is not evidence the address is wrong.
- No mail and no `[email]` line, only `[email:console-mode]`. Not a quota:
  `RESEND_API_KEY` is unset there, which is deliberate on previews so a preview
  can never mail a real customer.
- `psql`, `supabase db push` or the nightly backup is refused with
  `too many connections` or `remaining connection slots are reserved`.
- Pages load but nothing saves — an order will not record, the admin will not
  save a setting. That is the Supabase project in **read-only mode**, because
  the database passed 500 MB.
- **Uptime** is red and `/api/health` answers 503 `degraded`, with
  `health.database.failed` logged. Work [site-down](site-down.md) first, and
  come back here if it points at a limit.

⚠️ **Nothing emails you about an email quota, by design.** `deliver()` swallows
the 429 so a mail problem can never fail an order, and `sendOwnerAlert()` counts
a message sent once it is _addressed_ — so the alerter is silenced by the very
quota it would report, `alert.email.failed` does **not** fire, and the log line
above is your only evidence.

## Do this first

**1. Read the last few hours of production logs** — one command says which of
the three it is. Run it from the main checkout, since the CLI needs `.vercel/`
and that does not exist inside a worktree:

```bash
cd /Users/charles/Developer/goldrose-storefront && vercel logs --environment production --since 3h --level error | grep -i 'resend\|health.database.failed'
```

Good answer: no output. `[email] Resend 429` means mail; only
`health.database.failed` means the database.

**2. Open Resend's send log:** <https://resend.com/emails>. Good answer: today's
messages all say **Delivered** and the count is well under 100. The free plan is
**100 emails a day and 3,000 a month**; the daily counter rolls over once a day
on Resend's clock, so read the count there rather than guessing the hour.

**3. Remember Resend is spent by TWO separate things.** This is what turns "order
mail is late" into "customers cannot sign in", and it is the diagram at the top
of `.env.example`:

| Who calls Resend    | How           | Key                    | Sends                          |
| ------------------- | ------------- | ---------------------- | ------------------------------ |
| Our code, on Vercel | HTTPS REST    | `RESEND_API_KEY`       | order, shipping and owner mail |
| Supabase, on itself | SMTP port 465 | `RESEND_SMTP_PASSWORD` | **customer sign-in codes**     |

One account, one allowance, two consumers — so a day of test mail from our code
stops real shoppers signing in. The SMTP key is held by Supabase and must never
be added to Vercel; our code is at neither end of that link. Check that side at
<https://supabase.com/dashboard/project/cfvsvgbldnzkcjvbwnjp> → **Logs** →
**Auth** (good answer: no SMTP errors in the last hour). Supabase's auth mail is
separately capped at 30/hour — [domain-and-email](../features/domain-and-email.md).

**4. Ration what is left rather than waiting for the reset.** Open
`/admin/settings` → **Notifications** and switch off the **new-order alert**
first: it goes to the owner, and every one it sends is a sign-in code a shopper
cannot get. Leave order confirmation on — a buyer who has paid must get their
receipt. Good answer: sign-in codes arrive again within a minute.

**5. Supabase — read the usage before assuming.** Same dashboard → **Reports**,
plus the organisation's **Usage** page. Free gives 500 MB database, 5 GB egress
(plus 5 GB cached), 50,000 monthly active users, 1 GB file storage, 2 active
projects, and pauses a project after about a week idle. Only one stops the shop
outright: **over 500 MB the database goes read-only** and refuses every write,
returning to normal by itself once usage is under 95%. Egress and active-user
overruns earn a warning email and an upgrade request, not a cut-off.

**6. "Too many connections"? Find who is holding them.**

```bash
psql "postgresql://postgres.cfvsvgbldnzkcjvbwnjp@aws-1-us-west-2.pooler.supabase.com:5432/postgres" -c "select count(*), usename, application_name from pg_stat_activity group by 2, 3 order by 1 desc;"
```

It prompts for a password: `SUPABASE_DB_PASSWORD` in `.env.local`, which you
never paste anywhere. Good answer: a handful of rows, none an abandoned session
of your own.

It is almost never the app. The classic serverless failure is one connection per
running instance — a spike opens sixty and the sixty-first is refused, since free
(Nano) compute allows roughly 60 direct connections and about 200 pooler clients.
**Our runtime opens no Postgres connections at all:** `lib/supabase/remote.ts`
uses `@supabase/supabase-js`, which is HTTPS to PostgREST. So the culprit is a
direct-connection client — your `psql`, `supabase db push`, or the nightly
`pg_dump`. Poolers exist for this:

- **Session pooler, port 5432** (`aws-1-us-west-2.pooler.supabase.com`) —
  `psql`, migrations, `pg_dump`. It keeps prepared statements, which `pg_dump`
  needs; `scripts/backup-db.sh` refuses to run without it.
- **Transaction pooler, port 6543** — many short-lived connections, no prepared
  statements, so `pg_dump` cannot use it.
- **Direct connection** — IPv6 only, unreachable from GitHub Actions runners,
  which is why the backup workflow goes through the session pooler.

**7. Close a session you have identified as stuck and yours.**

⚠️ Destroys that session and rolls back whatever it was doing mid-transaction.
It cannot be undone. Never run it on a PID you cannot account for.

```sql
select pg_terminate_backend(<pid>);
```

## If that did not fix it

The real fix is money and it is the bosses' call, because they hold the billing.
**Resend Pro is $20/month** for 50,000 emails a month with no daily cap.
**Supabase Pro is from $25/month**: 8 GB database, 250 GB egress, 100,000
monthly active users, daily backups kept seven days, no pausing — already the
launch plan in [db-backups](../features/db-backups.md).

Tell the bosses in words they can act on: _"The shop's free email allowance is
used up. Until it resets, no customer can receive a sign-in code, so nobody new
can sign in. $20 a month removes the daily limit."_ Same for Supabase, plus the
fact that a read-only database means **no orders are being recorded**. Billing
still points at the wrong account
([domain-and-email](../features/domain-and-email.md)), so that is fixed first.

Do not:

- **Rotate `RESEND_API_KEY` hoping for a fresh allowance.** The quota belongs to
  the account, not the key, and a rotation you forget to copy into Vercel
  Production turns a quota problem into a total mail outage.
- **Open a second free Supabase project for another 500 MB.** Orders, customers
  and auth users would live in two databases and the backup dumps only one.
- **Raise `max_connections`.** On free compute the RAM is the real limit, so
  more connections means the database falls over instead of refusing politely.
- ⚠️ **Delete rows to get back under 500 MB.** Orders are never hard-deleted
  (`SUMMARY.md`) and, until the backup secrets are set, nothing can undo it.
  Dump first: `DATABASE_URL='<session pooler URL>' scripts/backup-db.sh ./backup`.

## Afterwards

- **The state lives in the feature record, not here.** A Resend change (plan,
  keys, caps) goes in [domain-and-email](../features/domain-and-email.md); a
  Supabase plan change in [db-backups](../features/db-backups.md). This file is
  only the procedure — fix any step that was wrong while you remember it.
- **Paying for anything is an owner decision.** File it with `npm run
agent-inbox` so it reaches
  [`agent-delivery/INBOX.md`](../../agent-delivery/INBOX.md) as an
  `OWNER-DECISION` row instead of being lost in chat, then add a dated entry to
  `.ai/WORKLOG.md`.
- **The rule that prevents a repeat: never point the test suite at production
  credentials.** `npm run test:e2e` blanks the Resend, Supabase, PayPal and
  `CHECKOUT_SKIP_PAYMENT` variables in `playwright.config.ts` precisely so a full
  run cannot spend a real allowance. To test mail for real, send one message by
  hand and count it against the day's 100.
