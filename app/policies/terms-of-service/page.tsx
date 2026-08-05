/**
 * ROLE OF THIS FILE
 * /policies/terms-of-service — scaffold for the un-ready Figma frame
 * 2118:241; replaced when the frame is marked Ready-for-dev. Linked from
 * the Policies & Legal hub (1523:1136).
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Terms of service — ELDREVE",
  robots: { index: false },
};

export default function TermsOfServicePage() {
  return <PolicyComingSoon title="Terms of Service" />;
}
