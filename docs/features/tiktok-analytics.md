---
id: tiktok-analytics
area: backend

delivery: backlog
rollout: not-deployed
statusChangedAt: 2026-08-04

dependsOn: [posting-account-attribution]
blockedBy: []

verification:
  automated: []
  human: null
---

# TikTok analytics — read our own metrics through the API

## Context

- Owner's idea (`docs/ideas.md`, line 81, verbatim): *"tiktok 数据分析"*. Related
  lines in the same file: content will be published to Facebook / TikTok / IG,
  and 达人 (influencers) are to be found in the US.
- Charles asked 2026-08-04 whether TikTok Business Suite could simply be
  rebuilt against TikTok's API.
- Business Suite is free and already answers the dashboard question. It cannot
  answer the commercial one — **which video produced revenue on eldreve.com** —
  because it has no visibility into our site. That gap, not prettier charts, is
  the reason to build anything here.
- Pre-launch state: no influencer signed, no campaigns, a handful of posts. The
  *dashboard* is therefore premature; the *collector* may not be, because of the
  two decay rules in Tech details — uncollected history is unrecoverable.

## Decision

None yet — BACKLOG. Scope and timing are OQ-1; account type is OQ-2.

## Options considered

Recorded for the eventual decision; nothing chosen yet.

| Option                              | Pros                                                                                                                | Cons                                                                                                                          | Verdict    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Do nothing; read Business Suite      | Zero build cost; covers every metric TikTok exposes                                                                 | 60-day window, CSV-only export, no join to orders, no automation; history silently expires                                    | pending    |
| Collector only (no UI)               | ~150 lines; starts accumulating history immediately; unblocks the revenue join later; no design work               | No product surface until a dashboard is built; needs an approved app before it can run at all                                 | pending    |
| Collector + `/admin/tiktok` dashboard | Full replacement for the analytics half of Business Suite                                                          | Rebuilds what TikTok already gives free; cannot reach Discovery/LIVE/demographics regardless of effort (see Tech details)     | pending    |

## Acceptance criteria

- [ ] An approved TikTok app can authenticate the ELDREVE Business account and
      return a video list.
- [ ] One row per video per day lands in Supabase; re-running the same day is
      idempotent (no duplicate rows).
- [ ] Rows survive past TikTok's own 60-day analytics window — i.e. the table
      still holds day-1 figures after 90 days.
- [ ] A video reached via `?utm_source=tiktok&utm_content=<video_id>` can be
      joined from `page_views` through to an order.
- [ ] Human acceptance: Charles compares one video's stored figures against
      Business Suite for the same date and they agree.

## Plan

Staged so each stage is independently useful:

| #   | Stage                    | Work                                                                                     |
| --- | ------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | Access                   | Register the app on `business-api.tiktok.com`; complete app review (see Blockers)         |
| 2   | Schema                   | `supabase/migrations/0007_tiktok_metrics.sql` — one row per (video_id, captured_on)       |
| 3   | Collector                | Scheduled pull of `/business/video/list/`; upsert on the composite key                    |
| 4   | Attribution link         | Link recipe `?utm_source=tiktok&utm_content=<video_id>` documented for whoever posts       |
| 5   | Dashboard *(deferred)*   | `/admin/tiktok` reading accumulated history; only worth building once history exists      |

## Tech details

### Two portals, not one

TikTok runs two separate developer platforms with separate app registrations
and separate docs. Searching the wrong one returns endpoints we cannot use.

| Portal                    | Contains                                                              |
| ------------------------- | ----------------------------------------------------------------------- |
| `developers.tiktok.com`   | Login Kit, Display API, Content Posting API, Research API              |
| `business-api.tiktok.com` | **API for Business** — Business Account API, Ads API, audience reports |

The second is ours. The Display API only returns the four vanity counters; the
Business Account API is what backs Business Suite.

### Capability matrix — API vs Business Suite

Union of both feature sets. **✅** available · **⚠️** partial · **❌** not
available · **❔** unverified, assume unavailable until seen in an approved app.
Surveyed 2026-08-04; TikTok changes this surface, so re-check before building.

