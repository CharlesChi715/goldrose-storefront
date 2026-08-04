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
| Collector + `/admin/tiktok` dashboard | Full replacement for the analytics half of Business Suite                                                          | Rebuilds what TikTok already gives free; still cannot reach LIVE, DMs or retention curves at any effort (see Tech details)     | pending    |

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
| 1   | Access                   | Register the app on `business-api.tiktok.com` with the three scopes in *Tech details*; complete app review (see Blockers). App name `ELDREVE Storefront Analytics`; redirect URL `https://eldreve.com/api/tiktok/callback` |
| 1b  | Callback route           | `app/api/tiktok/callback/route.ts` — receive `auth_code`, exchange for tokens, persist the refresh token. Must exist before the authorize link is clicked |
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

### Endpoints in the `TikTok Accounts` scope group (v2.0)

Copied verbatim from the scope picker in the portal's Create-New-App dialog,
2026-08-04. This is the authoritative inventory — it is what the platform
actually grants, unlike docs and third-party guides.

```
/business/get/                      /business/video/publish/
/business/video/list/               /business/photo/publish/
/business/comment/list/             /business/video/settings/
/business/comment/create/           /business/publish/status/
/business/comment/delete/           /business/publish/location/
/business/comment/hide/             /business/hashtag/suggestion/
/business/comment/like/             /business/post/authorize/
/business/comment/pin/              /business/post/authorize/status/
/business/comment/reply/list/       /business/post/authorize/delete/
/business/comment/reply/create/     /business/post/authorize/setting/
/business/benchmark/                /discovery/trending/search/
                                    /discovery/trending/search/keyword/
```

### Scopes to request

The group's sub-groups tick independently. Request these three and nothing else:

| Sub-group             | Why                                            |
| --------------------- | ---------------------------------------------- |
| **Account User**      | `/business/get/` — account and follower metrics |
| **Get Account Media** | `/business/video/list/` — per-video performance |
| **Account Comment**   | `/business/comment/list/` - list, reply, hide, delete on our own videos    |

Deliberately **not** requested:

| Sub-group                | Why not                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Account Post Content** | ⚠️ Write access — publishes videos and photos to the live account. The single most dangerous permission in the group, and the collector never posts. |
| Business Benchmark       | Reads fine in the dashboard; no need to hold the permission to chart it                                              |
| Discovery Search         | Trend research is a human activity in Business Suite, not something the collector automates                          |
| Auth Code Management     | Not needed for a single first-party authorization                                                                    |

Rationale: every ticked scope is a capability our `app_secret` can exercise
forever if it leaks, and TikTok lists over-requesting as a review-failure
reason. Read scopes cannot damage the account; `Account Post Content` can.
Scopes are addable later via a re-review, so the cost of starting narrow is one
review cycle *only if* the bosses pivot — against a permanent reduction in
blast radius.

### Endpoints in the `Ad Account Management` scope group (v2.0)

Copied verbatim from the same picker, 2026-08-04. Recorded so the decision to
skip this group is evidence-based rather than assumed. **Verdict: none of it
serves the collector.** This group administers a *Business Center* — the
console an agency uses to manage many advertiser accounts, assets, members and
invoices. We have one account, no ad spend and no agency structure.

