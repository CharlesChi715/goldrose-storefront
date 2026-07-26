# docs/features/

One file per feature: the **decision** (what we chose and why, with pros/cons)
and the **plan** (work items, status). The **Status tree below doubles as the
project roadmap** — every leaf carries its current status so agents can survey
everything without opening the files.

## Lifecycle

Every future thought moves one way through the docs — never lives in two places:

```
docs/ideas.md  →  docs/features/<name>.md  →  docs/project-state.md  →  .ai/WORKLOG.md
  (raw inbox,      (decision, plan, STATUS)       (release queue only)       (dated history)
```

- An idea graduates: add its feature file, delete its line from ideas.md.
- Spec [../admin-design.md](../admin-design.md) is updated only after shipping,
  and only if the product's promised behavior changed.
- Superseded docs move to [../archive/](../archive/).

## Status line

Line 1 of every feature file, bold, fixed vocabulary:

**BACKLOG → READY → IN PROGRESS → UAT → DONE** (+ **DROPPED**, exit from any state)

- BACKLOG — on the roadmap, approach not chosen yet (raw ideas stay in ideas.md; a feature file is born BACKLOG)
- READY — approach chosen (options + pros/cons recorded)
- IN PROGRESS — being built
- UAT (user acceptance testing) — live on production, **awaiting human verification** (a queue, not an activity — dormant/sandbox features sit here too; automated tests were already green to land)
- DONE — **works well on the live site, verified by a human** (owner/Charles clicked through it); nothing known to fix — only future improvements remain possible
- DROPPED — considered and rejected; keep the file, the "why not" is the value

Format — full pipeline with the **current stage bold**, then date + qualifier:

`Status: BACKLOG → **READY** → IN PROGRESS → UAT → DONE · 2026-07-24, not yet implemented`

(DROPPED replaces the whole pipeline: `Status: **DROPPED** · date, why`.)

RULE: whoever changes a feature's status updates BOTH the file's status line
and its leaf in the Status tree below, **in the same commit** — the two must
never disagree.

## File format

Status line → Context → Decision → Options considered (pros/cons table) →
Plan (work items) → Related links (learning/, TESTER-GUIDE, spec §).

## Status tree (= roadmap)

Two sections, Frontend and Backend. **Each feature is the root of its own
mini-tree; its functions are the children** (nest deeper when a function has
sub-functions). **The status meter is appended inline at the end of every
leaf line**; roots and branch nodes carry no meter — at most a shared caveat
after an em-dash. Kept narrow so lines never wrap in terminals or app views.
A node named `*.md` is a tracked record in this folder (its inline status
synced with the file's status line); everything else predates this system and
is maintained directly here until a new decision earns it a file.

Meter = milestones completed after planning. BACKLOG is the empty meter — on 
the roadmap, nothing started; a filled dot always means a real step happened:

`○○○○ BACKLOG · ●○○○ READY · ●●○○ IN PROGRESS · ●●●○ UAT · ●●●● DONE · ✕ DROPPED`

Text after the status ONLY when the bare status would mislead (e.g. deployed
but dormant/sandbox) or to name the blocker to the next stage — never to
restate the status.



### Frontend (storefront)

```text
Figma pixel-exact pages
├── / (home) ●●●● DONE
├── /shop ●●●● DONE
├── /products/[slug] ●●●● DONE
└── wishlist button ●●●○ UAT

Native checkout (PayPal Orders v2)
├── cart ●●●○ UAT
├── discount codes ●●●○ UAT
├── shipping rates ●●●○ UAT — RoW $19.95 placeholder (OQ-2)
├── PayPal create/capture ●●●○ UAT — sandbox until launch
└── PayPal webhooks ●●●○ UAT

Guest order lookup
└── /orders ●●●○ UAT

Customer accounts /account — dormant: owner config pending
├── email one-time code ●●○○ IN PROGRESS — needs Supabase OTP template + SMTP
├── Google OAuth ✕ DROPPED — absent from the 07-25 design (lib kept)
├── Apple OAuth ✕ DROPPED — absent from the 07-25 design (lib kept)
├── passkeys ✕ DROPPED — owner 07-25 "no passkey" (storefront only; admin keeps them)
├── order matching (verified email) ●●●○ UAT
├── nav tab "Login" ⇄ "Me" ●●●○ UAT
├── login screen 74:53 ●●●○ UAT — imported pixel-exact 07-25
└── login screen 74:55 (B2B) ●●●○ UAT — imported 07-25; enquiries email the
    owner, nothing persisted; needs RESEND_API_KEY + a store contact email

Concierge chat (mascot + bar overlay)
├── feedback panel → admin Ideas ●●●○ UAT
└── real chat widget ○○○○ BACKLOG

SEO/GEO baseline
├── sitemap ●●●○ UAT
├── robots + AI-crawler toggle ●●●○ UAT
├── /llms.txt ●●●○ UAT
├── JSON-LD ●●●○ UAT
└── product feeds ○○○○ BACKLOG — search-discovery-implementation.md
```

### Backend (admin + data)

```text
Admin suite (EN/中文) — §14.3 owner walkthrough pending
├── Home ●●●○ UAT
├── Orders lifecycle ●●●○ UAT
├── Products + inventory ●●●○ UAT
├── Customers ●●●○ UAT
├── Content (slots/files/Ideas) ●●●○ UAT
├── Discounts ●●●○ UAT
├── Settings + Team ●●●○ UAT
├── Forum (unread badges) ●●●○ UAT
├── ⌘K search ●●●○ UAT
└── Analytics
    ├── first-party beacon ●●●○ UAT
    ├── channel/UTM/country reports ●●●○ UAT
    └── posting-account-attribution.md ●●●○ UAT — utm_acc tag

Product content — 120 SKUs (OQ-3)
└── product-content-pipeline.md ○○○○ BACKLOG — live-wire pages + CSV/image import

Admin auth
├── login + access approvals ●●●○ UAT
├── password reset ●●●○ UAT
└── passkeys ●●●○ UAT — dormant

Order emails (Resend) — console fallback until RESEND_API_KEY set
├── order confirmation ●●●○ UAT
├── shipping confirmation ●●●○ UAT
└── owner new-order alert ●●●○ UAT

Shipping & tracking
└── order-tracking.md ●●●○ UAT — owner must verify a real carrier link

Marketing
└── promotion-emails.md ○○○○ BACKLOG — consent + unsubscribe first

Supabase hosted DB
├── migrations (0001–0003) ●●●● DONE — 0003 verified hosted 2026-07-25
├── seed (--reset / --demo) ●●●● DONE — owner's --demo run pending
└── db-backups.md ○○○○ BACKLOG — nightly pg_dump→S3; scheduler sign-off
```

Refs (links can't render inside the code blocks, so shorthands above resolve
here):

- **§14.3** → [admin-design.md · 14.3 Final acceptance](../admin-design.md#143-final-acceptance)
- **owner config pending / dormant** → [BUILD-REPORT §5 activation checklist](../archive/BUILD-REPORT.md)
- **OQ-2 / OQ-3** → [project-state.md · Open product decisions](../project-state.md#open-product-decisions)
- **db-backups.md** → [backend/db-backups.md](backend/db-backups.md)
- **search-discovery-implementation.md** → [seo-geo/search-discovery-implementation.md](../seo-geo/search-discovery-implementation.md)
- **order-tracking.md** → [backend/order-tracking.md](backend/order-tracking.md)
- **promotion-emails.md** → [backend/promotion-emails.md](backend/promotion-emails.md)
