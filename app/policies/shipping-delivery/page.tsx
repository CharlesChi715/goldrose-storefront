/**
 * ROLE OF THIS FILE
 * /policies/shipping-delivery — "Policy B", imported 2026-08-18 from frame
 * 2118:242 once the design team marked it Ready-for-dev. Replaces the
 * PolicyComingSoon scaffold this route carried since 2026-08-02.
 *
 * ⚠️ Still `noindex`: the copy states processing times (1-3 and 3-7 business
 * days) and a 30-day delay rule that the bosses have not signed off, and real
 * shipping rates are themselves still an open gate (OQ-2). See AI-046.
 */

import type { Metadata } from "next";
import { PolicyDocumentScreen } from "@/components/screens/PolicyDocumentScreen";
import { getSettingsMap } from "@/lib/admin/settings";
import { POLICY_DOCUMENTS } from "@/lib/policies/documents";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shipping & delivery — ELDREVE",
  description:
    "ELDREVE shipping coverage, processing time, delivery estimates, tracking, and what happens when a parcel is delayed or lost.",
  robots: { index: false },
};

export default async function ShippingDeliveryPage() {
  const settings = await getSettingsMap();
  return (
    <PolicyDocumentScreen
      document={POLICY_DOCUMENTS["shipping-delivery"]}
      store={settings.store}
    />
  );
}
