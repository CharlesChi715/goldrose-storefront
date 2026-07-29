---
schemaVersion: 1
id: engagement-tracking
kind: feature
parent: admin-analytics
area: backend
order: 40

delivery: in-progress
rollout: local-only
priority: p2
owner: charles
target: v1-launch
qualifier: "hosted schema live; app code not yet deployed"
statusChangedAt: 2026-07-28

dependsOn: []
blockedBy: []

verification:
  automated:
    - tests/unit/engagement.test.ts
    - tests/unit/engagement-report.test.ts
    - tests/e2e/engagement-beacon.spec.ts
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
- **One section owns the clock at a time**, so per-section times **sum to ≤ page
  active time** — the invariant that makes the report defensible. *Which* section
  owns it is undecided: see [OQ-1](#oq-1--which-section-owns-the-clock).
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
| `last_section` | `text` | `"HOME-STORY-SECTION"` |

`last_section` was added during implementation. The drop-off report needs the
final section reached, and that **cannot** be read off the end of `sections`:
Postgres `jsonb` does not preserve key order, so the "last" key of that blob is
meaningless once stored. It is sent explicitly instead.

Addressing the row requires the client to know its id, so `POST /api/beacon`
starts accepting a client-generated `viewId` and uses it as the primary key
instead of minting one server-side (`app/api/beacon/route.ts:36`).

⚠️ **Migration numbering:** the remote database holds an orphan `0004` row with
no matching file. Run `supabase migration repair` **before** adding anything, and
number this migration `0005` — do not reuse `0004`.

## Reports

Three cards on `/admin/analytics`, EN + 中文 like every other admin string:

1. **Time on page** — average active seconds per path, compared to previous period.
2. **Section attention** (per page) — bar list of average seconds per section,
   with the % of visits that ever reached it.
3. **Drop-off** — the last section reached, ranked; tells us where readers stop.

## Privacy

Still cookieless, still first-party, still no PII — but dwell and scroll depth
are *behavioural* measurement, which sits differently under EU rules than a plain
hit counter. This raises the consent debt already logged at
`docs/admin-design.md:1004`. Recommendation: ship it, and fold it into the same
consent-wording review that gates launch rather than opening that question now.

## Acceptance criteria

- [x] `page_views` gains `active_ms`, `scroll_pct`, `sections`; `0001`–`0003`
      plus repaired `0004` state verified before `0005` is pushed.
      *(2026-07-28: orphan `0004` repaired to `reverted`, `0005` pushed; local
      and remote both at `0005`, all 734 existing rows preserved as null.)*
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

## Open questions

### OQ-1 — which section owns the clock

When three bands are partly on screen at once, which one is the visitor
"viewing"? This is a judgement call, not an API limit — IntersectionObserver
reports all three, and we choose the rule.

| Rule | Consequence |
|---|---|
| Any pixel visible counts | Every band on screen runs its clock, so section times overlap and sum to far more than the page total. The numbers stop meaning anything. |
| Element ≥50% visible | Breaks for tall bands — a section taller than the screen can never be 50% visible, so the longest bands always read zero. |
| Biggest share of the viewport wins | Exactly one section holds the clock at a time, and the sum stays ≤ page active time. Cost: during a fast scroll the winner flips every few frames, so it needs a minimum-dwell floor (~1 s) to avoid crediting meaningless slivers. |

**DECIDED 2026-07-28 (owner): biggest share of the viewport, with a 1 s minimum
dwell.** Charles then raised the objection that fixes the formula:

> if we choose Biggest share of the viewport wins, what if the section is too
> small it doesnt shares most of the screen even in the middle of screen?

Correct, and fatal to the naive version. A 120 px band between two tall bands
can never own the most viewport pixels, even dead-centre, so short sections
would read zero forever. So coverage is measured against **the most a section
could possibly show**, not against the whole screen:

```
coverage = visible px ÷ min(section height, viewport height)
```

Short sections are judged against their own height, tall ones against the
screen, and either can reach 1.0 — size no longer decides the winner. A mild
centre bias breaks the remaining tie so a sliver at the very edge cannot beat
the band filling the middle. Exactly one winner still holds the clock, so the
sum invariant survives. Implemented as `sectionScore()` in `lib/engagement.ts`
and pinned by the first test in `tests/unit/engagement.test.ts`.

Original recommendation, kept for the record: **biggest share, with a 1 s
minimum dwell.** Time below the
floor stays deliberately unattributed, which makes the gap between page time and
summed section time its own signal ("skim time"). Needs the owner's read before
stage 2 is built, because it decides what every section number means.

Charles: if we choose Biggest share of the viewport wins, what if the section is too small it doesnt     
  shares most of the screen even in the middle of screen? 

## Verification evidence

**Automated — 2026-07-28, all green.**

- `tests/unit/engagement.test.ts` (15 tests): hidden tabs bank zero; idle past
  the 30 s cut is dropped and interaction restarts the clock; a section below
  the 1 s floor earns nothing; the sum invariant holds across visibility
  changes; a short centred section outscores a tall partial one.
- `tests/unit/engagement-report.test.ts` (7 tests): unmeasured visits are
  excluded rather than counted as zero-second visits; averages, reach rate and
  drop-off shares.
- `tests/e2e/engagement-beacon.spec.ts` (2 tests): a real Chromium visit to `/`
  banks time, records tagged sections, and on tab-hide flushes a summary that
  lands on **the same `page_views` row** the arrival created; the admin cards
  render.
- Whole suite re-run after the change: **87/87 e2e pass**, 60/60 unit pass,
  `tsc --noEmit` clean, `next build` succeeds. Pixel baselines unchanged.

**Manual — local file adapter, production build:**

- Arrival + engagement round trip updates one row in place (no second row).
- A payload whose section times exceed the page total has its `sections`
  dropped and its page time kept — the invariant is enforced server-side too.
- A caller holding the `viewId` but the wrong `visitorId` cannot write.
- `/admin/analytics?range=30d` renders "Time on page" with its average, "Section
  attention" (`HOME-FEATURED-SECTION` 21s · 67% reached) and "Where visits
  stop", from seeded data.

**Hosted — 2026-07-28, migration `0005` applied.** Orphan `0004` repaired to
`reverted` first; local and remote now both read `0005`. Verified directly
against the hosted database with one throwaway row, since deleted (row count
returned to its prior 734):

- The adapter's two-key match (`id` + `visitor_id`) updates exactly 1 row.
- The same update with a wrong `visitor_id` touches **0** rows — cross-visitor
  writes are impossible even for a caller holding the view id.
- `scroll_pct = 150` is rejected by `page_views_scroll_pct_check`.

This mattered because both beacon routes swallow their errors by design: a
hosted failure would otherwise have been completely silent.

**Not yet verified:** the deployed app. The code is still an uncommitted
working tree, so nothing on Vercel records engagement yet and the owner
acceptance criterion is untouched. Section coverage is limited to the three
bands tagged today
(`HOME-HERO-SECTION`, `HOME-FEATURED-SECTION`, `HOME-PROMISE-SECTION`) — the
mechanism is complete and generic, coverage grows as tagging lands.

## Related links

- [`docs/ixd/element-names.md`](../../ixd/element-names.md) — section name vocabulary and rules
- [`docs/features/posting-account-attribution.md`](../posting-account-attribution.md) — the `utm_acc` tag on the same beacon
- [`docs/google-analytics-concepts.md`](../../google-analytics-concepts.md) — engagement-rate and funnel-event background
- `components/Beacon.tsx`, `app/api/beacon/route.ts`, `lib/admin/analytics.ts`
