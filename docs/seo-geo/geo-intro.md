# How AI Search Finds and Recommends Products

**GoldRose research report — verified 23 July 2026**

AI shopping changes quickly. This report separates confirmed platform documentation from emerging research and inference. It is a broad, source-led review, not a claim that every proprietary ranking factor is known.

Implementation is tracked only in
[search-discovery-implementation.md](search-discovery-implementation.md).

> **Reconciled 2026-08-04.** The report's findings still stand; two facts in its
> storefront audit have moved since 23 July. (1) The site is now
> <https://eldreve.com> — the brand is ELDREVE, and every "GoldRose" below is
> pending the rename (AI-021). (2) Seven `/policies/*` routes now exist, but they
> are **coming-soon scaffolds with no policy text** (AI-012), so the audit's
> conclusion is unchanged: there is still nothing a merchant program can read.

## Executive summary

AI systems do not use one universal “AI ranking.” They usually:

1. interpret the shopper’s need, constraints, and conversational context;
2. rewrite or expand the request into several searches;
3. retrieve candidates from web indexes, merchant feeds, marketplaces, reviews, and partner catalogs;
4. match product entities and variants;
5. remove ineligible, unavailable, unsafe, or inconsistent offers;
6. rank the remaining products for relevance, trust, freshness, offer quality, and sometimes personalization;
7. generate an answer or product cards; then separately choose which merchant offer to show;
8. hand the shopper to the merchant or an agentic checkout.

For GoldRose, the strongest controllable strategy is not “write for an LLM.” It is:

- publish accurate, complete, visible product information;
- keep page, structured data, feed, inventory, shipping, and checkout facts identical;
- provide Google, Microsoft, OpenAI, and payment/catalog partners with fresh structured product data;
- earn genuine reviews and third-party mentions;
- allow the correct **search** crawlers while treating **training** crawlers separately;
- create useful occasion and comparison content that answers real shopping questions;
- measure qualified referrals and sales, not only whether a chatbot mentions the brand.

The immediate blocker is data trust. GoldRose currently shows placeholder reviews, discounts, shipping promises, options, and sales claims on its product page. It also lacks public privacy, terms, shipping, returns, and contact pages. Fix these before submitting to merchant programs.

## Evidence labels

- **Confirmed:** stated in current official documentation or directly observed on GoldRose.
- **Vendor-stated:** a platform describes its own system; useful, but exact weights remain private.
- **Emerging research:** a paper or preprint under controlled conditions, not proof of a durable production ranking factor.
- **Inference:** a practical conclusion formed by combining the evidence; it should be tested.

## 1. The end-to-end product recommendation pipeline

### 1.1 Intent and constraint extraction

The system first decides whether the request is commercial and extracts constraints such as:

- product category and use case;
- recipient or occasion;
- budget and currency;
- location and delivery deadline;
- material, colour, size, style, or compatibility;
- quality threshold and exclusions;
- preferences from the current conversation or, where enabled, past activity and memory.

