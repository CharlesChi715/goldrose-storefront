/**
 * ROLE OF THIS FILE
 * Product reviews: the storefront read models (published list + live
 * aggregate) and the submit path that the /account/orders/review form posts
 * into. Works against both backends via getStore(); moderation columns
 * (status, rejected_reason) are written by future admin screens, never here.
 *
 * Design decisions (mentor session 2026-08-06): aggregates are computed live
 * from the rows — there are deliberately no rating columns on products — and
 * reviews are never hard-deleted (FTC 16 CFR 465 audit trail).
 */

import { randomUUID } from "crypto";
import { getStore } from "@/lib/supabase/store.ts";
import type { ProductReviewRow } from "@/lib/supabase/types.ts";

export type ReviewStats = {
  /** Mean of published ratings rounded to one decimal, e.g. 4.9. */
  average: number;
  count: number;
};

/**
 * Published reviews of one product, newest first — the PDP drawer's list.
 * Pending and rejected rows never leave the server.
 *
 * @param productId - The product's catalog id (products.id, text).
 * @returns Published review rows sorted by created_at descending.
 */
export async function listPublishedReviews(
  productId: string,
): Promise<ProductReviewRow[]> {
  const rows = await getStore().where("product_reviews", {
    product_id: productId,
    status: "published",
  });
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Live aggregate over published reviews (the option-a decision: one source
 * of truth, no denormalized counters to drift).
 *
 * @param reviews - The published rows, e.g. from listPublishedReviews.
 * @returns Average (1 decimal) and count; average 0 when there are none.
 */
export function reviewStats(reviews: ProductReviewRow[]): ReviewStats {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export type CreateReviewInput = {
  productId: string;
  rating: number;
  body: string;
  orderId?: string | null;
  userId?: string | null;
  authorName?: string | null;
};

/**
 * Insert a customer review as `pending` — nothing goes public without
 * moderation. The author_name snapshot is taken here, at submit time.
 *
 * @param input - Product, rating, body, and optional order/user linkage.
 * @returns The stored row.
 * @throws When the same order already reviewed this product (DB unique
 *   constraint in hosted mode; explicit pre-check in local mode).
 */
export async function createReview(
  input: CreateReviewInput,
): Promise<ProductReviewRow> {
  const store = getStore();
  if (input.orderId) {
    const dupes = await store.where("product_reviews", {
      product_id: input.productId,
      order_id: input.orderId,
    });
    if (dupes.length > 0) {
      throw new Error("This order has already reviewed this product.");
    }
  }
  const row: ProductReviewRow = {
    id: randomUUID(),
    product_id: input.productId,
    order_id: input.orderId ?? null,
    user_id: input.userId ?? null,
    author_name: input.authorName?.trim() || null,
    rating: input.rating,
    body: input.body,
    photo_urls: [],
    status: "pending",
    rejected_reason: null,
    created_at: new Date().toISOString(),
  };
  await store.insert("product_reviews", [row]);
  return row;
}
