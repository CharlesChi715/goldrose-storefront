/**
 * ROLE OF THIS FILE
 * /account/orders/review — the "Write a Review" form, from Ready-for-dev
 * frame 2439:370 (section me二·级, imported 2026-08-05). Reached from the
 * delivered view's WRITE A REVIEW button (2439:369 → 2439:370).
 *
 * The screen's choices and character counter are real and local; PUBLISH
 * REVIEW is inert because there is no reviews backend yet (see the screen's
 * own header, and the session hand-off).
 */

import type { Metadata } from "next";
import { WriteReviewScreen } from "@/components/screens/orders/WriteReviewScreen";

export const metadata: Metadata = {
  title: "Write a review — ELDREVE",
  robots: { index: false },
};

export default function AccountOrderReviewPage() {
  return <WriteReviewScreen />;
}
