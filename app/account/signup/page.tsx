/**
 * ROLE OF THIS FILE
 * /account/signup — "loginpage-Create a shopping account" (Figma 1523:3315,
 * re-imported 2026-08-02) as a visual placeholder route. The design's
 * password fields were removed at source, so the login page's "Create a
 * shopping account ›" now links here; the form itself stays inert until
 * customer-auth activation (see the screen's file header).
 */

import type { Metadata } from "next";
import { SignupScreen } from "@/components/screens/SignupScreen";

export const metadata: Metadata = {
  title: "Create account — GoldRose",
  robots: { index: false },
};

export default function SignupPage() {
  return <SignupScreen />;
}
