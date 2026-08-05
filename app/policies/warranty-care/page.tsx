/**
 * ROLE OF THIS FILE
 * /policies/warranty-care — scaffold for the un-ready Figma frame 2118:243;
 * replaced when the frame is marked Ready-for-dev. Linked from the
 * Policies & Legal hub (1523:1136).
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Limited product warranty & care — ELDREVE",
  robots: { index: false },
};

export default function WarrantyCarePage() {
  return <PolicyComingSoon title="Limited Product Warranty & Care" />;
}
