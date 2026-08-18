/**
 * ROLE OF THIS FILE
 * /policies/privacy — "Policy E", imported 2026-08-18 from frame 2118:244
 * once the design team marked it Ready-for-dev. Replaces the
 * PolicyComingSoon scaffold this route carried since 2026-08-02.
 *
 * ⚠️ Still `noindex`: the copy names ELDREVE as the controller and makes
 * California Shine the Light and Global Privacy Control undertakings that the
 * bosses have not signed off (AI-046). A privacy policy is also the one
 * document whose claims must match what the site actually does — the cookie
 * and analytics sections should be checked against the live tracking before
 * it is published.
 *
 * Distinct from /account/privacy (the signed-in privacy hub) and from
 * /account/privacy-policy, which has no frame of its own (route drift, open).
 */

import type { Metadata } from "next";
import { PolicyDocumentScreen } from "@/components/screens/PolicyDocumentScreen";
import { getSettingsMap } from "@/lib/admin/settings";
import { POLICY_DOCUMENTS } from "@/lib/policies/documents";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacy policy — ELDREVE",
  description:
    "How ELDREVE collects, uses, discloses and protects personal information, and the choices you have over it.",
  robots: { index: false },
};

export default async function PrivacyPolicyPage() {
  const settings = await getSettingsMap();
  return (
    <PolicyDocumentScreen
      document={POLICY_DOCUMENTS["privacy"]}
      store={settings.store}
    />
  );
}
