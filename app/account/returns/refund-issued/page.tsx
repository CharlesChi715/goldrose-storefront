/**
 * ROLE OF THIS FILE
 * /account/returns/refund-issued — Figma "/account/returns/refund-issued ·
 * completed" (2030:182, AFTER-SALES batch, imported 2026-08-02). Reached
 * from the After-Sales Status tab's second request card. Visual
 * placeholder: the mock's own refund; no returns backend.
 */

import type { Metadata } from "next";
import { RefundIssuedScreen } from "@/components/screens/returns/RefundIssuedScreen";

export const metadata: Metadata = {
  title: "Refund issued — ELDREVE",
  robots: { index: false },
};

export default function RefundIssuedPage() {
  return <RefundIssuedScreen />;
}
