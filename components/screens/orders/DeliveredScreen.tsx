/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/orders/delivered — pixel-exact implementation of the Ready-for-dev
 * frame "/account/orders/delivered · mobile · iPhone 15 Pro Max" (2439:369,
 * section me二·级), imported 2026-08-05. Geometry, colors, fonts and copy are
 * verbatim from the Figma REST data; the frame is 430×1316.
 *
 * Closes AI-029: the orders list's second "View details" button prototype-
 * links here (1523:3455 → 2439:369) and had no route to reach.
 *
 * Data: a static mock, following the /account/orders/details precedent —
 * there is no per-order detail backend, so the design's own order (number,
 * recipient, amounts, tracking, card) renders verbatim and there is no
 * dynamic segment. Everything on this page is the mock's, not a real order.
 *
 * Wired: back → /account/orders; BUY AGAIN → /shop (the H-15 nearest-honest-
 * destination precedent the orders list already uses); WRITE A REVIEW →
 * /account/orders/review (the frame's own prototype edge); RETURNS AND
 * AFTER-SALES and "Start a return" → /account/returns; "Contact support" →
 * /care. The ↻ ✉ › prefixes shipped no Figma exports and stay text glyphs
 * (browser font fallback, the established gotcha).
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { BrandWordmark } from "@/components/screens/account-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/eldreve/screens";
const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const PINK = "#F3C6D1";
const WHITE = "#FFFFFF";

/** The batch's card surface: fill, 1px inside-stroke, per-frame radius. */
function card(
  x: number,
  y: number,
  w: number,
  h: number,
  r = 16,
): React.CSSProperties {
  return {
    ...abs(x, y, w, h),
    background: WHITE,
    boxShadow: `inset 0 0 0 1px ${SAND}`,
    borderRadius: r,
  };
}

/** One label/value row of the delivery-details card (icon + left + right). */
function DetailRow({
  icon,
  iconY,
  label,
  labelY,
  value,
  valueY,
  valueLines,
}: {
  icon: string;
  iconY: number;
  label: string;
  labelY: number;
  value: string;
  valueY: number;
  valueLines?: boolean;
}) {
  return (
    <>
      <img
        src={`${A}/${icon}.svg`}
        alt=""
        width={24}
        height={24}
        style={{ ...abs(32, iconY, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(64, labelY, 116), ...txt(11, 16, INK) }}>
        {label}
      </div>
      <div
        style={{
          ...abs(188, valueY, 210),
          ...txt(11, 16, INK, "right"),
          ...(valueLines ? { whiteSpace: "pre-line" } : null),
        }}
      >
        {value}
      </div>
    </>
  );
}

/** A full-width action button; ink-filled when `primary`, outlined otherwise. */
function ActionButton({
  y,
  label,
  href,
  primary = false,
}: {
  y: number;
  label: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        ...abs(16, y, 398, 48),
        borderRadius: 14,
        display: "block",
        textDecoration: "none",
        ...(primary
          ? { background: INK }
          : { boxShadow: `inset 0 0 0 1.2px ${INK}` }),
      }}
    >
      <div
        style={{
          ...abs(0, 16, 398),
          ...txt(13, 16, primary ? CREAM : INK, "center"),
          fontWeight: 500,
          letterSpacing: 0.78,
        }}
      >
        {label}
      </div>
    </Link>
  );
}

