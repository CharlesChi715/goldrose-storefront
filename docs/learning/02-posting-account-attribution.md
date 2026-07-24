# Feature Learning 02 — Posting-Account Attribution (Commissions)

Traced end to end per [learning-docs-guideline.md](learning-docs-guideline.md).
Commit: `17730c3 feat(analytics): per-account attribution for sales commissions`.

## Feature Summary

**What it does**
The owner runs several social accounts per platform (e.g. multiple TikTok accounts, one per salesperson). Each account posts links tagged with its own `utm_content` name, e.g.

```
https://goldrose-storefront.vercel.app/?utm_source=tiktok&utm_content=amy&utm_campaign=rose-video-1
```

When a visitor clicks such a link, browses, and buys, the admin can see:
- **Analytics** → "Sessions by posting account" and "Sales by posting account (for commissions)" cards, with rows like **TikTok · amy**.
- **Order detail** → a "Referred by account: TikTok · amy" line in the Conversion summary.

**Why it exists**
Commission. The owner pays each salesperson by which account brought the buyer (owner idea in [docs/ideas.md](../ideas.md)). Channel attribution ("TikTok") already existed; this adds the *who within the platform*.

Two design decisions shape it:

1. **Nothing new is stored.** The feature writes zero new data. The beacon already saved `utm_content` inside the `utm` JSON of every page view, and orders already carried `visitor_id`. Attribution is *computed at read time* from those two facts — so the labeling rule (e.g. the "TikTok · amy" format) can change later and it re-labels all history retroactively.
2. **First-touch wins.** An order is credited to the account on the visitor's *first-ever recorded page view* — the click that introduced them to the store — not whatever link they last clicked before buying.

