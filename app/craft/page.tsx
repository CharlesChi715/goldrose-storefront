/**
 * ROLE OF THIS FILE
 * /craft — the craft/workshop page (MECRAFT-OUR-CRAFT-IMAGE-LED-PAGE
 * 1573:107, imported 2026-07-29). Fills the target the homepage craft cards
 * (H-17/H-31) and the menu drawer's OUR CRAFT row have pointed at since
 * 07-25. Canvas 1347 = the frame's nav band top (1288) + 59, shared
 * owner-art BottomNav (the frame's own glyph-text nav variant is a DQ).
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/chrome";
import { notoSC } from "@/lib/fonts";
import { CraftScreen } from "@/components/screens/CraftScreen";

export const metadata: Metadata = {
  title: "Our craft — GoldRose",
  description:
    "How GoldRose preserves real roses in 24K gold: selected, preserved, hand-finished.",
  alternates: { canonical: "/craft" },
};

export default function CraftPage() {
  return (
    <ScaleFrame
      height={1347}
      background="#FFF6EC"
      fontClass={notoSC.className}
      navActive="none"
    >
      <CraftScreen />
    </ScaleFrame>
  );
}
