# docs/features/

One file per feature: the **decision** (what we chose and why, with pros/cons)
and the **plan** (work items, status). The **Status tree below doubles as the
project roadmap** — every leaf carries its current status so agents can survey
everything without opening the files.

## Lifecycle

Every future thought moves one way through the docs — never lives in two places:

```
docs/ideas.md  →  docs/features/<name>.md  →  SUMMARY.md "Next steps"  →  .ai/WORKLOG.md
  (raw inbox,      (options, pros/cons,         (only while queued          (dated entry
   verbatim)        decision, plan, STATUS)      or in flight)               when done)
```

- An idea graduates: add its feature file, delete its line from ideas.md.
- Spec [../admin-design.md](../admin-design.md) is updated only after shipping,
  and only if the product's promised behavior changed.
- Superseded docs move to [../archive/](../archive/).

## Status line

Line 1 of every feature file, bold, fixed vocabulary:

**PLANNED → DECIDED → IN PROGRESS → TESTING → STABLE** (+ **DROPPED**, exit from any state)

- PLANNED — on the roadmap, approach not chosen yet (raw ideas stay in ideas.md; a feature file is born PLANNED)
- DECIDED — approach chosen (options + pros/cons recorded)
- IN PROGRESS — being built
- TESTING — live on production, **awaiting human verification** (a queue, not an activity — dormant/sandbox features sit here too; automated tests were already green to land)
- STABLE — **works well on the live site, verified by a human** (owner/Charles clicked through it); nothing known to fix — only future improvements remain possible
- DROPPED — considered and rejected; keep the file, the "why not" is the value

Format — full pipeline with the **current stage bold**, then date + qualifier:

`Status: PLANNED → **DECIDED** → IN PROGRESS → TESTING → STABLE · 2026-07-24, not yet implemented`

(DROPPED replaces the whole pipeline: `Status: **DROPPED** · date, why`.)

RULE: whoever changes a feature's status updates BOTH the file's status line
and its leaf in the Status tree below, **in the same commit** — the two must
never disagree.

## File format

Status line → Context → Decision → Options considered (pros/cons table) →
Plan (work items) → Related links (learning/, USER-GUIDE, spec §).

## Status tree (= roadmap)

Two sections, Frontend and Backend. **Each feature is the root of its own
mini-tree; its functions are the children** (nest deeper when a function has
sub-functions). **The status meter is appended inline at the end of every
leaf line**; roots and branch nodes carry no meter — at most a shared caveat
after an em-dash. Kept narrow so lines never wrap in terminals or app views.
A node named `*.md` is a tracked record in this folder (its inline status
synced with the file's status line); everything else predates this system and
is maintained directly here until a new decision earns it a file.

Meter = milestones completed after planning. PLANNED is the empty meter — on 
the roadmap, nothing started; a filled dot always means a real step happened:

`○○○○ PLANNED · ●○○○ DECIDED · ●●○○ IN PROGRESS · ●●●○ TESTING · ●●●● STABLE · ✕ DROPPED`

Text after the status ONLY when the bare status would mislead (e.g. deployed
but dormant/sandbox) or to name the blocker to the next stage — never to
restate the status.

### Frontend (storefront)

```text
Figma pixel-exact pages
├── / (home) ●●●● STABLE
├── /shop ●●●● STABLE
├── /products/[slug] ●●●● STABLE
└── wishlist button ●●●○ TESTING

Native checkout (PayPal Orders v2)
├── cart ●●●○ TESTING
├── discount codes ●●●○ TESTING
├── shipping rates ●●●○ TESTING — RoW $19.95 placeholder (OQ-2)
├── PayPal create/capture ●●●○ TESTING — sandbox until launch
└── PayPal webhooks ●●●○ TESTING

Guest order lookup
└── /orders ●●●○ TESTING

Customer accounts /account — dormant: owner config pending
├── Google OAuth ●●●○ TESTING
├── Apple OAuth ●●●○ TESTING
├── passkeys ●●●○ TESTING
└── order matching (verified email) ●●●○ TESTING

Concierge chat (mascot + bar overlay)
├── feedback panel → admin Ideas ●●●○ TESTING
└── real chat widget ○○○○ PLANNED

SEO/GEO baseline
├── sitemap ●●●○ TESTING
├── robots + AI-crawler toggle ●●●○ TESTING
├── /llms.txt ●●●○ TESTING
├── JSON-LD ●●●○ TESTING
└── product feeds ○○○○ PLANNED — search-discovery-implementation.md
```

### Backend (admin + data)

```text
Admin suite (EN/中文) — §14.3 owner walkthrough pending
├── Home ●●●○ TESTING
├── Orders lifecycle ●●●○ TESTING
├── Products + inventory ●●●○ TESTING
├── Customers ●●●○ TESTING
├── Content (slots/files/Ideas) ●●●○ TESTING
├── Discounts ●●●○ TESTING
├── Settings + Team ●●●○ TESTING
├── Forum (unread badges) ●●●○ TESTING
├── ⌘K search ●●●○ TESTING
└── Analytics
    ├── first-party beacon ●●●○ TESTING
    ├── channel/UTM/country reports ●●●○ TESTING
    └── posting-account-attribution.md ●○○○ DECIDED — acct= tag

Admin auth
├── login + access approvals ●●●○ TESTING
├── password reset ●●●○ TESTING
└── passkeys ●●●○ TESTING — dormant

Order emails (Resend) — console fallback until RESEND_API_KEY set
├── order confirmation ●●●○ TESTING
├── shipping confirmation ●●●○ TESTING
└── owner new-order alert ●●●○ TESTING

Supabase hosted DB
├── migrations (0001, 0002) ●●●● STABLE
├── seed (--reset / --demo) ●●●● STABLE — owner's --demo run pending
└── nightly pg_dump→S3 backup ○○○○ PLANNED — Database.md
```

Refs (links can't render inside the code blocks, so shorthands above resolve
here):

- **§14.3** → [admin-design.md · 14.3 Final acceptance](../admin-design.md#143-final-acceptance)
- **owner config pending / dormant** → [BUILD-REPORT §5 activation checklist](../archive/BUILD-REPORT.md)
- **OQ-2** → [SUMMARY.md · Open questions](../../SUMMARY.md)
- **Database.md** → [Database.md backup plan](../Database.md)
- **search-discovery-implementation.md** → [search-discovery-implementation.md](../search-discovery-implementation.md)
