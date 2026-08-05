# Search discovery implementation

**Status:** implementation source of truth  
**Scope:** SEO, AI-search/GEO, product feeds, and measurement  
**Last verified:** 2026-07-23

This is the operational plan for making ELDREVE discoverable in conventional
search, shopping surfaces, and AI-assisted product discovery. Use
[geo-intro.md](geo-intro.md) for the research and platform background, and
[seo-intro.md](seo-intro.md) for the concise opportunity map. Do not track
implementation in those supporting documents.

## 1. Why SEO and GEO share one plan

The two channels use the same underlying evidence:

- crawlable, useful, truthful pages;
- stable product and variant identities;
- matching page, structured-data, feed, inventory, shipping, and checkout
  facts;
- public policies and a consistent merchant identity;
- genuine reviews and independent references;
- measurement from landing page through payment and return.

Google states that AI Overviews and AI Mode have no additional technical
requirements or special schema beyond normal Search eligibility. OpenAI and
shopping platforms may also consume merchant-supplied product data, so the
implementation needs platform adapters, not a second product database.

Work is labelled:

- **[Shared]** benefits both conventional and AI-assisted discovery.
- **[SEO]** is specific to crawl, index, search appearance, or search content.
- **[GEO]** is specific to AI crawler access, answer visibility, or AI referral
  analysis.
- **[Commerce]** concerns catalog feeds and merchant eligibility.

## 2. Non-negotiable rules

1. **One commercial source of truth.** Supabase remains authoritative. Pages,
   JSON-LD, `llms.txt`, feeds, cart, and checkout must derive from the same
   normalized product and policy data.
2. **Truth before reach.** Do not submit feeds while the storefront contains
   placeholder reviews, discounts, shipping promises, warehouse claims,
   colours, payment methods, or product facts.
3. **No hand-maintained platform catalogs.** Generate adapters from one
   canonical commerce record.
4. **No thin page multiplication.** Add a URL only when it answers a distinct
   shopper need with substantial original value. Templated doorway or
   search-engine-first pages are out of scope.
5. **Eligibility is not placement.** Schema and feeds can make a product
   eligible; no platform guarantees indexing, a rich result, a free listing,
   citation, ranking, or recommendation.
6. **Visible content and machine data must agree.** Never add a claim only to
   schema, `llms.txt`, or a feed.
7. **Crawler controls are not access controls.** Authentication protects
   private data. `robots.txt` only communicates crawl preferences.
8. **`llms.txt` is optional.** Keep it only as a small, accurate summary. It is
   not required by Google and is not a proven ranking signal.

## 3. Current repository baseline

| Area               | Existing implementation                               | Gap before launch                                                                                     |
| ------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Product routes     | `/products/[slug]`, `/shop`, canonical metadata       | Remove unsupported visible claims; show useful DB-backed descriptions and variant facts               |
| Discovery          | `app/sitemap.ts`, `app/robots.ts`                     | Verify the production domain; separate search crawlers from training-policy choices                   |
| Structured data    | Product JSON-LD on product pages; site data on home   | Escape `<` safely; use absolute URLs; model real variants, seller, shipping, and returns              |
| AI summary         | Dynamic `/llms.txt`                                   | Replace example contact data and ensure every value matches the storefront                            |
| Catalog data       | `lib/supabase/catalog.ts` and `catalog_products` view | Normalize complete merchant fields and validation; the internal view is not an external feed API      |
| Policies           | Values exist in admin settings                        | Publish Contact, Shipping, Returns/Refunds, Privacy, and Terms routes                                 |
| Inventory/checkout | Native cart and PayPal flow                           | Resolve Tier 1 integrity defects in the repository review before feeds amplify stock and order errors |
| Analytics          | First-party page-view beacon with UTM/referrer        | Classify AI referrals and measure the complete conversion funnel                                      |
| External setup     | Not represented in the repository                     | Production domain, Search Console, Merchant Center, business verification, and feed enrolment         |

The relevant security and commerce-integrity defects were tracked in the
2026-07-23 repository review (doc since removed; in git history). This plan
depends on that review; it does not duplicate the fixes.

## 4. Target architecture

```text
Private Supabase product, variant, inventory, policy, and setting records
                                |
                                v
                 normalizeMerchantCatalog()
                 + validateMerchantCatalog()
                                |
          +---------------------+----------------------+
          |                     |                      |
     Storefront/UI         JSON-LD + sitemap      Platform adapters
          |                     |                 + Google feed
       Checkout               llms.txt             + OpenAI feed
                                                   + Microsoft reuse/import
```

