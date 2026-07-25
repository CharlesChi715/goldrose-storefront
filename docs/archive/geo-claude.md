# How AI search recommends products — research report (2026-07-23)

_Deep-research run (105 agents, 23 sources fetched, 25 top claims adversarially verified: 20 confirmed / 5 refuted). Prioritized primary sources — OpenAI, Google, Perplexity, Microsoft official docs — over SEO-blog speculation. Companion to [seo-intro.md](../seo-geo/seo-intro.md); this file covers the AI-search/GEO side specifically. Claims marked **[confirmed]** survived 3-vote verification against live primary sources; everything else is flagged._

> **See also [geo-intro.md](../seo-geo/geo-intro.md)** (formerly `geo-codex.md`) — the deeper primary doc: same core findings plus a GoldRose storefront audit (P0 data-trust fixes), Claude/Amazon/Meta coverage, and **PayPal Store Sync** (our closest-fit program), which this file missed. This file remains the quick summary.

## TL;DR
AI shopping surfaces run on **two parallel discovery channels**:

1. **Ordinary web crawling** by dedicated AI search bots (OAI-SearchBot, PerplexityBot) reading your product pages — works with zero sign-up if robots.txt allows them (ours does, via the admin AI-crawler toggle).
2. **Structured merchant product feeds** submitted to each vendor's program — OpenAI direct feeds, Google Merchant Center free listings, Perplexity Merchant Program, Microsoft Merchant Center. These are all **free**, and all vendors state recommendations are **organic, not paid placement**.

