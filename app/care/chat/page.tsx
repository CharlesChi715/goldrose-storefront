/**
 * ROLE OF THIS FILE
 * /care/chat — Figma frame 1537:111
 * "/care/chat · default · mobile · shoppage-Product Details-Checkout-Need help?"
 * (Ready-for-dev, under section shoppage三级 1523:420). Re-verified against
 * that frame on 2026-08-03: pixel-identical, no import needed. The frame was
 * re-authored since the 07-28/07-29 import — the old node ids (1230:120,
 * 1523:1470) no longer exist in the file, so quote 1537:111 from here on.
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
