/**
 * ROLE OF THIS FILE
 * /account/returns/request-not-approved — Figma "/account/returns/
 * request-not-approved · closed" (2030:183, AFTER-SALES batch, imported
 * 2026-08-02). Reached from the After-Sales Status tab's third request
 * card. Visual placeholder: the mock's own closed request; no returns
 * backend.
 */

import type { Metadata } from "next";
import { ReturnNotApprovedScreen } from "@/components/screens/returns/ReturnNotApprovedScreen";

export const metadata: Metadata = {
  title: "Request not approved — ELDREVE",
  robots: { index: false },
};

export default function ReturnNotApprovedPage() {
  return <ReturnNotApprovedScreen />;
}
