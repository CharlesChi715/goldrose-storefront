# docs/features/

One file per feature: the **decision** (what we chose and why, with pros/cons)
and the **plan** (work items, status). The **Roadmap below is a status tree**
— every leaf carries its current status so agents can survey everything
without opening the files.

## Lifecycle

Every future thought moves one way through the docs — never lives in two places:

```
docs/ideas.md  →  docs/features/<name>.md   →  SUMMARY.md            →  .ai/WORKLOG.md
(raw inbox,       (decision, plan, STATUS)     (release queue only)     (dated history)
```

- An idea graduates: add its feature file, delete its line from ideas.md.
- Spec [../admin-design.md](../admin-design.md) is updated only after shipping,
  and only if the product's promised behavior changed.
- Superseded docs are deleted; their history stays in git.

## Status model (front matter)

Status lives ONLY in machine-readable front matter — never as prose in a
body. Three kinds of node feed the Roadmap below:

- **Records** — `<id>.md` files in this folder; front matter per
  [`TEMPLATE.md`](TEMPLATE.md).
- **Groups** — `<area>/<group-id>/_group.md` with `kind: group`; no status of
  their own, an optional `qualifier` is the caveat shown after the group name.
- **Legacy leaves** — features shipped before this system, one line each in
  [`roadmap.legacy.yaml`](roadmap.legacy.yaml); that file shrinks as leaves
  graduate into records.

Two status axes, fixed vocabulary:

**delivery** — `backlog → ready → in-progress → uat → verified` (+ `dropped`, exit from any state)

- BACKLOG — on the roadmap, approach not chosen yet (raw ideas stay in ideas.md; a record is born BACKLOG)
- READY — approach chosen (options + pros/cons recorded)
- IN PROGRESS — being built
- UAT (user acceptance testing) — deployed, **awaiting human verification** (a queue, not an activity; automated tests were already green to land)
- VERIFIED (formerly DONE) — **works on the deployed site, verified by a human** (owner/Charles clicked through it); requires `verification.human` evidence
- DROPPED — considered and rejected; keep the node, the "why not" is the value

**rollout** — `not-deployed | local-only | test-deployment | dormant | live` —
where the code actually runs, independent of delivery. This replaces the old
hand-written "dormant / sandbox" caveats: the roadmap prints them
automatically whenever rollout is surprising for the delivery stage.

`statusChangedAt` updates whenever delivery changes; `priority` / `owner` /
`target` are required while delivery is ready/in-progress/uat.

## Commands

| Command | Does |
|---|---|
| `npm run features:new -- <id> --area <a> --parent <group-id>` | scaffold a record from TEMPLATE.md, then regenerate the roadmap |
| `npm run features:generate` | validate the registry, rebuild the Roadmap block below |
| `npm run features:check` | fail when the registry is invalid or the Roadmap is stale (runs in CI) |

(`node scripts/features/cli.mjs list` prints a flat status table.)

## File format

[`TEMPLATE.md`](TEMPLATE.md) is the authority; scaffold with
`npm run features:new`. Body order:

Context → Decision → Options considered (pros/cons table) → Acceptance criteria
→ Plan → *Tech details* → Blockers and dependencies → *Open questions* →
Verification evidence → Related links.

Two **optional** sections, added 2026-07-28 (records created before then do not
carry them):

| Section          | Holds                                               | Sits there because                                      |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------- |
| *Tech details*   | platform constraints and traps found while planning | reference for whoever executes the Plan above it        |
| *Open questions* | OQ-1, OQ-2… choices still **ours** to make          | next to Blockers, which are someone **else's** to clear |

Data shape and invariants (column names, "X must never exceed Y") go in
*Tech details*; the checkbox that proves them goes in *Acceptance criteria*.

## Roadmap (status tree)

Two sections, Frontend and Backend. **Each group is the root of its own
mini-tree; its functions are the children.** A leaf named `*.md` is a record
in this folder; every other leaf lives in `roadmap.legacy.yaml`.

