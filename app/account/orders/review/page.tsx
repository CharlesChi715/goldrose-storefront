/**
 * ROLE OF THIS FILE
 * /account/orders/review — the "Write a Review" form, from Ready-for-dev
 * frame 2439:370 (section me二·级, imported 2026-08-05). Reached from the
 * delivered view's WRITE A REVIEW button (2439:369 → 2439:370).
 *
 * The screen's choices and character counter are real and local. PUBLISH
 * REVIEW posts to /api/reviews (owner decision 2026-08-06, closing AI-031);
 * ?product=<handle> and ?order=<uuid> pick what is being reviewed, defaulting
 * to the design's own mock order card (the signature rose) until the
 * delivered screen carries real per-order data.
 */

import type { Metadata } from "next";
import { WriteReviewScreen } from "@/components/screens/orders/WriteReviewScreen";

export const metadata: Metadata = {
  title: "Write a review — ELDREVE",
  robots: { index: false },
};

export default async function AccountOrderReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; order?: string }>;
}) {
  const params = await searchParams;
  return (
    <WriteReviewScreen
      productHandle={params.product ?? "signature-24k-gold-rose"}
      orderId={params.order ?? null}
    />
  );
}
