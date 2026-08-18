---
delivery: uat
rollout: live
statusChangedAt: 2026-07-25
priority: p1
---

# order-tracking

## Context

Carrier tracking (UPS first) on fulfilled orders, and the customer surfaces
that show it: the shipping-confirmation email's link and a delivery-status
pill on `/account`. Built and deployed; the owner has yet to verify a real
carrier link, which is the ACCEPTED gate.

- Boss (ideas.md 2026-07-25, verbatim): "UPS/" and "send the order tracking
  email." — he plans to ship from US stock via UPS and wants buyers to get a
  tracking email.
- Boss (ideas.md 2026-07-24, graduated here 2026-07-25): "Let people checkout
  the delivery info such as where the parcel in currently , and is that called
  UPS / USPS / Flow / Follow???" — i.e. customers should see delivery status;
  the term he was reaching for is *order tracking*, UPS/USPS are carriers.
- **Most of this already existed** (the "Order emails" + fulfill flow, UAT):
  - Orders carry `fulfillment_status`, `tracking_number`, `tracking_url`
    (`supabase/migrations/0001_init.sql`, `lib/supabase/types.ts:128`).
  - Admin "Fulfill items" (§9.4, `lib/admin/orders.ts` `fulfillOrder`): admin
    pastes a tracking number + URL → order marked fulfilled, timeline event,
    **shipping-confirmation email with the tracking link sent automatically**
    (`lib/email.ts` `sendShippingConfirmationEmail`, §10.3).
  - Signed-in customers see a "Track <number>" link per order on `/account`
    (`app/account/AccountClient.tsx`).
  - Emails go through Resend; until `RESEND_API_KEY` is set they print to the
    server console (owner activation item — SUMMARY.md Release queue).
- What was missing:
  1. **No carrier concept** — admin had to hand-paste a full tracking URL
     every time; a typo silently sent buyers a dead link. → built 2026-07-25.
  2. **No delivery status in the Me section** — `/account` showed a bare
     "Track" link, no at-a-glance state. → built 2026-07-25 (status pill).
  3. **Guests have no tracking page** — after `/checkout/success` their only
     surface is the email itself (`/orders` is a guest lookup, no status).
  4. **No live status** ("in transit / delivered") — link-out to the carrier
     only. Deferred (Option C).

## Decision

**Confirmed by Charles 2026-07-25** (chat): **Option B — carrier picker +
auto-built tracking link, keep carrier link-out for V1 (Level 1)**, with two
scope rulings:

- Dropdown lists **UPS + USPS only** for now (plus "Other (paste a tracking
  URL)" as the manual escape hatch); FedEx/DHL templates dropped from V1 —
  add to `lib/shipping/carriers.ts` when actually used.
- **Me section (`/account`) shows delivery status immediately**: a status
  pill per order — Preparing your order / Shipped via UPS·USPS (+ Track
  link) / Cancelled. Live "where is it now" stays behind the carrier link.

Industry note: for a small store's V1, "email with a carrier tracking link"
*is* the standard design (what Shopify Basic does); in-house live tracking
pages come later, if ever.

## Options considered

| Option                                                                                                                        | Pros                                                                                                            | Cons                                                                                                                                                   | Verdict                       |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| A. Status quo — admin pastes number + full URL                                                                                | Zero work; already at UAT                                                                                       | URL typos = dead links for buyers; no carrier on record for reports                                                                                    | ❌                            |
| B. Carrier dropdown (UPS first) + URL auto-built from number; email/link-out unchanged                                        | Small change (~1 field + URL template map); kills the typo risk; carrier stored for later use; provider-neutral | Still no live status; one more migration                                                                                                               | ✅ **chosen 2026-07-25**      |
| C. Full integration — UPS Track API or aggregator (AfterShip/17TRACK/Shippo): live status on our own page, "delivered" emails | Best buyer UX; enables delivery-based automations                                                               | Carrier API contracts + webhooks/polling to build and babysit; aggregators cost money (17TRACK ~$9/mo past 100 shipments); overkill before real volume | ❌ for V1 — revisit post-ship |

