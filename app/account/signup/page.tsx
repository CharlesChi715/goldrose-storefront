/**
 * ROLE OF THIS FILE
 * /account/signup — "loginpage-Create a shopping account" (Figma 1523:3315,
 * re-imported 2026-08-02). The frame's password and name fields were removed
 * at source and it now reads "Continue with your email", so the login page's
 * "Create a shopping account ›" links here.
 *
 * As of 2026-08-03 the form is LIVE, not a placeholder: emailed 6-digit code
 * + one-tap sign-in link, verified against Supabase (see the screen's file
 * header). This page stays a server component so the metadata below is
 * static; the interactive screen is the client component it renders.
 *
 * AI-TAG(AI-020): AGENT-UNSURE — the frame is a unified email entry point
 * while its name, this route and the title still say "create account", and
 * it duplicates the signed-out /account login screen. See
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
