---
schemaVersion: 1
id: engagement-tracking
kind: feature
parent: admin-analytics
area: backend
order: 40

delivery: backlog
rollout: not-deployed
statusChangedAt: 2026-07-28

dependsOn: []
blockedBy: []

verification:
  automated: []
  human: null
---

# Engagement tracking — how long, and which sections

## Context

- Owner's idea, 2026-06-28 (`docs/ideas.md`): *"Analytics about behavior of the
  viewer in this website."*
- Today the beacon (`components/Beacon.tsx` → `POST /api/beacon` → `page_views`)
  records **arrivals only**. We know a page was opened; we cannot tell a
  two-second bounce from a two-minute read.
- The homepage is ~15 stacked bands (A-1 … A-11). Nobody knows which ones earn
  attention and which are scrolled past — so nobody can say what to cut, move up,
  or spend photography money on.

## Decision

Extend the existing first-party beacon to measure **active time** per page and
per named section, aggregate it **in the browser**, and send **one summary at the
end of the visit** that updates that visit's existing `page_views` row.

Section identity reuses the `data-el="…-SECTION"` names we already ship
(`docs/ixd/element-names.md`). No new attribute, no new table, no extra rows.

## Options considered

### How engagement is recorded

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Client aggregates, one flush per visit, `UPDATE` the `page_views` row | **row count unchanged**; existing indexes and every existing query keep working; one payload to reason about and test | a lost final beacon means no engagement data for that visit — stored as `NULL`, never as zero | ✅ **chosen** |

### How a section is identified

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Reuse `data-el="…-SECTION"` | the name is already the shared vocabulary across Figma, code, tests; owner can point at a band and read its row in the report | only A-1…A-3 are tagged today; the rest needs tagging first | ✅ **chosen** |

## Measurement rules

Precision here is the whole feature — vague rules produce numbers nobody trusts.

- **Active time, not wall time.** The clock runs only while
  `document.visibilityState === "visible"`. Background tabs count zero.
- **Idle cut at 30 s.** No scroll, pointer, or key event for 30 s pauses the
  clock; the next interaction resumes it. Stops "left the tab open at lunch"
  from reading as engagement.
- **One section owns the clock at a time** — the section covering the largest
  share of the viewport. This makes per-section times **sum to ≤ page active
  time**, which is the invariant that makes the report defensible.
- **Flush on `visibilitychange → hidden`**, plus on client-side route change,
  with `pagehide` as backstop. Uses `navigator.sendBeacon` (not the `keepalive`
  fetch the arrival beacon uses) — at unload, `fetch` is unreliable on mobile
  Safari and `sendBeacon` is the documented survivor.
- **Also captured:** max scroll depth (%), and the last section reached.
- **Not captured:** clicks, mouse paths, keystrokes, form contents, screen
  recording. Out of scope on purpose (see Privacy).

## Data shape

Three columns added to `page_views`, written by one `UPDATE`:

| Column | Type | Example |
|---|---|---|
| `active_ms` | `integer` | `41200` |
| `scroll_pct` | `smallint` | `78` |
| `sections` | `jsonb` | `{"HOME-HERO-SECTION": 8200, "HOME-STORY-SECTION": 19500}` |

Addressing the row requires the client to know its id, so `POST /api/beacon`
starts accepting a client-generated `viewId` and uses it as the primary key
instead of minting one server-side (`app/api/beacon/route.ts:36`).

⚠️ **Migration numbering:** the remote database holds an orphan `0004` row with
no matching file. Run `supabase migration repair` **before** adding anything, and
number this migration `0005` — do not reuse `0004`.

## Reports

Three cards on `/admin/analytics`, EN + 中文 like every other admin string:

1. **Time on page** — median active seconds per path, compared to previous period.
2. **Section attention** (per page) — bar list of median seconds per section,
   with the % of visits that ever reached it.
3. **Drop-off** — the last section reached, ranked; tells us where readers stop.

## Privacy

Still cookieless, still first-party, still no PII — but dwell and scroll depth
are *behavioural* measurement, which sits differently under EU rules than a plain
hit counter. This raises the consent debt already logged at
`docs/admin-design.md:1004`. Recommendation: ship it, and fold it into the same
consent-wording review that gates launch rather than opening that question now.

## Acceptance criteria

- [ ] `page_views` gains `active_ms`, `scroll_pct`, `sections`; `0001`–`0003`
      plus repaired `0004` state verified before `0005` is pushed.
- [ ] A visit that stays 40 s on `/` records `active_ms` within ±2 s of 40 000.
- [ ] A backgrounded tab for 60 s adds **zero** active time.
- [ ] Per-section times never exceed the page's `active_ms` (the invariant).
- [ ] A visit whose final beacon never arrives leaves `active_ms` `NULL`, and the
      existing session/conversion reports are numerically unchanged.
- [ ] Admin analytics still renders with no measurable slowdown at seeded volume.
- [ ] Owner opens the test deployment, reads one homepage band for ~30 s, and
      sees that band top the Section attention card. *(gates UAT → VERIFIED)*

## Plan

Staged so stage 1 ships without waiting on design-team decisions.

| # | Stage | Work | Depends on |
|---|---|---|---|
| 1 | Page dwell | migration `0005`; `viewId` on arrival; active-time + scroll clock in `Beacon.tsx`; `POST /api/beacon/engagement`; "Time on page" card | nothing |
| 2 | Section timing | `IntersectionObserver` over `[data-el$="-SECTION"]`; `sections` jsonb; Section attention card | `data-el` tagging of A-4…A-11, `/shop`, `/products/[slug]` |
| 3 | Drop-off | last-section-reached ranking | stage 2 |

Tests: a unit test pinning the clock rules (hidden = 0, idle cut, sum invariant),
and an e2e run asserting a timed visit surfaces on the admin card.

## Blockers and dependencies

Stage 2 is blocked on element naming, not on code. Only A-1, A-2, A-3 carry
`data-el` today; A-4 … A-11, `/shop` and `/products/[slug]` are untagged, and the
SECTION vocabulary those bands need (`STORY`, `CRAFT`, `OCCASION`, …) is still
**PROPOSED, awaiting the owner's OK** (`docs/ixd/element-names.md`). Tagging
before that sign-off means renaming across ~8 files later.

No feature-record id exists for element naming, so `dependsOn` stays empty and
the dependency is recorded here in prose.

## Verification evidence

Not started — this document is a design awaiting approval.

## Related links

- [`docs/ixd/element-names.md`](../../ixd/element-names.md) — section name vocabulary and rules
- [`docs/features/posting-account-attribution.md`](../posting-account-attribution.md) — the `utm_acc` tag on the same beacon
- [`docs/google-analytics-concepts.md`](../../google-analytics-concepts.md) — engagement-rate and funnel-event background
- `components/Beacon.tsx`, `app/api/beacon/route.ts`, `lib/admin/analytics.ts`