`normalizeMerchantCatalog()` must be server-only. It may reuse the existing
catalog query, but should join the additional private fields required for
shipping, returns, identifiers, dimensions, and validation. Platform routes
must expose only approved public commerce fields—never the Supabase service
key, internal notes, supplier costs, customer data, or admin-only records.

For this small catalog, a scheduled full-feed URL is simpler and safer than a
new standalone REST service. Add API-based incremental updates only if catalog
size or freshness requirements later justify the operational cost.

## 5. Canonical commerce record

Create one typed record per purchasable variant. Product-level fields may be
shared, but price and availability must describe the exact offer.

| Field                    | Required handling                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `id`                     | Stable variant/feed ID; never recycle it for a different item                          |
| `itemGroupId`            | Stable parent product ID for variants                                                  |
| `title`                  | Accurate product + variant title; no promotional stuffing                              |
| `description`            | Plain factual copy that is also visible on the landing page                            |
| `link`                   | Absolute canonical product URL, with a way to select the exact variant where necessary |
| `imageLink`              | Absolute URL to the main image for the represented variant                             |
| `additionalImageLinks`   | Approved, accessible product images only                                               |
| `availability`           | Derived from the same atomic inventory rule used by checkout                           |
| `price` / `currency`     | Exact purchasable USD price; integer cents internally                                  |
| `salePrice`              | Emit only when a genuine, currently active comparison price exists                     |
| `brand`                  | Real, consistent brand name                                                            |
| `gtin` / `mpn`           | Real assigned identifiers only; never invent them                                      |
| `condition`              | Normally `new`, backed by the actual product state                                     |
| `material`, colour, size | Exact variant/product attributes shown to buyers                                       |
| `shipping`               | Country scope, service, cost, and delivery estimate from real settings                 |
| `returns`                | Public policy URL and structured rules matching the checkout policy                    |
| `updatedAt`              | Time the commercial record last changed                                                |

Validation must reject or quarantine an item when a required value is missing,
malformed, contradictory, inaccessible, or unsupported. It must not silently
fill production feeds with demo defaults.

## 6. Platform delivery

### 6.1 Google first

**[Commerce]** Create Google Merchant Center only after Gate 0 below passes.
For the initial catalog:

1. Generate a Google-compatible scheduled feed from the canonical records.
2. Host it at a stable route such as `/feeds/google-products.xml`.
3. Configure Merchant Center to fetch it on a schedule.
4. Keep product IDs stable and page/feed price and stock synchronized.
5. Monitor item-level diagnostics; fix the underlying record rather than
   platform-specific copies.

Google supports structured data, Merchant Center feeds, or both. ELDREVE
should use both because the feed carries controlled, refreshed offer facts
while page markup explains the landing page. Free-listing eligibility does not
guarantee that Google will show an item.

Do not build the Merchant API for the current three-product catalog. Reconsider
it when frequent incremental inventory updates or a much larger catalog make a
scheduled file insufficient.

### 6.2 OpenAI second

**[Commerce] [GEO]** Apply for the relevant OpenAI merchant/feed program after
the Google feed is clean. Build an OpenAI adapter from the same canonical
records and map it to the current official product-feed specification at
implementation time. Program access and transport can change, so do not expose
an invented public API merely in anticipation.

Crawler policy is separate:

- allow `OAI-SearchBot` to crawl public discoverable content if the owner wants
  ChatGPT Search visibility;
- decide whether to allow `GPTBot` as a separate model-training policy;
- never use either rule to protect private routes.

### 6.3 Microsoft later

**[Commerce]** Reuse or import the Google-compatible catalog in Microsoft
Merchant Center. Do not create a third hand-maintained catalog. Consider the
Microsoft Content API only if scheduled/imported files stop meeting scale or
freshness needs.

### 6.4 Feed route behaviour

- server-generated from live canonical records;
- absolute HTTPS URLs using the configured production origin;
- deterministic ordering and stable IDs;
- explicit content type and UTF-8 encoding;
- no session, admin login, or browser JavaScript required;
- an appropriate cache/revalidation interval, documented with its maximum
  staleness;
- invalid items excluded with server-side diagnostics;
- an automated parser/schema test for every emitted format;
- administrative revalidation after relevant product, inventory, shipping, or
  policy changes.

## 7. Implementation sequence and gates

### Gate 0 — safe, truthful commerce

**Owner and engineering; blocks every submission**

- Resolve Tier 1 findings 1–5 and A1–A4 in the repository review.
- Remove or replace all unsupported product, review, discount, stock,
  warehouse, delivery, option, and payment claims.
