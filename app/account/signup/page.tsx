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
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupScreen } from "@/components/screens/SignupScreen";

export const metadata: Metadata = {
  // AI-020 (answered 2026-08-04): this is the storefront's one login page, not
  // just the create-account step, so the title says what the page does. The
  // route name still says "signup" — renaming it is a redirect exercise best
  // done with the ELDREVE rename (AI-021), not smuggled in here.
  title: "Sign in — GoldRose",
  robots: { index: false },
};

export default function SignupPage() {
  // The screen reads ?auth_error=1 via useSearchParams, which opts a client
  // component out of static prerendering unless it sits under Suspense. The
  // fallback is deliberately blank: the screen mounts immediately, so anything
  // drawn here would be a flash, not a loading state.
  return (
    <Suspense fallback={null}>
      <SignupScreen />
    </Suspense>
  );
}
