/**
 * ROLE OF THIS FILE
 * /account — the storefront "Me" tab (owner request 2026-07-23): the
 * signed-in account view (orders placed with the account's email, passkey
 * management).
 *
 * Signed-in only since AI-020 (2026-08-04): /account/signup is the single
 * login page, and AccountClient redirects there when there is no session.
 * The design ships no signed-in frame, so this keeps the hand-built account
 * view. All auth runs client-side; the page itself stays static.
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
