/**
 * ROLE OF THIS FILE
 * /account/delete — Figma ACCOUNT-DELETE-CONFIRM 1234:431, imported 2026-07-28.
 * Visual placeholder, unlinked route (/bag precedent): deletion is
 * destructive and has no backend flow yet.
 */

import type { Metadata } from "next";
import { DeleteConfirmScreen } from "@/components/screens/DeleteConfirmScreen";

export const metadata: Metadata = {
  title: "Delete account — GoldRose",
  robots: { index: false },
};

export default function DeleteConfirmPage() {
  return <DeleteConfirmScreen />;
}
