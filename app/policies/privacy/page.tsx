/**
 * ROLE OF THIS FILE
 * /policies/privacy — scaffold for the un-ready Figma frame 2118:244;
 * replaced when the frame is marked Ready-for-dev. Linked from the
 * Policies & Legal hub (1523:1136). (The older designed privacy-policy
 * SCREEN still lives at /account/privacy-policy — separate frame.)
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Privacy policy — ELDREVE",
  robots: { index: false },
};

export default function PrivacyPolicyComingSoonPage() {
  return <PolicyComingSoon title="Privacy Policy" />;
}
