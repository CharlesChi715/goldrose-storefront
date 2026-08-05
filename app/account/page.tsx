/**
 * ROLE OF THIS FILE
 * /account — the storefront "Me" tab (owner request 2026-07-23): customer
 * sign-in with Google / Apple (first round) and passkeys, then a simple
 * account view (orders placed with the account's email, passkey
 * management).
 *
 * Signed out, this renders the pixel-exact VELORIA frame 74:53 (imported
 * 2026-07-25) and signs in with an emailed one-time code. Signed in, it keeps
 * the hand-built account view — the design ships no signed-in frame. All auth
 * runs client-side; the page itself stays static.
 */

import type { Metadata } from "next";
import { AccountClient } from "./AccountClient";

export const metadata: Metadata = {
  title: "My account — ELDREVE",
  robots: { index: false },
};

export default function AccountPage() {
  return <AccountClient />;
}
