/**
 * ROLE OF THIS FILE
 * /policies/terms-of-service — "Policy D", imported 2026-08-18 from frame
 * 2118:241 once the design team marked it Ready-for-dev. Eighteen sections,
 * the longest of the six. Replaces the PolicyComingSoon scaffold this route
 * carried since 2026-08-02.
 *
 * ⚠️ Still `noindex`, and this one has the sharpest reason: section 16 binds
 * disputes to arbitration under a governing-law state the frame never named
 * (`[STATE]`), so the clause renders "to be confirmed" until the bosses
 * choose one. Publishing terms of service with an unnamed forum would be
 * worse than publishing none. See AI-046.
 */

import type { Metadata } from "next";
import { PolicyDocumentScreen } from "@/components/screens/PolicyDocumentScreen";
import { getSettingsMap } from "@/lib/admin/settings";
import { POLICY_DOCUMENTS } from "@/lib/policies/documents";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Terms of service — ELDREVE",
  description:
    "The terms that apply to visiting eldreve.com and to orders placed through the site.",
  robots: { index: false },
};

export default async function TermsOfServicePage() {
  const settings = await getSettingsMap();
  return (
    <PolicyDocumentScreen
      document={POLICY_DOCUMENTS["terms-of-service"]}
      store={settings.store}
    />
  );
}
