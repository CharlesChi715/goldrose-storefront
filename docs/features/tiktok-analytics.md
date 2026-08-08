---
delivery: backlog
rollout: not-deployed
statusChangedAt: 2026-08-04
---

# tiktok-analytics

## Context

Read ELDREVE's own TikTok metrics through the API, to answer which video
produced revenue on eldreve.com — a question TikTok's own Business Suite
cannot see.

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

| Option                                | Pros                                                                                                 | Cons                                                                                                                       | Verdict |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| Do nothing; read Business Suite       | Zero build cost; covers every metric TikTok exposes                                                  | 60-day window, CSV-only export, no join to orders, no automation; history silently expires                                 | pending |
| Collector only (no UI)                | ~150 lines; starts accumulating history immediately; unblocks the revenue join later; no design work | No product surface until a dashboard is built; needs an approved app before it can run at all                              | pending |
| Collector + `/admin/tiktok` dashboard | Full replacement for the analytics half of Business Suite                                            | Rebuilds what TikTok already gives free; still cannot reach LIVE, DMs or retention curves at any effort (see Tech details) | pending |

## Acceptance criteria

Restored 2026-08-08 from the Chinese mirror, which had kept them after the
English section was emptied.

- [ ] An approved TikTok app authenticates the ELDREVE business account and
      returns the video list.
- [ ] One row per video per day lands in Supabase; re-running the same day is
      idempotent (no duplicate rows).
- [ ] Rows outlive TikTok's own 60-day analytics window — day 1's figures are
      still in the table 90 days later.
- [ ] A video arrived at via `?utm_source=tiktok&utm_content=<video_id>` joins
      from `page_views` through to an order.
- [ ] Human acceptance: Charles compares one video's archived figures against
      Business Suite for the same day and they agree.

## Plan

Staged so each stage is independently useful:

| #   | Stage                  | Work                                                                                                                                                                                                                       |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Access                 | Register the app on `business-api.tiktok.com` with the three scopes in *Tech details*; complete app review (see Blockers). App name `ELDREVE Storefront Analytics`; redirect URL `https://eldreve.com/api/tiktok/callback` |
| 1b  | Callback route         | `app/api/tiktok/callback/route.ts` — receive `auth_code`, exchange for tokens, persist the refresh token. Must exist before the authorize link is clicked                                                                  |
| 2   | Schema                 | `supabase/migrations/0007_tiktok_metrics.sql` — one row per (video_id, captured_on)                                                                                                                                        |
| 3   | Collector              | Scheduled pull of `/business/video/list/`; upsert on the composite key                                                                                                                                                     |
| 4   | Attribution link       | Link recipe `?utm_source=tiktok&utm_content=<video_id>` documented for whoever posts                                                                                                                                       |
| 5   | Dashboard *(deferred)* | `/admin/tiktok` reading accumulated history; only worth building once history exists                                                                                                                                       |

## Tech details

### Two portals, not one

TikTok runs two separate developer platforms with separate app registrations
and separate docs. Searching the wrong one returns endpoints we cannot use.

| Portal                    | Contains                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
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

| Sub-group             | Why                                                                     |
| --------------------- | ----------------------------------------------------------------------- |
| **Account User**      | `/business/get/` — account and follower metrics                         |
| **Get Account Media** | `/business/video/list/` — per-video performance                         |
| **Account Comment**   | `/business/comment/list/` - list, reply, hide, delete on our own videos |

Deliberately **not** requested:

| Sub-group                | Why not                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Account Post Content** | ⚠️ Write access — publishes videos and photos to the live account. The single most dangerous permission in the group, and the collector never posts. |
| Business Benchmark       | Reads fine in the dashboard; no need to hold the permission to chart it                                                                              |
| Discovery Search         | Trend research is a human activity in Business Suite, not something the collector automates                                                          |
| Auth Code Management     | Not needed for a single first-party authorization                                                                                                    |

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

## Related links

- [posting-account-attribution.md](posting-account-attribution.md) — the
  `utm_acc` decision and the beacon's UTM capture this would join against.
- [engagement-tracking.md](engagement-tracking.md) — on-site
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

---

# 中文对照（全文翻译）

> 仅为方便阅读的译文，**不是权威版本**。任何冲突以上方英文正文为准。
> 端点路径、字段名、文件路径、专有名词一律保留英文原文。

