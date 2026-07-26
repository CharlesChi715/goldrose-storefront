/**
 * ROLE OF THIS FILE
 * Order tracking (`/orders/track`) — a pixel-exact import of the "C-1 · Order
 * Tracking" frame (node 765:112, 430×1780) from the VELORIA Figma file. The
 * timeline and order details are the design's placeholder data — the frame has
 * no lookup form and there is no guest-lookup backend yet, so nothing here is
 * a real order (signed-in customers see real tracking on /account). This route
 * exists so the login screen's "View my order" button has a customer-facing
 * destination instead of the admin order list. `nav={false}`: the frame draws
 * its own tab bar, which lives inside TrackOrderScreen.
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/chrome";
import { notoSC } from "@/lib/fonts";
import { TrackOrderScreen } from "@/components/screens/TrackOrderScreen";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Follow your GoldRose gift from our workshop to the door.",
  alternates: { canonical: "/orders/track" },
};

export default function TrackOrderPage() {
  return (
    <ScaleFrame height={1780} background="#FFFBF6" fontClass={notoSC.className} nav={false}>
      <TrackOrderScreen />
    </ScaleFrame>
  );
}
