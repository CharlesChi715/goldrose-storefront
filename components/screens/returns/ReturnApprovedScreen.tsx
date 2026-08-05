/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns/approved — pixel-exact implementation of
 * "/account/returns/approved · approved" (2030:184, AFTER-SALES batch,
 * imported 2026-08-02). All data is the design's mock — RA number, QR,
 * tracking number, dates; no returns backend.
 *
 * Inert by design: Download Label (no backend, nothing to generate) and
 * Track Package → (return-shipment tracking has no page — /orders/track is
 * the OUTBOUND order timeline, not a return leg; left unwired rather than
 * pointed somewhere wrong). The Return Progress stepper builds from sheet
 * geometry: Request/Approved/Label done-green, Package/Refund/Complete
 * pending-grey. The ✓/• step marks and the QR are Figma's own SVG exports;
 * the ▣◇□⊘↓ text prefixes shipped no exports and stay text glyphs.
 */

import { ScaleFrame } from "@/components/chrome";
import {
  card,
  LineGlyph,
  PAGE_BG,
  ReturnsHeader,
} from "@/components/screens/returns/returns-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/eldreve/screens";
const TITLE_INK = "#171311";
const HEADING_INK = "#1A1412";
const BODY_GREY = "#3D3833";
const BUTTON_INK = "#271F1B";
const TRACK_BLUE = "#0540D9";

/** 2044:197…219 — the six steps; the first three are done (green). */
const STEPS = [
  { x: 50, label: "Request", done: true },
  { x: 113, label: "Approved", done: true },
  { x: 176, label: "Label", done: true },
  { x: 239, label: "Package", done: false },
  { x: 302, label: "Refund", done: false },
  { x: 365, label: "Complete", done: false },
] as const;

/** 2044:200…216 — connector lines; green while both ends are done. */
const LINES = [
  { x: 74, green: true },
  { x: 137, green: true },
  { x: 200, green: false },
  { x: 263, green: false },
  { x: 326, green: false },
] as const;