Descriptions marked ⁇ are inferred from the path name, not read from TikTok's
documentation; only `/oauth2/advertiser/get/` is confirmed (it appears in
TikTok's official SDK).

| Endpoint                                 | What it gets or does                                               | Kind      | Use to us |
| ---------------------------------------- | ------------------------------------------------------------------ | --------- | :-------: |
| `/oauth2/advertiser/get/`                | Ad-account (advertiser) IDs this access token is authorized for    | read      | ❌        |
| `/bc/inspiration_tool/audience_insight/` | ⁇ Audience insight data from the Inspiration tool, for ad planning | read      | ❌        |
| `/bc/inspiration_tool/ad_performance/`   | ⁇ Benchmark ad-performance data for planning                       | read      | ❌        |
| `/bc/advertiser/disable/`                | Disable an ad account under the Business Center                    | **write** | ❌        |
| `/bc/advertiser/qualification/get/`      | ⁇ Verification/qualification document status for an advertiser     | read      | ❌        |
| `/bc/advertiser/attribute/`              | ⁇ Advertiser attributes (industry, category)                       | ⁇         | ❌        |
| `/bc/advertiser/unionpay_info/check/`    | ⁇ Check UnionPay payment details (China payment rails)             | read      | ❌        |
| `/bc/advertiser/unionpay_info/submit/`   | ⁇ Submit UnionPay payment details                                  | **write** | ❌        |
| `/bc/account/transaction/get/`           | ⁇ Transaction records — top-ups and transfers                      | read      | ❌        |
| `/bc/account/cost/get/`                  | ⁇ Spend/cost figures per ad account                                | read      | ❌        |
| `/bc/account/budget/changelog/get/`      | ⁇ History of budget changes                                        | read      | ❌        |
| `/asset/bind/quota/`                     | ⁇ Remaining quota for binding assets                               | read      | ❌        |
| `/bc/pixel/get/`                         | Pixels owned by the Business Center                                | read      | ❌        |
| `/bc/asset/account/authorization/`       | ⁇ Authorize/link an asset to an account                            | **write** | ❌        |
| `/bc/asset/advertiser/assign/`           | Assign an asset to an advertiser                                   | **write** | ❌        |
| `/bc/asset/advertiser/unassign/`         | Remove that assignment                                             | **write** | ❌        |
| `/bc/asset/advertiser/assigned/`         | List which advertisers an asset is assigned to                     | read      | ❌        |
| `/bc/oa/create/`                         | ⁇ Create an owned/official account entry under the BC              | **write** | ❌        |
| `/bc/member/assign/`                     | Assign a member (person) to assets or roles                        | **write** | ❌        |
| `/bc/invoice/billing_report/get/`        | ⁇ Invoices and billing reports                                     | read      | ❌        |
| `/bc/asset_group/create/`                | Create an asset group                                              | **write** | ❌        |
| `/bc/asset_group/get/`                   | Read one asset group                                               | read      | ❌        |
| `/bc/asset_group/update/`                | Update an asset group                                              | **write** | ❌        |
| `/bc/asset_group/list/`                  | List asset groups                                                  | read      | ❌        |
| `/bc/asset_group/delete/`                | Delete an asset group                                              | **write** | ❌        |
| `/bc/child/invite/`                      | Invite a child Business Center                                     | **write** | ❌        |
| `/bc/child/unbind/`                      | Unbind a child Business Center                                     | **write** | ❌        |

Note the shape: **13 of 27 are writes**, several of them destructive
(`advertiser/disable/`, `asset_group/delete/`, `child/unbind/`) or financial
(`unionpay_info/submit/`). That is the concrete argument for least privilege —
ticking this group to "look thorough" would hand our `app_secret` the ability
to disable ad accounts and submit payment details, in exchange for zero
analytics we cannot already get from `/business/*`.

### Capability matrix — API vs Business Suite

Union of both feature sets, with the endpoint behind every API-side capability.
**✅** available · **⚠️** partial · **❌** not available · **❔** endpoint exists
but the specific field is unverified — treat as unavailable until seen in an
approved app.

Source authority differs by column and is stated per block below the table.

| Category          | Function                                             | API — endpoint / field                                                         | Business Suite         |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | :--------------------: |
| **Account**       | Username, display name, avatar                       | ✅ `/business/get/`                                                            | ✅                     |
|                   | Follower count                                       | ✅ `/business/get/`                                                            | ✅                     |
|                   | Total likes                                          | ✅ `/business/get/`                                                            | ✅                     |
|                   | Profile views                                        | ❔ `/business/get/` — field unconfirmed                                        | ✅                     |
|                   | Follower growth over a period                        | ⚠️ `/business/get/` polled daily; the API returns a level, we derive the delta | ✅                     |
| **Video metrics** | List all our videos                                  | ✅ `/business/video/list/`                                                     | ✅                     |
|                   | Views per video                                      | ✅ `video_views` (organic **+ paid** combined)                                 | ✅                     |
|                   | Likes / comments / shares per video                  | ✅ `/business/video/list/`                                                     | ✅                     |
|                   | Reach                                                | ✅ `reach`                                                                     | ✅                     |
|                   | Total + average watch time                           | ✅ `total_time_watched`, `average_time_watched`                                | ✅                     |
|                   | Full-video-watched rate                              | ✅ `full_video_watched_rate`                                                   | ✅                     |
|                   | Traffic source (For You / Follow / Search / Profile) | ✅ `impression_sources`                                                        | ✅                     |
|                   | Per-video audience territories                       | ✅ `audience_countries`                                                        | ✅                     |
|                   | Saves / bookmarks                                    | ❔ `collect_count` is a **Display API** field; unconfirmed here                | ✅                     |
|                   | Retention / drop-off curve                           | ❌ no endpoint                                                                 | ✅                     |
|                   | Insights on videos idle >7 days                      | ❌ fields drop out                                                             | ❌                     |
|                   | Data on posts older than 365 days                    | ❌ stops updating                                                              | ❌                     |
| **Audience**      | Follower territories                                 | ❔ `/business/get/` — field unconfirmed                                        | ✅                     |
|                   | Follower **gender** split                            | ❔ unverified — see note                                                       | ✅                     |
|                   | Follower **age** split                               | ❔ unverified — see note                                                       | ✅                     |
|                   | Follower active hours / days                         | ❔ unverified — see note                                                       | ✅                     |
|                   | What followers watched / listened to                 | ❌ no endpoint                                                                 | ✅                     |
| **Comments**      | List comments on our videos                          | ✅ `/business/comment/list/`                                                   | ✅                     |
|                   | Get replies to a comment                             | ✅ `/business/comment/reply/list/`                                             | ✅                     |
|                   | Reply to a comment                                   | ✅ `/business/comment/reply/create/`                                           | ✅                     |
|                   | Post a comment                                       | ✅ `/business/comment/create/`                                                 | ✅                     |
|                   | Like / unlike a comment                              | ✅ `/business/comment/like/`                                                   | ✅                     |
|                   | Hide / unhide a comment                              | ✅ `/business/comment/hide/`                                                   | ✅                     |
|                   | Delete a comment                                     | ✅ `/business/comment/delete/`                                                 | ✅                     |
|                   | Pin a comment                                        | ✅ `/business/comment/pin/`                                                    | ✅                     |
|                   | Bulk / rule-based auto-moderation                    | ✅ compose `comment/list/` + `hide/` + `delete/`                               | ⚠️ keyword filter only |
|                   | Direct messages (DM inbox)                           | ❌ no endpoint                                                                 | ✅                     |
|                   | Auto-reply / keyword auto-messages                   | ❌ (comments only, see above)                                                  | ✅                     |
| **Publishing**    | Publish a video                                      | ✅ `/business/video/publish/`                                                  | ✅                     |
|                   | Publish a photo / carousel                           | ✅ `/business/photo/publish/`                                                  | ✅                     |
|                   | Check publish status                                 | ✅ `/business/publish/status/`                                                 | ✅                     |
|                   | Video settings (comments, duet, stitch)              | ✅ `/business/video/settings/`                                                 | ✅                     |
|                   | Attach a location to a post                          | ✅ `/business/publish/location/`                                               | ✅                     |
|                   | Authorize a post for Spark Ads                       | ✅ `/business/post/authorize/` (+ `/status/`, `/delete/`, `/setting/`)         | ✅                     |
|                   | Upload as draft / to inbox                           | ❔ not in this scope group                                                     | ✅                     |
|                   | Schedule a post                                      | ⚠️ no endpoint — run our own cron against `video/publish/`                     | ✅                     |
| **LIVE**          | LIVE views, watch time, diamonds, new followers      | ❌ no endpoint                                                                 | ✅                     |
|                   | Go LIVE / LIVE controls                              | ❌ no endpoint                                                                 | ✅                     |
| **Discovery**     | Trending search                                      | ✅ `/discovery/trending/search/`, `/discovery/trending/search/keyword/`        | ✅                     |
|                   | Hashtag suggestions                                  | ✅ `/business/hashtag/suggestion/`                                             | ✅                     |
|                   | Benchmark vs similar accounts                        | ✅ `/business/benchmark/`                                                      | ✅                     |
|                   | Creator Marketplace (influencer search)              | ⚠️ separate **TCM** scope group; endpoints unread                              | ✅                     |
|                   | Content ideas / Coach tips                           | ❌ no endpoint                                                                 | ✅                     |
| **Commerce/ads**  | Ads campaign create / manage                         | ⚠️ **Ads API** — `/campaign/`, `/adgroup/`, `/ad/`                             | ✅                     |
|                   | Ads reporting                                        | ⚠️ **Ads API** — `/report/integrated/get/`, `/report/task/create/`             | ✅                     |
|                   | Web conversion pixel / Events                        | ⚠️ **Ads API** — `/pixel/create/`, `/pixel/list/`                              | ✅                     |
|                   | Promote an existing post                             | ⚠️ via Spark Ads (`post/authorize/`) + Ads API                                 | ✅                     |
|                   | TikTok Shop product management                       | ⚠️ separate **Shop Partner API**                                               | ✅                     |
|                   | Lead-gen forms                                       | ⚠️ separate **Lead Management** scope group                                    | ✅                     |
| **Data handling** | History beyond the 60-day window                     | ✅ our storage, no endpoint                                                    | ❌                     |
|                   | Join to eldreve.com sessions / orders                | ✅ our SQL, no endpoint                                                        | ❌                     |
|                   | Automated alerts on a spike or drop                  | ✅ our cron, no endpoint                                                       | ❌                     |
|                   | Scheduled / unattended access                        | ✅ refresh-token flow                                                          | ❌                     |
|                   | Arbitrary custom date ranges                         | ✅ our SQL                                                                     | ⚠️ capped              |
|                   | Raw data export                                      | ✅ any format                                                                  | ⚠️ CSV only            |
|                   | Several accounts in one view                         | ✅ one row set per `open_id`                                                   | ⚠️                     |

#### Source authority, per claim type

| Claim type                                            | Source                                                                                                                                                                                              | Confidence                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Endpoint paths** under `TikTok Accounts`            | The scope picker in the portal's Create-New-App dialog, read 2026-08-04                                                                                                                             | **Highest** — it is what the platform actually grants |
| `/business/video/list/` **field names**               | TikTok's own docs text (`video_views`, `reach`, `full_video_watched_rate`, `total_time_watched`, `average_time_watched`, `impression_sources`, `audience_countries`) plus the 7-day / 365-day rules | High                                                  |
| Ads API paths (`/report/integrated/get/`, `/pixel/*`) | TikTok's official SDK repo                                                                                                                                                                          | High                                                  |
| `/business/get/` **field names**                      | **Never verified from an authoritative source.** Every account-level demographic row above is therefore ❔                                                                                          | **Low — resolve in sandbox**                          |

⚠️ **The official SDK does not help here.** `tiktok/tiktok-business-api-sdk`
was checked twice (raw README, then the whole repo via indexed docs) and covers
only the Marketing/Ads API — Campaign, Ad, Audience, Creative, Measurement,
Reporting, BC, plus `/oauth2/access_token/`. It contains **no `/business/*`
endpoints at all**, so it is useful for the token flow and nothing else on this
feature. TikTok's own docs pages are client-rendered and cannot be fetched
programmatically, which is why the picker became the source of record.

**Open verification task:** the first sandbox call should be `/business/get/`
with every plausible field requested, to settle the ❔ rows in one shot —
particularly whether follower age/gender are reachable, since that is the
single biggest capability question left and it drives whether audience work can
ever be automated.

How to read it: the two ❌ columns are the decision, not the ✅ overlap. The
API-only ❌ block (bottom) is small but strategic — history, joins, automation.
What is confirmed Suite-only is now narrow: **LIVE, DMs, retention curves and
"what followers watched"**. The audience demographics block is *unknown*, not
absent. **Both surfaces still stay in the workflow permanently; this is a
complement, not a replacement.**

> **Corrected 2026-08-04** against the scope picker, then re-checked the same
> day. Three rows were wrong in the first survey, all in the pessimistic
> direction: trending search, hashtag suggestion and account benchmarking **do**
> have endpoints, and photo/carousel publishing exists. The earlier claim that
> "Discovery is TikTok's own product and will not open up" was simply false.
> The re-check further downgraded several confident ❌/✅ marks to ❔ once it
> became clear they traced to third-party guides rather than TikTok.
> Lesson recorded deliberately: third-party guides and search results
> under-report a platform's surface; the vendor's own permission picker is the
> only complete inventory, and a claim with no first-party source should carry
> ❔ rather than a confident mark in either direction.

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
- **Authoritative:** the scope picker in the portal's Create-New-App dialog
  (`business-api.tiktok.com`, read 2026-08-04) — the only complete inventory of
  what the platform grants. Account records (which email registered what, the
  legal entity, the agreements signed) live in
  `~/Documents/Work/gold_rose/domain-setup.md`, not here.
- Secondary, surveyed 2026-08-04:
  [API for Business docs](https://business-api.tiktok.com/portal/docs) ·
  [Business video list](https://www.postman.com/tiktok/tiktok-api-for-business/request/7u65xdl/business-video-list) ·
  [Business comment list](https://www.postman.com/tiktok/tiktok-api-for-business/request/6nxw8xx/business-comment-list) ·
  [Audience reports](https://business-api.tiktok.com/portal/docs/audience-reports/v1.3) ·
  [Display API overview](https://developers.tiktok.com/doc/display-api-overview) ·
  [TikTok audience demographics via API](https://www.socialfetch.dev/guides/how-to-get-tiktok-audience-demographics)
</content>
</invoke>