## 背景

用 API 读取 ELDREVE 自己的 TikTok 数据，回答"哪条视频在 eldreve.com 上带来了
收入"——这个问题 TikTok 自带的 Business Suite 看不到。

- 老板的想法（`docs/ideas.md` 第 81 行，原文）：*"tiktok 数据分析"*。同一文件里
  相关的几行还提到：内容会发布到 Facebook / TikTok / IG，达人要在美国找。
- Charles 在 2026-08-04 提出：能不能干脆用 TikTok 的 API 把 Business Suite
  重做一遍。
- Business Suite 免费，而且已经回答了"看板"这个问题。它回答不了商业问题——
  **哪一条视频在 eldreve.com 上带来了收入**——因为它看不见我们的网站。要在这里
  动手做东西，理由是这个缺口，而不是把图表画得更好看。
- 上线前的现状：还没签任何达人，没有投放，只发了几条内容。所以**看板**为时过早；
  **采集器**未必，原因是"技术细节"里的两条衰减规则——没采到的历史数据是找不回来的。

## 决定

尚未决定——BACKLOG。范围与时机见 OQ-1；账号类型见 OQ-2。

## 备选方案

先记录下来供日后决策，目前一个都没选。

| 方案                              | 优点                                                                | 缺点                                                                                            | 结论 |
| --------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---- |
| 什么都不做，直接看 Business Suite | 零开发成本；TikTok 暴露的每个指标它都有                             | 只有 60 天窗口、只能导出 CSV、无法和订单关联、无法自动化；历史会静默过期                        | 待定 |
| 只做采集器（不做界面）            | 约 150 行代码；立刻开始累积历史；为日后的收入关联扫清障碍；无需设计 | 在看板做出来之前没有任何产品界面；而且必须先有一个过审的 app 才能跑起来                         | 待定 |
| 采集器 + `/admin/tiktok` 看板     | 完整替代 Business Suite 里做分析的那一半                            | 重做 TikTok 已经免费给的东西；而且无论花多少力气都拿不到 LIVE、私信、完播留存曲线（见技术细节） | 待定 |

## 验收标准

- [ ] 一个过审的 TikTok app 能够认证 ELDREVE 商业账号，并返回视频列表。
- [ ] 每条视频每天在 Supabase 落一行；同一天重复跑是幂等的（不产生重复行）。
- [ ] 数据行能活过 TikTok 自己的 60 天分析窗口——即 90 天之后，表里仍然存有
      第 1 天的数字。
- [ ] 通过 `?utm_source=tiktok&utm_content=<video_id>` 进来的视频，能从
      `page_views` 一路关联到订单。
- [ ] 人工验收：Charles 把某条视频的存档数字和 Business Suite 同一天的数字对比，
      两边一致。

## 计划

分阶段安排，每一阶段本身都有价值：

| #   | 阶段           | 工作内容                                                                                                                                                                                        |
| --- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 拿到访问权     | 在 `business-api.tiktok.com` 注册 app，勾选"技术细节"里的那三个 scope；完成 app 审核（见"阻塞项"）。App 名称 `ELDREVE Storefront Analytics`；回调地址 `https://eldreve.com/api/tiktok/callback` |
| 1b  | 回调路由       | `app/api/tiktok/callback/route.ts` —— 接收 `auth_code`，换取 token，持久化 refresh token。必须在点击授权链接之前就存在                                                                          |
| 2   | 表结构         | `supabase/migrations/0007_tiktok_metrics.sql` —— 每个 (video_id, captured_on) 一行                                                                                                              |
| 3   | 采集器         | 定时拉取 `/business/video/list/`；按复合键 upsert                                                                                                                                               |
| 4   | 归因链接       | 把链接配方 `?utm_source=tiktok&utm_content=<video_id>` 写成文档给发帖的人                                                                                                                       |
| 5   | 看板*（延后）* | `/admin/tiktok` 读取已累积的历史；只有当历史数据存在了才值得做                                                                                                                                  |

## 技术细节

### 是两个平台，不是一个

TikTok 有两个彼此独立的开发者平台，app 要分别注册，文档也各自分开。搜错了那一个，
返回的端点我们根本用不了。