| Category          | Function                                              | API                            | Business Suite     |
| ----------------- | ------------------------------------------------------- | :----------------------------: | :----------------: |
| **Account**       | Username, display name, avatar                        | ✅                             | ✅                 |
|                   | Follower count                                        | ✅                             | ✅                 |
|                   | Total likes                                           | ✅                             | ✅                 |
|                   | Profile views                                         | ❔                             | ✅                 |
|                   | Follower growth over a period                         | ⚠️ derive from daily snapshots | ✅                 |
| **Video metrics** | List all our videos                                   | ✅                             | ✅                 |
|                   | Views per video                                       | ✅                             | ✅                 |
|                   | Likes / comments / shares per video                   | ✅                             | ✅                 |
|                   | Saves (`collect_count`)                               | ✅                             | ✅                 |
|                   | Total + average watch time                            | ✅                             | ✅                 |
|                   | Full-video-watched rate                               | ✅                             | ✅                 |
|                   | Traffic source (For You / Follow / Search / Profile)  | ✅ `impression_sources`        | ✅                 |
|                   | Per-video audience territories                        | ✅ `audience_countries`        | ✅                 |
|                   | Retention / drop-off curve                            | ❌                             | ✅                 |
|                   | Insights on videos idle >7 days                       | ❌                             | ❌                 |
|                   | Data on posts older than 365 days                     | ❌                             | ❌                 |
| **Audience**      | Follower territories                                  | ✅                             | ✅                 |
|                   | Follower **gender** split                             | ❌                             | ✅                 |
|                   | Follower **age** split                                | ❌                             | ✅                 |
|                   | Follower active hours / days                          | ❔                             | ✅                 |
|                   | What followers watched / listened to                  | ❌                             | ✅                 |
| **Comments**      | List comments on our videos                           | ✅                             | ✅                 |
|                   | Get replies to a comment                              | ✅                             | ✅                 |
|                   | Reply to a comment                                    | ✅                             | ✅                 |
|                   | Like / unlike a comment                               | ✅                             | ✅                 |
|                   | Hide / unhide a comment                               | ✅                             | ✅                 |
|                   | Delete a comment                                      | ✅                             | ✅                 |
|                   | Bulk / rule-based auto-moderation                     | ✅                             | ⚠️ keyword filter  |
|                   | Direct messages (DM inbox)                            | ❌                             | ✅                 |
|                   | Auto-reply / keyword auto-messages                    | ❌                             | ✅                 |
| **Publishing**    | Publish a video                                       | ✅                             | ✅                 |
|                   | Upload as draft / to inbox                            | ✅                             | ✅                 |
|                   | Schedule a post                                       | ⚠️ own scheduler needed        | ✅                 |
|                   | Photo / carousel posts                                | ❔                             | ✅                 |
| **LIVE**          | LIVE views, watch time, diamonds, new followers       | ❌                             | ✅                 |
|                   | Go LIVE / LIVE controls                               | ❌                             | ✅                 |
| **Discovery**     | Trending sounds & hashtags                            | ❌                             | ✅                 |
|                   | Benchmark vs similar accounts                         | ❌                             | ✅                 |
|                   | Creator Marketplace (influencer search)               | ❌                             | ✅                 |
|                   | Content ideas / Coach tips                            | ❌                             | ✅                 |
| **Commerce/ads**  | Ads campaign create / manage / report                 | ✅ separate Ads API            | ✅                 |
|                   | Promote an existing post                              | ⚠️                             | ✅                 |
|                   | Web conversion pixel / Events                         | ✅ Events API                  | ✅                 |
|                   | TikTok Shop product management                        | ⚠️ separate Shop Partner API   | ✅                 |
|                   | Lead-gen forms                                        | ⚠️                             | ✅                 |
| **Data handling** | History beyond the 60-day window                      | ✅ if we store it              | ❌                 |
|                   | Join to eldreve.com sessions / orders                 | ✅                             | ❌                 |
|                   | Automated alerts on a spike or drop                   | ✅                             | ❌                 |
|                   | Scheduled / unattended access                         | ✅                             | ❌                 |
|                   | Arbitrary custom date ranges                          | ✅                             | ⚠️ capped          |
|                   | Raw data export                                       | ✅ any format                  | ⚠️ CSV only        |
|                   | Several accounts in one view                          | ✅                             | ⚠️                 |

