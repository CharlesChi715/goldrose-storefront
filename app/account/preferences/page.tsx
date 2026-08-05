/**
 * ROLE OF THIS FILE
 * /account/preferences — Figma ACCOUNT-PREFERENCES-CONTROLS 1234:111, imported 2026-07-28.
 * Visual placeholder: toggles flip visually, nothing persists yet.
 */

import type { Metadata } from "next";
import { PreferencesScreen } from "@/components/screens/PreferencesScreen";

export const metadata: Metadata = {
  title: "Preferences — ELDREVE",
  robots: { index: false },
};

export default function PreferencesPage() {
  return <PreferencesScreen />;
}
