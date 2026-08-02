/**
 * ROLE OF THIS FILE
 * /account/privacy-policy — Figma ACCOUNT-PRIVACY-POLICY 1234:271, imported 2026-07-28.
 * Visual placeholder: the mock's own summaries, not a reviewed legal policy.
 * AI-TAG(AI-003): OWNER-TODO — supply approved policy text. See /agent-delivery/sessions/initial-inbox-07-30.md.
 * AI-TAG(AI-014): OWNER-DECISION — this route is orphaned: its frame became
 * the POLICIES-LEGAL hub (08-02) and the designed privacy policy is the
 * unmarked /policies/privacy. Keep, redirect, or retire? See
 * /agent-delivery/sessions/figma-sync-08-02-feat-figma-sync.md.
 */

import type { Metadata } from "next";
import { PrivacyPolicyScreen } from "@/components/screens/PrivacyPolicyScreen";

export const metadata: Metadata = {
  title: "Privacy policy — GoldRose",
  robots: { index: false },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyScreen />;
}
