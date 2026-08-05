/**
 * ROLE OF THIS FILE
 * /policies/contact-legal — scaffold for the un-ready Figma frame 2118:245;
 * replaced when the frame is marked Ready-for-dev. Linked from the
 * Policies & Legal hub (1523:1136).
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Contact & legal notice — ELDREVE",
  robots: { index: false },
};

export default function ContactLegalPage() {
  return <PolicyComingSoon title="Contact & Legal Notice" />;
}
