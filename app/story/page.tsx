/**
 * ROLE OF THIS FILE
 * /story — the brand-story page (MESTORY-OUR-STORY-IMAGE-LED-PAGE 1573:106,
 * imported 2026-07-29). Fills the target the homepage story card (H-34) and
 * the menu drawer's OUR STORY row have pointed at since 07-25. Canvas 1260 =
 * the frame's nav band top (1201) + 59, shared owner-art BottomNav.
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/chrome";
import { notoSC } from "@/lib/fonts";
import { StoryScreen } from "@/components/screens/StoryScreen";

export const metadata: Metadata = {
  title: "Our story — ELDREVE",
  description:
    "Why ELDREVE preserves real roses in 24K gold: meaning, sincerity, memory.",
  alternates: { canonical: "/story" },
};

export default function StoryPage() {
  return (
    <ScaleFrame
      height={1260}
      background="#FFF6EC"
      fontClass={notoSC.className}
      navActive="none"
    >
      <StoryScreen />
    </ScaleFrame>
  );
}
