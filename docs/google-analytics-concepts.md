# Google Analytics concepts → GoldRose analytics design

For Charles, 2026-07-24. Why study GA when we built our own beacon? Because GA
(specifically **GA4**, the current version) is the industry's shared mental
model of web analytics. Our first-party system is a miniature of it — learning
GA gives you the vocabulary to design our analytics, read ad-platform reports,
and know which conventions to keep (like the 30-min session) so our numbers
stay comparable with everyone else's.

## 1. The event model — everything is an event

GA4's core idea: every measurement is an **event** — a named happening with
**parameters** (key–value details). A pageview is just an event named
`page_view` with params like `page_location`. Purchases, clicks, video plays:
all events, one uniform shape.

**GoldRose today:** our beacon records exactly one event type — the pageview
(`components/Beacon.tsx` → POST `/api/beacon` → `page_views` row). The row's
columns (path, referrer, utm) are its parameters.

**Design lesson:** when we extend analytics, we extend by *adding event types*
(see §6), not by bolting on unrelated tables. One uniform event shape is what
makes funnels and behavior analysis possible later.

## 2. Identity — three nested layers

GA tracks *who / which visit / which action* as three layers:

| GA term | Lifetime | GoldRose equivalent |
|---|---|---|
| **User** (client_id cookie; user_id when logged in) | ~forever | `visitor_id` — random id in localStorage, survives across days (`Beacon.tsx` `getVisitorId`) |
| **Session** (visit, 30-min inactivity timeout) | one sitting | `session_id` — sessionStorage + `SESSION_GAP_MS` 30-min rotation (`Beacon.tsx:19`) |
| **Event** (hit) | one moment | one `page_views` row |

Every event carries all three ids, so any question can roll up to "how many
people," "how many visits," or "how many actions." Our beacon mirrors this
exactly — that's by design, not coincidence.

## 3. Dimensions vs metrics — the grammar of every report

- **Metric** = a number you aggregate: sessions, users, pageviews, revenue,
  conversion rate.
- **Dimension** = an attribute you group by: channel, country, campaign,
  posting account, device.

Every analytics report ever is: **one or more metrics, sliced by a dimension,
over a date range**. Our admin cards in this grammar: "Sessions by posting
account" = metric *sessions* × dimension *utm_acc*. "Sales by account" =
metric *revenue* × dimension *utm_acc*. When the boss asks for a new report,
translate the ask into metric × dimension first — if you can't, the ask isn't
specific yet.

## 4. Acquisition — source / medium / campaign and channels

GA's traffic taxonomy, which the whole ad industry shares:

- **source** = where from (`tiktok`, `google`, a referring site)
- **medium** = the kind of traffic (`social`, `cpc` = paid clicks, `email`)
- **campaign** = which marketing push (`rose-video-1`)

These arrive via the five standard **UTM parameters** on links
(`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`).
GA buckets source/medium combos into **default channel groups** — "Paid
Social," "Organic Search," "Direct," "Referral" — so reports read at a human
level. Our `channelOf()` (`lib/admin/channels.ts`) is a small version of that
bucketing, and `utm_acc` is our **custom parameter** (GA calls these custom
dimensions) for the *who within the platform* — deliberately non-standard so
ad tools never overwrite it.

**Design lesson:** taxonomy discipline beats clever code. One agreed spelling
per source (`tiktok`, never `TikTok`/`tt`), lowercase everything, document the
link recipe (TESTER-GUIDE does). Garbage taxonomy in = garbage reports out,
in GA and in ours alike.

## 5. Attribution models — who gets credit for a sale

When a buyer touched several channels, **attribution** decides who gets
credit. The named models:

- **First click** — the touch that *introduced* the customer wins.
- **Last click** — the touch closest to purchase wins (ads industry default).
- **Last non-direct click** — like last click, but "Direct" never steals
  credit from a real channel (GA's long-time default).
- **Data-driven** — GA4's ML model splits credit across touches.

**GoldRose chose first-touch per visitor** for commissions: the order joins
`visitor_id` → the visitor's earliest `page_views` row → `accountOf(views[0])`
(`lib/admin/orders.ts:125`). Rationale: commissions reward the 达人 who
*introduced* the customer; first-touch is also the most stable and explainable
to a salesperson. Know the trade-off: if a customer first arrives via amy but
later returns via bella's link and buys, amy gets the commission — that's a
policy choice, and it's documented, not accidental.

Note our two coexisting rules (both legitimate, different questions): sales
cards attribute **per visitor** (first-ever view); session/traffic cards
attribute **per session** (each session's landing view, `analytics.ts:210`).

## 6. E-commerce events and the funnel — the next big step

GA4 defines **recommended e-commerce events** with standard names:

```
view_item  →  add_to_cart  →  begin_checkout  →  purchase
```

Each carries an `items[]` parameter (product id, name, price, qty). Because
the names are standard, GA can auto-build a **funnel report**: how many
sessions reached each step, and where they drop off ("500 viewed → 80 added →
30 checked out → 12 purchased" — the 80→30 cliff tells you what to fix).

**GoldRose future:** this is exactly the boss's "viewer behavior" idea
(ideas.md 2026-06-28). Our beacon currently sees only pageviews; adding these
three-four events (fired from cart/checkout client code, same beacon endpoint,
an `event_name` column) would light up a funnel card per channel/account —
"amy's traffic converts at 4%, bella's at 1%" becomes visible per *step*.

## 7. Engagement — GA4's quality metrics

GA4 replaced the old "bounce rate" with **engaged sessions**: a session
counts as engaged if it lasted ≥10s, had ≥2 pageviews, or converted.
**Engagement rate** = engaged ÷ total sessions. It's the standard "was this
traffic any good?" number — useful someday to compare 素材 quality beyond raw
session counts (a video that brings 1000 one-second visits loses to one that
brings 300 engaged ones).

## 8. Realtime

GA's Realtime report (visitors right now, last 30 min) ↔ our live-visitors
card (30-second poll). Same concept; the boss's "每时每刻" request was this.

## 9. What GA has that we deliberately skipped — and why first-party

GA4 also brings: **sampling/thresholds** (big data estimated, small numbers
hidden for privacy), **consent mode** (cookie banners; GA cookies are what
GDPR/ePrivacy banners are largely about), data living in Google's hands, and
BigQuery export for raw data. Our first-party beacon trades all that away:
no third-party cookies (localStorage only, our domain), no consent-banner
pressure, no sampling, full raw data in our own Postgres — at the cost of
building reports ourselves. Running GA4 *alongside* the beacon later is
possible (one `gtag.js` snippet) if the boss ever wants industry-standard
dashboards or Google Ads integration — the cost is consent tooling and a
second source of truth that will never exactly match ours (different bots
filtering, different edge rules — expect ±10%, that's normal).

## 10. Design takeaways for GoldRose

1. Keep the **30-min session** and UTM taxonomy — comparability is the value.
2. Every new report request → translate to **metric × dimension × range**.
3. Next analytics increment, when prioritized: **e-commerce events + funnel**
   (§6) — it directly serves the 达人-effectiveness question.
4. Later candidates: engagement rate (§7); a UTM **link-builder page** in the
   admin so the boss composes correct links instead of hand-typing them.
5. Attribution policy is a *business* decision (§5): first-touch for
   commissions is chosen and documented; revisit only with the boss.
