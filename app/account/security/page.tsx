/**
 * ROLE OF THIS FILE
 * /account/security — Figma ACCOUNT-PRIVACY-SECURITY 1234:191, imported 2026-07-28.
 * Visual placeholder; reached from the dashboard's Account & Privacy row. The
 * password/2FA design conflicts with the email-link auth decision — flagged
 * in docs/ixd/README.md.
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
