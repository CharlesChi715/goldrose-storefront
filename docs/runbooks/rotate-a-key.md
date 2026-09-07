# Rotate a key

Open this when a credential has leaked — pasted into a chat, committed, caught in
a screenshot, still held by someone who should not have it — or when you are
retiring one on purpose. [`.env.example`](../../.env.example) says **which
machine holds which credential and why** (five authenticated links, with a
diagram); this page is how you replace one.

⚠️ **The one action here that cannot be undone is not a key.** Do not change
Supabase's **Site URL** while tidying up: the passkey RP ID is pinned to
`eldreve.com`, so changing it kills every existing passkey and every admin must
enrol again at `/admin/settings/security`
([domain-and-email](../features/domain-and-email.md); the same warning sits on
`NEXT_PUBLIC_SITE_URL` in `.env.example`). No rotation needs it.

## Symptoms

- A value is readable outside the team: a screenshot, a Figma comment, a support
  ticket, a commit, a scanner's "exposed secret" mail; or someone with access
  left, or a machine holding `.env.local` was lost.
- `git log --all --oneline -- .env.local` prints anything. It should print
  nothing — `git check-ignore -v .env.local` names the rule that ignores it.
- Supabase logs show reads or writes no deploy of ours would make.
- Routine: design work has ended, so `FIGMA_TOKEN` goes (the SUMMARY.md release
  queue retires it alongside cancelling Shopify).
- **Not** a symptom: the anon key visible in browser JavaScript — that one is
  published on purpose, see its section.

## Do this first

Order matters: a leaked key is being used while you decide whether it leaked.

1. **Assume compromise.** If the value was visible outside the team, rotate now
   and investigate after. Waiting never improves the position.
2. **Find its section below** — who issues it, who holds it, what breaks.
3. **Rotate at the issuer** (Supabase, PayPal, Resend, Figma). The old value dies
   here, so any gap starts here.
4. **Update every holder.** Most are in Vercel; this lists names and environments
   and prints no values:
   ```bash
   vercel env ls
   ```
   Edit them in the dashboard, Settings → Environment Variables.
5. **Redeploy** — a saved variable changes nothing until a new build (README,
   "Deploy"): Deployments → newest Production → ⋯ → Redeploy. Use the dashboard;
   production goes through the GitHub integration, not a CLI deploy.
6. **Verify.** The shop answering is the only proof the new value works:
   ```bash
   curl -s https://eldreve.com/api/health
   ```
   Good: `{"status":"ok"}`. `degraded` or silence means the deploy cannot reach
   the database — [site-down.md](site-down.md).
7. **Update `.env.local` last**, so a typo on your Mac cannot be mistaken for a
   production failure.

## The credentials, one at a time

### `SUPABASE_SERVICE_ROLE_KEY` — a leak of this is a database breach

Issued in the Supabase dashboard for project `cfvsvgbldnzkcjvbwnjp`, Project
Settings → API Keys; held by Vercel (server-side only) and `.env.local`. It
**bypasses Row Level Security completely**, so RLS is only the wall that stands
if the *anon* key leaks, not this one
([07-who-can-see-what](../learning/07-who-can-see-what.md)). Trust that panel
over this page, because Supabase keeps moving it.

**There is no rotate button for this key any more.** Supabase froze rotation of
the legacy `anon` / `service_role` / JWT secrets — its own troubleshooting page
says "it is no longer possible to rotate the legacy anon, service and JWT
secrets" — and is retiring them by the end of 2026. This project holds legacy
keys, so a leak is repaired by **replacing** the key, not reissuing it:

1. Settings → API Keys → **Publishable and secret API keys** → create a secret
   key (`sb_secret_…`). Creating it changes nothing on its own; the legacy keys
   keep working.
2. Put it in Vercel as `SUPABASE_SERVICE_ROLE_KEY`, and create a publishable
   key (`sb_publishable_…`) for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the same
   sitting — step 4 kills both legacy keys together, so doing one without the
   other takes the shop down.
3. Redeploy and check the shop loads and `/api/health` is `ok`.
4. ⚠️ **Only then** disable the legacy keys in the **Legacy API keys** tab.
   That is the moment the leaked key dies. It is reversible — re-enable them if
   anything breaks.

⚠️ Between the legacy keys being disabled and a good deploy being live, the site
cannot read its database: pages fail, `/api/health` returns 503, the uptime
workflow goes red and mails the owner. Recoverable, but do steps 1 to 4 in one
sitting.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public by construction

Same panel, same holders, plus **every visitor's browser**: `NEXT_PUBLIC_*` is
compiled into the JavaScript bundle at build time. Seeing it in page source is
not an incident — it grants nothing alone, and RLS allows the anon role two reads
and no writes. Rotate it when the service-role rotation forced it, or in a
"rotate everything" response after a lost laptop. Nothing changes until a fresh
production build, since the value is baked in; then browsers still on the old
bundle send a dead key, and their sign-in and account pages fail until a hard
reload. Customer sign-in and admin passkey login both use it.

