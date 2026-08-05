/**
 * ROLE OF THIS FILE
 * /account/returns/approved — Figma "/account/returns/approved · approved"
 * (2030:184, AFTER-SALES batch, imported 2026-08-02). Reached from the
 * After-Sales Status tab's first request card. Visual placeholder: the
 * mock's own RA number, QR label and tracking; no returns backend.
 */

import type { Metadata } from "next";
import { ReturnApprovedScreen } from "@/components/screens/returns/ReturnApprovedScreen";

export const metadata: Metadata = {
  title: "Return approved — ELDREVE",
  robots: { index: false },
};

export default function ReturnApprovedPage() {
  return <ReturnApprovedScreen />;
}
