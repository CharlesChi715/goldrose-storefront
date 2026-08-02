/**
 * ROLE OF THIS FILE
 * /policies/returns-refunds-cancellations — scaffold for the un-ready Figma
 * frame 2118:239; replaced when the frame is marked Ready-for-dev. Linked
 * from the Policies & Legal hub (1523:1136).
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Returns, refunds & cancellations — GoldRose",
  robots: { index: false },
};

export default function ReturnsRefundsCancellationsPage() {
  return <PolicyComingSoon title="Returns, Refunds & Cancellations" />;
}
