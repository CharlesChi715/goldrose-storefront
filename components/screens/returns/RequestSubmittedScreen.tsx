/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns/request-submitted — pixel-exact implementation of
 * "/account/returns/request-submitted · submitted" (2030:185, AFTER-SALES
 * batch, imported 2026-08-02). Replaces the AI-007 coming-soon scaffold.
 * Every value is the design's mock — request, photos, dates, amounts; no
 * returns backend, so nothing here reflects a real submission.
 *
 * Wired: Track Status → /account/returns?tab=status (the flow's status
 * tab); Back to Orders → /account/orders — the prototype pointed this
 * button at the returns START page (2030:189), but the label wins (hand-off
 * note). The big ✓ / ⓘ / ◷ marks are Figma's own SVG exports; the smaller
 * ◇▤▣▰✓ prefixes shipped no exports and stay text glyphs (browser font
 * fallback, the established gotcha).
 *
 * See /agent-delivery/sessions/figma-sync-08-02-feat-figma-sync.md.
 */

import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import {
  card,
  LineGlyph,
  PAGE_BG,
  ReturnsHeader,
} from "@/components/screens/returns/returns-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";
const TITLE_INK = "#171311";
const LABEL_INK = "#241F1A";
const VALUE_GREY = "#3D3630";
const BUTTON_INK = "#271F1B";

