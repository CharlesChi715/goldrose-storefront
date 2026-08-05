/**
 * ROLE OF THIS FILE
 * /account/personal-info — Figma ACCOUNT-PERSONAL-INFO-DETAILS 1230:112, imported 2026-07-28.
 * Visual placeholder: no profile-update backend, the mock's own values render.
 */

import type { Metadata } from "next";
import { PersonalInfoScreen } from "@/components/screens/PersonalInfoScreen";

export const metadata: Metadata = {
  title: "Personal information — ELDREVE",
  robots: { index: false },
};

export default function PersonalInfoPage() {
  return <PersonalInfoScreen />;
}