| 平台                      | 内容                                                            |
| ------------------------- | --------------------------------------------------------------- |
| `developers.tiktok.com`   | Login Kit、Display API、Content Posting API、Research API       |
| `business-api.tiktok.com` | **API for Business** —— Business Account API、Ads API、受众报告 |

我们要的是第二个。Display API 只返回那四个虚荣指标；Business Suite 背后靠的是
Business Account API。

### `TikTok Accounts` scope 组里的端点（v2.0）

2026-08-04 从平台"新建 App"对话框的 scope 选择器里逐字抄下。**这份清单才是权威**
——它是平台实际会授予的东西，文档和第三方教程都不是。

（端点清单见上方英文正文的代码块，此处不重复。）

### 要申请的 scope

这个组下面的子组可以分别勾选。只申请下面这三个，其余一律不要：

| 子组                  | 为什么                                                                |
| --------------------- | --------------------------------------------------------------------- |
| **Account User**      | `/business/get/` —— 账号与粉丝指标                                    |
| **Get Account Media** | `/business/video/list/` —— 单条视频的表现数据                         |
| **Account Comment**   | `/business/comment/list/` —— 对我们自己的视频做列表、回复、隐藏、删除 |

**故意不申请**的：

| 子组                     | 为什么不要                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Account Post Content** | ⚠️ 写权限——会往正在运营的账号直接发布视频和图片。这是整个组里最危险的一项权限，而采集器从来不发内容。 |
| Business Benchmark       | 在看板里正常可读；要画这个图不需要持有这项权限                                                        |
| Discovery Search         | 趋势研究是人在 Business Suite 里做的事，不是采集器要自动化的东西                                      |
| Auth Code Management     | 只做一次第一方授权，用不上                                                                            |

理由：每勾一个 scope，就等于我们的 `app_secret` 一旦泄露就能永久行使的一项能力；
而且 TikTok 明确把"过度申请权限"列为审核不通过的原因之一。只读的 scope 伤不到账号，
`Account Post Content` 可以。scope 以后还能通过重新审核加上，所以一开始就申请得窄，
代价只是**万一老板改主意时**多走一轮审核——换来的是永久缩小的爆炸半径。

### `Ad Account Management` scope 组里的端点（v2.0）

同样是 2026-08-04 从那个选择器里逐字抄下。记录在此，是为了让"跳过这个组"的决定
有证据支撑，而不是靠猜。**结论：这一组里没有任何东西对采集器有用。** 这个组管的是
*Business Center*——广告代理商用来管理大量广告主账号、资产、成员和发票的控制台。
我们只有一个账号，没有广告支出，也没有代理商结构。

标了 ⁇ 的说明是**从路径名推断的**，不是从 TikTok 文档读来的；只有
`/oauth2/advertiser/get/` 是确认过的（它出现在 TikTok 官方 SDK 里）。

