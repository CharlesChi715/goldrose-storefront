/**
 * ROLE OF THIS FILE
 * /account/signup — "loginpage-Create a shopping account" (Figma 1523:3315,
 * re-imported 2026-08-02) as a visual placeholder route. The frame's password
 * and name fields were removed at source and it now reads "Continue with your
 * email", so the login page's "Create a shopping account ›" links here; the
 * form itself stays inert until customer-auth activation (see the screen's
 * file header).
 *
 * AI-TAG(AI-020): AGENT-UNSURE — the frame is now a unified email entry point
 * while its name, this route and the title still say "create account", and
 * CONTINUE's prototype destination is null. See
 * /agent-delivery/sessions/figma-sync-signup-mepage-08-02-feat-figma-sync.md.
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
