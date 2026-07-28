/**
 * ROLE OF THIS FILE
 * /account/logout — Figma ACCOUNT-LOGOUT-CONFIRM 1234:351, imported 2026-07-28.
 * The designed sign-out flow; the confirm button ends the Supabase session
 * for real. Reached from the dashboard's Sign out row.
 */

import type { Metadata } from "next";
import { LogoutConfirmScreen } from "@/components/screens/LogoutConfirmScreen";

export const metadata: Metadata = {
  title: "Log out — GoldRose",
  robots: { index: false },
};

export default function LogoutConfirmPage() {
  return <LogoutConfirmScreen />;
}