Key jargon used below:
- **UTM tags** = standard `utm_*` query parameters marketers append to links. This feature repurposes `utm_content` to mean "posting account".
- **Beacon** = the first-party analytics ping ([components/Beacon.tsx](../../components/Beacon.tsx)) mounted site-wide; it POSTs one `page_views` row per storefront page view. No cookies, no third parties.
- **Visitor vs session**: `visitorId` is a random ID in `localStorage` (persists across visits — identifies the *person's browser*); `sessionId` lives in `sessionStorage` and rotates after 30 min of inactivity (identifies *one sitting*).
- **First-touch attribution** = crediting a conversion to the earliest marketing contact, as opposed to last-touch (the most recent one).

## Code Trace

```text
 WRITE PATH (data capture — existed before this feature)
 ────────────────────────────────────────────────────────
 owner posts link  …?utm_source=tiktok&utm_content=amy
        │
 visitor clicks ──▶ storefront page renders
                    components/Beacon.tsx (client, mounted site-wide)
                      │ getVisitorId()  ← localStorage  (persistent)
                      │ getSessionId()  ← sessionStorage (30-min rotate)
                      │ reads utm_source/…/utm_content from location.search
                      └─ POST /api/beacon {visitorId, sessionId, path, referrer, utm}
                                              │
                                              ▼
                    app/api/beacon/route.ts (server, service credentials)
                      └─ insert page_views row {visitor_id, session_id, utm: {utm_content:"amy"}, country ← geo-IP header}

 visitor buys ────▶ app/checkout/CheckoutClient.tsx
                      └─ payload includes visitorId (same localStorage value)
                         POST /api/checkout ─▶ createOrder()
                                                └─ orders.visitor_id = visitorId
                                                   ★ the only link between an order and its page views

 READ PATH (this feature — three consumers of one function)
 ──────────────────────────────────────────────────────────
                    lib/admin/channels.ts  accountOf(view)
                      │ utm_content missing/blank? → null (untagged traffic is invisible)
                      └ else "TikTok · amy"  (channelOf() prefix keeps same-named
                                              accounts on different platforms apart)
            ┌───────────────┬────────────────────┐
            ▼               ▼                    ▼
 admin opens /admin/analytics              admin opens /admin/orders/[id]
 app/admin/(dashboard)/analytics/page.tsx  app/admin/(dashboard)/orders/[id]/page.tsx
   └─ analyticsSummary(range)                └─ adminOrderDetail → conversionFor(order.visitor_id)
      lib/admin/analytics.ts                    lib/admin/orders.ts
      │ firstViewByVisitor / firstViewBySession │ all page_views for the visitor, time-sorted
      │ sessions: accountOf(session landing)    │ account = accountOf(views[0])  ← first touch
      │   → trafficByAccount                    ▼
      │ orders:   accountOf(visitor first view) OrderDetailView.tsx
      │   → salesByAccount                        "Referred by account: TikTok · amy"
      ▼
   AnalyticsDashboard.tsx
     ├─ ListCard "Sessions by posting account"        TikTok · amy   3
     └─ ListCard "Sales by posting account            TikTok · amy (1)  $159.00
                  (for commissions)"                        └ orders ┘   └ net sales
```

### Step 1 — Entry point: the tagged link and the beacon

The feature "starts" outside the code: the owner tags each account's links per the convention in [docs/USER-GUIDE.md](../USER-GUIDE.md) ("Marketing links", EN + 中文) — same `utm_content` in every link that account posts.

[components/Beacon.tsx](../../components/Beacon.tsx) is a client component rendered on every storefront page (never `/admin`). On each navigation it reads the five standard UTM params from the URL — `utm_content` included, values capped at 120 chars ([Beacon.tsx:78-85](../../components/Beacon.tsx#L78-L85)) — and fire-and-forgets a POST to `/api/beacon` with the visitor/session IDs ([Beacon.tsx:94-99](../../components/Beacon.tsx#L94-L99)). Fire-and-forget means a failed beacon never breaks browsing, and cached pages stay cached because tracking happens client-side after render.

[app/api/beacon/route.ts](../../app/api/beacon/route.ts) zod-validates the body and inserts one `page_views` row ([route.ts:36-47](../../app/api/beacon/route.ts#L36-L47)); the `utm` object is stored as JSON, so `utm_content` rides along with no schema change. `country` comes from Vercel's geo-IP header, never the client.

**Only the landing view carries the tags.** The visitor clicks through to `/products/...` and `/checkout` with clean URLs, so later views of the same session have `utm: null`. Every read below therefore looks at *first* views.

### Step 2 — Tying the order to the visitor

When the visitor pays, [CheckoutClient.tsx:289-291](../../app/checkout/CheckoutClient.tsx#L289-L291) reads the *same* localStorage visitor ID via `getVisitorId()` (exported from Beacon.tsx precisely for this) and includes it in the checkout payload. The API route passes it into `createOrder()`, which stores it as `orders.visitor_id` ([lib/orders/db.ts:197](../../lib/orders/db.ts#L197)). That one column is the entire bridge between "anonymous browsing history" and "money".

### Step 3 — The one labeling authority: accountOf()

[lib/admin/channels.ts:82-89](../../lib/admin/channels.ts#L82-L89) — `accountOf(view)`:

- No `utm_content` (or whitespace-only) → `null`. Callers skip null, so untagged traffic simply doesn't appear in the account cards — no "Unattributed" noise (contrast with "Sales by traffic source", which does show an Unattributed row).
- Otherwise it prefixes the existing `channelOf()` label: `utm_source=tiktok&utm_content=amy` → **"TikTok · amy"**. The prefix is why an "amy" on TikTok and an "amy" on Instagram stay two separate commission rows. A tag with no channel signal at all falls back to the bare name (`"amy"`).

All three UI surfaces call this one function, so the label is identical everywhere.

### Step 4 — Analytics aggregation

[lib/admin/analytics.ts](../../lib/admin/analytics.ts) `analyticsSummary()` loads all orders and all page views once (React `cache()` dedupes per request), then builds two lookup maps by sorting views by time ([analytics.ts:212-221](../../lib/admin/analytics.ts#L212-L221)):

- `firstViewByVisitor` — a visitor's first-ever view (first touch).
- `firstViewBySession` — a session's landing view (the one still carrying UTM tags).

Then two aggregations, mirroring the existing channel/campaign ones:

- **Sales**: for each order in range, `accountOf(firstViewByVisitor[order.visitor_id])`; if non-null, add the order's `total_cents − refunded_cents` to that account's bucket ([analytics.ts:234-240](../../lib/admin/analytics.ts#L234-L240)). Refunds reduce the commission basis automatically.
- **Sessions**: for each session in range, `accountOf(landing view)` → count ([analytics.ts:260-263](../../lib/admin/analytics.ts#L260-L263)).

Both come out sorted descending (top earner first) as `salesByAccount` / `trafficByAccount` on the `AnalyticsSummary` type.

Note the deliberate asymmetry: **sessions credit the session's landing tag** (a returning visitor who clicks ben's link later counts as a ben *session*), but **sales credit the visitor's first-ever tag** (the order still pays amy, who found the buyer). First touch is the commission rule.

### Step 5 — Rendering: two ListCards

[app/admin/(dashboard)/analytics/page.tsx:22-23](../../app/admin/%28dashboard%29/analytics/page.tsx#L22-L23) (server) calls `analyticsSummary(range)` and hands the summary to [AnalyticsDashboard.tsx](../../app/admin/%28dashboard%29/analytics/AnalyticsDashboard.tsx), which adds one `ListCard` to the sessions grid ([AnalyticsDashboard.tsx:307-314](../../app/admin/%28dashboard%29/analytics/AnalyticsDashboard.tsx#L307-L314)) and one to the sales grid ([AnalyticsDashboard.tsx:350-357](../../app/admin/%28dashboard%29/analytics/AnalyticsDashboard.tsx#L350-L357)) — the sales row label is `"TikTok · amy (3)"` (order count) with the money on the right. The empty state is itself a teaching tool: it tells the owner to add `utm_content` to their links.

All strings go through `t()` with EN + 中文 pairs in [lib/admin/i18n.ts](../../lib/admin/i18n.ts) (`analytics.card.sessionsByAccount`, `analytics.card.salesByAccount`, `analytics.emptyAccount`, `order.conversion.account`).

### Step 6 — Order detail: "Referred by account"

[lib/admin/orders.ts](../../lib/admin/orders.ts) `conversionFor(visitorId)` ([orders.ts:110-126](../../lib/admin/orders.ts#L110-L126)) fetches *all* page views for the order's visitor, sorts by time, and sets `account: accountOf(views[0])` — the same first-touch rule as analytics, so the order page and the commission card always agree. [OrderDetailView.tsx:511-515](../../app/admin/%28dashboard%29/orders/%5Bid%5D/OrderDetailView.tsx#L511-L515) renders the line only when `account` is non-null, inside the existing Conversion summary card (sessions count, first/last source).

## Tests covering this path

Unit — [tests/unit/channel-attribution.test.ts](../../tests/unit/channel-attribution.test.ts):
- channel-prefixed labels ("TikTok · amy" / "TikTok · ben" / "Instagram · amy" stay distinct),
- bare-name fallback when there's no channel signal,
- `null` for: no view, no utm, no `utm_content`, whitespace-only `utm_content`.

E2E — [tests/e2e/admin-analytics.spec.ts](../../tests/e2e/admin-analytics.spec.ts) runs the *whole* trace as one story:
1. Lands on `/shop?utm_source=tiktok&utm_content=amy&utm_campaign=stage7-video` and waits for the beacon POSTs.
2. Buys via mock checkout (the order picks up the visitor ID).
3. Order detail shows `Referred by account: TikTok · amy`.
4. Analytics shows both cards, with a `TikTok · amy` session row and a `TikTok · amy (n)` sales row.

Demo seed ([lib/supabase/seed-data.ts](../../lib/supabase/seed-data.ts)): the Instagram demo visitor's views carry `utm_content: "rose_daily"`, so `npm run seed -- --demo` gives the owner a populated example.

## Ideas worth stealing from this feature

- **Store facts, compute labels.** The DB holds only raw `utm` JSON + `visitor_id`; every human-facing label is derived at read time by one function. Changing the rule re-labels all history for free — no migration, no backfill.
- **One labeling authority.** `accountOf()` is called by analytics sessions, analytics sales, and the order page — the three surfaces can't drift apart.
- **`null` as a first-class answer.** Untagged traffic returns `null` and vanishes from the account cards instead of polluting them with an Unattributed bucket the owner can't act on.
- **Namespace user-supplied keys.** Prefixing the account with its channel ("TikTok · amy") avoids cross-platform name collisions without asking the owner to invent globally unique tags.
- **The e2e test is the user story.** One spec plays salesperson-posts-link → customer-buys → owner-checks-commission, proving the whole pipe rather than each piece in isolation.
