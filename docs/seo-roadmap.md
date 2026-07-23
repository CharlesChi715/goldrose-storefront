# SEO opportunity map

**Purpose:** concise, verified background—not the implementation tracker

**Last verified:** 2026-07-23

Use [search-discovery-implementation.md](search-discovery-implementation.md)
for sequencing, ownership, gates, and acceptance criteria. Use
[geo-intro.md](geo-intro.md) for the deeper AI-search and commerce research.

## What the repository already has

GoldRose does not have “essentially one indexable page.” It already has `/`,
`/shop`, and one canonical `/products/[slug]` route per active product, plus a
sitemap, robots rules, metadata, Open Graph data, Product JSON-LD, and
`/llms.txt`. That is a useful technical baseline.

The immediate constraint is commercial truth, not page count. Several visible
claims are placeholders, policies are not yet public, important product copy is
not meaningfully visible, and the repository review found stock/order-integrity
defects. Search expansion and merchant feeds should wait until those inputs are
trustworthy.

## Verified opportunities

### 1. Make every existing product page complete and consistent

This is the highest-priority search work. Each page should expose useful,
DB-backed product and exact-variant facts; accessible images; canonical URLs;
and structured data that matches the visible page, price, availability,
shipping, returns, and checkout.

Structured data helps Google understand a page and can make it eligible for
product experiences. It does not guarantee indexing, a rich result, or a
ranking.

### 2. Add pages for real shopper decisions

Useful candidates include product care, construction/process, shipping
deadlines, returns, accurate product-type comparisons, and selected
occasion-specific guides. Every new URL must answer a distinct user need with
substantial original value.

“Programmatic SEO” is not automatically an advantage. Generating dozens of
near-identical occasion/audience pages risks doorway or scaled-content abuse.
Begin with a small number of strong pages justified by Search Console data,
customer questions, or credible demand research.

### 3. Distribute accurate offers through Merchant Center

A catalog feed can make eligible products available to Google shopping
surfaces and gives the merchant a controlled source for current offer data.
Free-listing appearance is not guaranteed. Eligibility depends on accurate
product data, a functional and trustworthy site, matching landing pages, and
applicable shipping/return information.

For GoldRose's small catalog, a generated scheduled feed is sufficient; a
standalone catalog API is unnecessary. The same normalized records can later
produce an OpenAI feed and be reused or imported by Microsoft.

### 4. Add genuine reviews only after orders

Google supports Product review and aggregate-rating structured data, but the
reviews must be genuine, visible, and associated with the reviewed item. Even
valid markup does not guarantee review stars or any other search treatment.
Remove placeholder ratings now; add review markup only when collected records
support it.

### 5. Build evidence and reputation

Original process photographs, defensible material claims, useful comparisons,
supplier evidence, customer reviews, and legitimate independent coverage make
the store more trustworthy to both people and retrieval systems. Avoid paid
link schemes, fabricated citations, fake reviews, and networks of low-quality
AI-generated pages.

### 6. Treat AI discovery as an extension of the same foundation

Google states that AI Overviews and AI Mode require no special AI file, schema,
or optimization beyond normal Search eligibility. Important information should
be crawlable, textual, useful, and consistent with structured data and current
Merchant Center information.

Other systems can have distinct crawlers or merchant feeds. Handle those as
delivery adapters and crawler-policy choices—not as a separate content truth.
`llms.txt` may remain as an accurate optional summary, but it is not a
Google requirement or a proven ranking signal.

## Measurement prerequisite

Verify the stable production domain in Google Search Console and submit the
sitemap before judging SEO work. Setup time varies with the chosen verification
method, and crawling/indexing can take time; it should not be promised as a
fixed ten-minute task.

Measure:

- indexed/valid URLs and exclusion reasons;
- search impressions, clicks, and click-through rate;
- merchant item approvals, disapprovals, and data freshness;
- attributable shopping and AI referrals;
- conversion, revenue, cancellation, refund, and return outcomes.

Google currently includes AI-feature traffic inside the Search Console
Performance report's Web search type, so it should not be described as a fully
separate Google AI channel.

## Primary references

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Google: review snippet structured data](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- [Google: Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google Merchant Center: free listings](https://support.google.com/merchants/answer/13889434?hl=en)
- [Google Merchant Center: free-listing policies](https://support.google.com/merchants/answer/12073010?hl=en)
- [OpenAI: product feed specification](https://developers.openai.com/commerce/specs/file-upload/products)
- [Microsoft: Merchant Center catalog feeds](https://learn.microsoft.com/en-us/advertising/msa-help/hlp_ba_conc_bmcwhatiscatalog)
