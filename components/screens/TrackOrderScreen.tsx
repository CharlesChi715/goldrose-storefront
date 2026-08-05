/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Order tracking — pixel-exact implementation of "shoppage-Product
 * Details-Checkout-Order Details_track order" (1541:254, 07-29 delivery;
 * byte-identical twin "mepage-my orders-track order" 1523:775). The
 * redesigned C-1: 430×1519, the vector route map replaces the old artwork,
 * and the frame's own glyph tab bar is gone. The whole timeline is still
 * the design's placeholder order (#VL20250821, the UPS number, the dates) —
 * there is no tracking backend.
 *
 * The return flow ("…track order_return" 1542:628 / loose twin 1523:1266)
 * is a dim-overlay + bottom-sheet state OVER this page — implemented as
 * /orders/track?return=1 (TrackReturnSheet). No element on the track frame
 * triggers it and the file carries no prototype links, so the state ships
 * unlinked (DQ raised for the trigger).
 *
 * Brand: the frame's header wordmark image reads "ELDREVE" — the brand
 * itself (DQ-34). The live page sets it as text in the flow's Playfair
 * treatment at the image's box.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { TrackReturnSheet } from "@/components/screens/TrackReturnSheet";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";

const GREEN = "#09442E"; // flow brand: headline, done markers, values
const INK = "#29211F";
const GOLD = "#D18005"; // current marker, section glyphs
const GREY = "#6B6E75"; // small-caps labels, timestamps
const CARD = "#FFFFFF";
const SAND = "#E0D6C9"; // card hairlines
const PENDING = "#C7C9C9"; // pending marker + rail
const UPDATE_BG = "#FAF5ED"; // latest-update panel

/** Ink-cropped SVG export of a symbol TEXT node, at the node box. */
function Glyph({
  src,
  x,
  y,
  w,
  h,
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <img
      src={src}
      alt=""
      width={w}
      height={h}
      style={{
        ...abs(x, y, w, h),
        display: "block",
        objectFit: "none",
        objectPosition: "left center",
      }}
    />
  );
}

/**
 * 1541:298–350 · the six timeline entries ride a uniform 94px pitch from
 * y752. done = green ✓ marker + green rail; current = gold • marker + grey
 * rail; pending = grey empty marker, no rail (last row).
 */
const TIMELINE = [
  {
    title: "Order Confirmed",
    time: "May 15 · 9:41 AM",
    copy: "We received your order.",
    state: "done",
  },
  {
    title: "Preparing Your Gift",
    time: "May 15 · 2:10 PM",
    copy: "Your rose entered our studio.",
    state: "done",
  },
  {
    title: "Quality Check & Packaging",
    time: "May 16 · 8:30 AM",
    copy: "Inspection complete and carefully packed.",
    state: "done",
  },
  {
    title: "Shipped",
    time: "May 16 · 8:46 AM",
    copy: "Your parcel was handed to UPS.",
    state: "done",
  },
  {
    title: "In Transit",
    time: "Estimated May 18–23",
    copy: "Traveling to the next UPS facility.",
    state: "current",
  },
  {
    title: "Delivered",
    time: "Estimated May 18–23",
    copy: "The gift will be delivered to the recipient.",
    state: "pending",
  },
] as const;

/** 1541:277/283/289 · the tracking-details rows (glyph boxes vary per row). */
const DETAILS = [
  {
    glyph: "1541-278",
    gx: 32,
    gy: 502,
    gw: 22,
    label: "ORDER NUMBER",
    lx: 64,
    ly: 489,
    value: "#VL20250821",
    vy: 502,
  },
  {
    glyph: "1541-284",
    gx: 32,
    gy: 569,
    gw: 17,
    label: "TRACKING NUMBER",
    lx: 59,
    ly: 556,
    value: "1Z84W3E60390566070",
    vy: 569,
  },
  {
    glyph: "1541-290",
    gx: 32,
    gy: 636,
    gw: 22,
    label: "CARRIER",
    lx: 64,
    ly: 623,
    value: "UPS",
    vy: 636,
  },
] as const;

