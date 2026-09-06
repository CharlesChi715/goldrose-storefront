# Runbook: the shop is down

Open this when the shop will not load, when the **Uptime** workflow in GitHub
Actions has gone red, or when `/api/health` answers `degraded`. A
`[ELDREVE alert] paypal.*` email is a different problem — the shop is up and one
payment failed — and does not belong here.

## Symptoms

- GitHub emailed you that the scheduled **Uptime** workflow failed. Its last log
  line names the layer that went, and they mean different things:
  `/api/health could not be reached at all.` (nothing answered);
  `/api/health answered HTTP 503 (expected 200).` or
  `/api/health is reachable but reports degraded.` (our code ran and said no);
  `/shop answered HTTP 500 (expected 200).` (database fine, a page is not).
- <https://eldreve.com> shows an error page, a certificate warning, or nothing.
- Vercel runtime logs contain lines with `"event":"health.database.failed"` —
  logged and deliberately **not** emailed, so it only shows up if you go and
  look. The probe going red is what is meant to reach you.

## Do this first

**1. Ask the health endpoint yourself, on the real domain.**

```bash
curl -sS -i --max-time 20 https://eldreve.com/api/health
```

Good answer: `HTTP/2 200` and
`{"status":"ok","backend":"supabase","checks":{"database":"ok"},"ms":...}`. If
`backend` says `local`, the Supabase variables are missing in Vercel and the
shop is serving seed data — health claims "ok" while the shop is wrong.

**2. Ask the same endpoint on the vercel.app domain**, which skips our custom
domain and its DNS entirely.

```bash
curl -sS -i --max-time 20 https://goldrose-storefront.vercel.app/api/health
```

**3. Read the two answers together.** They tell apart three failures the probe
cannot, because from outside all three look identical:

| eldreve.com     | vercel.app     | What is actually broken         |
| --------------- | -------------- | ------------------------------- |
| no connection   | no connection  | Vercel is not serving — step 5  |
| 503 `degraded`  | 503 `degraded` | The database — step 4           |
| fails/TLS error | 200 `ok`       | DNS or the certificate — step 7 |

**4. Database failing? Check first whether Supabase paused the project** — the
likeliest cause and free to fix: on the Free plan Supabase pauses a project
after about a week of low activity, and a paused project looks exactly like a
database outage.

Open <https://supabase.com/dashboard/project/cfvsvgbldnzkcjvbwnjp>. If it is
paused, click **Resume project** and confirm, wait a few minutes, then repeat
step 1. Good answer: `"status":"ok"` and the shop loading.

**5. Supabase awake and still failing? Check it is not them.** During an
incident on <https://status.supabase.com> you wait; there is nothing to fix on
our side. To prove it is the database and not our code:

```bash
psql "postgresql://postgres.cfvsvgbldnzkcjvbwnjp@aws-1-us-west-2.pooler.supabase.com:5432/postgres" -c 'select 1'
```

It prompts for a password: `SUPABASE_DB_PASSWORD` in `.env.local`, which you
never paste anywhere. Good answer: a table with a single `1`.

**6. Vercel not serving? Look at the last deployment before anything else.**
Open <https://vercel.com/dashboard>, pick the `goldrose-storefront` project, and
check <https://www.vercel-status.com> too — their incident means you wait. A
newest deployment marked **Error** means the build failed and the previous one
is still live, so the outage is elsewhere. **Ready** and recent makes it the
prime suspect: read its **Logs** tab, or run this from the main checkout, since
the CLI needs `.vercel/` and that does not exist inside a worktree:

```bash
cd /Users/charles/Developer/goldrose-storefront && vercel logs --environment production --level error --since 1h
```

Our own failures are one JSON line each, so `--level error` and a grep for
`"event":` finds them without reading everything. Add `--follow` to watch live.

⚠️ **Instant Rollback puts an older build in front of customers and switches off
automatic deploys** — pushes to `main` stop going live until you undo it.
Nothing is deleted and it is reversible.

On the project overview page, on the Production Deployment tile, click **Instant
Rollback**, choose the last known-good deployment, **Continue**, then **Confirm
Rollback** (it is also on the **Deployments** list, ⋮ on a row). Environment
variables are not rolled back, only the build. When the real fix is merged,
click **Undo Rollback** on that tile and pick the new deployment, or `main`
stays disconnected from production.

**7. Only eldreve.com failing? It is the domain layer.**

```bash
dig +short eldreve.com
```

Good answer: at least one IP address. Nothing at all means DNS, which lives in
**Cloudflare on the bosses' account** — that is where it gets fixed. A
certificate complaint from `curl` instead points at the Vercel project's
**Settings → Domains**.

**8. Re-run the probe by hand rather than waiting fifteen minutes.**

```bash
gh workflow run uptime.yml && gh run list --workflow=uptime.yml --limit 3
```

Run `gh auth login` first if it says you are not authenticated. The workflow
lives only on `main`; GitHub runs scheduled workflows from the default branch.

## If that did not fix it

- Tell the bosses early, in one message: **the shop is not taking orders, this
  is what is broken, this is what I am doing, I will update you in 30 minutes.**
  DNS, Cloudflare and the Supabase plan sit on their accounts, so name the login
  you need.
- Rolling back (step 6) buys time: a rolled-back shop that works beats a current
  shop that does not.
- **Do not redeploy repeatedly hoping it clears.** Each build takes minutes and
  changes nothing about the cause; the same commit failing twice is the commit.
- **Do not change environment variables while diagnosing.** They only take
  effect on a new build (`NEXT_PUBLIC_*` values are baked in at build time), so
  an edit is a second change on top of the first and you stop knowing which one
  you are looking at.
- **Do not run migrations or `supabase db push` during an outage.**
- ⚠️ **Never change the Supabase Site URL or the passkey RP ID to "try
  something".** Every existing admin passkey stops working, permanently —
  [domain-and-email](../features/domain-and-email.md).

## Afterwards

- Record what broke and what fixed it in the feature record that owns it:
  [domain-and-email](../features/domain-and-email.md) for domain, DNS, TLS or
  mail, [database-migrations](../features/database-migrations.md) for the hosted
  database. Those records hold the state; this file is only the procedure. Fix
  any step here that was wrong or missing while you still remember it.
- A question only the bosses can answer (a plan upgrade, a Cloudflare change)
  goes through `npm run agent-inbox` into
  [`agent-delivery/INBOX.md`](../../agent-delivery/INBOX.md).
- **Once, when things are calm: add a second monitor.** GitHub disables
  scheduled workflows in a repository with no activity for 60 days, and a probe
  that has quietly stopped looks exactly like a healthy shop — so ours is not a
  dead man's switch. Create one free monitor at UptimeRobot or Better Stack:
  type **HTTP(S)**, URL `https://eldreve.com/api/health`, interval 5 minutes,
  email alerts to the same address as `ALERT_EMAIL`. Two independent things must
  then fail before an outage goes unnoticed.
