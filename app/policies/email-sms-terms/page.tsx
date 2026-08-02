/**
 * ROLE OF THIS FILE
 * /policies/email-sms-terms — scaffold for the un-ready Figma frame
 * 2127:238; replaced when the frame is marked Ready-for-dev. Linked from
 * the Policies & Legal hub (1523:1136).
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Email & SMS terms — GoldRose",
  robots: { index: false },
};

export default function EmailSmsTermsPage() {
  return <PolicyComingSoon title="Email & SMS Terms" />;
}
