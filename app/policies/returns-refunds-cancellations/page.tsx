/**
 * ROLE OF THIS FILE
 * /policies/returns-refunds-cancellations — "Policy A", imported 2026-08-18
 * from frame 2118:239 once the design team marked it Ready-for-dev. Replaces
 * the PolicyComingSoon scaffold this route carried since 2026-08-02.
 *
 * ⚠️ Still `noindex`: the copy commits ELDREVE to a 30-day return window and
 * a 7-day damage window, and the bosses have not signed those off (AI-046).
 * Clearing the flag is the publish decision, and it is theirs.
 */

import type { Metadata } from "next";
import { PolicyDocumentScreen } from "@/components/screens/PolicyDocumentScreen";
import { getSettingsMap } from "@/lib/admin/settings";
import { POLICY_DOCUMENTS } from "@/lib/policies/documents";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Returns, refunds & cancellations — ELDREVE",
  description:
    "How ELDREVE returns, refunds and order cancellations work: the return window, the conditions, and how to request one.",
  robots: { index: false },
};

export default async function ReturnsPolicyPage() {
  const settings = await getSettingsMap();
  return (
    <PolicyDocumentScreen
      document={POLICY_DOCUMENTS["returns-refunds-cancellations"]}
      store={settings.store}
    />
  );
}
