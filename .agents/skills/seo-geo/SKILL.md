---
name: seo-geo
description: "How ELDREVE is made discoverable by search engines and by AI assistants (GEO), and the gates that decide what may ship when. Use before touching sitemaps, robots, canonical URLs, JSON-LD/structured data, llms.txt, product feeds or Merchant Center, and before any change that would publish a claim about price, stock, shipping or returns. Triggers: SEO, GEO, sitemap, robots.txt, canonical, structured data, JSON-LD, schema.org, llms.txt, product feed, Merchant Center, Search Console, AI citation, discoverability."
metadata:
  author: charles
  version: "1.0.0"
---

# Search and AI discovery

Plan, baseline and gates:
[`docs/seo-geo/search-discovery-implementation.md`](../../../docs/seo-geo/search-discovery-implementation.md)
— §2 non-negotiable rules, §3 what already exists and what is missing, §5 the
canonical commerce record, §7 gates 0–6, §8 the prioritized backlog.
Background research: `seo-intro.md` (search) and `geo-intro.md` (AI answers) in
the same folder.

## The rules that decide whether a change is allowed

1. **One commercial source of truth** — pages, JSON-LD, `llms.txt`, feeds, cart
   and checkout all derive from the same normalized Supabase data.
2. **Truth before reach** — do not submit feeds while the storefront still
   carries placeholder reviews, discounts, shipping promises, warehouse claims,
   colours, payment methods or product facts. This is why the SEO work is
   gated behind the same release gates as the shop itself.
3. **Visible content and machine data must agree** — never add a claim that
   exists only in schema, `llms.txt` or a feed.
4. **No thin page multiplication** — a new URL must answer a distinct shopper
   need. Doorway and search-engine-first pages are out of scope.
5. **Eligibility is not placement** — schema and feeds make a product eligible;
   nothing guarantees indexing, a rich result, a citation or a ranking.
6. **Crawler controls are not access controls** — `robots.txt` states a
   preference; authentication is what protects private data.

## What is already built, and what is missing

Don't ask this skill — it would go stale. **§3 "Current repository baseline"**
in the plan is a table of exactly that, one row per area (product routes,
discovery, structured data, `llms.txt`, catalog data, policies, checkout,
analytics, external setup) with the gap beside each. §7's gates say which of
them must close before feeds and submissions may happen at all.

Per-feature status is in `docs/features/` (front matter, CI-checked); the
domain and its verification live in `docs/features/domain-and-email.md`.
