/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * C-1 · Order Tracking — pixel-exact import of Figma frame 765:112 (430×1780):
 * inline VELORIA header, route map, tracking-details card, six-step delivery
 * timeline, latest-update and help panels, and the design's own bottom nav.
 * Every order number / date / carrier is the mock's placeholder text — there
 * is no lookup backend — so only the back chevron (→ /account) and the nav
 * Shop tab (→ /shop) are live; every other CTA is a static div.
 * NOTE: this frame uses a newer palette (#FFFBF6 / #09442E / #D18005) than the
 * rest of the storefront and its own header, built verbatim as designed.
 */

import Link from "next/link";
import { abs } from "@/components/veloria";
import { notoSC, playfair } from "@/lib/fonts";

// Glyph/vector renders (manifest2.json). Figma crops each export to its ink,
// so every one is placed at its own render-bounds origin at natural size.
const ART = "/veloria/screens/";

// 768:113 / 768:122 / 768:131 / 768:140 / 768:149 / 768:158 — the six timeline
// rows are a perfect 94px pitch inside the card, so they differ only in copy
// and marker state. Row-local offsets: marker (3,0), rail (14,24),
// title (40,1), meta (40,20), body (40,35).
const TIMELINE = [
  {
    state: "done",
    title: "Order Confirmed",
    titleW: 105,
    meta: "May 15 · 9:41 AM",
    metaW: 83,
    body: "We received your order.",
  },
  {
    state: "done",
    title: "Preparing Your Gift",
    titleW: 118,
    meta: "May 15 · 2:10 PM",
    metaW: 83,
    body: "Your rose entered our studio.",
  },
  {
    state: "done",
    title: "Quality Check & Packaging",
    titleW: 165,
    meta: "May 16 · 8:30 AM",
    metaW: 83,
    body: "Inspection complete and carefully packed.",
  },
  {
    state: "done",
    title: "Shipped",
    titleW: 52,
    meta: "May 16 · 8:46 AM",
    metaW: 83,
    body: "Your parcel was handed to UPS.",
  },
  {
    state: "current",
    title: "In Transit",
    titleW: 58,
    meta: "Estimated May 18–23",
    metaW: 98,
    body: "Traveling to the next UPS facility.",
  },
  {
    state: "pending",
    title: "Delivered",
    titleW: 60,
    meta: "Estimated May 18–23",
    metaW: 98,
    body: "The gift will be delivered to the recipient.",
  },
] as const;

const MARKER_FILL = { done: "#09442E", current: "#D18005", pending: "#C7C9C9" };

// 768:177 / 768:180 / 768:183 / 768:186 — nav tabs at the design's fractional
// x pitch (90×58 each). icon/label offsets are relative to each tab.
const NAV = [
  {
    label: "Home",
    x: 0,
    href: null,
    color: "#29211F",
    icon: { src: `${ART}768-178.svg`, x: 38.5, y: 16.2, w: 13, h: 15 },
    text: { x: 32, w: 26 },
  },
  {
    label: "Shop",
    x: 102.667,
    href: "/shop",
    color: "#29211F",
    icon: { src: `${ART}768-181.svg`, x: 36.2, y: 14.3, w: 18, h: 18 },
    text: { x: 33.5, w: 23 },
  },
  {
    label: "Personalize",
    x: 205.333,
    href: null,
    color: "#29211F",
    icon: { src: `${ART}768-184.svg`, x: 35.32, y: 13.62, w: 20, h: 19 },
    text: { x: 20, w: 50 },
  },
  {
    label: "Help",
    x: 308,
    href: null,
    color: "#D18005",
    icon: { src: `${ART}768-187.svg`, x: 36, y: 13.9, w: 18, h: 18 },
    text: { x: 34.5, w: 21 },
  },
] as const;

export function TrackOrderScreen() {
  return (
    <>
      {/* 765:115 and the four section bands (765:116–765:119) are transparent
          groupings over the #FFFBF6 stage, so children sit at frame coords. */}

      {/* 766:114 · VELORIA Header (this frame's own header, not site chrome) */}
      <div style={{ ...abs(16, 8, 398, 48), overflow: "hidden" }}>
        {/* 766:115 back chevron — the glyph's ink is 6×13 inside its 10×36 box */}
        <Link href="/account" aria-label="Back to my account" style={{ ...abs(0, 6, 10, 36), display: "block" }}>
          <img
            src={`${ART}766-115.svg`}
            alt=""
            width={6}
            height={13}
            style={{ ...abs(1.56, 15.12, 6, 13), display: "block" }}
          />
        </Link>

        {/* 766:116 wordmark — 250px box centred on 205.5, not on the frame */}
        <div
          className={playfair.className}
          style={{
            ...abs(64.5, 5, 250),
            fontSize: 27,
            lineHeight: "35.99px",
            fontWeight: 600,
            color: "#09442E",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          VELORIA
        </div>

        {/* 766:117 bag glyph with its item count (static) */}
        <img
          src={`${ART}766-117.svg`}
          alt="Bag, 1 item"
          width={25}
          height={19}
          style={{ ...abs(370.2, 14.48, 25, 19), display: "block" }}
        />
      </div>

      {/* 766:118 page title */}
      <div
        className={playfair.className}
        style={{
          ...abs(16, 64, 398),
          fontSize: 29,
          lineHeight: "38.66px",
          fontWeight: 600,
          color: "#09442E",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Track Your Order
      </div>

      {/* 766:119 subtitle */}
      <div
        className={notoSC.className}
        style={{
          ...abs(16, 114, 398),
          fontSize: 13,
          lineHeight: "15.6px",
          fontWeight: 500,
          color: "#29211F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Your gift is on the way
      </div>

      {/* 766:120 route map (766:121 'Route Path Vector' shares this exact box,
          so it is flattened away). The four VECTOR nodes are design art served
          as their Figma renders; a CENTER stroke makes each export
          strokeWeight wider than its node, hence the −½w offsets. */}
      <div
        style={{
          ...abs(16, 146, 398, 324),
          background: "#E5F5F7",
          boxShadow: "inset 0 0 0 1px #D6E0E0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <img
          src={`${ART}766-122.svg`}
          alt=""
          width={399}
          height={219}
          // 766:122 — 399px wide inside a 398px box: Tailwind preflight would
          // squash it to 100%, and the map's own clip does the trimming.
          style={{ ...abs(-0.5, 11.5, 399, 219), display: "block", maxWidth: "none" }}
        />
        <img
          src={`${ART}766-123.svg`}
          alt=""
          width={294}
          height={137}
          style={{ ...abs(63.5, 96.5, 294, 137), display: "block" }}
        />
        <img
          src={`${ART}766-124.svg`}
          alt=""
          width={21}
          height={21}
          style={{ ...abs(54.5, 221.5, 21, 21), display: "block" }}
        />
        <img
          src={`${ART}766-125.svg`}
          alt=""
          width={21}
          height={21}
          style={{ ...abs(345.5, 87.5, 21, 21), display: "block" }}
        />

        {/* 766:126 / 766:127 / 766:128 state labels */}
        {[
          { t: "CALIFORNIA", x: 28, y: 258, w: 47 },
          { t: "ILLINOIS", x: 172, y: 210, w: 34 },
          { t: "NEW YORK", x: 306, y: 58, w: 41 },
        ].map((l) => (
          <div
            key={l.t}
            className={notoSC.className}
            style={{
              ...abs(l.x, l.y, l.w),
              fontSize: 8,
              lineHeight: "9.6px",
              fontWeight: 500,
              color: "#737A85",
              whiteSpace: "nowrap",
            }}
          >
            {l.t}
          </div>
        ))}

        {/* 766:130 origin marker + 766:129 glyph */}
        <div style={{ ...abs(39, 188, 52, 52), background: "#D18005", borderRadius: 26, overflow: "hidden" }}>
          <img
            src={`${ART}766-129.svg`}
            alt=""
            width={26}
            height={11}
            style={{ ...abs(14.12, 20.124, 26, 11), display: "block" }}
          />
        </div>

        {/* 766:132 destination marker + 766:131 glyph */}
        <div style={{ ...abs(330, 50, 52, 52), background: "#09442E", borderRadius: 26, overflow: "hidden" }}>
          <img
            src={`${ART}766-131.svg`}
            alt=""
            width={23}
            height={23}
            style={{ ...abs(14.56, 13.94, 23, 23), display: "block" }}
          />
        </div>
      </div>

      {/* 766:133 tracking details card. The three rows (766:134 / 766:140 /
          766:146) and their inner copy frames are transparent groupings,
          flattened into card coordinates. All values are the mock's data. */}
      <div
        style={{
          ...abs(16, 530, 398, 220),
          background: "#FFFFFF",
          boxShadow: "inset 0 0 0 1px #E0D6C9, 0 4px 14px rgba(41,33,31,0.08)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* 766:135 / 766:141 / 766:147 row glyphs (each at its own ink box) */}
        <img
          src={`${ART}766-135.svg`}
          alt=""
          width={18}
          height={18}
          style={{ ...abs(18.2, 32.84, 18, 18), display: "block" }}
        />
        <img
          src={`${ART}766-141.svg`}
          alt=""
          width={17}
          height={16}
          style={{ ...abs(16.242, 101.204, 17, 16), display: "block" }}
        />
        <img
          src={`${ART}766-147.svg`}
          alt=""
          width={21}
          height={9}
          style={{ ...abs(16.88, 171.526, 21, 9), display: "block" }}
        />

        {/* 766:137/138, 766:143/144, 766:149/150 — label + value pairs. The
            middle row starts at x=43, not 48, exactly as the design does. */}
        {[
          { label: "ORDER NUMBER", labelW: 71, value: "#VL20250821", x: 48, y: 15, valueW: 300 },
          { label: "TRACKING NUMBER", labelW: 85, value: "1Z84W3E60390566070", x: 43, y: 82, valueW: 300 },
          { label: "CARRIER", labelW: 38, value: "UPS", x: 48, y: 149, valueW: 226 },
        ].map((row) => (
          <div key={row.label}>
            <div
              className={notoSC.className}
              style={{
                ...abs(row.x, row.y, row.labelW),
                fontSize: 9,
                lineHeight: "10.8px",
                fontWeight: 500,
                color: "#6B6E75",
                whiteSpace: "nowrap",
              }}
            >
              {row.label}
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(row.x, row.y + 13, row.valueW),
                fontSize: 13,
                lineHeight: "15.6px",
                fontWeight: 500,
                color: "#29211F",
                whiteSpace: "nowrap",
              }}
            >
              {row.value}
            </div>
          </div>
        ))}

        {/* 766:139 / 766:145 hairline separators */}
        <div style={{ ...abs(16, 74, 366, 1), background: "#E0D6C9" }} />
        <div style={{ ...abs(16, 141, 366, 1), background: "#E0D6C9" }} />

        {/* 766:151 'VIEW ON UPS →' — static, no carrier deep link yet */}
        <img
          src={`${ART}766-151.svg`}
          alt="View on UPS"
          width={78}
          height={8}
          style={{ ...abs(283.98, 171.5, 78, 8), display: "block" }}
        />
      </div>

      {/* 768:111 delivery-timeline card */}
      <div
        style={{
          ...abs(16, 772, 398, 666),
          background: "#FFFFFF",
          boxShadow: "inset 0 0 0 1px #E0D6C9",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* 768:112 */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 16, 169),
            fontSize: 21,
            lineHeight: "27.99px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          Delivery Timeline
        </div>

        {TIMELINE.map((step, i) => (
          <div key={step.title} style={{ ...abs(16, 46 + 94 * i, 366, 92), overflow: "hidden" }}>
            {/* Rail marker (768:115 …) */}
            <div
              style={{
                ...abs(3, 0, 24, 24),
                background: MARKER_FILL[step.state],
                borderRadius: 12,
                overflow: "hidden",
              }}
            />
            {step.state === "done" ? (
              <img
                src={`${ART}768-116.svg`}
                alt=""
                width={8}
                height={9}
                style={{ ...abs(10.033, 5.519, 8, 9), display: "block" }}
              />
            ) : null}
            {step.state === "current" ? (
              <img
                src={`${ART}768-152.svg`}
                alt=""
                width={3}
                height={3}
                style={{ ...abs(14.224, 8.544, 3, 3), display: "block" }}
              />
            ) : null}
            {/* The last row's marker holds an empty TEXT node (768:161, width
                0), so it renders no glyph — and it has no rail below it. */}
            {step.state === "pending" ? null : (
              <div
                style={{
                  ...abs(14, 24, 2, 68),
                  background: step.state === "current" ? "#C7C9C9" : "#09442E",
                }}
              />
            )}

            {/* 768:119/120/121 … timeline copy */}
            <div
              className={notoSC.className}
              style={{
                ...abs(40, 1, step.titleW),
                fontSize: 13,
                lineHeight: "15.6px",
                fontWeight: 500,
                color: step.state === "pending" ? "#29211F" : "#09442E",
                whiteSpace: "nowrap",
              }}
            >
              {step.title}
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(40, 20, step.metaW),
                fontSize: 10,
                lineHeight: "12px",
                fontWeight: 400,
                color: "#6B6E75",
                whiteSpace: "nowrap",
              }}
            >
              {step.meta}
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(40, 35, 326),
                fontSize: 10,
                lineHeight: "12px",
                fontWeight: 400,
                color: "#29211F",
              }}
            >
              {step.body}
            </div>
          </div>
        ))}
      </div>

      {/* 768:166 latest shipping update */}
      <div
        style={{
          ...abs(16, 1462, 398, 102),
          background: "#FAF5ED",
          boxShadow: "inset 0 0 0 1px #E0D6C9",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          className={notoSC.className}
          style={{
            ...abs(14, 12, 113),
            fontSize: 9,
            lineHeight: "10.8px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          LATEST SHIPPING UPDATE
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(14, 27, 125),
            fontSize: 17,
            lineHeight: "22.66px",
            fontWeight: 500,
            color: "#29211F",
            whiteSpace: "nowrap",
          }}
        >
          May 16 · 8:46 AM
        </div>
        {/* 768:169 — wraps inside its 370px box, as the design does */}
        <div
          className={notoSC.className}
          style={{
            ...abs(14, 54, 370),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 400,
            color: "#29211F",
          }}
        >
          Your parcel left the UPS facility in Chicago and is traveling to the next stop.
        </div>
      </div>

      {/* 768:170 need help (768:172 'Help Copy' flattened) */}
      <div
        style={{
          ...abs(16, 1574, 398, 78),
          background: "#FFFFFF",
          boxShadow: "inset 0 0 0 1px #E0D6C9",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <img
          src={`${ART}768-171.svg`}
          alt=""
          width={24}
          height={24}
          style={{ ...abs(15.3, 27.92, 24, 24), display: "block" }}
        />
        <div
          className={playfair.className}
          style={{
            ...abs(52, 13, 85),
            fontSize: 17,
            lineHeight: "22.66px",
            fontWeight: 500,
            color: "#29211F",
            whiteSpace: "nowrap",
          }}
        >
          Need help?
        </div>
        <div
          className={notoSC.className}
          style={{
            ...abs(52, 38, 182),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 400,
            color: "#29211F",
            whiteSpace: "nowrap",
          }}
        >
          Our customer care team is always here.
        </div>
        {/* 768:175 'CONTACT SUPPORT →' — static per the design brief */}
        <img
          src={`${ART}768-175.svg`}
          alt="Contact support"
          width={97}
          height={7}
          style={{ ...abs(52.504, 54.25, 97, 7), display: "block" }}
        />
      </div>

      {/* 768:176 the frame's own bottom navigation (the route opts out of the
          shared site tab bar). Only Shop has a destination today. */}
      <div style={{ ...abs(16, 1662, 398, 88), overflow: "hidden" }}>
        {NAV.map((tab) => {
          const { href } = tab;
          const inner = (
            <>
              <img
                src={tab.icon.src}
                alt=""
                width={tab.icon.w}
                height={tab.icon.h}
                style={{ ...abs(tab.icon.x, tab.icon.y, tab.icon.w, tab.icon.h), display: "block" }}
              />
              <div
                className={notoSC.className}
                style={{
                  ...abs(tab.text.x, 36.5, tab.text.w),
                  fontSize: 9,
                  lineHeight: "10.8px",
                  fontWeight: 500,
                  color: tab.color,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </div>
            </>
          );
          return href ? (
            <Link
              key={tab.label}
              href={href}
              style={{ ...abs(tab.x, 15, 90, 58), display: "block", overflow: "hidden" }}
            >
              {inner}
            </Link>
          ) : (
            <div key={tab.label} style={{ ...abs(tab.x, 15, 90, 58), overflow: "hidden" }}>
              {inner}
            </div>
          );
        })}
      </div>
    </>
  );
}
