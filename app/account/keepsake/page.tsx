/**
 * ROLE OF THIS FILE
 * /account/keepsake — Figma ACCOUNT-KEEPSAKE-SHARE 1230:121, imported 2026-07-28.
 * Visual placeholder, unlinked route (/bag precedent): a real card needs
 * order data and a share/render backend.
 */

import type { Metadata } from "next";
import { KeepsakeShareScreen } from "@/components/screens/KeepsakeShareScreen";

export const metadata: Metadata = {
  title: "Share your keepsake card — ELDREVE",
  robots: { index: false },
};

export default function KeepsakeSharePage() {
  return <KeepsakeShareScreen />;
}