- Confirm wording and supplier evidence for “24K gold,” construction,
  preservation, origin, and longevity.
- Publish accurate Contact, Shipping, Returns/Refunds, Privacy, and Terms
  pages.
- Set the real support email, business identity, production domain, shipping
  countries/rates, and returns rules.

**Exit:** page, cart, checkout, order, inventory, and policies tell the same
truth, and a paid order cannot be created through a mock path in production.

### Gate 1 — technical search foundation

**[Shared]**

- Verify the production domain in Google Search Console and submit the sitemap.
- Inspect `/`, `/shop`, and every active product URL for crawl, index,
  canonical, title, description, and rendered textual content.
- Keep private/admin/account/checkout/API routes out of discovery.
- Fix JSON-LD script escaping and use absolute URLs.
- Model truthful `ProductGroup`/variant offers where the page supports those
  variants.
- Add seller/Organization, shipping, and return-policy data only when visible
  source data exists.
- Validate representative pages with Google's Rich Results Test.
- Confirm product images are accessible and useful on mobile.

**Exit:** production URLs are crawlable, canonical, safe, and consistent; the
sitemap and structured data validate without material errors.

### Gate 2 — canonical export and tests

**[Commerce]**

- Add the typed canonical record and server-only normalizer.
- Add explicit shipping, return, brand, material, dimensions/package contents,
  and legitimate identifier fields where missing.
- Add validation with actionable item-level errors.
- Derive current page JSON-LD and feed adapters from the same record where
  practical.
- Add unit fixtures for variants, out-of-stock offers, missing identifiers,
  invalid images, sales, shipping countries, and returns.

**Exit:** the same fixture produces matching page/offer/feed values, and invalid
items fail closed.

### Gate 3 — distribution

**[Commerce] [GEO]**

1. Launch and validate the Google scheduled feed.
2. Resolve Merchant Center diagnostics and enable eligible free listings.
3. Apply for OpenAI merchant access and add its current adapter/transport when
   accepted.
4. Reuse the Google catalog for Microsoft if it serves the launch markets.

**Exit:** approved items are current, platform diagnostics are owned, and no
manual platform copy can drift from Supabase.

### Gate 4 — useful search content

**[Shared]**

Start small. Candidate pages must be based on evidence of shopper need:

- factual care, display, construction/process, and expected-longevity guide;
- shipping deadlines and returns FAQ;
- accurate comparison of gold-dipped, gold-plated, preserved, artificial, and
  fresh roses;
- selected anniversary, Valentine's Day, or Mother's Day guides only when
  ELDREVE can provide materially different advice for each intent.

Before publishing a page, require:

- a distinct primary user question and useful answer;
- original factual text, appropriate images, and internal links;
- accurate product suitability and limitations;
- no fabricated expertise, urgency, reviews, citations, or statistics;
- canonical inclusion in navigation/sitemap where appropriate;
- a plan to update or remove stale seasonal facts.

Do not pre-commit to “dozens” of programmatic pages. Five excellent pages are
more appropriate than fifty near-duplicates.

### Gate 5 — reviews and external evidence

**[Shared]**

- Request reviews from fulfilled buyers.
- Store product/variant, rating, text, date, verification, and moderation
  status.
- Publish genuine visible reviews before adding `Review` or `aggregateRating`
  markup.
- Seek legitimate creator, publisher, gift-guide, supplier, or community
  coverage; do not buy links or manufacture third-party sites.

**Exit:** structured review facts are backed by visible, genuine records and
the review process is documented.

### Gate 6 — measurement and operation

**[Shared]**

- Add referral/channel rules for ChatGPT, Perplexity, Claude, Copilot/Bing, and
  Gemini/Google where the referrer or UTM value identifies them.
- Track landing → product view → add to cart → checkout start → approved
  payment → refund/return.
- Review Search Console coverage/performance and Merchant Center diagnostics.
- Treat answer presence and merchant rank in test prompts as noisy diagnostics,
  not a business KPI.

## 8. Prioritized backlog

