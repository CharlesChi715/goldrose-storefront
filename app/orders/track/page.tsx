/**
 * ROLE OF THIS FILE
 * Order tracking (`/orders/track`) — a pixel-exact import of the redesigned
 * C-1 frame ("…track order" 1541:254, 430×1519, 07-29 delivery). The
 * timeline and order details are the design's placeholder data — the frame
 * has no lookup form and there is no guest-lookup backend yet, so nothing
 * here is a real order. `?return=1` opens the return-reason bottom sheet
 * ("…track order_return" 1542:628) over this page; no element on the track
 * frame triggers it yet (unlinked state, DQ pending the design's trigger).
 * `nav={false}`: the 07-29 frame dropped the old glyph tab bar.
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

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const params = await searchParams;
  return (
    <ScaleFrame height={1519} background="#FFFBF6" fontClass={notoSC.className} nav={false}>
      <TrackOrderScreen returnOpen={params.return === "1"} />
    </ScaleFrame>
  );
}
