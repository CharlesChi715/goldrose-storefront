---
delivery: in-progress
rollout: live
statusChangedAt: 2026-08-06
priority: p1
---

# customer-accounts

## Context

A shopper signs in with an emailed code and gets an account area: dashboard,
orders, returns, reminders, personal info, privacy. Sign-in is live end to end
on eldreve.com (2026-08-03, verified by a real send); the account screens
themselves are a mix of live and design-only, listed under Plan.

## Decision

**Email OTP, no password.** `/account/signup` validates the address, calls
`signInWithOtp`, takes a 6-digit code behind a consent-gated CONTINUE, calls
`verifyOtp` and lands on `/account`; the same email also carries a one-tap
link, so a shopper on the device that received it never types the code.

**`/account/signup` is the ONLY login page** (AI-020, owner 2026-08-04). The
second login screen (`ShoppingLogin`, frame `74:53`) is deleted; `/account` is
signed-in only and redirects there otherwise.

**The auth user is the source of truth for identity.** Name, email and language
are saved through [`lib/account/profile.ts`](../../lib/account/profile.ts) to
the auth user's `user_metadata` and *mirrored* onto the linked `customers` row
— linked by id, **never by email**, because an email is a value a person can
change and a join key must not be.

## Plan

1. [x] OTP sign-in, custom SMTP, templates carrying both link and code.
2. [x] `/account/personal-info` — name, email, language (2026-08-06). Email
       changes go through `updateUser({ email })`; the project has secure email
       change on, so **both** addresses confirm.
3. [x] `orders.auth_user_id` (`0006`) so a signed-in customer sees their own
       orders on `/account`.
4. [ ] Apply the email-change mail template —
       `node scripts/apply-auth-email-templates.mjs`. The repo carries it; the
       hosted project does not have it yet, so a confirmation link returns to
       the homepage instead of the page the change was started from.
5. [ ] Give `/account/addresses` a backend (AI-039): the screen is the Figma
       frame's own, and the schema holds a single `default_address` rather than
       a collection, so nothing it shows or saves persists.
6. [ ] Guest order lookup — guests have only `/orders/track`
       ([order-tracking](order-tracking.md)).

## Tech details

- **The code arrives by email, so this feature is only as reliable as the mail
  setup** — SMTP, templates, sender and the monthly send allowance all live in
  [domain-and-email](domain-and-email.md). A bounced code is a shopper who
  cannot sign in.
- **Customer sign-in is unavailable in local mode** (blank Supabase variables),
  by design: there is no local auth server to hand out a code.

## Blockers and dependencies

- ⚠️ **`/account/business` has no signed-out entry.** The deleted second login
  screen carried the Gift Shopping ⇄ Business tabs, and the 2026-08-04 MENU
  dropped its FOR BUSINESS row, so the route works only if typed. Needs a
  design ruling (AI-020 follow-on).

## Related links

- [`lib/account/profile.ts`](../../lib/account/profile.ts) ·
  [`lib/account/profile-fields.ts`](../../lib/account/profile-fields.ts) ·
  [`lib/account/data.ts`](../../lib/account/data.ts)
- Migration [`0002_customer_auth.sql`](../../supabase/migrations/0002_customer_auth.sql)
  · [`0006_orders_auth_user_id.sql`](../../supabase/migrations/0006_orders_auth_user_id.sql)
  — ⚠️ `orders.auth_user_id` is load-bearing; do not drop it.
- Tests: [`tests/unit/profile-fields.test.ts`](../../tests/unit/profile-fields.test.ts),
  [`tests/unit/order-auth-link.test.ts`](../../tests/unit/order-auth-link.test.ts),
  [`tests/e2e/account.spec.ts`](../../tests/e2e/account.spec.ts),
  [`tests/e2e/account-screens.spec.ts`](../../tests/e2e/account-screens.spec.ts)
- Who may see what, end to end:
  [`docs/learning/07-who-can-see-what.md`](../learning/07-who-can-see-what.md)