## Acceptance criteria

- [x] Fulfilling with carrier = UPS + a tracking number auto-fills a working
      `ups.com` tracking URL; admin can still override the URL by hand.
      (e2e: UPS fulfill test)
- [x] Carrier is stored on the order and shown on the admin order detail
      (EN + 中文 labels via `t()`). (e2e asserts "UPS ·" on the detail)
- [x] Shipping-confirmation email names the carrier ("Carrier: UPS") and
      links the tracking URL.
- [x] Orders fulfilled before this change (URL only, no carrier) still render
      fine everywhere. (seed keeps a legacy-shaped demo order; "Other" e2e
      path stores carrier = null)
- [x] Me section: signed-in customers see a delivery-status pill per order —
      Preparing / Shipped via <carrier> + Track link / Cancelled.
- [ ] Human acceptance: owner fulfills a sandbox order with a real UPS
      number, receives the email, link opens UPS tracking (UAT → ACCEPTED).

## Plan

| #   | Work item                                                                                                                                                                                                                        | Status        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | Migration `0003`: nullable `tracking_carrier` on `orders` (+ literal defaults in `lib/orders/db.ts`, seed) — bundled with the agreed 0003 hardening: SKU partial unique index, FK indexes, `discounts.value` check (Database.md) | ✅ 2026-07-25 |
| 2   | `lib/shipping/carriers.ts`: carrier → tracking-URL template map (UPS, USPS per owner scope), JSDoc'd; unit tests                                                                                                                 | ✅ 2026-07-25 |
| 3   | `fulfillOrder` accepts `carrier`; builds URL from template when the URL field is left blank; carrier in the timeline event                                                                                                       | ✅ 2026-07-25 |
| 4   | Admin fulfill dialog: carrier dropdown (UPS default, USPS, Other), URL optional with help text; i18n EN + 中文                                                                                                                   | ✅ 2026-07-25 |
| 5   | Email: "Carrier: UPS" line in the shipping confirmation                                                                                                                                                                          | ✅ 2026-07-25 |
| 6   | e2e: manual-URL ("Other") + UPS auto-build fulfill paths in the admin orders spec                                                                                                                                                | ✅ 2026-07-25 |
| 7   | Me section `/account`: delivery-status pill (Preparing / Shipped via X / Cancelled) + Track link (owner ask 07-25)                                                                                                               | ✅ 2026-07-25 |
| 8   | SKU-guard side effects of the 0003 bundle: `saveProduct` rejects taken SKUs; Duplicate clears copied SKUs                                                                                                                        | ✅ 2026-07-25 |

Out of scope here (own decisions later): guest tracking page (tokenized
order-status link in the email) and live-status integration (Option C —
aggregator free tier or UPS Track API, post-ship).

## Blockers and dependencies

- Both original blockers have cleared: `0003_tracking_carrier_and_hardening.sql`
  is applied on hosted (fulfill needs `tracking_carrier` to exist before the
  code deploys), and `RESEND_API_KEY` is set on Vercel Production, so the email
  half is real there — previews still take the console-log fallback on purpose.
- Nothing else blocks; the only step left is the owner's real-carrier check,
  which is the UAT → ACCEPTED gate, not a blocker.

## Tech details

