---
schemaVersion: 1
id: promotion-emails
kind: feature
parent: marketing
area: backend
order: 10

delivery: backlog
rollout: not-deployed
statusChangedAt: 2026-07-25

dependsOn: []
blockedBy: []

verification:
  automated: []
  human: null
---

# Promotion emails — consent, list, campaigns

## Context

- Boss (ideas.md 2026-07-25, verbatim): "user register must need email" — and
  Charles asked how we could send registered users promotion emails.
- What exists today:
  - **Transactional email only** (`lib/email.ts` via Resend REST: order
    confirmation, shipping confirmation, owner alert). No promo emails, no
    email list, no consent capture, no unsubscribe machinery.
  - Every `/account` customer **already has an email**: sign-in is
    Google/Apple OAuth first, passkeys are added from inside a signed-in
    account (`app/account/page.tsx`); customers rows are email-keyed
    (`0002_customer_auth.sql`). So the boss's "register must need email" is
    already structurally true — worth pinning with a test, not building.
  - Guest checkout captures an email per order — but **that is not marketing
    consent**.
- Industry reality (why consent comes first): transactional emails need no
  permission, but promotional email legally requires **opt-in consent and a
  working unsubscribe link** — CAN-SPAM (US) and GDPR/ePrivacy (EU; we sell
  internationally). The pre-checked box is illegal under GDPR: the checkbox
  must default to unchecked. Sending promo to non-consented buyers also burns
  the domain's sending reputation, which then hurts the *order* emails.

## Decision

Proposed, awaiting Charles/owner sign-off (stays BACKLOG until then):
**Option A — capture consent ourselves (checkout checkbox + account toggle,
stored in our DB as source of truth), sync consented contacts to a Resend
Audience, owner sends campaigns with Resend Broadcasts.** Resend is already
our email provider; Broadcasts gives hosted unsubscribe handling for free.

## Options considered

| Option                                                | Pros                                                                                                                                                                    | Cons                                                                                                                               | Verdict                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A. Resend Audiences + Broadcasts                      | Provider already integrated (one API key, one dashboard); managed unsubscribe link + suppression; free tier fits our volume; consent stays in our DB (provider-neutral) | Basic segmentation only; no e-commerce automations (abandoned cart, win-back)                                                      | ✅ **proposed** for V1                                                          |
| B. Klaviyo (or Mailchimp)                             | E-commerce standard: segments, flows, revenue attribution                                                                                                               | Second vendor + cost; catalog/order sync work; overkill before real volume                                                         | ❌ now — the consent data we store works there too, so switching later is cheap |
| C. Hand-rolled: loop `deliver()` over customer emails | Full control, no new vendor                                                                                                                                             | We'd own unsubscribe, suppression, bounces, throttling, deliverability — a solved problem rebuilt, with legal risk when it's buggy | ❌                                                                              |

## Acceptance criteria

- [ ] Checkout shows an **unchecked** "Email me news and offers" checkbox;
      ticking it stores consent (+ timestamp) on the customer.
- [ ] `/account` has a marketing-emails toggle; both directions work.
- [ ] Consented addresses appear in the Resend Audience; unsubscribing via
      the email link flips our DB flag too (no re-adding on next sync).
- [ ] Promo sends can only ever target consented contacts; order/shipping
      emails are untouched by any of this.
- [ ] Test pins that every customer row has an email (the boss's
      "register must need email" rule).
- [ ] Human acceptance: owner sends a test Broadcast to himself from the
      Resend dashboard and unsubscribes from it (UAT → VERIFIED).

## Plan

| #   | Work item                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Migration `0003`/`0004`: `marketing_consent` boolean + `marketing_consent_at` on `customers` (+ file-adapter default)                                                                     |
| 2   | Checkout: consent checkbox (unchecked default), EN copy; writes through order → customer upsert                                                                                           |
| 3   | `/account`: consent toggle backed by a server action                                                                                                                                      |
| 4   | `lib/marketing/resend-audience.ts`: server-side sync of consented contacts to a Resend Audience (JSDoc'd); Resend webhook or periodic sync-back for unsubscribes                          |
| 5   | Admin: show consented-contact count (Settings or Customers header); campaigns themselves stay in the Resend dashboard for V1 — no in-admin campaign builder                               |
| 6   | Deliverability prerequisite: verified sending domain (SPF/DKIM DNS records) so mail comes from `@goldrose` not `onboarding@resend.dev` — owner DNS task, goes on the activation checklist |
| 7   | Unit + e2e: consent capture, toggle, "customers always have email" pin                                                                                                                    |

## Blockers and dependencies

No feature-id dependencies. Practically gated by the owner's Resend
activation (`RESEND_API_KEY` + domain verification — owner activation
env-var tasks). Campaign *content* (what to send, cadence) is the owner's call and
out of scope here.

## Verification evidence

None yet — BACKLOG.

## Related links

- Existing email module: `lib/email.ts` (§10.3 notifications)
- Activation: owner items in
  [SUMMARY.md · Release queue](../../../SUMMARY.md#release-queue)
- Sibling ask, same boss note: [order-tracking.md](order-tracking.md)
- Post-ship marketing context: influencer campaign idea in
  [ideas.md](../../ideas.md)
