/**
 * ROLE OF THIS FILE
 * /account/privacy — Figma "mepage-Account & Privacy" 1523:3878, imported
 * 2026-07-29. The Account & Privacy hub: summary cards fanning out to the
 * settings detail pages. The dashboard's "Account & Privacy" row lands here
 * (it previously jumped straight to /account/security).
 */

import type { Metadata } from "next";
import { PrivacyHubScreen } from "@/components/screens/PrivacyHubScreen";

export const metadata: Metadata = {
  title: "Account & privacy — GoldRose",
  robots: { index: false },
};

export default function PrivacyHubPage() {
  return <PrivacyHubScreen />;
}