ChatGPT says shopping results consider the user’s query and context, including Memory and custom instructions. Google says AI Mode can use previous searches and connected personalization. Amazon’s Alexa for Shopping uses catalog knowledge, reviews, Q&A, web information, and customer activity. These are platform-specific personalization systems, not a general rule that every user sees a unique result. ([OpenAI shopping results](https://help.openai.com/en/articles/11128490-improved-shopping-results-from-chatgpt-search), [Google AI Mode personalization](https://support.google.com/websearch/answer/17212611?hl=en), [Amazon Alexa for Shopping](https://www.aboutamazon.com/news/retail/amazon-rufus-ai-assistant-personalized-shopping-features))

### 1.2 Query rewriting and fan-out

The original prompt may not be the query used for retrieval.

- ChatGPT can rewrite a prompt into one or more targeted searches and issue follow-up searches.
- Google AI features use “query fan-out”: several related searches across subtopics and data sources.
- A request such as “a lasting anniversary gift under US$150” can become searches about relevant product types, materials, price, reviews, shipping, and gift suitability.

This makes topical coverage and clear facts more useful than repeating one exact keyword. ([How ChatGPT search works](https://help.openai.com/en/articles/9237897-chatgpt-), [Google AI features and websites](https://developers.google.com/search/docs/appearance/ai-features), [Google AI Mode](https://blog.google/products-and-platforms/products/search/ai-mode-search/))

### 1.3 Candidate retrieval

Platforms combine different sources:

| Source                                         | Typical role                                                                   | GoldRose control                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| Crawled/indexed pages                          | Discover the brand, products, guides, policies, and supporting evidence        | High                                    |
| Merchant feeds and catalog APIs                | Precise title, variant, price, availability, image, shipping, and policy facts | High                                    |
| Marketplace/payment catalogs                   | Product discovery and sometimes cart/checkout                                  | Medium; requires enrollment             |
| Reviews, Q&A, creators, forums, and publishers | Trust, comparisons, use cases, and external corroboration                      | Indirect                                |
| Knowledge graphs and entity databases          | Brand/product identity and relationship resolution                             | Indirect                                |
| Conversation and user preferences              | Personal relevance                                                             | Low                                     |
| Advertising inventory                          | Sponsored placement where offered                                              | Optional; should be labelled separately |

Examples:

- OpenAI uses web results and shopping data providers, lists Bing and Shopify among providers, and accepts direct merchant feeds.
- Google combines its web index, Knowledge Graph, and Shopping Graph. Google says the Shopping Graph holds more than 50 billion listings, with more than two billion refreshed hourly.
- Microsoft Copilot uses web results plus Microsoft Merchant Center feeds.
- Perplexity crawls the web and can surface eligible merchant products through its commerce integrations.
- Amazon primarily reasons over Amazon’s own catalog, customer behaviour, reviews, Q&A, and selected web information.
- Meta’s shopping mode combines Marketplace listings, web information, and Meta community/creator content.

Sources: [OpenAI search providers](https://help.openai.com/en/articles/9237897-chatgpt-), [OpenAI merchant program](https://chatgpt.com/merchants/), [Google AI shopping](https://blog.google/products-and-platforms/products/shopping/google-shopping-ai-mode-virtual-try-on-update/), [Microsoft agentic commerce](https://about.ads.microsoft.com/en/solutions/technology/agentic-commerce), [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Amazon science](https://www.amazon.science/blog/the-technology-behind-amazons-genai-powered-shopping-assistant-rufus), [Meta shopping mode](https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs/)

### 1.4 Entity, offer, and variant resolution

The system has to determine that:

- two records refer to the same product;
- several offers are sold by different merchants;
- colour or size records are variants, not unrelated products;
- the exact variant requested is in stock;
- a review belongs to the correct item.

Stable internal IDs, brand, SKU, legitimate GTIN/MPN, variant group IDs, canonical URLs, and consistent titles make this easier. Do not invent identifiers. Google says product-rating matching is strongest with GTIN, then MPN plus brand; OpenAI’s feed specification also supports product and variant identifiers. ([Google Product Ratings](https://support.google.com/merchants/answer/14620705?hl=en), [OpenAI product feed specification](https://developers.openai.com/commerce/specs/file-upload/products))

### 1.5 Eligibility and safety

Being understood does not mean being eligible. A system may filter an item because:

- it cannot be bought or shipped in the shopper’s country;
- price or availability conflicts across page, feed, schema, and checkout;
- the page is broken, blocked, thin, misleading, or lacks business/policy information;
- a prohibited or restricted product policy applies;
- the item has no usable image or product URL;
- the product or merchant is not enrolled in the relevant commerce program.

Google explicitly requires honest, transparent, accurate representation and a functional site. OpenAI’s feed contains separate search, checkout, and advertising eligibility fields. These are distinct decisions. ([Google misrepresentation policy](https://support.google.com/merchants/answer/12073010?hl=en), [OpenAI feed fields](https://developers.openai.com/commerce/specs/file-upload/products))

### 1.6 Product ranking and merchant-offer ranking

No platform publishes a complete formula or fixed weighting. The recurring signal families are:

| Signal family             | What it means in practice                                                                                    | Evidence                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Intent relevance          | The product directly satisfies category, occasion, budget, material, style, location, and timing constraints | All major systems                                              |
| Data completeness         | Clear title, factual description, category, images, identifiers, variants, dimensions, and policies          | Google, Microsoft, OpenAI                                      |
| Freshness and consistency | Current stock, price, currency, shipping, and landing-page agreement                                         | Google, Microsoft, OpenAI                                      |
| Product quality and trust | Genuine ratings/reviews, credible sources, detailed evidence, safe merchant                                  | Google, OpenAI, Amazon                                         |
| Offer attractiveness      | Landed price, delivery speed, availability, returns, and seller quality                                      | OpenAI and Amazon explicitly                                   |
| Seller relationship       | Maker or primary seller may be preferred when equivalent offers exist                                        | OpenAI explicitly                                              |
| Popularity/performance    | Purchases and product performance can inform ranking on some systems                                         | Amazon explicitly; optional performance fields in OpenAI feeds |
| Personal fit              | User preferences, activity, memory, or loyalty relationship                                                  | Google, OpenAI, Amazon                                         |

OpenAI says product selection is independent of ads or commercial partnerships. It separately ranks merchant offers using factors such as availability, price, quality, whether the merchant is the maker or primary seller, and user context. Amazon’s published EU explanation describes intent matching followed by ranking and says offer attractiveness includes landed price and delivery speed. ([OpenAI shopping results](https://help.openai.com/en/articles/11128490-improved-shopping-results-from-chatgpt-search), [Amazon compliance report, Annex 1](https://assets.aboutamazon.com/50/7b/92fca0af4323afd758ebd636b4db/amazon-compliance-report-2025-annex-1.pdf))

### 1.7 Answer and card generation

The displayed wording may not be the merchant’s exact copy. OpenAI says it can generate product titles and descriptions from merchant and third-party metadata, summarize reviews from public websites, and attach labels based on third-party information. Ratings are not independently verified by OpenAI.

This creates two obligations:

1. provide precise source facts that survive summarisation;
2. monitor the generated representation because an AI answer can still be wrong.

Product selection, generated explanation, merchant selection, and checkout eligibility are four different layers. A page citation is not proof that its product was recommended; a recommendation is not proof the offer can be bought in-chat. ([OpenAI shopping results](https://help.openai.com/en/articles/11128490-improved-shopping-results-from-chatgpt-search))

### 1.8 Checkout and feedback

The final step may be:

- a referral to the merchant’s product page;
- a cart handoff;
- an embedded or agentic checkout;
- a marketplace purchase.

OpenAI is prioritising product discovery and merchant-owned checkout over its earlier standalone Instant Checkout direction. Its commerce feeds remain a way to improve discovery and accuracy. Google’s Universal Commerce Protocol, OpenAI and Stripe’s Agentic Commerce Protocol, Microsoft Copilot commerce, and PayPal Store Sync are different integration paths—not one shared ranking standard. ([OpenAI merchants](https://chatgpt.com/merchants/), [OpenAI product discovery](https://openai.com/index/powering-product-discovery-in-chatgpt/), [UCP developer documentation](https://developers.google.com/merchant/ucp), [Agentic Commerce Protocol](https://www.agenticcommerce.dev/docs), [PayPal Store Sync](https://developer.paypal.com/store-sync/overview))

## 2. What each major platform currently uses

| Platform                                        | Discovery inputs                                                                        | Public merchant route                                                                       | Important qualification                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ChatGPT                                         | Bing/web search, crawled pages, providers such as Shopify, direct merchant product data | Apply to OpenAI’s merchant program; feed supports daily full snapshot plus intraday updates | Shopping is currently live in the US; applications include Australian-headquartered merchants, but access is waitlisted |
| Google Search, AI Overviews, AI Mode and Gemini | Google index, Knowledge Graph, Shopping Graph, Merchant Center                          | Merchant Center free listings; structured data; UCP waitlist for agentic actions            | Normal Search eligibility still applies; no special AI file or schema is required                                       |
| Microsoft Copilot                               | Web index plus Microsoft Merchant Center                                                | MMC feed, API, or Google feed import; opt in to agentic commerce                            | Copilot Checkout’s current documented buyer scope is US/English/USD                                                     |
| Perplexity                                      | Web search, PerplexityBot index, third-party and commerce data                          | Eligible products through supported merchant/payment pathways, including PayPal Store Sync  | Instant Buy availability is currently limited, including US scope                                                       |
| Amazon Alexa for Shopping                       | Amazon catalog, customer actions, reviews, Q&A, and web sources                         | Sell on Amazon and maintain strong listing/catalog quality                                  | It is primarily an Amazon shopping surface, not an open-web merchant feed                                               |
| Claude                                          | Web search across cited sources and user-requested page fetches                         | No verified public product-feed or merchant-ranking program found                           | Optimise crawlable factual pages; `Claude-SearchBot` is distinct from training crawler `ClaudeBot`                      |
| Meta AI shopping mode                           | Marketplace, public web, creators, Groups, Reels, and posts                             | No general external-merchant feed program was verified in this review                       | Marketplace/community presence matters more than adding a special website file                                          |

### ChatGPT details

- `OAI-SearchBot` is for search visibility; `GPTBot` is for model training. Blocking one does not imply blocking the other.
- `ChatGPT-User` represents user-triggered visits and may not follow robots rules in the same way as an automated crawler.
- Any public page can be referenced, but allowing `OAI-SearchBot` is required for inclusion in summaries and snippets.
- ChatGPT referrals include `utm_source=chatgpt.com`, which makes first-party measurement practical.
- A direct feed is not mandatory for a crawlable product, but it gives the merchant more control over accuracy and freshness.

Sources: [OpenAI bots](https://developers.openai.com/api/docs/bots), [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq?1-star=1), [OpenAI merchant program](https://chatgpt.com/merchants/), [OpenAI feed overview](https://developers.openai.com/commerce/guides/get-started), [OpenAI file uploads](https://developers.openai.com/commerce/specs/file-upload/overview)

### Google details

Google says there are no extra technical requirements for AI Overviews or AI Mode beyond normal Search eligibility. Its July 2026 guidance says these features use retrieval-augmented generation grounded by core Search ranking systems plus query fan-out. A page must be indexed and eligible to show a snippet. Its guidance is to:

- make important content available in text;
- use high-quality images and video where useful;
- ensure structured data matches visible content;
- keep Merchant Center data current.

Google explicitly says a new AI text file or special AI schema is not required. `llms.txt` may help other consumers, but Google says it neither helps nor harms Google Search visibility. `Google-Extended` controls certain Gemini training/grounding uses and does **not** control inclusion or ranking in Google Search. ([Google generative-AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?hl=en), [Google AI features and websites](https://developers.google.com/search/docs/appearance/ai-features), [Google crawler controls](https://developers.google.com/crawling/docs/about-crawling?hl=en))

For shopping, use both Product structured data and Merchant Center where possible. Google says this maximises eligibility and helps it understand and verify product information. Free listings can appear across Search, Images, Lens, YouTube, Gemini, the Shopping tab, and other surfaces, but submission never guarantees display. Australia is supported for free listings. ([Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product), [Google merchant listings](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=en), [Google free listings](https://support.google.com/merchants/answer/13889434?hl=en), [supported countries](https://support.google.com/merchants/answer/13692890?hl=en))

### Microsoft details

Microsoft says organic Copilot shopping uses web information and Microsoft Merchant Center feeds. Approved products are automatically eligible for free product listings. Microsoft accepts a direct feed/API and can import a Google feed. Its optimisation advice stresses a complete daily feed, current stock, detailed attributes/category/descriptions, and good images. ([Microsoft agentic commerce](https://about.ads.microsoft.com/en/solutions/technology/agentic-commerce), [Microsoft free product listings](https://help.ads.microsoft.com/apex/index/3/en/60063), [Microsoft feed optimisation](https://help.ads.microsoft.com/apex/index/3/en-gb/50886))

### Perplexity and PayPal details

`PerplexityBot` builds the search index and is not described as a training crawler. `Perplexity-User` fetches a page in response to a user request and generally ignores robots rules. Perplexity’s current Instant Buy through PayPal is limited to selected merchant products and US availability. ([Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Perplexity Instant Buy](https://www.perplexity.ai/help-center/en/articles/12932923-instant-buy-buy-with-paypal))

PayPal Store Sync exposes catalog, cart, order, and checkout information to supported AI shopping assistants. Its current documented prerequisites include an existing PayPal merchant, physical goods sold in USD to US customers, PayPal Orders v2 or Braintree, and an accessible catalog. GoldRose already uses Orders v2 and sells physical goods in USD, so this is the closest technical fit once its catalog and policies are production-ready. Access still has to be requested; eligibility is not guaranteed. ([PayPal Store Sync overview](https://developer.paypal.com/store-sync/overview), [PayPal AI-discovery guidance](https://www.paypal.com/us/brc/article/optimize-products-for-ai-discovery))

## 3. What actually improves visibility

### 3.1 Product data is the source of truth

At minimum, every sellable variant should have:

- stable product and variant IDs;
- factual title and description;
- canonical product URL;
- absolute primary and additional image URLs;
- brand or maker;
- condition;
- price and currency;
- availability and quantity status;
- target country and store country;
- variant attributes such as colour or size;
- SKU and legitimate GTIN/MPN where they exist;
- material, dimensions, weight, and package contents;
- shipping destination, price, carrier/service, and delivery estimate;
- return window, method, fees, and policy URL;
- seller/business identity;
- genuine review aggregate only after valid reviews exist.

OpenAI additionally supports Q&A, popularity, return-rate, related-product, geographic, search-eligibility, checkout-eligibility, and ad-eligibility fields. Those fields indicate what its commerce layer can consume; they do not prove a fixed ranking boost. ([OpenAI product feed specification](https://developers.openai.com/commerce/specs/file-upload/products), [Google product data specification](https://support.google.com/merchants/answer/7052112?hl=en))

### 3.2 Page, schema, feed, and checkout must agree

The same fact can appear in four places:

```text
Visible product page
        │
        ├── Product/Offer structured data
        ├── Merchant feeds and APIs
        └── Checkout and order system
```

A mismatch weakens confidence and can cause disapproval. The visible page is not optional: Google says structured data must represent visible content, and merchant-feed price and availability must match the landing page. ([Google AI features](https://developers.google.com/search/docs/appearance/ai-features), [Google product data specification](https://support.google.com/merchants/answer/7052112?hl=en))

### 3.3 Useful content should satisfy shopping subquestions

Because search systems fan out, one useful guide can support several stages of a decision:

- “Is a preserved rose a suitable anniversary gift?”
- “What does 24K gold-dipped mean?”
- “How large is it and how should it be displayed?”
- “Can it arrive before my date?”
- “How is it different from plated metal, artificial, or preserved roses?”
- “What is included, and what is the return policy?”

Pages should answer the question early, use specific evidence, show relevant products naturally, and link to primary sources for technical claims. Do not manufacture scientific authority or force repetitive keywords.

### 3.4 External trust still matters

AI systems can consult reviews, publisher comparisons, creator content, forums, and community posts. Genuine verified-purchaser reviews, consistent business information, and independent mentions provide evidence the merchant cannot create merely by adding schema.

The original academic “GEO” paper found that adding citations, quotations, and statistics could increase its visibility metric in a fixed benchmark by up to 40%, depending on the domain. It did **not** test durable organic product ranking or revenue. Newer controlled preprints suggest topical relevance and context position are strong citation drivers and warn that results vary substantially by platform and pipeline. Treat these as content-quality clues, not guaranteed ranking recipes. ([GEO paper](https://arxiv.org/abs/2311.09735), [Princeton publication record](https://collaborate.princeton.edu/en/publications/geo-generative-engine-optimization/), [2026 GEO survey preprint](https://arxiv.org/abs/2607.14035), [controlled retrieval preprint](https://arxiv.org/abs/2605.25517))

## 4. GoldRose storefront audit

The audit used the repository and the live production endpoints on 23 July 2026.

| Area                    | Observed state                                                                                                                                               | Why it matters                                                                                                                     | Priority |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Product page truth      | Visible page contains static “BEST SELLER,” 4.9/286 reviews, 15% off, US warehouse, 3–5 business days, and 120 colours; many visible options are also static | Misleading or inconsistent claims can cause merchant disapproval and bad AI summaries                                              | **P0**   |
| Product description     | Database description is used in metadata/schema but is not shown as meaningful visible product copy                                                          | Search and shoppers need accessible evidence; schema should match visible content                                                  | **P0**   |
| Policies/business trust | No public privacy, terms, shipping, returns/refunds, or contact routes were found; live `llms.txt` uses an example-domain support address                    | Merchant trust and eligibility depend on real business and policy information                                                      | **P0**   |
| Crawler controls        | `robots.txt` allows `GPTBot`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`, `CCBot`, and `Bytespider`                                       | It omits current search-specific agents such as `OAI-SearchBot` and `Claude-SearchBot`; training and search controls are conflated | **P0**   |
| Product schema          | Product JSON-LD includes name, description, first-variant SKU/price, images, and broad stock status                                                          | Live image URL is relative; variants, shipping, returns, seller/brand, and legitimate identifiers are incomplete                   | **P1**   |
| Feed readiness          | Supabase holds useful product and variant data, including internal barcode/weight fields, but there is no public merchant-feed export                        | Feed is the most controllable source for current product facts                                                                     | **P1**   |
| Sitemap/metadata        | Active products are in the sitemap; pages have canonical, Open Graph, metadata, and Product JSON-LD                                                          | Good foundation; preserve it while fixing accuracy                                                                                 | Strength |
| `llms.txt`              | Dynamically lists products, prices, stock, links, countries, and contact                                                                                     | Helpful optional summary, but not a Google requirement or proven ranking factor; current content must be made truthful             | **P1**   |
| Attribution             | First-party beacon captures UTM/referrer, but channel grouping lacks ChatGPT, Perplexity, Claude, Copilot, and Gemini                                        | AI traffic will fragment into raw source labels                                                                                    | **P2**   |

### Crawler policy that GoldRose should use

Treat these categories separately:

| Purpose                  | Examples                                                                      | Recommended default                                                       |
| ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Search/index discovery   | `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, normal search bots      | Allow public catalog/content; block account, admin, API, and checkout     |
| User-triggered retrieval | `ChatGPT-User`, `Perplexity-User`, `Claude-User`                              | Do not rely on robots as access control; keep private pages authenticated |
| Model training           | `GPTBot`, `ClaudeBot`, `Google-Extended` and other declared training controls | Owner policy choice; independent of search visibility                     |

Never use `robots.txt` to protect private data. Authentication and authorisation must do that.

## 5. Implementation handoff

This report's audit and evidence inform the unified
[search-discovery implementation plan](search-discovery-implementation.md).
That document owns:

- the truth and commerce-integrity launch gate;
- the canonical product-record and platform-feed architecture;
- Google, OpenAI, and Microsoft delivery sequencing;
- content, review, and measurement work;
- backlog IDs, dependencies, tests, exit criteria, and operating cadence.

Keeping the actions there prevents the platform research in this report from
becoming a second, drifting roadmap.

## 6. Myths and risky tactics

| Claim                                                      | Assessment                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| “`llms.txt` makes Google rank the store in AI answers.”    | Unsupported. Google explicitly says no new AI file is needed. Keep the file only as an accurate optional summary.   |
| “Allowing `GPTBot` enables ChatGPT Search.”                | Incorrect. `OAI-SearchBot` is the search crawler; `GPTBot` is for training.                                         |
| “Schema alone is enough.”                                  | Incorrect. It improves understanding/eligibility, but must match visible page and merchant-feed data.               |
| “A merchant feed guarantees recommendations.”              | Incorrect. It improves data control and eligibility, not guaranteed placement.                                      |
| “More keywords or AI-written pages create authority.”      | Unsupported and risky. Relevance, factual depth, and external trust matter more.                                    |
| “Ads improve organic AI selection.”                        | Not established. OpenAI says shopping selection is independent of ads; Google separates organic and paid reporting. |
| “Citations or statistics produce a guaranteed 40% boost.”  | Incorrect interpretation of one controlled academic benchmark.                                                      |
| “Mentioning the brand on many low-quality sites helps.”    | Risky. It can create spam, policy, and reputation problems without genuine authority.                               |
| “Fake reviews are acceptable until real reviews arrive.”   | False and high risk. They mislead users, feeds, search systems, and regulators.                                     |
| “Agentic checkout should be built before catalog quality.” | Backwards. Reliable discovery, policies, stock, pricing, and order handling are prerequisites.                      |

## 7. Readiness handoff

The authoritative readiness gates and success measures are in
[search-discovery-implementation.md](search-discovery-implementation.md).
The central conclusion from this research remains: GoldRose is not ready for
merchant submission until its visible claims, product data, inventory,
checkout, policies, structured data, and feeds agree.

## 8. Source library

### OpenAI and agentic commerce

- [Improved shopping results from ChatGPT Search](https://help.openai.com/en/articles/11128490-improved-shopping-results-from-chatgpt-search)
- [How ChatGPT Search works and its data providers](https://help.openai.com/en/articles/9237897-chatgpt-)
- [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)
- [Publisher and developer FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq?1-star=1)
- [OpenAI merchant program](https://chatgpt.com/merchants/)
- [Commerce feed getting started](https://developers.openai.com/commerce/guides/get-started)
- [File-upload feed overview](https://developers.openai.com/commerce/specs/file-upload/overview)
- [OpenAI product feed specification](https://developers.openai.com/commerce/specs/file-upload/products)
- [Powering product discovery in ChatGPT](https://openai.com/index/powering-product-discovery-in-chatgpt/)
- [Agentic Commerce Protocol documentation](https://www.agenticcommerce.dev/docs)
- [Agentic Commerce Protocol repository](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)

### Google

- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Official guide to optimising for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?hl=en)
- [AI Mode and query fan-out](https://blog.google/products-and-platforms/products/search/ai-mode-search/)
- [AI Mode shopping and the Shopping Graph](https://blog.google/products-and-platforms/products/shopping/google-shopping-ai-mode-virtual-try-on-update/)
- [Google visual shopping update](https://blog.google/products-and-platforms/products/search/search-ai-updates-september-2025/)
- [AI Mode personalization](https://support.google.com/websearch/answer/17212611?hl=en)
- [Shopping preferences and favourite brands](https://support.google.com/websearch/answer/13005558?hl=en)
- [Free listings](https://support.google.com/merchants/answer/13889434?hl=en)
- [Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Merchant listing structured data](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=en)
- [Product data specification](https://support.google.com/merchants/answer/7052112?hl=en)
- [Product-data optimisation](https://support.google.com/merchants/answer/7380908?hl=en)
- [Merchant Center AI performance insights](https://support.google.com/merchants/answer/17200695?hl=en)
- [Search Console generative-AI performance reports](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports)
- [Product Ratings participation](https://support.google.com/merchants/answer/14620705?hl=en)
- [Misrepresentation policy](https://support.google.com/merchants/answer/12073010?hl=en)
- [Google crawler controls](https://developers.google.com/crawling/docs/about-crawling?hl=en)
- [Free-listing supported countries](https://support.google.com/merchants/answer/13692890?hl=en)
- [Universal Commerce Protocol developer documentation](https://developers.google.com/merchant/ucp)
- [How UCP works](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/)
- [UCP specification site](https://ucp.dev/)
- [Google Search documentation updates](https://developers.google.com/search/updates)

### Microsoft

- [Microsoft agentic commerce](https://about.ads.microsoft.com/en/solutions/technology/agentic-commerce)
- [Microsoft Merchant Center free product listings](https://help.ads.microsoft.com/apex/index/3/en/60063)
- [Microsoft feed optimisation](https://help.ads.microsoft.com/apex/index/3/en-gb/50886)

### Perplexity and PayPal

- [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Perplexity Instant Buy with PayPal](https://www.perplexity.ai/help-center/en/articles/12932923-instant-buy-buy-with-paypal)
- [PayPal Store Sync overview](https://developer.paypal.com/store-sync/overview)
- [PayPal guidance for AI product discovery](https://www.paypal.com/us/brc/article/optimize-products-for-ai-discovery)
- [PayPal Store Sync terms](https://www.paypal.com/storesync/legal/terms)

### Amazon, Anthropic, and Meta

- [Amazon Alexa for Shopping](https://www.aboutamazon.com/news/retail/amazon-rufus-ai-assistant-personalized-shopping-features)
- [Amazon Rufus background](https://www.aboutamazon.com/news/retail/amazon-rufus)
- [Amazon science: technology behind Rufus](https://www.amazon.science/blog/the-technology-behind-amazons-genai-powered-shopping-assistant-rufus)
- [Amazon compliance report, Annex 1](https://assets.aboutamazon.com/50/7b/92fca0af4323afd758ebd636b4db/amazon-compliance-report-2025-annex-1.pdf)
- [Anthropic web search announcement](https://www.anthropic.com/news/web-search)
- [Using web search in Claude](https://support.anthropic.com/en/articles/10684626-enabling-and-using-web-search)
- [Anthropic crawler controls](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Meta AI shopping mode](https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs/)
- [Meta AI grounded in public Facebook content](https://about.fb.com/news/2026/06/new-ai-tools-to-help-you-make-things-happen-on-facebook/)

### Independent research

- [GEO: Generative Engine Optimization](https://arxiv.org/abs/2311.09735)
- [Princeton record for the peer-reviewed GEO paper](https://collaborate.princeton.edu/en/publications/geo-generative-engine-optimization/)
- [Generative Engine Optimization: A Survey](https://arxiv.org/abs/2607.14035) — 2026 preprint
- [Controlled study of citation selection in retrieval-augmented generation](https://arxiv.org/abs/2605.25517) — 2026 preprint
- [Brand bias in LLM recommendations](https://arxiv.org/abs/2406.13997) — preprint
- [Incumbent advantage in generative recommendations](https://arxiv.org/abs/2606.17443) — 2026 preprint
- [Popularity bias in LLM recommendations](https://arxiv.org/pdf/2406.01285) — preprint

---

**Bottom line:** AI product visibility is ordinary search eligibility plus excellent commerce data, trustworthy evidence, and platform-specific distribution. GoldRose already has a useful technical foundation—server-rendered product routes, sitemap, metadata, JSON-LD, a database catalog, PayPal Orders v2, and first-party attribution. Its next gain will come from making every public claim true and every commercial fact consistent, then distributing that canonical catalog through Merchant Center and eligible AI-commerce programs.
