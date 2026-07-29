/**
 * ROLE OF THIS FILE
 * /account/orders/details — the orders list's VIEW DETAILS target, from the
 * 07-29 frame "mepage-my orders-view details" (1523:3347, byte-identical to
 * the checkout-flow 1541:362). A static mock view (the /orders/track
 * precedent): the design's own order renders verbatim — there is no
 * per-order detail backend yet, so no dynamic segment. Back returns to the
 * orders list.
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/chrome";
import { notoSC } from "@/lib/fonts";
import { OrderConfirmedScreen } from "@/components/screens/OrderConfirmedScreen";

export const metadata: Metadata = {
  title: "Order details — GoldRose",
  robots: { index: false },
};

export default function AccountOrderDetailsPage() {
  return (
    <ScaleFrame height={1188} background="#FFFBF6" fontClass={notoSC.className} nav={false}>
      <OrderConfirmedScreen orderName="" total={null} method={null} mock={false} backFallback="/account/orders" />
    </ScaleFrame>
  );
}