export function DeliveredScreen() {
  return (
    <ScaleFrame
      height={1316}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2460:384/385 Brand Navigation — frame art arrow + shared wordmark */}
      <BackButton
        fallback="/account/orders"
        src={`${A}/2460-384.png`}
        style={abs(0, 21, 40, 43)}
      />
      <BrandWordmark x={149} y={17} w={140} h={51} />

      {/* 2440:374…378 hero */}
      <img
        src={`${A}/2440-374.svg`}
        alt=""
        width={58}
        height={58}
        style={{ ...abs(186, 72, 58, 58), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(148, 135, 134),
          ...txt(31, 40, INK),
          fontWeight: 500,
          letterSpacing: -0.2,
        }}
      >
        Delivered
      </div>
      <div style={{ ...abs(24, 180, 382), ...txt(14, 20, INK, "center") }}>
        Your gift has been delivered successfully.
      </div>

      {/* 2440:380…388 delivery confirmation banner */}
      <div
        style={{
          ...abs(16, 214, 398, 80),
          background: PINK,
          borderRadius: 16,
        }}
      />
      <img
        src={`${A}/2440-381.svg`}
        alt=""
        width={34}
        height={34}
        style={{ ...abs(30, 237, 34, 34), display: "block" }}
      />
      <div
        style={{ ...abs(76, 231, 182), ...txt(15, 20, INK), fontWeight: 500 }}
      >
        Delivered to Jessica Chen
      </div>
      <div style={{ ...abs(76, 253, 138), ...txt(12, 16, INK) }}>
        May 21, 2024&nbsp; • &nbsp;2:14 PM
      </div>

      {/* 2441:369…395 order summary card */}
      <div style={card(16, 306, 398, 388)} />
      <div
        style={{
          ...abs(34, 322, 44),
          ...txt(11, 14, GOLD),
          fontWeight: 500,
          letterSpacing: 1.5,
        }}
      >
        ORDER
      </div>
      <div
        className={playfair.className}
        style={{ ...abs(34, 346, 160), ...txt(18, 28, INK), fontWeight: 500 }}
      >
        Order #VL20250821
      </div>
      <div style={{ ...abs(34, 375, 163), ...txt(11, 16, INK) }}>
        Placed May 15, 2024&nbsp; • &nbsp;9:41 AM
      </div>
      <div style={{ ...abs(34, 404, 358, 1), background: SAND }} />

      <img
        src={`${A}/2441-375.png`}
        alt=""
        width={104}
        height={96}
        style={{
          ...abs(34, 419, 104, 96),
          borderRadius: 12,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(152, 420.5, 175),
          ...txt(17, 24, INK),
          fontWeight: 500,
        }}
      >
        24K Gold-Dipped Rose
      </div>
      <div style={{ ...abs(152, 447.5, 90), ...txt(11, 16, INK) }}>
        Classic Collection
      </div>
      <div style={{ ...abs(152, 466.5, 56), ...txt(11, 16, INK) }}>
        Quantity&nbsp; 1
      </div>
      <div
        className={playfair.className}
        style={{ ...abs(152, 485.5, 65), ...txt(19, 28, INK), fontWeight: 500 }}
      >
        $129.00
      </div>
      <div style={{ ...abs(34, 529, 358, 1), background: SAND }} />

      {/* 2441:382…389 price breakdown — every value box ends at x392 */}
      <div
        style={{
          ...abs(34, 540, 358),
          ...txt(11, 14, GOLD),
          fontWeight: 500,
          letterSpacing: 1.5,
        }}
      >
        ORDER SUMMARY&nbsp; ˄
      </div>
      <div style={{ ...abs(34, 553, 44), ...txt(11, 16, INK) }}>Subtotal</div>
      <div style={{ ...abs(352, 553, 40), ...txt(11, 16, INK, "right") }}>
        $129.00
      </div>
      <div style={{ ...abs(34, 573, 46), ...txt(11, 16, INK) }}>Shipping</div>
      <div style={{ ...abs(311, 573, 81), ...txt(11, 16, INK, "right") }}>
        Complimentary
      </div>
      <div style={{ ...abs(34, 593, 70), ...txt(11, 16, INK) }}>
        Estimated tax
      </div>
      <div style={{ ...abs(358, 593, 34), ...txt(11, 16, INK, "right") }}>
        $10.64
      </div>
      <div style={{ ...abs(34, 644, 358, 1), background: SAND }} />
      <div
        style={{
          ...abs(34, 657, 80),
          ...txt(12, 14, INK),
          fontWeight: 500,
          letterSpacing: 1.5,
        }}
      >
        TOTAL PAID
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(328, 657, 64),
          ...txt(20, 28, INK, "right"),
          fontWeight: 500,
        }}
      >
        $139.64
      </div>

      {/* 2444:369…400 delivery details card */}
      <div style={card(16, 706, 398, 308)} />
      <div
        style={{
          ...abs(32, 720, 114),
          ...txt(11, 14, GOLD),
          fontWeight: 500,
          letterSpacing: 1.5,
        }}
      >
        DELIVERY STATUS
      </div>
      <div
        style={{
          ...abs(338, 720, 60),
          ...txt(13, 20, INK, "right"),
          fontWeight: 500,
        }}
      >
        Delivered
      </div>
      <DetailRow
        icon="2444-374"
        iconY={754}
        label="Tracking number"
        labelY={758}
        value="9400 1234 5678 9012 3456 78"
        valueY={758}
      />
      <DetailRow
        icon="2444-380"
        iconY={793}
        label="Carrier"
        labelY={797}
        value="USPS"
        valueY={797}
      />
      <DetailRow
        icon="2444-385"
        iconY={844}
        label="Shipping address"
        labelY={848}
        value={"Jessica Chen\n123 Rose Ave, Apt 5B\nNew York, NY 10012"}
        valueY={832}
        valueLines
      />
      <DetailRow
        icon="2444-391"
        iconY={897}
        label="Payment method"
        labelY={901}
        value={"Visa  •••• 2345"}
        valueY={901}
      />

      {/* 2444:397…400 left-at-door note */}
      <div
        style={{ ...abs(32, 933, 366, 54), background: PINK, borderRadius: 12 }}
      />
      <img
        src={`${A}/2444-397.svg`}
        alt=""
        width={24}
        height={24}
        style={{ ...abs(44, 948, 24, 24), display: "block" }}
      />
      <div
        style={{ ...abs(78, 942, 98), ...txt(12, 20, INK), fontWeight: 500 }}
      >
        Left at front door
      </div>
      <div style={{ ...abs(78, 962, 115), ...txt(10, 16, INK) }}>
        May 21, 2024&nbsp; • &nbsp;2:14 PM
      </div>

      {/* 2446:369…378 actions and support */}
      <ActionButton y={1026} label="BUY AGAIN" href="/shop" primary />
      <ActionButton
        y={1084}
        label="WRITE A REVIEW"
        href="/account/orders/review"
      />
      <ActionButton
        y={1142}
        label="RETURNS AND AFTER-SALES"
        href="/account/returns"
      />

      <div style={card(16, 1200, 398, 94, 14)} />
      <img
        src={`${A}/2446-374.svg`}
        alt=""
        width={38}
        height={38}
        style={{ ...abs(30, 1228, 38, 38), display: "block" }}
      />
      <div
        style={{ ...abs(80, 1214, 151), ...txt(12, 20, INK), fontWeight: 500 }}
      >
        Need help with this order?
      </div>
      <Link
        href="/account/returns"
        style={{
          ...abs(80, 1237, 194),
          ...txt(11, 16, INK),
          textDecoration: "none",
        }}
      >
        ↻&nbsp; Start a return or report an issue &nbsp; &nbsp; ›
      </Link>
      <div style={{ ...abs(80, 1256, 318, 1), background: SAND }} />
      <Link
        href="/care"
        style={{
          ...abs(80, 1260, 177),
          ...txt(11, 16, INK),
          textDecoration: "none",
        }}
      >
        ✉&nbsp; Contact support &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ›
      </Link>
    </ScaleFrame>
  );
}
