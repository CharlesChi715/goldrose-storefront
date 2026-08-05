/**
 * ROLE OF THIS FILE
 * /account/business — the Business & Partnerships screen, reached from the
 * account-type tabs on /account. Pixel-exact import of ELDREVE frame 74:55
 * (2026-07-25); see components/login/BusinessLogin.tsx.
 *
 * Static like the rest of the storefront: sign-in and the enquiry CTAs are
 * client-side, so nothing here depends on the visitor.
 */

import type { Metadata } from "next";
import { BusinessLogin } from "@/components/login/BusinessLogin";

export const metadata: Metadata = {
  title: "Business & Partnerships — ELDREVE",
  description:
    "Bulk orders, corporate gifting, wedding events and wholesale partnerships with ELDREVE.",
};

export default function BusinessAccountPage() {
  return <BusinessLogin />;
}