| 端点                                     | 干什么用                                 | 类型   | 对我们有用吗 |
| ---------------------------------------- | ---------------------------------------- | ------ | :----------: |
| `/oauth2/advertiser/get/`                | 当前 access token 被授权的广告主账号 ID  | 读     | ❌           |
| `/bc/inspiration_tool/audience_insight/` | ⁇ 灵感工具里的受众洞察数据，用于投放规划 | 读     | ❌           |
| `/bc/inspiration_tool/ad_performance/`   | ⁇ 用于规划的广告表现基准数据             | 读     | ❌           |
| `/bc/advertiser/disable/`                | 停用 Business Center 下的某个广告账号    | **写** | ❌           |
| `/bc/advertiser/qualification/get/`      | ⁇ 广告主的资质／认证材料状态             | 读     | ❌           |
| `/bc/advertiser/attribute/`              | ⁇ 广告主属性（行业、类目）               | ⁇      | ❌           |
| `/bc/advertiser/unionpay_info/check/`    | ⁇ 校验银联支付信息（中国支付通道）       | 读     | ❌           |
| `/bc/advertiser/unionpay_info/submit/`   | ⁇ 提交银联支付信息                       | **写** | ❌           |
| `/bc/account/transaction/get/`           | ⁇ 交易记录——充值与转账                   | 读     | ❌           |
| `/bc/account/cost/get/`                  | ⁇ 每个广告账号的消耗／成本数字           | 读     | ❌           |
| `/bc/account/budget/changelog/get/`      | ⁇ 预算变更历史                           | 读     | ❌           |
| `/asset/bind/quota/`                     | ⁇ 绑定资产的剩余配额                     | 读     | ❌           |
| `/bc/pixel/get/`                         | Business Center 拥有的 pixel             | 读     | ❌           |
| `/bc/asset/account/authorization/`       | ⁇ 授权／关联某项资产到某个账号           | **写** | ❌           |
| `/bc/asset/advertiser/assign/`           | 把资产分配给广告主                       | **写** | ❌           |
| `/bc/asset/advertiser/unassign/`         | 解除该分配                               | **写** | ❌           |
| `/bc/asset/advertiser/assigned/`         | 列出某项资产被分配给了哪些广告主         | 读     | ❌           |
| `/bc/oa/create/`                         | ⁇ 在 BC 下创建一个自有／官方账号条目     | **写** | ❌           |
| `/bc/member/assign/`                     | 给成员（人）分配资产或角色               | **写** | ❌           |
| `/bc/invoice/billing_report/get/`        | ⁇ 发票与账单报表                         | 读     | ❌           |
| `/bc/asset_group/create/`                | 创建资产分组                             | **写** | ❌           |
| `/bc/asset_group/get/`                   | 读取单个资产分组                         | 读     | ❌           |
| `/bc/asset_group/update/`                | 更新资产分组                             | **写** | ❌           |
| `/bc/asset_group/list/`                  | 列出资产分组                             | 读     | ❌           |
| `/bc/asset_group/delete/`                | 删除资产分组                             | **写** | ❌           |
| `/bc/child/invite/`                      | 邀请子 Business Center                   | **写** | ❌           |
| `/bc/child/unbind/`                      | 解绑子 Business Center                   | **写** | ❌           |

注意这个形状：**27 个里有 13 个是写操作**，其中好几个是破坏性的
（`advertiser/disable/`、`asset_group/delete/`、`child/unbind/`）或者涉及资金
（`unionpay_info/submit/`）。这就是最小权限原则最具体的论据——为了"显得全面"而勾上
这一组，等于把"停用广告账号"和"提交支付信息"的能力交给我们的 `app_secret`，
换回来的分析数据是零，因为那些我们从 `/business/*` 本来就拿得到。

### 能力对照表 —— API vs Business Suite

把两边的功能集合并起来，API 这一侧每一项能力后面都注明是哪个端点。
**✅** 可用 · **⚠️** 部分可用 · **❌** 不可用 · **❔** 端点存在，但具体字段未经证实
——在真正用过审的 app 看到之前，一律按"不可用"对待。

每一块的资料来源权威度不同，表格下方分别说明。

