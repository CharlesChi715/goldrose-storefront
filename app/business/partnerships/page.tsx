/**
 * ROLE OF THIS FILE
 * Corporate partnerships (`/business/partnerships`) — a pixel-exact import of
 * the "B-3 · Business Partnerships" frame (node 561:89, 430×1922) from the
 * VELORIA Figma file: hero, colourways, partner grid, advantages, the
 * four-step process and two CTAs (the frame carries no enquiry form). Copy is
 * the design's own placeholder text. "Apply for wholesale" links to
 * /business/wholesale; "Contact business team" has no destination yet, so it
 * stays inert (see docs/ixd).
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/veloria";
import { notoSC } from "@/lib/fonts";
import { PartnershipsScreen } from "@/components/screens/PartnershipsScreen";

export const metadata: Metadata = {
  title: "Corporate partnerships",
  description: "GoldRose gifting partnerships for retailers, corporate buyers and events.",
  alternates: { canonical: "/business/partnerships" },
};

export default function PartnershipsPage() {
  return (
    <ScaleFrame height={1922} background="#FFF6EC" fontClass={notoSC.className} nav={false}>
      <PartnershipsScreen />
    </ScaleFrame>
  );
}
