/**
 * ROLE OF THIS FILE
 * The shopping bag (`/bag`) — a pixel-exact import of the "B-1 · Shopping
 * Bag" frame (node 561:87, 430×1844) from the VELORIA Figma file. The line
 * items are still the design's placeholder rows: the cart itself lives in
 * localStorage (lib/cart/store.ts) and wiring it into this layout is a
 * follow-up. The checkout CTA goes to the real /checkout.
 *
 * Canvas height is 1728 — the 07-27 frame (430×1726 after the polish pass)
 * parks its own tab bar at y=1669; the real bar is viewport-fixed, so the
 * canvas is nav-start + 59 and the fixed bar lands exactly where the design
 * draws its own (same equivalence the 1750 canvas used before the polish).
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/chrome";
import { notoSC } from "@/lib/fonts";
import { BagScreen } from "@/components/screens/BagScreen";

export const metadata: Metadata = {
  title: "Shopping bag",
  description: "Review your GoldRose gifts before checkout.",
  alternates: { canonical: "/bag" },
};

export default function BagPage() {
  return (
    <ScaleFrame height={1728} background="#FFF6EC" fontClass={notoSC.className} navActive="Bag">
      <BagScreen />
    </ScaleFrame>
  );
}
