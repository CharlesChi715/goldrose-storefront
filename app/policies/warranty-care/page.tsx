/**
 * ROLE OF THIS FILE
 * /policies/warranty-care — "Policy C", imported 2026-08-18 from frame
 * 2118:243 once the design team marked it Ready-for-dev. Replaces the
 * PolicyComingSoon scaffold this route carried since 2026-08-02.
 *
 * ⚠️ Still `noindex`: the copy grants a one-year limited warranty, which is
 * a commitment the bosses have not signed off (AI-046). This frame is also
 * the one that shipped a bracketed fake revision date, `[MAY 20, 2024]` —
 * see POLICIES_LAST_UPDATED in lib/policies/documents.ts for what is shown
 * instead.
 */

import type { Metadata } from "next";
import { PolicyDocumentScreen } from "@/components/screens/PolicyDocumentScreen";
import { getSettingsMap } from "@/lib/admin/settings";
import { POLICY_DOCUMENTS } from "@/lib/policies/documents";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Limited warranty & care — ELDREVE",
  description:
    "The ELDREVE one-year limited warranty: what it covers, what it excludes, how to claim it, and how to care for a gold-dipped rose.",
  robots: { index: false },
};

export default async function WarrantyCarePage() {
  const settings = await getSettingsMap();
  return (
    <PolicyDocumentScreen
      document={POLICY_DOCUMENTS["warranty-care"]}
      store={settings.store}
    />
  );
}