export function TrackOrderScreen({
  returnOpen = false,
}: {
  returnOpen?: boolean;
}) {
  return (
    <>
      {/* ---------- 01 · Header + Route Map ---------- */}
      <BackButton
        fallback="/account"
        src={`${A}/1541-258.png`}
        style={abs(16, 8, 40, 42)}
      />
      {/* Wordmark box (134,1.6 152×54.8) — ELDREVE for the frame's
          "ELDREVE" placeholder image, in the flow's Playfair treatment. */}
      <div
        className={playfair.className}
        style={{
          ...abs(134, 1.6, 152, 54.8),
          ...txt(26, 54.8, GREEN, "center"),
          fontWeight: 600,
        }}
      >
        ELDREVE
      </div>
      <h1
        className={playfair.className}
        style={{
          ...abs(16, 58, 398),
          ...txt(29, 38.7, GREEN, "center"),
          fontWeight: 600,
          margin: 0,
        }}
      >
        Track Your Order
      </h1>
      <div
        style={{
          ...abs(16, 108, 398),
          ...txt(13, 15.6, INK, "center"),
          fontWeight: 500,
        }}
      >
        Your gift is on the way
      </div>
      {/* 1541:262 · Editable Route Map — the whole vector panel (path, state
          labels, origin/destination markers) served as one scale-2 render. */}
      <img
        src={`${A}/1541-262.png`}
        alt=""
        width={398}
        height={324}
        style={{
          ...abs(16, 140, 398, 324),
          borderRadius: 12,
          display: "block",
        }}
      />

      {/* ---------- 02 · Tracking Details ---------- */}
      <div
        style={{
          ...abs(16, 474, 398, 220),
          background: CARD,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 14,
        }}
      />
      {DETAILS.map((row, i) => (
        <div key={row.label}>
          <Glyph
            src={`${A}/${row.glyph}.svg`}
            x={row.gx}
            y={row.gy}
            w={row.gw}
            h={26}
          />
          <div
            style={{
              ...abs(row.lx, row.ly, 300),
              ...txt(9, 10.8, GREY),
              fontWeight: 500,
            }}
          >
            {row.label}
          </div>
          <div
            style={{
              ...abs(row.lx, row.vy, 300),
              ...txt(13, 15.6, INK),
              fontWeight: 500,
            }}
          >
            {row.value}
          </div>
          {i < 2 ? (
            <div
              style={{
                ...abs(32, i === 0 ? 548 : 615, 366, 1),
                background: SAND,
              }}
            />
          ) : null}
        </div>
      ))}
      {/* VIEW ON UPS stays inert — no real tracking number to hand over. */}
      <div
        style={{ ...abs(300, 643, 78), ...txt(10, 12, GOLD), fontWeight: 500 }}
      >
        {"VIEW ON UPS  →"}
      </div>

      {/* ---------- 03 · Delivery Timeline ---------- */}
      <div
        style={{
          ...abs(16, 706, 398, 588),
          background: CARD,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 14,
        }}
      />
      <div
        className={playfair.className}
        style={{ ...abs(32, 722, 169), ...txt(21, 28, GREEN), fontWeight: 500 }}
      >
        Delivery Timeline
      </div>
      {TIMELINE.map((step, i) => {
        const y = 752 + i * 94;
        const markerBg =
          step.state === "done"
            ? GREEN
            : step.state === "current"
              ? GOLD
              : PENDING;
        return (
          <div key={step.title}>
            <div
              style={{
                ...abs(35, y, 24, 24),
                background: markerBg,
                borderRadius: 12,
              }}
            />
            {step.state === "done" ? (
              <Glyph src={`${A}/1541-301.svg`} x={42} y={y + 3} w={8} h={13} />
            ) : null}
            {step.state === "current" ? (
              <div
                style={{
                  ...abs(42, y + 3, 11),
                  ...txt(11, 13.2, "#FFFFFF"),
                  fontWeight: 500,
                }}
              >
                •
              </div>
            ) : null}
            {i < TIMELINE.length - 1 ? (
              <div
                style={{
                  ...abs(46, y + 24, 2, 68),
                  background: step.state === "done" ? GREEN : PENDING,
                }}
              />
            ) : null}
            <div
              style={{
                ...abs(72, y + 1, 326),
                ...txt(13, 15.6, step.state === "pending" ? INK : GREEN),
                fontWeight: 500,
              }}
            >
              {step.title}
            </div>
            <div style={{ ...abs(72, y + 20, 326), ...txt(10, 12, GREY) }}>
              {step.time}
            </div>
            <div style={{ ...abs(72, y + 35, 326), ...txt(10, 12, INK) }}>
              {step.copy}
            </div>
          </div>
        );
      })}

      {/* ---------- 04 · Latest Update + Help ---------- */}
      <div
        style={{
          ...abs(16, 1314, 398, 102),
          background: UPDATE_BG,
          borderRadius: 12,
        }}
      />
      <div
        style={{
          ...abs(30, 1326, 113),
          ...txt(9, 10.8, GREEN),
          fontWeight: 500,
        }}
      >
        LATEST SHIPPING UPDATE
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(30, 1341, 125),
          ...txt(17, 22.7, INK),
          fontWeight: 500,
        }}
      >
        May 16 · 8:46 AM
      </div>
      <div
        style={{
          ...abs(30, 1368, 370),
          ...txt(10, 12, INK),
          whiteSpace: "normal",
        }}
      >
        Your parcel left the UPS facility in Chicago and is traveling to the
        next stop.
      </div>

      {/* implements ORDER-DETAIL-CONTACT-SUPPORT — whole card lands in chat. */}
      <div
        style={{
          ...abs(16, 1426, 398, 78),
          background: CARD,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 12,
        }}
      />
      <Glyph src={`${A}/1541-357.svg`} x={30} y={1449.5} w={26} h={31} />
      <div
        className={playfair.className}
        style={{
          ...abs(68, 1439, 300),
          ...txt(17, 22.7, INK),
          fontWeight: 500,
        }}
      >
        Need help?
      </div>
      <div style={{ ...abs(68, 1464, 300), ...txt(10, 12, INK) }}>
        Our customer care team is always here.
      </div>
      <div
        style={{
          ...abs(68, 1478, 300),
          ...txt(9, 10.8, GREEN),
          fontWeight: 500,
        }}
      >
        {"CONTACT SUPPORT  →"}
      </div>
      <Link
        href="/care/chat"
        aria-label="Contact support"
        style={{ ...abs(16, 1426, 398, 78), display: "block" }}
      />

      {returnOpen ? <TrackReturnSheet /> : null}
      <span className={notoSC.className} style={{ display: "none" }} />
    </>
  );
}