**The trees between the markers are generated — never edit them by hand.**
Change a status in its source (front matter or the legacy file), run
`npm run features:generate`, and commit both together; CI's `features:check`
fails while they disagree.

Meter = milestones completed after planning. BACKLOG is the empty meter — on
the roadmap, nothing started; a filled dot always means a real step happened:

`○○○○ BACKLOG · ●○○○ READY · ●●○○ IN PROGRESS · ●●●○ UAT · ●●●● VERIFIED · ✕ DROPPED`

Text after a status appears only when the bare meter would mislead (deployment
caveats print automatically from `rollout`) or when a `qualifier` names the
blocker to the next stage.



<!-- roadmap:begin — generated by `npm run features:generate`; edit front matter or roadmap.legacy.yaml, then regenerate -->

### Frontend (storefront)

```text
Figma pixel-exact pages
├── / (home) ●●●● VERIFIED
├── /shop ●●●● VERIFIED
├── /products/[slug] ●●●● VERIFIED
└── wishlist button ●●●○ UAT

Native checkout (PayPal Orders v2)
├── cart ●●●○ UAT
├── discount codes ●●●○ UAT
├── shipping rates ●●●○ UAT — RoW $19.95 placeholder (OQ-2)
├── PayPal create/capture ●●●○ UAT — sandbox until launch
├── PayPal webhooks ●●●○ UAT
└── card-payments.md ●○○○ READY — owner must enable Advanced Checkout first

Guest order lookup
└── /orders ●●●○ UAT

Customer accounts /account — dormant: owner config pending
├── email one-time code ●●○○ IN PROGRESS — dormant; needs Supabase OTP template
│       + SMTP
├── Google OAuth ✕ DROPPED — absent from the 07-25 design (lib kept)
├── Apple OAuth ✕ DROPPED — absent from the 07-25 design (lib kept)
├── passkeys ✕ DROPPED — owner 07-25 'no passkey' (storefront only; admin keeps
│       them)
├── order matching (verified email) ●●●○ UAT
├── nav tab 'Login' ⇄ 'Me' ●●●○ UAT
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
    ├── posting-account-attribution.md ●●●○ UAT
    └── engagement-tracking.md ●●○○ IN PROGRESS — deployed (test); 3/17 home
            sections tagged; vocabulary sign-off pending

Product content — 120 SKUs (OQ-3)
└── product-content-pipeline.md ○○○○ BACKLOG

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
└── promotion-emails.md ○○○○ BACKLOG

Supabase hosted DB
├── migrations (0001–0005) ●●●● VERIFIED — 0004 permanently skipped, repaired
│       07-28
├── seed (--reset / --demo) ●●●● VERIFIED — owner's --demo run pending
└── db-backups.md ○○○○ BACKLOG

Infrastructure
└── region-alignment.md ●●●● VERIFIED
```

<!-- roadmap:end -->

Refs (links can't render inside the code blocks, so shorthands above resolve
here):

- **§14.3** → [admin-design.md · 14.3 Final acceptance](../admin-design.md#143-final-acceptance)
- **owner config pending / dormant** → owner activation items in
  [SUMMARY.md · Release queue](../../SUMMARY.md#release-queue)
- **OQ-1 / OQ-2 / OQ-3** → [SUMMARY.md · Product decisions](../../SUMMARY.md#product-decisions)
- **card-payments.md** → [card-payments.md](card-payments.md)
- **db-backups.md** → [backend/db-backups.md](backend/db-backups.md)
- **search-discovery-implementation.md** → [seo-geo/search-discovery-implementation.md](../seo-geo/search-discovery-implementation.md)
- **order-tracking.md** → [backend/order-tracking.md](backend/order-tracking.md)
- **promotion-emails.md** → [backend/promotion-emails.md](backend/promotion-emails.md)
- **region-alignment.md** → [backend/region-alignment.md](backend/region-alignment.md)
