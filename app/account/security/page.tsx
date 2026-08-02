/**
 * ROLE OF THIS FILE
 * /account/security — Figma "mepage-Account & Privacy-Security", re-imported
 * 2026-08-02 from the replacement frame 1526:111. Visual placeholder. The
 * old password-inputs design was removed at source (masked value + inert
 * "Change password" button now), which resolves the earlier conflict with
 * the email-link auth decision.
 */

import type { Metadata } from "next";
import { PrivacySecurityScreen } from "@/components/screens/PrivacySecurityScreen";

export const metadata: Metadata = {
  title: "Account & privacy — GoldRose",
  robots: { index: false },
};

export default function PrivacySecurityPage() {
  return <PrivacySecurityScreen />;
}