Because we are a custom store (not Shopify/Etsy — those get auto-integrated), **we must apply/submit to each program ourselves**. One Google-Shopping-style feed file covers most of them. Most programs are **US-gated as of July 2026** — eligibility depends on the merchant-of-record (owner's business), and needs checking per program.

Popular GEO folklore did **not** survive verification: no platform requires `llms.txt` (Google explicitly says no AI-specific markup is needed), and the "Reddit/Wikipedia/listicles dominate AI citations" statistics were refuted. Ours is already live and harmless, but it's not a lever.

## 1. Per-platform mechanisms (all confirmed against primary docs)

### ChatGPT search / shopping (OpenAI)

- **Crawling**: `OAI-SearchBot` powers ChatGPT search visibility; `GPTBot` is separate and only for model training. You can allow search while blocking training. Blocking OAI-SearchBot removes you from search answers. ChatGPT search also leans on **Bing's index** — Bing SEO matters for ChatGPT. **[confirmed]** (developers.openai.com/api/docs/bots)
- **Feeds**: OpenAI runs a merchant product-feed program. Shopify/Etsy catalogs are auto-integrated; independent stores **apply for direct-feed access** (currently US-merchant, waitlist-gated). Feed = platform-neutral flat file (Parquet+zstd preferred; JSONL/CSV/TSV gzipped also supported), pushed via SFTP / file upload / hosted URL; full feed **at least daily**, intraday price/stock updates via API. **[confirmed]** (sources: [file-upload spec](https://developers.openai.com/commerce/specs/file-upload/overview) — formats + "Recommended cadence: at least daily"; [get-started guide](https://developers.openai.com/commerce/guides/get-started) — "entire feed once a day … updates throughout the day via the API"; [field schema](https://developers.openai.com/commerce/product-feeds/spec); [help article](https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search) — Shopify/Etsy auto-integrated, others apply; [merchant application](https://chatgpt.com/merchants/))
- **Two eligibility tiers** in the feed spec: `is_eligible_search` (surface in results) vs `is_eligible_checkout` (buy-in-chat; requires search eligibility + privacy policy/ToS fields). **[confirmed]**
- **Ranking**: structured metadata (price, description) from first- and third-party sources + third-party content + OpenAI safety/product policies. When several merchants sell the same item: availability, price, quality, **maker/primary-seller status** (good for us — we're the maker), and whether agentic checkout is enabled. Self-reported by OpenAI, not independently audited. **[confirmed as OpenAI's stated policy]**
- **Results are organic** — "not ads, nor influenced by any OpenAI partnerships"; the 2026 ads launch keeps Sponsored cards separate. **[confirmed as stated policy]**
- ⚠️ **Instant Checkout status is in flux**: March 2026 OpenAI revamped shopping toward discovery + merchant-owned checkout after the initial buy-in-chat version underperformed. Claims that Instant Checkout is broadly live were **refuted**. Don't build against it yet.

### Google AI Overviews / AI Mode

- Entry ticket = **free Google Merchant Center listings** (no ads needed). New "AI performance insights" report (US pilot, launched ~2026-07-13, expanding AU/CA/IN/NZ) shows how your brand/products surface in AI Mode & AI Overviews, and counts **only organic AI traffic**. **[confirmed]** (support.google.com/merchants/answer/17200695)
- Google's own optimization advice is **conventional**: mine the conversational product terms the report reveals (e.g. "easy setup"-style phrases) and fold them into product titles/descriptions; keep structured attributes complete. Google Search Central explicitly states there are **no additional requirements** for AI features — no llms.txt, no AI-specific markup. **[confirmed]**

### Perplexity

- Default shopping discovery is powered by **platform integrations (notably Shopify)** — a custom store is NOT covered by default. Remedy: the **free Perplexity Merchant Program** — submit a Google-Shopping-compatible feed (CSV via SFTP) + schema.org Product markup; Perplexity says indexed products get "increased chances of being a recommended product". Cards are stated to be unsponsored. **[confirmed as stated policy]**
- Two bots: `PerplexityBot` (search index) and `Perplexity-User` (fetches pages live when a user asks; **generally ignores robots.txt**, so user-triggered retrieval reaches us regardless). **[confirmed]** (docs.perplexity.ai)

### Microsoft Copilot / Bing

- **Copilot Checkout is live** (launched Jan 2026; US/USD/English-only): buy-in-chat inside Copilot, powered by PayPal, Stripe, or Shopify. Requires a **Microsoft Merchant Center** account + a **UCP-compliant feed** (Universal Commerce Protocol — a layer on top of normal MMC feeds; GA in US since Apr 2026). Discovery-level surfacing needs only an ordinary MMC feed; UCP is for checkout. Non-Shopify stores onboard **directly via MMC or via PayPal/Stripe as the PSP**. **[confirmed]** (about.ads.microsoft.com agentic-commerce)
- Bing's organic index also feeds ChatGPT search (above) — double reason to have Bing Webmaster Tools + MMC.

### Claude / Amazon Rufus

- **No verified findings** — no public merchant feed/program surfaced for either. Open question; revisit later.

## 2. Ranking factors: confirmed vs folklore

**Confirmed (vendor-stated):** structured metadata completeness, price, availability, maker/primary-seller status, product-page quality; conversational phrasing in titles/descriptions (Google's own advice).

**Refuted in verification — treat as speculation:**
- "Wikipedia is the most-cited domain / Reddit & listicles dominate AI answers" (the widely-quoted Ahrefs percentages failed verification).
- "Feeds directly determine what ChatGPT surfaces" (feeds are one input among several).
- "Blocking PerplexityBot removes you from Perplexity" (user-triggered fetches bypass robots.txt).
- `llms.txt` as a requirement anywhere (Google explicitly disclaims it; no vendor confirms using it).

The whole "part 2" of GEO-blog advice (brand mentions, third-party listicles, UGC seeding) has **essentially no surviving verified evidence** — plausible, unproven. Don't invest there before the confirmed levers.

## 3. Action plan for GoldRose (confirmed levers, in order)

Prereqs shared by everything below: real product content (OQ-3) and live Supabase deploy — feeds of placeholder data would burn first impressions.

1. **Keep AI crawlers allowed** in robots.txt (already built — admin toggle): `OAI-SearchBot`, `PerplexityBot`, `Bingbot`, Google. Optionally block `GPTBot` (training) without losing ChatGPT search visibility.
2. **Complete schema.org Product/Offer JSON-LD** on every product page, consistent with page text (already live; keep price/availability exact — feeds and pages are cross-checked).
3. **Build one feed generator** (e.g. `/api/feeds/google.xml|csv` from Supabase products): Google-Shopping-format covers **Google Merchant Center + Perplexity + Microsoft MMC**; OpenAI needs its own flat-file variant of the same data.
4. **Sign up**: Google Merchant Center free listings (also unlocks the AI-performance report when it reaches us) → Perplexity Merchant Program (free) → Microsoft Merchant Center → apply at chatgpt.com/merchants (US waitlist).
5. **Google Search Console + Bing Webmaster Tools** — the instrument panels (Bing matters more than usual because ChatGPT leans on it).
6. **Conversational copy**: write titles/descriptions the way buyers ask AI ("anniversary gift for wife", "preserved rose that lasts forever") — this is Google's only stated content-side AI lever, and it aligns with seo-intro.md §1.
7. **Later — agentic checkout**: when live, revisit Copilot Checkout via **PayPal as PSP** (we're PayPal-native, owner has a business account) and OpenAI's `is_eligible_checkout` tier. US/USD-only today; check owner's merchant-of-record eligibility first.

## 4. Agentic commerce landscape (context for OQ-1/PayPal)

- **ACP (Agentic Commerce Protocol)** — open standard by OpenAI + Stripe (+ Meta per Stripe docs), beta, github.com/agentic-commerce-protocol. Defines how agents transact with merchants.
- **UCP (Universal Commerce Protocol)** — Google-led open industry standard ([ucp.dev](https://ucp.dev), [developers.google.com/merchant/ucp](https://developers.google.com/merchant/ucp)) powering purchases in AI Mode/Gemini; Microsoft adopted UCP-compliant feeds for Copilot Checkout. _(Corrected 2026-07-23 — an earlier revision wrongly called UCP "Microsoft's layer".)_
- **AP2 (Agent Payments Protocol)** — Google + payments partners, extends A2A/MCP for agent-led payments.
- **PayPal**: powers Copilot Checkout at launch; separately, PayPal + Google Cloud "PayPal Agent" (Oct 2025) lets merchants run agentic shopping on **their own site**. Our PayPal choice keeps every one of these doors open.
- Protocols are competing and churning fast; don't build against any until one is required for a concrete surface we want.

## 5. Caveats & open questions

- All "organic, not paid" and ranking-factor statements are **vendor self-descriptions**, not audits.
- **US-gating**: OpenAI direct feeds, Copilot Checkout, Google's AI insights pilot — verify the owner's merchant eligibility per program.
- **Extreme drift**: specs/programs changed materially between late 2025 and mid 2026 (Instant Checkout pivot, UCP GA, Google pilot days old). Re-verify before implementing; this report is a snapshot of 2026-07-23.
- Open: Claude & Amazon Rufus merchant mechanics; real empirical ranking-factor evidence; ACP-vs-UCP convergence; international rollout timing.

## Key primary sources

- OpenAI: developers.openai.com/commerce (feed spec, key concepts), /api/docs/bots, help.openai.com article 11128490, chatgpt.com/merchants
- Google: support.google.com/merchants/answer/17200695 (AI performance insights), developers.google.com/search/docs/appearance/ai-features
- Perplexity: perplexity.ai/hub/blog/shop-like-a-pro, docs.perplexity.ai/docs/resources/perplexity-crawlers
- Microsoft: about.ads.microsoft.com/en/solutions/technology/agentic-commerce
- Protocols: github.com/agentic-commerce-protocol, docs.stripe.com/agentic-commerce/acp, Google Cloud AP2 & PayPal announcements
