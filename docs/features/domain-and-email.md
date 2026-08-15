---
delivery: uat
rollout: live
statusChangedAt: 2026-08-15
priority: p1
---

# domain-and-email

## Context

The production domain **eldreve.com** and everything wired to it: TLS, the auth
provider's redirect URLs, passkey identity, inbound mail routing and outbound
sending. Live since 2026-08-03 and verified end to end by a real sign-in; the
remaining item is billing.

## Decision

`eldreve.com` is registered at Cloudflare Registrar on the **boss-owned**
account and serves from Vercel; `goldrose.co` is superseded. Inbound mail is a
Cloudflare Email Routing catch-all into the company Gmail, and everything
outbound — transactional and Supabase's own auth mail — goes through **Resend**
on `send.eldreve.com`.

## Tech details

- **Vercel:** apex + `www`, certificate issued.
  `NEXT_PUBLIC_SITE_URL=https://eldreve.com` is live, and canonical, `og:image`
  and the sitemap were each verified against it.
- ⚠️ **Passkey RP ID is `eldreve.com`.** A passkey is bound to the domain that
  created it, so the vercel.app passkeys are dead by design — re-enrol on the
  new domain, and **do not change the RP ID again** without accepting that
  every existing passkey stops working. (Passkeys are the *admin* sign-in;
  customers use email codes — [customer-accounts](customer-accounts.md).)
- **Supabase:** Site URL and redirect allow-list moved to the new domain.
- **Auth mail runs on custom SMTP** (`smtp.resend.com:465`, sender
  `noreply@eldreve.com` / "ELDREVE"), templates applied from
  [`scripts/apply-auth-email-templates.mjs`](../../scripts/apply-auth-email-templates.mjs),
  `mailer_otp_length` 6, send cap 30/hour.
- **Two Resend keys, both live** (documented in `.env.example`):
  `RESEND_API_KEY` for our own code and `RESEND_SMTP_PASSWORD` for Supabase's
  SMTP. `RESEND_API_KEY` / `RESEND_FROM` are set on Vercel **Production only**,
  so preview deployments take `lib/email.ts`'s console-log fallback **on
  purpose** — a preview must never mail a real customer.
- ⚠️ **Resend's free tier is ~3k mails/month.** Every sign-in code counts
  against it; a bounced code is a shopper who cannot sign in. Watch it against
  real volume.

## Blockers and dependencies

- **Billing still points at the wrong place** — move it to hua's PayPal.
- The brand-name rule that came with the domain (what was renamed, and the
  `goldrose` strings that are identifiers) is
  [`docs/ixd/naming/brand-name.md`](../ixd/naming/brand-name.md).

## Related links

- Off-repo records (owner's machine):
  `~/Documents/Work/gold_rose/{eldreve-domain-registration,domain-setup}.md`
- Mail sending in code: [`lib/email.ts`](../../lib/email.ts)
- Consent and marketing mail, which is a different question:
  [promotion-emails](promotion-emails.md)
