/**
 * ROLE OF THIS FILE
 * The shopping bag (`/bag`) — a pixel-exact import of the "B-1 · Shopping
 * Bag" frame (node 561:87, 430×1844) from the VELORIA Figma file. The line
 * items are still the design's placeholder rows: the cart itself lives in
 * localStorage (lib/cart/store.ts) and wiring it into this layout is a
 * follow-up. The checkout CTA goes to the real /checkout.
 *
 * Canvas height is the design's INNER frame (747:95, 1750px), not the 1844px
 * outer frame: the mock parks its tab bar at y=1692 with dead space beneath,
 * while the real bar is viewport-fixed. At 1750 the fixed bar lands exactly
 * where the design draws it.
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/veloria";
import { notoSC } from "@/lib/fonts";
import { BagScreen } from "@/components/screens/BagScreen";

export const metadata: Metadata = {
  title: "Shopping bag",
  description: "Review your GoldRose gifts before checkout.",
  alternates: { canonical: "/bag" },
};

export default function BagPage() {
  return (
    <ScaleFrame height={1750} background="#FFF6EC" fontClass={notoSC.className} navActive="Bag">
      <BagScreen />
    </ScaleFrame>
  );
}
