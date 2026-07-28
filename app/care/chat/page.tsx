/**
 * ROLE OF THIS FILE
 * /care/chat — Figma CARE-SUPPORT-CHAT 1230:120, imported 2026-07-28.
 * Visual placeholder: the mock's own conversation; reached from /care's
 * "Chat with us" button.
 */

import type { Metadata } from "next";
import { SupportChatScreen } from "@/components/screens/SupportChatScreen";

export const metadata: Metadata = {
  title: "Support chat — GoldRose",
  robots: { index: false },
};

export default function SupportChatPage() {
  return <SupportChatScreen />;
}
