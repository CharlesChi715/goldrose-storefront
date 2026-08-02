/**
 * ROLE OF THIS FILE
 * /account/returns/request-submitted — Figma "/account/returns/
 * request-submitted · submitted" (2030:185, AFTER-SALES batch, imported
 * 2026-08-02). Replaces the coming-soon scaffold that held this route while
 * the frame wasn't Ready-for-dev. Reached from add-photos' Submit Request
 * and the /orders/track return sheet's Confirm Return. Visual placeholder:
 * the mock's own request; no returns backend.
 */

import type { Metadata } from "next";
import { RequestSubmittedScreen } from "@/components/screens/returns/RequestSubmittedScreen";

export const metadata: Metadata = {
  title: "Request submitted — GoldRose",
  robots: { index: false },
};

export default function ReturnRequestSubmittedPage() {
  return <RequestSubmittedScreen />;
}
