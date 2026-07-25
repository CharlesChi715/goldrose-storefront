/**
 * ROLE OF THIS FILE
 * /account — the storefront "Me" tab (owner request 2026-07-23): customer
 * sign-in with Google / Apple (first round) and passkeys, then a simple
 * account view (orders placed with the account's email, passkey
 * management). Hand-built page in the checkout's styling — NOT a Figma
 * frame, so it is not pixel-gated. All auth runs client-side; the page
 * itself stays static.
 */

import type { Metadata } from "next";
import { BottomNav } from "@/components/veloria";
import { AccountClient } from "./AccountClient";

export const metadata: Metadata = {
  title: "My account — GoldRose",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <>
      <AccountClient />
      <BottomNav active="Login" />
    </>
  );
}
