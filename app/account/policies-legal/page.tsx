/**
 * ROLE OF THIS FILE
 * /account/policies-legal — Figma POLICIES-LEGAL hub 1523:1136, imported
 * 2026-08-02. The policy index: seven entry cards linking to the /policies/*
 * routes (all still coming-soon scaffolds — no policy page frame is
 * Ready-for-dev yet). Reached from the privacy hub and the signed-out login.
 */

import type { Metadata } from "next";
import { PoliciesLegalScreen } from "@/components/screens/PoliciesLegalScreen";

export const metadata: Metadata = {
  title: "Policies & legal — ELDREVE",
  robots: { index: false },
};

export default function PoliciesLegalPage() {
  return <PoliciesLegalScreen />;
}
