/**
 * ROLE OF THIS FILE
 * /account/signup — AUTH-SIGNUP-SHOPPING (Figma 1097:114, imported
 * 2026-07-27) as a visual placeholder route. Nothing links here yet: the
 * live sign-in flow is the emailed one-time code on /account, and this
 * design's password fields conflict with that decision (see the screen's
 * file header and docs/ixd/README.md).
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