| ID    | Tag          | Work                                                                    | Dependency        | Done when                                                  |
| ----- | ------------ | ----------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| SD-00 | Shared       | Complete repository-review launch blockers                              | None              | Gate 0 integrity fixes are verified                        |
| SD-01 | Shared       | Replace placeholder claims and publish policy/contact pages             | Real owner inputs | Gate 0 truth review passes                                 |
| SD-02 | SEO          | Verify production domain and Search Console; submit sitemap             | Stable domain     | Property ownership and sitemap status confirmed            |
| SD-03 | Shared       | Fix JSON-LD escaping, absolute URLs, and exact variants                 | SD-01             | Representative pages pass structured-data tests            |
| SD-04 | Commerce     | Define canonical record and missing source fields                       | SD-00, SD-01      | Typed model and field ownership documented                 |
| SD-05 | Commerce     | Implement normalizer, validator, and tests                              | SD-04             | Invalid records fail closed; fixtures pass                 |
| SD-06 | Commerce     | Implement and test Google scheduled feed                                | SD-05             | Parse test passes and live route contains only valid items |
| SD-07 | Commerce     | Configure Merchant Center and resolve diagnostics                       | SD-02, SD-06      | Eligible products approved/current                         |
| SD-08 | GEO          | Correct crawler categories and `llms.txt` identity/data                 | SD-01             | Public output is accurate; private routes remain protected |
| SD-09 | Shared       | Publish the first evidence-led guide/FAQ set                            | SD-01, SD-02      | Each page passes the content gate                          |
| SD-10 | GEO/Commerce | Apply for OpenAI merchant program and build current adapter if accepted | SD-05, SD-07      | Accepted transport validates and stays synchronized        |
| SD-11 | Commerce     | Reuse/import feed in Microsoft when market value justifies it           | SD-07             | No separate manual catalog                                 |
| SD-12 | Shared       | Implement genuine reviews and conditional markup                        | Fulfilled orders  | Visible verified data backs markup                         |
| SD-13 | Shared       | Add AI-referral classification and funnel reporting                     | Stable analytics  | Monthly report separates attributable channels             |

## 9. Verification

### Automated

- unit-test canonical mapping and required-field validation;
- snapshot/parse each feed adapter;
- assert stable IDs, absolute HTTPS URLs, cents-to-currency conversion, exact
  variant availability, and exclusion of inactive/invalid products;
- assert JSON-LD serialization cannot terminate the script element;
- test route content type, caching contract, and unauthenticated accessibility;
- add regression fixtures for stock, price, policy, and variant mismatch.

### Pre-release manual

- compare one variant across admin, product page, JSON-LD, feed, cart, and
  checkout;
- test Rich Results output and Google URL Inspection;
- fetch sitemap, robots, `llms.txt`, policies, and feed from production;
- confirm images and canonical URLs return `200`;
- confirm no private/admin fields are present;
- inspect merchant diagnostics after the platform processes the feed.

## 10. Success measures

Track outcomes by funnel stage, not a single “GEO score”:

| Stage      | Measures                                                                     |
| ---------- | ---------------------------------------------------------------------------- |
| Technical  | Valid indexed URLs, excluded/error reasons, structured-data errors           |
| Catalog    | Valid/approved item ratio, feed age, price/stock mismatches, disapprovals    |
| Discovery  | Search impressions/clicks/CTR; attributable AI and shopping referrals        |
| Engagement | Product views, useful-page engagement, add-to-cart rate                      |
| Commerce   | Checkout starts, approved payments, revenue, cancellations, refunds, returns |
| Quality    | Unsupported-claim count, stale-policy incidents, feed validation failures    |

Do not report “mentioned by an AI” as success unless it produces accurate,
repeatable, attributable user value.

## 11. Operating cadence

- **After commercial edits:** revalidate page/schema/feed and inspect the exact
  changed offer.
- **Daily after feed launch:** check feed fetch/process failures and critical
  price or availability mismatches.
- **Weekly:** review Search Console coverage, Merchant diagnostics, referral
  classification, and conversion anomalies.
- **Monthly:** review content usefulness, stale facts, query opportunities,
  policy accuracy, platform specification changes, and a small versioned AI
  prompt test set.
- **Quarterly:** remove or consolidate weak pages; audit crawler choices,
  merchant programs, identifiers, shipping, returns, and measurement privacy.

## 12. Primary references

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Google: product variants](https://developers.google.com/search/docs/appearance/structured-data/product-variants)
- [Google: Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google Merchant Center: free listings](https://support.google.com/merchants/answer/13889434?hl=en)
- [Google Merchant API: data-source options](https://developers.google.com/merchant/api/guides/data-sources/overview)
- [OpenAI: product feed specification](https://developers.openai.com/commerce/specs/file-upload/products)
- [OpenAI: crawler controls](https://developers.openai.com/api/docs/bots)
- [OpenAI: shopping merchant guidance](https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search)
- [Microsoft: Merchant Center catalog feeds](https://learn.microsoft.com/en-us/advertising/msa-help/hlp_ba_conc_bmcwhatiscatalog)