| 分类           | 功能                               | API —— 端点／字段                                                        | Business Suite    |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------ | :---------------: |
| **账号**       | 用户名、昵称、头像                 | ✅ `/business/get/`                                                      | ✅                |
|                | 粉丝数                             | ✅ `/business/get/`                                                      | ✅                |
|                | 总获赞数                           | ✅ `/business/get/`                                                      | ✅                |
|                | 主页浏览量                         | ❔ `/business/get/` —— 字段未证实                                        | ✅                |
|                | 一段时间内的粉丝增长               | ⚠️ `/business/get/` 每天轮询；API 返回的是存量，增量由我们自己算         | ✅                |
| **视频指标**   | 列出我们所有视频                   | ✅ `/business/video/list/`                                               | ✅                |
|                | 每条视频的播放量                   | ✅ `video_views`（自然流量 **+ 付费** 合并计算）                         | ✅                |
|                | 每条视频的点赞／评论／分享         | ✅ `/business/video/list/`                                               | ✅                |
|                | 触达人数                           | ✅ `reach`                                                               | ✅                |
|                | 总观看时长 + 平均观看时长          | ✅ `total_time_watched`、`average_time_watched`                          | ✅                |
|                | 完播率                             | ✅ `full_video_watched_rate`                                             | ✅                |
|                | 流量来源（推荐／关注／搜索／主页） | ✅ `impression_sources`                                                  | ✅                |
|                | 单条视频的受众地区                 | ✅ `audience_countries`                                                  | ✅                |
|                | 收藏数                             | ❔ `collect_count` 是 **Display API** 的字段；在这里未经证实             | ✅                |
|                | 留存／跳出曲线                     | ❌ 没有端点                                                              | ✅                |
|                | 超过 7 天无互动的视频的洞察数据    | ❌ 字段会消失                                                            | ❌                |
|                | 发布超过 365 天的内容数据          | ❌ 停止更新                                                              | ❌                |
| **受众**       | 粉丝地区分布                       | ❔ `/business/get/` —— 字段未证实                                        | ✅                |
|                | 粉丝**性别**分布                   | ❔ 未证实 —— 见下方说明                                                  | ✅                |
|                | 粉丝**年龄**分布                   | ❔ 未证实 —— 见下方说明                                                  | ✅                |
|                | 粉丝活跃时段／日期                 | ❔ 未证实 —— 见下方说明                                                  | ✅                |
|                | 粉丝还看了／听了什么               | ❌ 没有端点                                                              | ✅                |
| **评论**       | 列出我们视频下的评论               | ✅ `/business/comment/list/`                                             | ✅                |
|                | 获取某条评论的回复                 | ✅ `/business/comment/reply/list/`                                       | ✅                |
|                | 回复某条评论                       | ✅ `/business/comment/reply/create/`                                     | ✅                |
|                | 发表评论                           | ✅ `/business/comment/create/`                                           | ✅                |
|                | 点赞／取消点赞评论                 | ✅ `/business/comment/like/`                                             | ✅                |
|                | 隐藏／取消隐藏评论                 | ✅ `/business/comment/hide/`                                             | ✅                |
|                | 删除评论                           | ✅ `/business/comment/delete/`                                           | ✅                |
|                | 置顶评论                           | ✅ `/business/comment/pin/`                                              | ✅                |
|                | 批量／按规则自动审核               | ✅ 用 `comment/list/` + `hide/` + `delete/` 组合实现                     | ⚠️ 只有关键词过滤 |
|                | 私信收件箱                         | ❌ 没有端点                                                              | ✅                |
|                | 自动回复／关键词自动私信           | ❌（只能做评论，见上一行）                                               | ✅                |
| **发布**       | 发布视频                           | ✅ `/business/video/publish/`                                            | ✅                |
|                | 发布图片／图集                     | ✅ `/business/photo/publish/`                                            | ✅                |
|                | 查询发布状态                       | ✅ `/business/publish/status/`                                           | ✅                |
|                | 视频设置（评论、合拍、拼接）       | ✅ `/business/video/settings/`                                           | ✅                |
|                | 给内容加地点                       | ✅ `/business/publish/location/`                                         | ✅                |
|                | 为 Spark Ads 授权某条内容          | ✅ `/business/post/authorize/`（含 `/status/`、`/delete/`、`/setting/`） | ✅                |
|                | 上传为草稿／到收件箱               | ❔ 不在这个 scope 组里                                                   | ✅                |
|                | 定时发布                           | ⚠️ 没有端点 —— 自己跑 cron 调 `video/publish/`                           | ✅                |
| **直播**       | 直播观看、时长、钻石、新增粉丝     | ❌ 没有端点                                                              | ✅                |
|                | 开播／直播控制                     | ❌ 没有端点                                                              | ✅                |
| **发现**       | 趋势搜索                           | ✅ `/discovery/trending/search/`、`/discovery/trending/search/keyword/`  | ✅                |
|                | 话题标签推荐                       | ✅ `/business/hashtag/suggestion/`                                       | ✅                |
|                | 与同类账号做对标                   | ✅ `/business/benchmark/`                                                | ✅                |
|                | 达人广场（找达人）                 | ⚠️ 属于独立的 **TCM** scope 组；端点尚未查阅                             | ✅                |
|                | 内容灵感／Coach 建议               | ❌ 没有端点                                                              | ✅                |
| **电商／广告** | 广告计划的创建与管理               | ⚠️ **Ads API** —— `/campaign/`、`/adgroup/`、`/ad/`                      | ✅                |
|                | 广告报表                           | ⚠️ **Ads API** —— `/report/integrated/get/`、`/report/task/create/`      | ✅                |
|                | 网页转化 pixel / Events            | ⚠️ **Ads API** —— `/pixel/create/`、`/pixel/list/`                       | ✅                |
|                | 给已有内容加热                     | ⚠️ 通过 Spark Ads（`post/authorize/`）+ Ads API                          | ✅                |
|                | TikTok Shop 商品管理               | ⚠️ 属于独立的 **Shop Partner API**                                       | ✅                |
|                | 线索收集表单                       | ⚠️ 属于独立的 **Lead Management** scope 组                               | ✅                |
| **数据处理**   | 60 天窗口以外的历史                | ✅ 存在我们自己的库里，不需要端点                                        | ❌                |
|                | 关联到 eldreve.com 的访问／订单    | ✅ 我们自己的 SQL，不需要端点                                            | ❌                |
|                | 数据暴涨或暴跌时自动告警           | ✅ 我们自己的 cron，不需要端点                                           | ❌                |
|                | 定时／无人值守访问                 | ✅ refresh token 流程                                                    | ❌                |
|                | 任意自定义时间区间                 | ✅ 我们自己的 SQL                                                        | ⚠️ 有上限         |
|                | 原始数据导出                       | ✅ 任何格式                                                              | ⚠️ 只能 CSV       |
|                | 多个账号放在一个视图里             | ✅ 每个 `open_id` 一组数据行                                             | ⚠️                |

