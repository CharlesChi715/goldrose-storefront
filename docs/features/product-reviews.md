---
delivery: in-progress
rollout: live
statusChangedAt: 2026-08-06
priority: p1
---

# product-reviews

## Context

Customers write a review from a delivered order and the product page shows it.
Built and live (2026-08-06, PR #30, `feat/product-reviews`); the write and read
halves are done, the moderation half is not — publishing a review still needs a
manual database update.

## Decision

Reviews are their own table (`product_reviews`, migration `0007`) with
content-neutral moderation — a review is `pending`, `published` or `hidden` and
is **never hard-deleted**, the same rule orders live under — and the PDP shows
live statistics only once something is published, falling back to the design's
mock until then.

## Plan

1. [x] `product_reviews` on hosted (`0007`), reader/writer in
       [`lib/reviews/db.ts`](../../lib/reviews/db.ts).
2. [x] `POST /api/reviews` and the `/account/orders/review` PUBLISH button —
       which closes AI-031's inert button.
3. [x] PDP rating row and drawer read live stats and scroll.
4. [ ] Photo upload from the review form — the column exists, the UI does not.
5. [ ] An admin moderation screen (§9.x, unwritten): today a publish is a
       hand-written `UPDATE`.

## Tech details

- **The design mock is the visible fallback**, not an empty state: with nothing
  published the PDP renders exactly the imported frame, so the pixel baseline
  holds and no shopper sees "no reviews yet" on a shop that has never sold.
- **Two demonstration reviews are seeded** on hosted and locally
  (`npm run seed:reviews`, reversed by `npm run seed:reviews -- --remove`).
  They are not customer content.

## Blockers and dependencies

- ⚠️ **Release gate.** The seeded demonstration reviews must be removed before
  the first real order — a fabricated review is the one placeholder that is
  never safe on a live site, because it is a claim about a stranger's
  experience. Tracked as a hard gate in [SUMMARY.md](../../SUMMARY.md#release-queue).
- Moderation is manual until step 5 lands, so a real customer review sits
  unpublished until someone runs SQL.

## Related links

- [`lib/reviews/db.ts`](../../lib/reviews/db.ts) ·
  [`app/api/reviews/route.ts`](../../app/api/reviews/route.ts) ·
  [`supabase/migrations/0007_product_reviews.sql`](../../supabase/migrations/0007_product_reviews.sql)
- Write screen: [`components/screens/orders/WriteReviewScreen.tsx`](../../components/screens/orders/WriteReviewScreen.tsx) ·
  seed: [`scripts/seed-demo-reviews.ts`](../../scripts/seed-demo-reviews.ts)
- Tests: [`tests/e2e/order-delivered-review.spec.ts`](../../tests/e2e/order-delivered-review.spec.ts)
- Open matters AI-030 (invented selected state) and AI-031 (closed by step 2):
  [agent-delivery/INBOX.md](../../agent-delivery/INBOX.md)