- Automated: `tests/unit/carriers.test.ts` (7 tests — URL templates, encoding,
  labels) and `tests/e2e/admin-orders.spec.ts` ("fulfill flow stores tracking",
  the Other/manual URL path, plus "fulfill with the default UPS carrier
  auto-builds the tracking link").
- 2026-07-25, on worktree branch `worktree-order-tracking`: `npm run test:unit`
  35/35 green, eslint + tsc clean, full Playwright suite green (57 tests
  including the two fulfill paths). Merged, deployed, `0003` applied since.

## Research — live status (Option C), 2026-08-19

Sourced sweep of how a delivery-tracking system is built in 2026, run against
this record's deferred Option C. **No decision is taken here** — Decision and
Options above stay write-once; this is the evidence a later decision cites.

### Why it is worth re-opening

Option C was parked as "overkill before real volume". Two things changed in
2026, and they move the inputs in opposite directions:

```
                     2026-07-25 (when C was parked)   2026-08-19 (now)
  DIY carrier APIs   UPS free, USPS free              UPS free, USPS GATED
  Aggregator floor   "~$9/mo past 100 shipments"      $0–$3.90/mo at our volume
                     ──────────────────────────────   ─────────────────────────
  Net effect         build-it-yourself looked fine    buying is now cheaper AND
                                                      the only workable USPS path
```

### Finding 1 — USPS closed public tracking on 2026-04-01

Two changes compound:

- **Web Tools retired 2026-01-25.** The legacy endpoints are dark; the v3 REST
  catalog on `developers.usps.com` is the only path.
- **Access control from 2026-04-01.** Tracking APIs, webhook subscriptions and
  scan-event extracts are no longer open lookup. Access is tied to the sender's
  **Mailer ID (MID)** and requires an **Enterprise Payment System (EPS)**
  account plus a signed order form / IP agreement. Third-party platforms may
  also pay a monthly fee.
- **Shippers keep their own parcels' events free** when authorised on the MID
  that produced the label — so this is paperwork, not a wall, *provided we buy
  USPS postage under our own MID*. We currently do not: the admin pastes a
  number someone else's label produced.

**Consequence for us:** `lib/shipping/carriers.ts` offers UPS **and** USPS. A
DIY "call the carrier API" build would deliver live status for UPS only and
stall on USPS behind an EPS account. That asymmetry is the single strongest
argument for an aggregator — one integration, and someone else maintains the
carrier relationships.

UPS is unchanged and remains the easier half — but only for *pull*. The Track
API is free to license, with self-serve OAuth 2.0 app registration on
`developer.ups.com` and immediate test + production access. **Push is a
separate, paid product**: UPS Track Alert takes a tracking number plus a
callback URL (up to 100 per call) and posts scan events for 14 days. So a DIY
UPS build means polling on our own schedule for free, or paying UPS for the
webhook — the "free API" is not the same thing as free live tracking.

### Finding 2 — the aggregator floor is now near zero at our volume

We ship in the tens per month, not thousands. At that volume the market has
split: the incumbents gate the API behind mid-tier plans, the challengers give
it away.

| Vendor           | Free tier                       | API + webhook on free? | Entry paid                     | Notes for us                                                   |
| ---------------- | ------------------------------- | ---------------------- | ------------------------------ | -------------------------------------------------------------- |
| **Ship24**       | 10 shipments/mo                 | ✅ yes, every tier      | Essential $3.90/mo             | Cheapest real entry; webhooks not paywalled                     |
| **17TRACK**      | 100 quotas/mo                   | ✅ yes                  | ~$119 / 5 000 (≈$0.024 ea)     | 3 400+ carriers, strong cross-border; quotas expire in 12 mo    |
| **TrackingMore** | trial only                      | ❌ API from Pro         | Pro $158/mo @5 000             | ~2× Ship24 at equal volume; overage $0.04                       |
| **Track123**     | —                               | paid                    | $179/mo @10 000, $0.02 overage | Cheaper than TrackingMore at scale                              |
| **AfterShip**    | 50 shipments/mo                 | ❌ **API is Premium**   | Premium from $70/mo            | Free plan cannot be integrated — dashboard only                 |
| **EasyPost**     | none for tracking               | n/a                    | $0.01–$0.03 per shipment       | Pay-per-tracker; Advanced Tracking $0.03 adds a branded page    |
| **Shippo**       | free if the label is bought there | ✅ `track_updated`    | per-shipment for foreign labels | Best only if we ever buy labels through Shippo                 |

Three traps worth recording, because none is visible until integration day:

- **AfterShip's free tier is a decoy for a developer.** 50 shipments/month is
  ample for us, but API *and* webhook access starts at Premium (~$70/mo). The
  free plan is a dashboard, not an integration.
- **EasyPost dedupes trackers by `(tracking_code, carrier)` for three months.**
  Re-registering the same number inside that window returns the existing
  tracker rather than a new one — fine, but retry logic must not assume it got
  a fresh object.
- **Shippo requires the webhook to exist before you POST a tracking number**,
  and its tracking webhooks are *not* idempotent — register each number once,
  or the buyer gets duplicate emails.

### Finding 3 — the architecture every source converges on

Nobody polls carriers per-order in 2026. The shape is the same across EasyPost,
Shippo, 17TRACK and Ship24:

```
  admin fulfils order                          carrier scans parcel
         │                                            │
         ▼                                            ▼
  [ fulfillOrder ] ──register(number, carrier)──> [ aggregator ]
         │                                            │
         │                                     push on change
         │                                            ▼
         │                              [ POST /api/webhooks/tracking ]
         │                                            │
         │                            ┌───────────────┼───────────────┐
         │                            ▼               ▼               ▼
         │                     verify HMAC     dedupe event id    reject if
         │                     over RAW body   (idempotency)      ts > 5 min
         │                            └───────────────┬───────────────┘
         ▼                                            ▼
  orders.tracking_*                        append to tracking_events
                                                      │
                                    ┌─────────────────┼─────────────────┐
                                    ▼                 ▼                 ▼
                            /orders/track      status pill on      Resend email
                            (branded page)     /account            on milestones
```

Four rules the sources state explicitly:

1. **Push, not poll.** Polling burns quota whether or not anything changed and
   earns 429s at volume; webhooks bill only on change. Keep a slow reconcile
   sweep as a safety net, because no webhook delivery is guaranteed — hybrid is
   the norm, not a compromise.
2. **Normalise the status.** No two carriers name events the same way — one
   carrier's "in transit" is another's "departed facility". Every aggregator
   ships a fixed taxonomy; EasyPost's is the most granular (`pre_transit /
   in_transit / out_for_delivery / available_for_pickup / delivered /
   return_to_sender / failure / cancelled / unknown`, plus 25 `status_detail`
   values such as `delayed`, `damaged`, `address_correction`). Store the
   normalised status **and** the raw carrier message.
3. **Treat the webhook endpoint as hostile input.** Verify HMAC-SHA256 over the
   *raw* body before parsing JSON, reject timestamps older than ~5 minutes, and
   key every event by a provider event id so replays and retries are safe. Touch
   nothing in the database until all three pass.
4. **Events are append-only.** A tracking history is a log, not a mutable field
   — the same discipline `orders` already follows ("orders are never
   hard-deleted", SUMMARY.md).

### Finding 4 — the payoff is support volume, and it is large

- WISMO ("where is my order?") is reported at **~70 % of post-purchase support
  contacts**, and 30–40 % of *all* inbound support volume, even at brands
  already using carrier notifications.
- A branded tracking page with real status is claimed to cut WISMO contacts by
  up to ~72 %, and the page itself converts — vendors quote 6–12 % additional
  revenue per order from recommendation blocks on it.
- Shipment notification emails see **~91 % open rates** vs ~21 % for marketing.
  We already send one (`sendShippingConfirmationEmail`); the sources put the
  full ladder at **shipped → out for delivery → delivered**, plus an exception
  alert — mobile-first, tracking link above the fold.

Read those percentages as directional. They are vendor-published, and our order
volume is far too small for any of them to bite yet; they say where this pays
off, not what it pays today.

### Finding 5 — what practitioners actually hit (Stack Overflow)

Vendor docs describe the happy path; Stack Overflow records where people get
stuck. Queried through the Stack Exchange API, because SO blocks the search
crawler.

**The distribution of questions is itself the finding.** Ask how many people
get stuck, per integration route:

```
  tag:fedex   top question  75 pts / 68 k views   ─────────────────────────█
  tag:ups     top question  20 pts / 21 k views   ──────────█
  tag:usps    top question  11 pts / 15 k views   ──────█
  tag:shippo  top question   5 pts /  0.4 k views ──█
  tag:easypost top question  3 pts /  1.7 k views ─█
  tag:aftership          no such tag
```

Hundreds of high-score questions about raw carrier APIs; a handful of
low-score ones about aggregators, and nothing at all about AfterShip or
17TRACK. Aggregators are boring to integrate — that is the point of them. The
carrier APIs are where the time goes.

**Testing is the hidden cost, and it lands unevenly.**

- **UPS publishes fixed test tracking numbers**, one per scenario, in the
  Tracking Web Service Developer Guide appendix — `1Z12345E0205271688`
  (Delivered), `1Z12345E1305277940` (Origin scan), `1Z12345E6205277936`
  (2nd delivery attempt), `1Z12345E020527079` (Invalid number),
  `1Z12345E1505270452` (No tracking information). Production numbers also work
  against the test environment.
- **FedEx publishes a full table** — `449044304137821` (info sent),
  `122816215025810` (Delivered), `957794015041323` (Unable to deliver),
  `797615467620` (Incorrect address), `076288115212522` (Returned to sender),
  and a dozen more.
- **USPS publishes none.** The accepted answer is blunt about the options: hoard
  real production numbers and build your own status mapping, or use a provider
  that has already mapped them. That is an argument for the aggregator written
  by a practitioner in 2015 and still true after the 2026 lockdown.

This bears directly on `tests/e2e/admin-orders.spec.ts`, which today asserts
against a fulfilment we fake ourselves. A live integration needs those
fixtures, and only two of our three carriers supply them.

**Auth failures dominate the UPS questions**, and they are the same three
every time:

1. The token call wants `Authorization: Basic base64(clientId:clientSecret)`.
   Sending the UPS account username/password instead is the single most-viewed
   UPS question on the site (21 k views). The `x-merchant-id` header is *not*
   the credential.
2. Two hosts, and they are not interchangeable — `wwwcie.ups.com` (test) vs
   `onlinetools.ups.com` (production). The test host only accepts the test
   products actually assigned to your app.
3. `transId` and `transactionSrc` are required headers with no real
   explanation in the docs — a per-request unique id (≤32 chars; a GUID is
   fine) and a client-app identifier (≤512).

**"Real-time" is a misnomer**, per an EasyPost engineer answering on their own
product: there is always a lag between the carrier's system and any provider's,
so no one should claim real-time. Worth holding onto for the page copy and for
what we promise the boss — "latest scan, as the carrier reports it" is honest;
"live tracking" is not.

**The raw-body trap will bite us specifically.** Every "signature verification
failed" thread has the same root cause: the framework parsed the body before
the handler saw it, so the HMAC is computed over re-serialised JSON that no
longer matches byte-for-byte. In the Pages Router the fix was
`config.api.bodyParser = false`; we are on the App Router, where
`await req.text()` gives the raw body — so the rule for
`app/api/webhooks/tracking` is **never call `req.json()` before verifying**.
Related: Shippo POSTs a raw JSON body rather than form fields, so reading
request *parameters* silently yields nothing.

**Carrier-detection regexes are a solved but sharp problem.** The canonical
thread (75 pts, 68 k views) has a well-tested 2020 answer covering UPS
(`\b1Z[A-Z0-9]{16}\b`), FedEx and USPS/S10, with two caveats worth copying: the
patterns do **not** verify the mod-check digits, and FedEx SmartPost is
deliberately classed as USPS because either carrier can track it. That answer
points at `jkeen/tracking_number_data` — the same library the vendor-neutral
sources recommend, which is a good sign.

### How it would plug into what we already have

The groundwork is unusually complete — this is wiring, not a new subsystem:

```
  already built                              what Option C adds
  ─────────────────────────────────────      ──────────────────────────────
  orders.tracking_carrier/_number/_url   →   unchanged (registration input)
  fulfillOrder (lib/admin/orders.ts)     →   + register with the provider
  ─                                          + tracking_events table (0013)
  ─                                          + app/api/webhooks/tracking
  /orders/track  (placeholder frame)     →   the real branded page
  status pill on /account                →   reads live status, not fulfilment
  Resend + sendShippingConfirmation      →   + out-for-delivery / delivered
  guest lookup (plan item 3, open)       →   same page + tokenised link
```

Two of our own rules bear on the design:

- **The EDD is a release-gate claim.** An estimated delivery date on
  `/orders/track` is a delivery-date assertion, and SUMMARY.md forbids a live
  placeholder stating a delivery date we cannot honour. Either show the
  carrier's own EDD attributed to the carrier, or show none. Sources are blunt
  that optimistic EDDs damage trust more than longer honest ones, and that
  accuracy only improves 15–20 points with data-driven models far beyond our
  volume.
- **Guest lookup should be a tokenised link, not a form.** The common pattern is
  order number **+** email; the safer and simpler one — already implied by plan
  item 3 — is an unguessable token in the shipping email that deep-links to the
  page, sidestepping order-number enumeration entirely.

Two cheap wins that need no Option C at all:

- **`schema.org/ParcelDelivery` JSON-LD in the shipping email** makes Gmail and
  Outlook render a native "Track package" action. Pure markup, no API, and it
  sits squarely in the `seo-geo` remit.
- **Carrier auto-detection from the number format** (`ts-tracking-number`,
  `jkeen/tracking_number_data`) would let the admin paste a number without
  picking a carrier — a small usability win over today's dropdown.

### Reference implementation to copy

Shopify — the reference this admin is cloned from — does exactly the V1/V2 split
this record already chose. Supported carriers get live status and a map on the
order-status page; unsupported carriers degrade to a bare link-out to the
carrier's site. That is the design to copy: **live status where we have it, a
link where we do not**, never a dead end.

### Sources

**Carrier APIs (first-party)**

- USPS developer portal — <https://developers.usps.com/> · API catalog
  <https://developers.usps.com/apis>
- USPS — retirement of v1/v2 APIs
  <https://developers.usps.com/industry-alert-api-retirement>
- USPS Web Tools shutdown (2026-01-25)
  <https://www.usps.com/business/web-tools-apis/>
- USPS tracking access control, effective 2026-04-01 —
  <https://www.gain.consulting/post/usps-to-restrict-package-tracking-data-access-for-service-providers-starting-april-2026>
  · <https://www.ecommercebytes.com/2026/01/09/usps-to-restrict-access-to-package-tracking/>
  · <https://www.supplychain247.com/article/usps-tightens-package-tracking-data-access-2026>
- USPS API rate limits after rollout —
  <https://revaddress.com/blog/usps-api-rate-limits-2026-what-changed/>
- UPS developer portal — <https://developer.ups.com/> · pricing
  <https://developer.ups.com/pricing>
- UPS API overview / OAuth — <https://zuplo.com/learning-center/ups-api>
- UPS Track Alert (the paid push product) —
  <https://developer.ups.com/tag/UPS-Track-Alert?loc=en_US> · Postman collection
  <https://www.postman.com/ups-api/ups-apis/documentation/gk3hpdh/ups-track-alert>
  · integration write-up
  <https://www.houseblend.io/articles/netsuite-shipment-tracking-webhooks>

**Aggregators (first-party docs + pricing)**

- EasyPost Trackers — <https://docs.easypost.com/docs/trackers> · tracking guide
  <https://docs.easypost.com/guides/tracking-guide> · webhooks guide
  <https://docs.easypost.com/guides/webhooks-guide> · pricing
  <https://www.easypost.com/pricing>
- EasyPost email-notification tutorial (closest thing to a worked example) —
  <https://docs.easypost.com/guides/email-tracking-tutorial> · code
  <https://github.com/EasyPost/example-tracking-notifications>
- Shippo tracking + webhooks — <https://docs.goshippo.com/docs/Tracking/Webhooks>
  · API pricing <https://goshippo.com/pricing/api>
- 17TRACK API docs — <https://api.17track.net/en/doc> · quick guide
  <https://help.17track.net/hc/en-us/articles/30944262120729--Tracking-API-Quick-Guide>
  · plan details
  <https://help.17track.net/hc/en-us/articles/37575217580825-Plan-Details>
- Ship24 — tracking API <https://www.ship24.com/tracking-api> · webhooks
  <https://www.ship24.com/tracking-webhook> · pricing
  <https://www.ship24.com/pricing>
- AfterShip tracking API — <https://www.aftership.com/tracking-api>
- Vendor-run comparisons (read for the numbers, not the verdicts):
  Track123 vs TrackingMore <https://www.track123.com/blog/track123-vs-trackingmore>
  · TrackingMore vs Ship24 <https://www.trackingmore.com/compare/ship24>
  · 17TRACK alternatives <https://www.24htrack.com/blog/best-17track-alternatives>
  · EasyPost vs Shippo <https://www.aftership.com/blog/easypost-vs-shippo>
  · <https://nextbillion.ai/feeds/blog/compare-real-time-shipment-tracking-apis-e-commerce>

**Architecture and correctness**

- Webhooks vs polling —
  <https://hookwatch.dev/blog/webhooks-vs-polling-when-to-use-each>
  · <https://unified.to/blog/polling_vs_webhooks_when_to_use_one_over_the_other>
- Webhook security (HMAC over raw body, replay window, idempotency) —
  <https://hooque.io/guides/webhook-security/>
  · <https://didit.me/blog/webhook-security-patterns/>
  · <https://www.hooklistener.com/learn/webhook-signing-hmac-verification-best-practices>
- Status normalisation — <https://pango.ai/resources/carrier-tracking-statuses>
  · <https://help.shippypro.com/en/knowledge/tracking-mapping-statuses>
  · exceptions <https://www.cahoot.ai/shipment-exception-guide/>
- Scheduling the reconcile sweep — Supabase Cron
  <https://supabase.com/docs/guides/cron> · Vercel cron limits (Hobby = daily,
  Pro = per-minute, production only, UTC)
  <https://vercel.com/docs/cron-jobs/usage-and-pricing>
- Tracking-number format detection —
  <https://github.com/jkeen/tracking_number_data>
  · <https://www.npmjs.com/package/ts-tracking-number>

**Practitioner threads (Stack Overflow)**

Queried via the Stack Exchange API (`api.stackexchange.com/2.3/search/advanced`)
— stackoverflow.com blocks the search crawler, so a plain web search will not
surface these.

- Carrier detection regexes, the canonical thread (75 pts, 68 k views) —
  <https://stackoverflow.com/questions/619977/regular-expression-patterns-for-tracking-numbers>
- UPS OAuth token request fails — `Basic base64(id:secret)`, test vs prod hosts
  (20 pts, 21 k views) —
  <https://stackoverflow.com/questions/73791089/ups-api-oauth-token-request-fails>
- UPS `transId` / `transactionSrc` headers explained —
  <https://stackoverflow.com/questions/77764991/ups-oauth-2-0-restful-api-integration>
- UPS test tracking numbers, per scenario —
  <https://stackoverflow.com/questions/15145865/ups-test-tracking-numbers-is-there-a-such-thing>
- Does UPS offer real-time tracking? ("real-time is a misnomer", answered by an
  EasyPost engineer; later answer notes UPS webhooks are now paid) —
  <https://stackoverflow.com/questions/71655908/does-ups-offer-any-real-time-tracking-api>
- UPS Track JSON body format —
  <https://stackoverflow.com/questions/35662181/ups-tracking-api-json-body-format>
- Tracking API for FedEx and UPS, incl. the link-out fallback we already use —
  <https://stackoverflow.com/questions/5879953/tracking-api-for-fedex-and-ups>
- FedEx test tracking numbers, full status table (46 pts, 63 k views) —
  <https://stackoverflow.com/questions/11049025/how-to-get-fedex-testing-tracking-number>
- USPS has no test tracking numbers — accepted answer recommends an aggregator —
  <https://stackoverflow.com/questions/33163757/how-to-test-usps-package-tracking-api-without-test-tracking-numbers>
- USPS auth / XML parse failures —
  <https://stackoverflow.com/questions/31164890/usps-api-returning-80040b19-error-code-and-account-is-in-production>
  · <https://stackoverflow.com/questions/9969977/usps-api-authorization-failure>
- USPS expected-delivery-date field —
  <https://stackoverflow.com/questions/23902091/usps-tracking-api-expected-delivery-date>
- Shippo posts a raw JSON body, not form fields —
  <https://stackoverflow.com/questions/45971304/what-data-is-posted-to-a-shippo-webhook>
- Webhook signature fails because the framework parsed the body first (the
  App Router lesson: `req.text()`, never `req.json()`, before verifying) —
  <https://stackoverflow.com/questions/76477168/error-verifying-request-signature-next-js-13-stripe>
  · <https://stackoverflow.com/questions/72888820/stripe-error-no-signatures-found-matching-the-expected-signature-for-payload-a>
- Verifying a webhook really came from the sender —
  <https://stackoverflow.com/questions/47917733/how-to-ensure-that-webhook-is-receiving-data-from-desired-data-source-and-not-th>
- pg_cron: no transaction blocks, and scheduling runs in the server's timezone —
  <https://stackoverflow.com/questions/75545014/pg-cron-failing-when-using-transaction-block>
  · <https://stackoverflow.com/questions/73795095/how-to-run-pg-cron-job-as-per-local-time>

**Customer-facing design**

- Shopify order tracking (our reference model) —
  <https://help.shopify.com/en/manual/fulfillment/setup/order-status-page/order-tracking>
- WISMO volume and branded-page impact —
  <https://gomalomo.com/wismo/wismo-tracking>
  · <https://wismolabs.com/solutions/reduce-wismo-calls/>
  · <https://www.lateshipment.com/blog/branded-parcel-tracking/>
- Notification-email ladder and open rates —
  <https://www.aftership.com/blog/delivering-delight-best-practices-for-engaging-shipment-notification-emails>
  · <https://www.klaviyo.com/blog/tips-better-shipping-confirmation-emails>
- Estimated delivery dates —
  <https://hub.shipium.com/content/estimated-delivery-dates/>
  · <https://shipperhq.com/blog/estimated-delivery-dates-to-do-list>
- `schema.org/ParcelDelivery` email markup —
  <https://www.emailonacid.com/blog/article/email-development/schema-markup-gmail/>
  · <https://devblogs.microsoft.com/microsoft365dev/unlock-your-email-potential-with-schema-org/>
- Guest order lookup patterns —
  <https://learn.microsoft.com/en-us/dynamics365/commerce/order-lookup-guest>

### What this research does not settle

Left for Charles, in the order they block each other:

1. **Who fulfils, and under whose postage account?** If we buy USPS labels on
   our own MID the USPS gate is paperwork; if a third party ships for us, an
   aggregator is the only route. This decides everything below it.
2. **Buy or build.** The evidence points to buy — Ship24 or 17TRACK free tier,
   $0 at our volume, both give API + webhooks free, both cover UPS and USPS.
   Finding 5 hardens this: UPS charges for push, USPS ships no test numbers, and
   the volume of people stuck on carrier APIs versus aggregator APIs is not
   close.
3. **Is it worth doing before volume?** The V1 verdict — "email with a carrier
   tracking link *is* the standard design for a small store" — still holds. The
   honest reading is that the cost of Option C fell to roughly zero, not that
   the need for it arrived.

## Related links

- Spec: [admin-design.md §9.4 fulfill flow, §10.3 notifications](../admin-design.md)
- Activation: owner items in
  [SUMMARY.md · Release queue](../../SUMMARY.md#release-queue)
- SKU rules behind the 0003 bundle: [Database.md](../Database.md)
- Sibling ask, same boss note: [promotion-emails.md](promotion-emails.md)