How to read it: the two ❌ columns are the decision, not the ✅ overlap. The
API-only ❌ block (bottom) is small but strategic — history, joins, automation.
The Suite-only ❌ block splits in two: LIVE / DMs / demographics are merely
unbuilt endpoints and could appear later, but Discovery (trends, benchmarks,
Creator Marketplace) is TikTok's own product and will not open up. **Both
surfaces stay in the workflow permanently; this is a complement, not a
replacement.**

### Platform invariants

- **The API can never exceed the dashboard.** TikTok states it directly: if a
  metric is absent from TikTok Analytics, the API will not return it either.
- **365-day cap** — post data stops updating 365 days after publish.
- **7-day insight decay** — insight fields (traffic source, territories) become
  unavailable on videos with no engagement for more than 7 days.
- Consequence for scheduling: a collector's value is strictly a function of how
  early it starts. A dashboard built later can only ever chart what was already
  being saved.

### Join key

`utm_content` is already captured by the beacon alongside `utm_source`,
`utm_medium`, `utm_campaign`, `utm_term` and `utm_acc`, so carrying the TikTok
video id in `utm_content` needs no collection-side change. This is consistent
with [posting-account-attribution](posting-account-attribution.md), which moved
the posting account onto its own `utm_acc` tag precisely so `utm_content` could
return to identifying *which creative* a visitor arrived from.

## Blockers and dependencies

- **App review gates everything.** The Business API requires an approved app,
  which requires a live privacy policy URL and terms URL on a verified domain.
  `eldreve.com` is live and verified, but the seven `/policies/*` routes are
  still coming-soon scaffolds — they need real content before review can pass.
- **Account type gates the API.** Business Account API endpoints require the
  TikTok account to be a Business account, which is OQ-2 below.
- Depends on `posting-account-attribution` only for the beacon's UTM capture,
  which is already built and in UAT.

## Open questions

- **OQ-1 — Build the collector now, or wait until after launch?** The dashboard
  is clearly post-launch: eight items sit ahead of it in the release queue and
  there is almost no data to chart. The collector is the live question, because
  the 365-day and 7-day rules mean history not captured is gone permanently.
  *Recommend:* build the collector once app review clears, leave the dashboard
  in backlog. Cost is roughly a migration plus a scheduled script.

- **OQ-2 — Business or Creator account for ELDREVE's TikTok?** A Business
  account is required for the Business API, ads, pixel and Shop, but is
  restricted to the Commercial Music Library and loses trending sounds. A
  Creator account keeps the full sound library — which is the actual
  distribution mechanism for a gift product riding Valentine's / Mother's Day
  audio trends. *Recommend:* escalate to the owner. This is a marketing
  trade-off (organic reach vs. commercial tooling), not a technical one, and it
  may belong in SUMMARY.md "Product decisions" rather than here.

## Verification evidence

Nothing built; no evidence. Front matter stays BACKLOG until OQ-1 is answered.

## Related links

- [posting-account-attribution.md](posting-account-attribution.md) — the
  `utm_acc` decision and the beacon's UTM capture this would join against.
- [backend/engagement-tracking.md](backend/engagement-tracking.md) — on-site
  dwell data, the other half of any "which video drove engagement" question.
- Sources surveyed 2026-08-04:
  [API for Business docs](https://business-api.tiktok.com/portal/docs) ·
  [Business video list](https://www.postman.com/tiktok/tiktok-api-for-business/request/7u65xdl/business-video-list) ·
  [Business comment list](https://www.postman.com/tiktok/tiktok-api-for-business/request/6nxw8xx/business-comment-list) ·
  [Audience reports](https://business-api.tiktok.com/portal/docs/audience-reports/v1.3) ·
  [Display API overview](https://developers.tiktok.com/doc/display-api-overview) ·
  [TikTok audience demographics via API](https://www.socialfetch.dev/guides/how-to-get-tiktok-audience-demographics)
</content>
</invoke>
