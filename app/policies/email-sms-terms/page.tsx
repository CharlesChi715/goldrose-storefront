/**
 * ROLE OF THIS FILE
 * /policies/email-sms-terms — "Policy G", imported 2026-08-18 from frame
 * 2127:238. Replaces the PolicyComingSoon scaffold this route carried since
 * 2026-08-02.
 *
 * ⚠️ The frame is named SCROLL-CONTENT, not `/policies/email-sms-terms`, so
 * `npm run figma:routes` reports this route as drift in both directions and
 * always will until the design team renames it per the route rule. The frame
 * IS this page: it is titled "Email & SMS Terms" and carries the Policy G
 * code. Recorded in the drift allowlist rather than re-diagnosed every sync.
 *
 * ⚠️ Still `noindex` pending the bosses' sign-off on the copy (AI-046).
 */

import type { Metadata } from "next";
import { PolicyDocumentScreen } from "@/components/screens/PolicyDocumentScreen";
import { getSettingsMap } from "@/lib/admin/settings";
import { POLICY_DOCUMENTS } from "@/lib/policies/documents";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Email & SMS terms — ELDREVE",
  description:
    "The rules that apply to ELDREVE marketing email and SMS: consent, message frequency, and how to opt out.",
  robots: { index: false },
};

export default async function EmailSmsTermsPage() {
  const settings = await getSettingsMap();
  return (
    <PolicyDocumentScreen
      document={POLICY_DOCUMENTS["email-sms-terms"]}
      store={settings.store}
    />
  );
}
