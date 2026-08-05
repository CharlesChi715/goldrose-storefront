<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-021 · `OWNER-DECISION` · the ELDREVE rename is now a defect backlog

**Where:** [Repo summary](../../SUMMARY.md)

DQ-34 is answered: **ELDREVE is the brand.** Every sync since 07-29 treated
the design team's ELDREVE wordmark as a placeholder and painted GoldRose over
it — so those ~23 substitutions are defects, not safeguards, and **~270
GoldRose references across ~110 files** are now wrong.

Three tiers, very different risk:

1. **Mechanical** — copy, page titles, `alt` text, admin i18n (EN *and* 中文).
   Low risk, but a careless `sed` will also rewrite
   `goldrose-storefront.vercel.app` and break things.
2. **Artwork** — this one gets *easier*: stop substituting and use the
   frames' own ELDREVE art, which was always there.
3. **Domain cutover** — mostly done already (Site URL, redirects, passkey RP
   ID moved to `eldreve.com`; old vercel.app passkeys are dead by design and
   need re-enrolment). Still pending: `NEXT_PUBLIC_SITE_URL` only takes
   effect on the next production deploy, so canonicals, OG images and the
   sitemap still emit the vercel.app URL.

**Recommendation:** do tiers 1–2 on a dedicated `feat/eldreve-rename` branch,
not folded into a design-import or feature branch — 110 files of rename mixed
with behaviour changes is unreviewable and unrevertable. Confirm first how
the name is written in prose: the wordmark is all-caps ELDREVE, but the email
sender and templates currently say "Eldreve" (my choice, easily changed).
- **Closed:** 2026-08-05
- **Why:** Owner ruled 2026-08-05: prose casing is all-caps ELDREVE everywhere. Rename delivered on branch feat/eldreve-rename — GoldRose/GOLDROSE replaced in all copy, titles, alt text, admin i18n (EN + 中文), seed data, email templates and tests; the Veloria asset namespace moved to public/eldreve/. Storage keys, the vercel.app host and test-fixture emails kept as identifiers.