export function RequestSubmittedScreen() {
  return (
    <ScaleFrame
      height={950}
      background={PAGE_BG}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2024:330 Brand Navigation (instance at y+1) */}
      <ReturnsHeader dy={1} backFallback="/account/returns" />

      {/* 2045:183/184 title + subtitle */}
      <div
        className={playfair.className}
        style={{
          ...abs(20, 83, 390),
          ...txt(29, 38.7, TITLE_INK, "center"),
          fontWeight: 600,
        }}
      >
        Request Submitted
      </div>
      <div
        style={{ ...abs(18, 122, 394), ...txt(12, 14.4, "#2E2926", "center") }}
      >
        We received your request and we’re reviewing it now.
      </div>

      {/* 2045:185…188 received banner */}
      <div
        style={{
          ...abs(16, 151, 398, 64),
          background: "#F5FAF0",
          boxShadow: "inset 0 0 0 1px #C7D7BC",
          borderRadius: 12,
        }}
      />
      <LineGlyph
        src="2045-186"
        x={32}
        y={163}
        w={40}
        lh={33.6}
        ink={[20, 23]}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(82, 161, 300),
          ...txt(15, 20, "#1F1A17"),
          fontWeight: 600,
        }}
      >
        Request received
      </div>
      <div style={{ ...abs(82, 185, 310), ...txt(10, 12, VALUE_GREY) }}>
        Submitted on Jul 27, 2026 · 10:58 AM
      </div>

      {/* 2045:189…203 details card */}
      <div style={card(16, 228, 398, 348)} />
      <img
        src={`${A}/2045-190.png`}
        alt=""
        width={116}
        height={90}
        style={{
          ...abs(28, 240, 116, 90),
          borderRadius: 10,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(158, 240, 240, 40),
          ...txt(15, 20, TITLE_INK),
          fontWeight: 600,
          whiteSpace: "normal",
        }}
      >
        24K Gold-Plated Rose · Golden Memory
      </div>
      <div style={{ ...abs(158, 272, 230), ...txt(10, 12, "#423B36") }}>
        Order #GR202506150311
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(158, 297, 120),
          ...txt(18, 24, "#14120F"),
          fontWeight: 600,
        }}
      >
        $99.00
      </div>
      <div style={{ ...abs(28, 340, 374, 1), background: "#EBE0D1" }} />
      <div
        className={playfair.className}
        style={{
          ...abs(30, 354, 180),
          ...txt(13, 17.3, LABEL_INK),
          fontWeight: 600,
        }}
      >
        {"◇  Return reason"}
      </div>
      <div style={{ ...abs(70, 376, 300), ...txt(10, 12, VALUE_GREY) }}>
        Item arrived damaged
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(30, 404, 180),
          ...txt(13, 17.3, LABEL_INK),
          fontWeight: 600,
        }}
      >
        {"▤  Issue details"}
      </div>
      <div style={{ ...abs(70, 426, 320), ...txt(10, 12, VALUE_GREY) }}>
        The rose head arrived bent and the outer box was dented.
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(30, 456, 220),
          ...txt(13, 17.3, LABEL_INK),
          fontWeight: 600,
        }}
      >
        {"▣  Attached photos"}
      </div>
      {(["2045-200", "2045-201", "2045-202"] as const).map((photo, i) => (
        <img
          key={photo}
          src={`${A}/${photo}.png`}
          alt=""
          width={86}
          height={62}
          style={{
            ...abs(70 + i * 98, 479, 86, 62),
            borderRadius: 8,
            objectFit: "cover",
            display: "block",
          }}
        />
      ))}
      <div
        className={playfair.className}
        style={{
          ...abs(30, 549, 360),
          ...txt(13, 17.3, LABEL_INK),
          fontWeight: 600,
        }}
      >
        {"▰  Estimated refund amount     $99.00"}
      </div>

      {/* 2045:204…206 review-first note */}
      <div
        style={{
          ...abs(16, 590, 398, 74),
          background: "#FFF9F1",
          boxShadow: "inset 0 0 0 1px #E8DED0",
          borderRadius: 12,
        }}
      />
      <LineGlyph
        src="2045-205"
        x={32}
        y={610}
        w={38}
        lh={28.8}
        ink={[23, 23]}
      />
      <div
        style={{
          ...abs(78, 604, 314),
          ...txt(10, 18, "#38332E"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "Your request will be reviewed first. Do not ship the item\nuntil you receive approval and return instructions."
        }
      </div>

      {/* 2045:207…209 review timing */}
      <div
        style={{
          ...abs(16, 676, 398, 52),
          background: "#FFFEFC",
          boxShadow: "inset 0 0 0 1px #E8DED0",
          borderRadius: 12,
        }}
      />
      <LineGlyph
        src="2045-208"
        x={32}
        y={687}
        w={38}
        lh={26.4}
        ink={[14, 14]}
      />
      <div style={{ ...abs(78, 691, 312), ...txt(10, 12, "#38332E") }}>
        Most requests are reviewed within 1–2 business days.
      </div>

      {/* 2045:210…212 what happens next */}
      <div
        style={{
          ...abs(16, 740, 398, 104),
          background: "#FFFEFC",
          boxShadow: "inset 0 0 0 1px #E8DED0",
          borderRadius: 12,
        }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(32, 750, 350),
          ...txt(16, 21.3, "#1A1412"),
          fontWeight: 600,
        }}
      >
        What happens next
      </div>
      <div
        style={{
          ...abs(32, 778, 352),
          ...txt(10, 19, "#38332E"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "✓  We’ll email you when the review is complete.\n✓  If approved, we’ll send return instructions.\n✓  Refund processing begins after inspection."
        }
      </div>

      {/* 2045:213 Track Status → the status tab */}
      <Link
        href="/account/returns?tab=status"
        style={{
          ...abs(16, 856, 398, 36),
          background: BUTTON_INK,
          borderRadius: 8,
          display: "block",
        }}
      >
        <span
          className={playfair.className}
          style={{
            ...abs(0, 7, 398),
            ...txt(14, 18.7, "#FFF8F0", "center"),
            fontWeight: 500,
            display: "block",
          }}
        >
          Track Status
        </span>
      </Link>
      {/* 2045:215 Back to Orders — label wins over the prototype's link to
          the returns start page (divergence noted in the hand-off) */}
      <Link
        href="/account/orders"
        style={{
          ...abs(16, 900, 398, 36),
          background: "#FFF8F0",
          boxShadow: "inset 0 0 0 1px #826C5A",
          borderRadius: 8,
          display: "block",
        }}
      >
        <span
          className={playfair.className}
          style={{
            ...abs(0, 7, 398),
            ...txt(14, 18.7, "#251E1A", "center"),
            fontWeight: 500,
            display: "block",
          }}
        >
          Back to Orders
        </span>
      </Link>
    </ScaleFrame>
  );
}