#### 各类结论的资料来源与可信度

| 结论类型                                              | 来源                                                                                                                                                                                      | 可信度                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `TikTok Accounts` 下的**端点路径**                    | 平台"新建 App"对话框里的 scope 选择器，2026-08-04 读取                                                                                                                                    | **最高** —— 这就是平台实际授予的 |
| `/business/video/list/` 的**字段名**                  | TikTok 自己的文档正文（`video_views`、`reach`、`full_video_watched_rate`、`total_time_watched`、`average_time_watched`、`impression_sources`、`audience_countries`）以及 7 天／365 天规则 | 高                               |
| Ads API 路径（`/report/integrated/get/`、`/pixel/*`） | TikTok 官方 SDK 仓库                                                                                                                                                                      | 高                               |
| `/business/get/` 的**字段名**                         | **从未从权威来源证实过。** 因此上表里每一行账号级人口属性都标了 ❔                                                                                                                        | **低 —— 需要在 sandbox 里解决**  |

⚠️ **官方 SDK 在这件事上帮不上忙。** `tiktok/tiktok-business-api-sdk` 查了两遍
（先看原始 README，再通过索引文档看整个仓库），它只覆盖 Marketing/Ads API——
Campaign、Ad、Audience、Creative、Measurement、Reporting、BC，外加
`/oauth2/access_token/`。里面**完全没有 `/business/*` 端点**，所以它对这个功能来说，
除了 token 流程之外没有别的用处。TikTok 自己的文档页面是客户端渲染的，程序抓不下来
——这正是那个 scope 选择器成为记录依据的原因。

**待验证任务：** sandbox 里的第一个调用应该是 `/business/get/`，把所有可能的字段
一次性全都请求一遍，把上表里的 ❔ 一次性解决——尤其是粉丝年龄／性别到底拿不拿得到，
因为这是剩下最大的一个能力问题，而且它决定了受众相关的工作能不能自动化。

怎么读这张表：决定在于两侧的 ❌，而不是中间重叠的 ✅。API 独有的 ❌ 那一块虽小但很关键
——历史、关联、自动化。确认只有 Suite 才有的，现在范围已经很窄：**直播、私信、留存曲线，
以及"粉丝还看了什么"**。受众人口属性那一块属于*未知*，不是*没有*。
**两边都会长期留在工作流里；这是互补，不是替代。**

> **2026-08-04 更正**：对着 scope 选择器核对了一遍，当天又复查了一次。第一次调研有
> 三行是错的，而且全都错在过于悲观的方向：趋势搜索、话题标签推荐、账号对标**都有**
> 端点，图片／图集发布也是存在的。之前那句"Discovery 是 TikTok 自己的产品，不会开放"
> 纯属错误。复查还把若干原本很确定的 ❌/✅ 降级成了 ❔——因为发现它们的依据其实来自
> 第三方教程，而不是 TikTok。
> 特意记下的教训：第三方教程和搜索结果会低报一个平台的真实能力面；厂商自己的权限
> 选择器才是唯一完整的清单；没有第一方来源的结论，应该标 ❔，而不是在任何一个方向上
> 打一个自信的勾或叉。

