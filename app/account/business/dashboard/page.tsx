/**
 * ROLE OF THIS FILE
 * /account/business/dashboard — ACCOUNT-INFO-BUSINESS-DASHBOARD (Figma
 * 914:113, imported 2026-07-27) as a visual placeholder route. Business
 * accounts have no backend yet, so nothing links here from the live flows
 * (/bag precedent); when business auth exists this becomes its signed-in
 * view. The mock's own strings ("David", RFQ #GRB-20260821) render verbatim.
 */

import type { Metadata } from "next";
import { BusinessDashboardScreen } from "@/components/screens/DashboardScreen";

export const metadata: Metadata = {
  title: "Business dashboard — ELDREVE",
  robots: { index: false },
};

export default function BusinessDashboardPage() {
  return <BusinessDashboardScreen />;
}
