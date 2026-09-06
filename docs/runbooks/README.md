# Runbooks — what to do when something is wrong

A runbook is the page you open when the shop is misbehaving and you do not
have the patience to work it out from first principles. Each one starts with
the symptoms, so the right page is findable from what you can see rather than
from what you have already diagnosed.

**Start here:**

| What you are seeing                                                        | Open                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------- |
| The site is down, slow, or the Uptime workflow went red                     | [site-down.md](site-down.md)                             |
| An alert about a payment, or a customer says they paid and got nothing      | [payment-failing.md](payment-failing.md)                 |
| Email is not arriving, sign-in codes fail, or the database refuses to answer | [quota-or-limit-hit.md](quota-or-limit-hit.md)           |
| A password or key leaked, or one is due for rotation                        | [rotate-a-key.md](rotate-a-key.md)                       |
| The database must be restored — or the restore drill is due                 | [restore-from-backup.md](restore-from-backup.md)         |

## How you find out at all

Nothing here helps if nobody knows. Three things watch the shop, and they are
independent on purpose, because each has a way of failing quietly:

- **`alert()` in the code** ([`lib/observe.ts`](../../lib/observe.ts)) emails
  the owner when something on the money path fails, throttled to one message
  per kind per fifteen minutes. It reaches `ALERT_EMAIL`, falling back to the
  owner contact address in settings. **Set `ALERT_EMAIL` in Vercel** — the
  fallback lives in the database, and the failure most worth an email is the
  database being unreachable.
- **The Uptime workflow**
  ([`.github/workflows/uptime.yml`](../../.github/workflows/uptime.yml)) asks
  `/api/health` every fifteen minutes whether the shop can reach its database,
  which is the outage a "homepage returns 200" check misses. It shouts by
  going red, and GitHub emails the repository owner.
- **The nightly backup**
  ([`.github/workflows/db-backup.yml`](../../.github/workflows/db-backup.yml))
  going red means yesterday has no copy.

⚠️ **None of these is a dead man's switch.** GitHub disables scheduled
workflows in a repository with no activity for 60 days, and a probe that has
silently stopped looks exactly like a shop that is fine. One free external
monitor pointed at `/api/health` fixes that, and is the single highest-value
fifteen minutes of setup available here. See
[site-down.md](site-down.md).

## Writing a new one

Keep the shape: **Symptoms → Do this first → If that did not fix it →
Afterwards.** Order the steps by cheapest-and-most-likely first, give literal
commands rather than descriptions of commands, and put a line starting `⚠️`
immediately before anything destructive saying what it destroys and whether it
can be undone.

The reader is one stressed person at 3 a.m., possibly on a phone, who is a
capable programmer but not an operations specialist. Density beats
completeness: a page nobody can read in that state is not a runbook.

Facts that go stale — which migration is applied, what is deployed, what is
still mocked — belong in a feature record under
[`docs/features/`](../features/), never here. A runbook says what to *do*.
