/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-7 · "MORI Gift Finder" of the VELORIA homepage redesign
 * (Figma frame 138:63, [0,4606 430x730]): hero title + MORI illustration,
 * static who/occasion criteria chips, the "See MORI's Picks" placeholder
 * button, the "Browse All Gifts" link, and the MORI recommendation card.
 * All coordinates/colors/fonts are verbatim from the Figma REST data.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, goudy, notoSC } from "@/lib/fonts";

/* ---------- Criteria chips (static, non-interactive) ---------- */

type ChipSpec = {
  x: number; // chip left, module-relative
  y: number; // chip top, module-relative
  w: number; // chip width (h is always 28)
  label: string;
  labelX: number; // label left, chip-relative
  labelW: number;
  selected?: boolean; // pink/gold "Wife" state baked into the design
};

const CHIPS: ChipSpec[] = [
  // Step one · WHO IS THIS GIFT FOR?
  { x: 224, y: 222, w: 82, label: "Wife", labelX: 29.5, labelW: 23, selected: true },
  { x: 314, y: 222, w: 82, label: "Girlfriend", labelX: 16.5, labelW: 49 },
  { x: 224, y: 256, w: 82, label: "Mother", labelX: 22.5, labelW: 37 },
  { x: 314, y: 256, w: 82, label: "Friend", labelX: 24.5, labelW: 33 },
  { x: 224, y: 290, w: 172, label: "Couple", labelX: 67.5, labelW: 37 },
  // Step two · WHAT ARE YOU CELEBRATING?
  { x: 224, y: 356, w: 82, label: "Anniversary", labelX: 10.5, labelW: 61 },
  { x: 314, y: 356, w: 82, label: "Birthday", labelX: 18.5, labelW: 45 },
  { x: 224, y: 390, w: 82, label: "Wedding", labelX: 18, labelW: 46 },
  { x: 314, y: 390, w: 82, label: "Valentine's Day", labelX: 1.5, labelW: 79 },
  { x: 224, y: 424, w: 82, label: "Mother's Day", labelX: 7.5, labelW: 67 },
  { x: 314, y: 424, w: 82, label: "Congratulations", labelX: -0.5, labelW: 83 },
  { x: 224, y: 458, w: 172, label: "Just Because", labelX: 52.5, labelW: 67 },
];

function Chip({ c }: { c: ChipSpec }) {
  return (
    <div
      style={{
        ...abs(c.x, c.y, c.w, 28),
        background: c.selected ? "#F3C6D1" : "#FFF6EC",
        boxShadow: `inset 0 0 0 1px ${c.selected ? "#D4AF37" : "#E5D9C9"}`,
        borderRadius: 999,
      }}
    >
      <div
        className={notoSC.className}
        style={{
          ...abs(c.labelX, 7.5, c.labelW),
          fontSize: 11,
          lineHeight: "13.2px",
          fontWeight: 400,
          color: "#3B2F2F",
          whiteSpace: "nowrap",
        }}
      >
        {c.label}
      </div>
    </div>
  );
}

const stepLabel: React.CSSProperties = {
  fontSize: 9,
  lineHeight: "10.8px",
  fontWeight: 500,
  color: "#D4AF37",
  whiteSpace: "nowrap",
};

const buttonLabel: React.CSSProperties = {
  fontSize: 14,
  lineHeight: "20.83px",
  letterSpacing: 1.1,
  whiteSpace: "nowrap",
};

/* ---------- A-7 module ---------- */