### `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` — sandbox and live are different apps

Issued in the PayPal Developer Dashboard, per app. **Sandbox and live are
separate apps with separate credentials**, so rotate inside the environment you
are in; only the owner may switch `PAYPAL_ENV` to live. The secret is held by
Vercel only; the client id is not a secret and also ships as
`NEXT_PUBLIC_PAYPAL_CLIENT_ID` for PayPal's browser SDK — checkout renders its
buttons only when both are set. If the dashboard offers a second secret on the
same app, add it, deploy, then delete the old: a rotation with no gap. Otherwise
pick a quiet hour, because while the secret is wrong every call fails
authentication, checkout stops taking money, and `paypal.create.failed` /
`paypal.capture.failed` alert mail arrives. A **new app** also means a new
`PAYPAL_WEBHOOK_ID`.

### `RESEND_API_KEY` and `RESEND_SMTP_PASSWORD` — two keys, two holders

Both are Resend sending keys, revocable separately, because Resend is reached
twice (links 4 and 5 in `.env.example`).

- `RESEND_API_KEY` — held by **Vercel, Production only**, read by
  [`lib/email.ts`](../../lib/email.ts) for order, shipping and alert mail;
  previews leave it unset so they never mail a real customer. ⚠️ Failure is
  **silent by design** — with a dead key, mail is logged to the console and
  checkout still succeeds, so verify in Resend's own Emails log.
- `RESEND_SMTP_PASSWORD` — held by **Supabase**, in its Auth SMTP settings
  (`smtp.resend.com` port 465, username the literal `resend`). ⚠️ Never add it to
  Vercel: our code is at neither end of that link. While it is wrong, sign-in
  codes never arrive and customers cannot sign in. Verify by asking for a code at
  `/account/signup` with your own address.

### `SUPABASE_DB_PASSWORD` — the operator credential

Reset in the Supabase dashboard under Database settings. Held **only** in
`.env.local` on your Mac, documented in README.md and absent from `.env.example`
because no code reads it; it authenticates as the `postgres` role — direct SQL
with RLS bypassed, so stronger than the service-role key.

⚠️ The reset is immediate, cannot be undone, and breaks every saved copy of the
connection string at once: your `psql` sessions, the password `supabase db push`
asks for, and the GitHub Actions secret `SUPABASE_DB_URL`, which carries this
password inside the URL — a stale one means the nightly backup fails and mails
you. Update it straight after (paste at the prompt, so it never enters shell
history; `gh auth login` first if `gh` is not authenticated):

```bash
gh secret set SUPABASE_DB_URL
gh workflow run db-backup.yml
```

Good: a green "Database backup" run ending with a table count near 21.

### `FIGMA_TOKEN` — revoke when the design work ends

Issued in Figma's account settings (scope `file_content:read`), held only in
`.env.local`, read only by `scripts/figma/lib.mjs`. Revoking breaks the
`npm run figma:*` commands and nothing customer-facing — scheduled cleanup, not
an emergency.

## If that did not fix it

- **Still degraded after the redeploy.** Check the build saw the new value: its
  log prints `[env] Hosted Supabase configuration is complete.` from
  `scripts/validate-env.mjs`. A partial set of Supabase variables is a hard build
  failure naming what is missing — good news, the old deploy keeps serving.
- **You think someone used the key.** Read the Supabase dashboard logs now, not
  tomorrow: the free plan keeps about a day. ⚠️ Do not delete rows to tidy up —
  orders are never hard-deleted, and evidence beats a tidy table.
- **Tell the bosses** in one short message: what was exposed, what was rotated
  and when, whether customer data was read, whether payments were affected — the
  fact and the timeline, not the variable names.
- **Do not** paste either value into chat, mail or a screenshot; rotate live
  PayPal credentials without the owner; or change the Supabase Site URL. If the
  shop is down too, work [site-down.md](site-down.md) first — a broken key and a
  broken deploy look identical from outside.

## Afterwards

- Record what changed in the feature record that owns it: Resend, SMTP, domain
  and passkey facts in [domain-and-email](../features/domain-and-email.md), the
  backup connection string in [db-backups](../features/db-backups.md); then a
  dated line in `.ai/WORKLOG.md`.
- If a variable was renamed or added, `npm run check:env` fails until
  `.env.example` matches the code; run it before committing.
- If a decision is left for the owner — whether customers must be told, whether a
  paid plan is now worth it — file it in `agent-delivery/INBOX.md` as an `AI-nnn`
  row; `npm run agent-inbox` shows what is waiting.
- Write the new value only into the holders named in its section, nowhere else.
