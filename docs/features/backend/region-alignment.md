---
schemaVersion: 1
id: region-alignment
kind: feature
parent: infrastructure
area: backend
order: 10

delivery: verified
rollout: test-deployment
statusChangedAt: 2026-07-26

dependsOn: []
blockedBy: []

verification:
  automated: []
  human:
    by: charles
    date: 2026-07-26
    environment: production
    evidence: "curl -sI …/api/beacon shows x-vercel-id: syd1::pdx1 (see note below)"
---

# Region alignment — put Vercel compute beside the Oregon database

> **Done 2026-07-26** (commit `fe73e42`): `vercel.json` now pins `pdx1`;
> both wrong region records are corrected. Verified live —
> `curl -sI …/api/beacon` returns `x-vercel-id: syd1::pdx1::…` (edge::function
> region). Only the EU-reads section below remains future work.

## Context

- The Supabase primary (`cfvsvgbldnzkcjvbwnjp`) runs in **AWS `us-west-2`
  (Oregon)** — read it from `supabase/.temp/pooler-url`
  (`aws-1-us-west-2.pooler.supabase.com`). The `*.supabase.co` hostname
  resolves to Cloudflare edges, so DNS/ping cannot tell you the region.
- Commit `a62848e` pinned Vercel functions to `syd1` on the premise that the
  database was in Sydney. **That premise is wrong**; the since-deleted
  `archive/BUILD-REPORT.md` recorded the same
  wrong region (`ap-southeast-2`). The commit's real win was the
  `getAdminSession` `React cache()` dedupe; the region pin moved compute
  *away* from the data.
- Measured 2026-07-26 from Sydney: a request that must reach the Supabase
  origin takes **~190 ms**; Cloudflare-edge-answered requests (~40 ms) mask
  this. Every DB query from a `syd1` function pays ~170 ms across the
  Pacific, and dynamic pages issue several queries.
- Market is US-first (see `SUMMARY.md`), so today a US shopper's checkout
  round-trips US → Sydney → Oregon and back.

## Fix (one line + doc corrections)

1. In `vercel.json`, change `"regions": ["syd1"]` → `"regions": ["pdx1"]`
   (Portland = AWS `us-west-2`, same region as the database; fn→DB drops to
   ~1–5 ms).
2. Correct the "database is in Sydney / ap-southeast-2" claims where they
   mislead: commit `a62848e`'s message is wrong — messages can't be edited,
   so the correction is recorded here. (The other stale claim lived in
   `archive/BUILD-REPORT.md`, since deleted with the archive.)

Trade-off: Sydney/China UAT feels ~180 ms slower per dynamic page (one
browser→function hop); customers are unaffected and static assets stay on
the global CDN. Team pages are mostly cached anyway.

Caveat: on the Hobby plan Vercel ignores multi-entry `regions` values beyond
one region and forces defaults for some features; a single region entry is
valid on every tier, so `["pdx1"]` is safe regardless of plan.

## Verification

- `curl -sI https://goldrose-storefront.vercel.app/api/beacon | grep x-vercel-id`
  on an uncached dynamic route should show `pdx1`.
- Admin language toggle and checkout should feel same-or-faster from Sydney
  (one Pacific hop instead of one per query).

## Future option — EU reads (only if Europe launches)

If Europe launches **and** analytics show slow EU dynamic pages: add one
Supabase **read replica** in an EU region plus a matching Vercel function
region (Vercel Pro allows up to 5). Constraints to respect:

- Replicas are **read-only**; every write (bag, checkout, payment, sign-in)
  still goes to the Oregon primary — checkout gains little.
- Replication is asynchronous → **replication lag**; naive routing causes
  read-your-own-writes bugs (e.g. bag looks empty right after adding).
- Costs: Vercel Pro $20/user/mo + roughly one extra DB instance per replica.

Do not build this pre-launch; the CDN already serves static pages globally.