### 平台的硬性约束

- **API 永远不可能超过看板。** TikTok 明说：如果 TikTok Analytics 里没有某个指标，
  API 也不会返回它。
- **365 天上限** —— 内容发布 365 天后，数据停止更新。
- **7 天洞察衰减** —— 超过 7 天没有互动的视频，洞察类字段（流量来源、地区分布）
  就不再可用。
- 对排期的推论：采集器的价值严格取决于它开始得有多早。以后再做的看板，只能画出
  当时已经在存的那些数据。

### 关联键

`utm_content` 已经由埋点脚本连同 `utm_source`、`utm_medium`、`utm_campaign`、
`utm_term`、`utm_acc` 一起采集，所以把 TikTok 的 video id 放进 `utm_content`
不需要改采集端任何东西。这和 [posting-account-attribution](posting-account-attribution.md)
的做法一致——那次把"发帖账号"挪到了它自己的 `utm_acc` 标签上，正是为了让
`utm_content` 回归本职：标识访客是从**哪一条创意**来的。

## 阻塞项与依赖

- **一切都卡在 app 审核上。** Business API 要求 app 过审，而过审要求在一个已验证的
  域名上有可访问的隐私政策 URL 和条款 URL。`eldreve.com` 已经上线并通过验证，但那
  七个 `/policies/*` 路由还是"即将上线"的占位页——审核能过之前，它们需要真实内容。
- **账号类型卡住 API。** Business Account API 的端点要求 TikTok 账号是商业账号，
  这就是下面的 OQ-2。
- 对 `posting-account-attribution` 的依赖只在于埋点的 UTM 采集，而那部分已经做完，
  正在 UAT。

## 待决问题

- **OQ-1 —— 现在就做采集器，还是等上线之后？** 看板显然是上线后的事：发布队列里
  有八项排在它前面，而且几乎没有数据可画。真正要现在回答的是采集器，因为 365 天和
  7 天这两条规则意味着**没采到的历史就永远没有了**。*建议：* app 审核一通过就把
  采集器做掉，看板继续留在 backlog。成本大致是一个 migration 加一个定时脚本。

- **OQ-2 —— ELDREVE 的 TikTok 用商业号还是创作者号？** 商业号是 Business API、
  广告、pixel 和 Shop 的前提，但它被限制在商用音乐库里，会失去热门音乐。创作者号
  保留完整音乐库——而对一个要蹭情人节／母亲节音频热点的礼品类产品来说，音乐恰恰是
  真正的分发机制。*建议：* 上报老板决定。这是一个营销层面的取舍（自然流量 vs 商业
  工具），不是技术问题，而且它可能更应该写在 SUMMARY.md 的"Product decisions"里，
  而不是这里。

## 相关链接

- [posting-account-attribution.md](posting-account-attribution.md) —— `utm_acc`
  的决定，以及本功能要关联的那份埋点 UTM 采集。
- [engagement-tracking.md](engagement-tracking.md) —— 站内停留
  数据，是"哪条视频带来了互动"这个问题的另一半。
- **权威来源：** 平台"新建 App"对话框里的 scope 选择器
  （`business-api.tiktok.com`，2026-08-04 读取）—— 关于平台到底授予什么，这是唯一
  完整的清单。账号类记录（哪个邮箱注册了什么、法律主体、签了哪些协议）在
  `~/Documents/Work/gold_rose/domain-setup.md`，不在这里。
- 次要来源，2026-08-04 调研：
  [API for Business docs](https://business-api.tiktok.com/portal/docs) ·
  [Business video list](https://www.postman.com/tiktok/tiktok-api-for-business/request/7u65xdl/business-video-list) ·
  [Business comment list](https://www.postman.com/tiktok/tiktok-api-for-business/request/6nxw8xx/business-comment-list) ·
  [Audience reports](https://business-api.tiktok.com/portal/docs/audience-reports/v1.3) ·
  [Display API overview](https://developers.tiktok.com/doc/display-api-overview) ·
  [TikTok audience demographics via API](https://www.socialfetch.dev/guides/how-to-get-tiktok-audience-demographics)
