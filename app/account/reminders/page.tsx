/**
 * ROLE OF THIS FILE
 * /account/reminders — the Gift Reminders screen (Figma
 * ACCOUNT-GIFT-REMINDERS 1097:120, imported 2026-07-27), reached from the
 * dashboard's "Dates & Gift Reminders" row. Visual placeholder: no
 * reminders backend exists yet, so the mock's own reminders render.
 */

import type { Metadata } from "next";
import { RemindersScreen } from "@/components/screens/RemindersScreen";

export const metadata: Metadata = {
  title: "Gift reminders — GoldRose",
  robots: { index: false },
};

export default function RemindersPage() {
  return <RemindersScreen />;
}