export function ReturnApprovedScreen() {
  return (
    <ScaleFrame
      height={932}
      background={PAGE_BG}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2024:325 Brand Navigation (instance at y+2); the frame's back
          arrow prototype-navigates to the returns start page */}
      <ReturnsHeader dy={2} backFallback="/account/returns" />

      {/* 2044:183/184 title + subtitle */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 84, 382),
          ...txt(30, 40, TITLE_INK, "center"),
          fontWeight: 600,
        }}
      >
        Return Approved
      </div>
      <div
        style={{ ...abs(20, 125, 390), ...txt(12, 14.4, "#302B26", "center") }}
      >
        Your request was approved. Ship the item back within 14 days.
      </div>

      {/* 2044:185…188 approved banner */}
      <div
        style={{
          ...abs(24, 154, 382, 66),
          background: "#F3FAF1",
          boxShadow: "inset 0 0 0 1px #95BE94",
          borderRadius: 12,
        }}
      />
      <LineGlyph src="2044-186" x={42} y={164} w={42} lh={36} ink={[22, 24]} />
      <div
        className={playfair.className}
        style={{
          ...abs(100, 166, 280),
          ...txt(15, 20, "#086E1F"),
          fontWeight: 600,
        }}
      >
        Return Approved
      </div>
      <div style={{ ...abs(100, 190, 280), ...txt(11, 13.2, "#332E29") }}>
        Return Authorization: RA-20260821
      </div>

      {/* 2044:189…194 product card */}
      <div style={card(24, 234, 382, 118)} />
      <img
        src={`${A}/2044-190.png`}
        alt=""
        width={100}
        height={94}
        style={{
          ...abs(36, 246, 100, 94),
          borderRadius: 10,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(150, 247, 242, 40),
          ...txt(15, 20, TITLE_INK),
          fontWeight: 600,
          whiteSpace: "normal",
        }}
      >
        24K Gold-Plated Rose · Golden Memory
      </div>
      <div style={{ ...abs(150, 282, 230), ...txt(10, 12, "#453D38") }}>
        Order #GR202506150311
      </div>
      <div style={{ ...abs(150, 305, 200), ...txt(10, 12, "#C76E03") }}>
        Estimated refund amount
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(150, 322, 180),
          ...txt(18, 24, "#14120F"),
          fontWeight: 600,
        }}
      >
        $99.00
      </div>

      {/* 2044:195…219 Return Progress stepper */}
      <div style={card(24, 366, 382, 106)} />
      <div
        className={playfair.className}
        style={{
          ...abs(38, 376, 340),
          ...txt(16, 21.3, HEADING_INK),
          fontWeight: 600,
        }}
      >
        Return Progress
      </div>
      {LINES.map((line) => (
        <div
          key={line.x}
          style={{
            ...abs(line.x, 419, 39, 2),
            background: line.green ? "#62D678" : "#DAD9D6",
          }}
        />
      ))}
      {STEPS.map((step) => (
        <div key={step.label}>
          <div
            style={{
              ...abs(step.x, 408, 24, 24),
              background: step.done ? "#EAF8EB" : "#EEEEEC",
              boxShadow: `inset 0 0 0 1px ${step.done ? "#4CCC66" : "#D5D4D0"}`,
              borderRadius: 12,
            }}
          />
          <LineGlyph
            src={step.done ? "2044-198" : "2044-210"}
            x={step.x}
            y={409}
            w={24}
            lh={16.8}
            ink={step.done ? [10, 12] : [4, 4]}
          />
          <div
            style={{
              ...abs(step.x - 10, 438, 44),
              ...txt(8, 9.6, BODY_GREY, "center"),
            }}
          >
            {step.label}
          </div>
        </div>
      ))}

      {/* 2044:220…231 shipping label + QR + tracking panel */}
      <div style={card(24, 486, 382, 246)} />
      <div
        className={playfair.className}
        style={{
          ...abs(38, 496, 340),
          ...txt(17, 22.7, HEADING_INK),
          fontWeight: 600,
        }}
      >
        Your Shipping Label
      </div>
      <div style={{ ...abs(38, 521, 350), ...txt(10, 12, BODY_GREY) }}>
        Print this label or show the QR code at any USPS location.
      </div>
      <img
        src={`${A}/2044-223.svg`}
        alt="Return shipping label QR code"
        width={96}
        height={96}
        style={{ ...abs(167, 542, 96, 96), display: "block" }}
      />
      <div
        style={{
          ...abs(40, 648, 350, 72),
          background: "#F2F6FF",
          boxShadow: "inset 0 0 0 1px #C9D8FA",
          borderRadius: 10,
        }}
      />
      {/* 2044:229 is one text node; its 25-space gap rides alternating
          NBSPs so HTML cannot collapse it */}
      <div
        style={{
          ...abs(50, 656, 330),
          ...txt(10, 12, "#1F2938"),
          fontWeight: 500,
        }}
      >
        {"▣  Package Tracking" + "  ".repeat(12) + " Label Created"}
      </div>
      <div
        style={{
          ...abs(52, 678, 220),
          ...txt(9, 15, TRACK_BLUE),
          whiteSpace: "pre-line",
        }}
      >
        {"Tracking Number\n9434636106023325465613"}
      </div>
      {/* Track Package → stays inert: return-shipment tracking has no page
          (only the outbound /orders/track exists), so there is nowhere
          honest to send it yet */}
      <div
        style={{
          ...abs(280, 690, 96),
          ...txt(9, 10.8, TRACK_BLUE, "right"),
          fontWeight: 500,
        }}
      >
        {"Track Package  →"}
      </div>

      {/* 2044:232…234 before you ship */}
      <div style={card(24, 744, 382, 76)} />
      <div
        className={playfair.className}
        style={{
          ...abs(38, 752, 340),
          ...txt(15, 20, HEADING_INK),
          fontWeight: 600,
        }}
      >
        Before you ship
      </div>
      <div
        style={{
          ...abs(38, 776, 352),
          ...txt(9, 17, "#38332E"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "◇  Pack the item securely     □  Use the original gift box\n⊘  Do not place the label on the gift box     ▣  Ship by Aug 29, 2026"
        }
      </div>

      {/* 2044:235 Download Label — inert: no backend, no label to serve */}
      <div
        style={{
          ...abs(24, 832, 382, 44),
          background: BUTTON_INK,
          borderRadius: 9,
        }}
      >
        <span
          className={playfair.className}
          style={{
            ...abs(0, 10, 382),
            ...txt(16, 21.3, "#FFF8F0", "center"),
            fontWeight: 500,
            display: "block",
          }}
        >
          {"↓  Download Label"}
        </span>
      </div>
    </ScaleFrame>
  );
}
