/**
 * ROLE OF THIS FILE
 * /account/orders/delivered — the delivered-order view, from Ready-for-dev
 * frame 2439:369 (section me二·级, imported 2026-08-05). The orders list's
 * "View details" on a delivered order lands here; the frame's prototype edge
 * (1523:3455 → 2439:369) is what AI-029 recorded as a dead end.
 *
 * A static mock view, like /account/orders/details: there is no per-order
 * detail backend, so no dynamic segment and no real order data.
 */

import type { Metadata } from "next";
import { DeliveredScreen } from "@/components/screens/orders/DeliveredScreen";

export const metadata: Metadata = {
  title: "Delivered — ELDREVE",
  robots: { index: false },
};

export default function AccountOrderDeliveredPage() {
  return <DeliveredScreen />;
}