export function A7() {
  return (
    <div style={{ ...abs(0, 4606, 430, 730), background: "#FFF6EC", overflow: "hidden" }}>
      {/* MORI Finder Hero (163:114) */}
      <div style={{ ...abs(0, 0, 430, 522), background: "#FFF6EC" }} />
      <img
        src="/veloria/home/424-150.svg"
        alt=""
        width={142}
        height={34}
        style={{ ...abs(144, 10, 142, 34), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(36, 49, 358),
          fontSize: 34,
          lineHeight: "30px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "pre-line",
        }}
      >
        {"Find the Right\nRose Gift with MORI"}
      </div>
      <img
        src="/veloria/home/436-337.svg"
        alt=""
        style={{ ...abs(185.926, 124, 58.149, 13.923), display: "block" }}
      />
      <div
        className={goudy.className}
        style={{
          ...abs(50, 149.92, 330),
          fontSize: 11,
          lineHeight: "17px",
          color: "#3B2F2F",
          textAlign: "center",
        }}
      >
        {"Tell MORI who the gift is for and what you're celebrating, and we'll help you find the best match."}
      </div>
      {/* Illustration bleeds 10px past the left edge; the module frame clips it.
          Figma fill blendMode DARKEN keys out the art's opaque near-white
          background — without it the box covers the section behind it. */}
      <img
        src="/veloria/home/420-262.png"
        data-blend
        alt="MORI, the GoldRose gift-finder companion"
        width={246}
        height={246}
        style={{
          ...abs(-10, 210, 246, 246),
          objectFit: "cover",
          display: "block",
          mixBlendMode: "darken",
        }}
      />

      {/* Steps + criteria chips (static; a hidden step-three label in the design is omitted) */}
      <div className={notoSC.className} style={{ ...abs(224, 198, 188), ...stepLabel }}>
        WHO IS THIS GIFT FOR?
      </div>
      <div className={notoSC.className} style={{ ...abs(224, 332, 188), ...stepLabel }}>
        WHAT ARE YOU CELEBRATING?
      </div>
      {CHIPS.map((c) => (
        <Chip key={c.label} c={c} />
      ))}

      {/* Button · Reveal My Gift Match (163:147) — placeholder, not clickable */}
      <div style={{ ...abs(24, 506, 382, 44), background: "#3B2F2F", borderRadius: 10 }}>
        <div className={goudy.className} style={{ ...abs(116, 11.5, 123), ...buttonLabel, color: "#FFF6EC" }}>
          {"See MORI's Picks"}
        </div>
        <img src="/veloria/home/465-156.svg" alt="→" style={{ ...abs(251, 13, 15, 18), display: "block" }} />
      </div>

      {/* Button · Browse All Gifts (163:150) */}
      <Link
        href="/shop"
        style={{
          ...abs(24, 558, 382, 44),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 10,
        }}
      >
        <div className={goudy.className} style={{ ...abs(119.5, 11.5, 116), ...buttonLabel, color: "#3B2F2F" }}>
          Browse All Gifts
        </div>
        <img src="/veloria/home/465-156.svg" alt="→" style={{ ...abs(247.5, 13, 15, 18), display: "block" }} />
      </Link>

      {/* MORI Recommendation Card (452:149) */}
      <div
        style={{
          ...abs(24, 610, 382, 108),
          background: "#FFF9F1",
          borderRadius: 16,
          boxShadow: "inset 0 0 0 1px rgba(231, 210, 188, 0.9), 0 4px 12px rgba(59, 47, 47, 0.08)",
          overflow: "hidden",
        }}
      >
        <img
          src="/veloria/home/452-150.png"
          alt="Recommended gold-dipped rose gift"
          width={146}
          height={108}
          style={{ ...abs(0, 0, 146, 108), objectFit: "cover", display: "block" }}
        />
        <div style={{ ...abs(158, 0, 214, 108), overflow: "hidden" }}>
          <div
            className={playfair.className}
            style={{
              ...abs(0, 16.54, 214),
              fontSize: 14,
              lineHeight: "18px",
              fontWeight: 500,
              color: "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            Thoughtful picks, just for you.
          </div>
          <div
            className={goudy.className}
            style={{ ...abs(0, 38.54, 214), fontSize: 10, lineHeight: "13px", color: "#3B2F2F" }}
          >
            MORI combines the timeless beauty of real roses with your story to recommend gifts that
            speak from the heart.
          </div>
          <img
            src="/veloria/home/452-154.svg"
            alt=""
            style={{ ...abs(0, 81.54, 58.149, 13.923), display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
