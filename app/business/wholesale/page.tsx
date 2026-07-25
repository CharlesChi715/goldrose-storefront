/**
 * ROLE OF THIS FILE
 * Wholesale application (`/business/wholesale`) — a pixel-exact import of the
 * "B-4 · Wholesale Application" frame (node 561:90, 430×1954) from the
 * VELORIA Figma file. The fields are real inputs so the page is usable, but
 * there is no submission backend yet: the submit button is a placeholder.
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/veloria";
import { notoSC } from "@/lib/fonts";
import { WholesaleScreen } from "@/components/screens/WholesaleScreen";

export const metadata: Metadata = {
  title: "Wholesale application",
  description: "Apply for GoldRose wholesale pricing and trade terms.",
  alternates: { canonical: "/business/wholesale" },
};

export default function WholesalePage() {
  return (
    <ScaleFrame height={1954} background="#FFF6EC" fontClass={notoSC.className} nav={false}>
      <WholesaleScreen />
    </ScaleFrame>
  );
}
