/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns/refund-issued — pixel-exact implementation of
 * "/account/returns/refund-issued · completed" (2030:182, AFTER-SALES
 * batch, imported 2026-08-02). All data is the design's mock — amount,
 * card, dates; no returns backend.
 *
 * NOTE this frame draws NO Brand Navigation header — it opens directly
 * with the title (verbatim from the render; the rest of the flow carries
 * the header). Buy Again → /shop (prototype-confirmed). The success badge
 * and the ◇▣□◷ⓘ row marks are Figma's own SVG exports.
 */

import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import {
  LineGlyph,
  PAGE_BG,
} from "@/components/screens/returns/returns-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";
const VALUE_INK = "#14120F";
const LABEL_INK = "#1F1A17";

/** 2037:188…202 — the four refund detail rows (icon / label / value). */
const ROWS = [
  {
    icon: "2037-188",
    ink: [18, 18],
    label: "Refund amount",
    value: "$99.00",
    y: 441,
  },
  {
    icon: "2037-192",
    ink: [15, 15],
    label: "Refunded to",
    value: "Visa ending in 2048",
    y: 498,
  },
  {
    icon: "2037-196",
    ink: [15, 15],
    label: "Issued on",
    value: "Sep 03, 2026",
    y: 555,
  },
  {
    icon: "2037-200",
    ink: [12, 12],
    label: "Bank posting time",
    value: "3–10 business days",
    y: 612,
  },
] as const;

export function RefundIssuedScreen() {
  return (
    <ScaleFrame
      height={932}
      background={PAGE_BG}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2036:183/184 title + subtitle — no header on this frame */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 91, 382),
          ...txt(32, 42.7, "#141211", "center"),
          fontWeight: 600,
        }}
      >
        Refund Issued
      </div>
      <div
        style={{ ...abs(24, 137, 382), ...txt(14, 16.8, "#24211F", "center") }}
      >
        Your after-sales request has been completed.
      </div>

      {/* 2036:185…189 completed banner */}
      <div
        style={{
          ...abs(16, 174, 398, 82),
          background: "#F6FBF4",
          boxShadow: "inset 0 0 0 1px #C7DBBA",
          borderRadius: 16,
        }}
      />
      <img
        src={`${A}/2036-186.svg`}
        alt=""
        width={42}
        height={42}
        style={{ ...abs(42, 194, 42, 42), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(104, 203, 295),
          ...txt(16, 21.3, "#1A1A17"),
          fontWeight: 600,
        }}
      >
        Refund sent to original payment method
      </div>

      {/* 2037:183…202 details card — the flow's one card with a drop
          shadow (0,5 r16 #291C12 @ 8%) on top of the inside-stroke */}
      <div
        style={{
          ...abs(16, 270, 398, 414),
          background: "#FFFEFB",
          boxShadow: "inset 0 0 0 1px #E8DBC9, 0 5px 16px rgba(41,28,18,0.08)",
          borderRadius: 16,
        }}
      />
      <img
        src={`${A}/2037-184.png`}
        alt=""
        width={112}
        height={126}
        style={{
          ...abs(30, 284, 112, 126),
          borderRadius: 12,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(158, 300, 242),
          ...txt(16, 21.3, VALUE_INK),
          fontWeight: 600,
          whiteSpace: "normal",
        }}
      >
        24K Gold-Plated Rose · Golden Memory
      </div>
      <div style={{ ...abs(158, 348, 240), ...txt(12, 14.4, "#45403B") }}>
        Order #GR202506150311
      </div>
      <div style={{ ...abs(30, 424, 370, 1), background: "#E8DBC9" }} />
      {ROWS.map((row, i) => (
        <div key={row.label}>
          <LineGlyph
            src={row.icon}
            x={36}
            y={row.y}
            w={28}
            lh={21.6}
            ink={[row.ink[0], row.ink[1]]}
          />
          <div
            className={playfair.className}
            style={{
              ...abs(74, row.y + 1, 150),
              ...txt(14, 18.7, LABEL_INK),
              fontWeight: 500,
            }}
          >
            {row.label}
          </div>
          <div
            className={playfair.className}
            style={{
              ...abs(223, row.y + 1, 166),
              ...txt(14, 18.7, VALUE_INK, "right"),
              fontWeight: 500,
            }}
          >
            {row.value}
          </div>
          {i < ROWS.length - 1 ? (
            <div
              style={{ ...abs(74, row.y + 40, 326, 1), background: "#EDE3D4" }}
            />
          ) : null}
        </div>
      ))}

      {/* 2037:203…205 didn't-arrive note */}
      <div
        style={{
          ...abs(16, 704, 398, 78),
          background: "#FFFBF5",
          boxShadow: "inset 0 0 0 1px #EDE0CC",
          borderRadius: 16,
        }}
      />
      <LineGlyph
        src="2037-204"
        x={36}
        y={726}
        w={24}
        lh={28.8}
        ink={[23, 23]}
        align="left"
      />
      <div
        className={playfair.className}
        style={{
          ...abs(78, 722, 320, 40),
          ...txt(13, 20, LABEL_INK),
          fontWeight: 500,
          whiteSpace: "pre-line",
        }}
      >
        {
          "If you do not see the funds after the estimated time,\nplease contact support."
        }
      </div>

      {/* 2037:206 Buy Again → /shop (prototype-confirmed) */}
      <Link
        href="/shop"
        style={{
          ...abs(16, 806, 398, 58),
          background: "#261F1A",
          borderRadius: 14,
          display: "block",
        }}
      >
        <span
          className={playfair.className}
          style={{
            ...abs(0, 14, 398),
            ...txt(21, 28, "#FFFBF5", "center"),
            fontWeight: 500,
            display: "block",
          }}
        >
          Buy Again
        </span>
      </Link>
    </ScaleFrame>
  );
}
