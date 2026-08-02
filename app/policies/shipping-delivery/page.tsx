/**
 * ROLE OF THIS FILE
 * /policies/shipping-delivery — scaffold for the un-ready Figma frame
 * 2118:242; replaced when the frame is marked Ready-for-dev. Linked from
 * the Policies & Legal hub (1523:1136).
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Shipping & delivery — GoldRose",
  robots: { index: false },
};

export default function ShippingDeliveryPage() {
  return <PolicyComingSoon title="Shipping & Delivery" />;
}
