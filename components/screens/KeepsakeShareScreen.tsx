/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/keepsake — pixel-exact implementation of the 07-29
 * "shoppage-Product Details_Checkout Share Card" frame (1523:1432).
 * Geometry, colors, fonts and copy verbatim from the Figma REST data;
 * ornamental glyphs are Figma's own SVG exports; the product photo, brand
 * strip and card monogram are the mock's own renders. The frame draws no
 * back arrow and no bottom nav band — only the brand strip up top (flagged
 * in the 07-29 findings, the screen has no navigation affordance).
 *
 * Visual placeholder end to end: the milestone ("The 4th recipient"),
 * recipient, total, date and masked order number are the mock's own
 * strings — generating a real keepsake card needs order data plus an
 * image-render/share backend (tracked follow-up), and the four share
 * buttons stay inert until then.
 */

import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  GOLD,
  INK,
  SHADOW,
  sCard, GoldRoseWordmark } from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

// 1523:1444…1449 — the three detail rows (glyph, ink, text).
const DETAILS: Array<{ glyph: string; ink: [number, number]; text: string }> = [
  { glyph: "1523-1444", ink: [8, 10], text: "For: Jessica C." },
  { glyph: "1523-1446", ink: [10, 10], text: "Total: $227.00" },
  { glyph: "1523-1448", ink: [10, 10], text: "Purchased on: Aug 21, 2026" },
];

// 1523:1455…1466 — the share row (glyph or literal, label). Inert.
const SHARE: Array<{ x: number; glyph?: string; ink?: [number, number]; literal?: string; label: string }> = [
  { x: 48, glyph: "1523-1456", ink: [18, 18], label: "Messages" },
  { x: 140, glyph: "1523-1459", ink: [18, 18], label: "Social" },
  { x: 232, literal: "f", label: "Post" },
  { x: 324, glyph: "1523-1465", ink: [10, 19], label: "Save image" },
];

export function KeepsakeShareScreen() {
  return (
    <ScaleFrame height={932} background="#FFFFFF" fontClass={notoSC.className} nav={false}>
      {/* 1523:1468/1469 brand strip — the frame's whole header; no back arrow */}
      <GoldRoseWordmark x={145} y={0} w={140} h={51} />

      <div className={playfair.className} style={{ ...abs(24, 58, 382), ...txt(25, 40, INK, "center"), fontWeight: 500, letterSpacing: -0.2 }}>
        Share Your Keepsake Card
      </div>
      <div style={{ ...abs(32, 96, 366), ...txt(10, 20, INK, "center") }}>Create and share a card celebrating your GoldRose.</div>

      {/* the keepsake card — cream, gold border, gold inner ring */}
      <div style={{ ...sCard(36, 126, 358, 588, { bg: CREAM, stroke: false }), boxShadow: `inset 0 0 0 1px ${GOLD}, ${SHADOW}` }} />
      <div style={{ ...abs(50, 140, 330, 560), boxShadow: `inset 0 0 0 1px ${GOLD}`, borderRadius: 10 }} />
      {/* 1523:1453 draws an "ELDREVE" monogram (placeholder brand, DQ) —
          the 07-28 rose emblem stays, centred in the monogram's box. */}
      <img src="/veloria/screens/1245-118.svg" alt="" width={28} height={28} style={{ ...abs(201, 163, 28, 28), display: "block" }} />
      <div className={playfair.className} style={{ ...abs(36, 212, 358), ...txt(24, 28, GOLD, "center"), fontWeight: 500 }}>
        The 4th recipient
      </div>
      <div style={{ ...abs(56, 244, 318), ...txt(9, 16, GOLD, "center") }}>in San Francisco to receive a GoldRose gift</div>
      <img src="/veloria/screens/1523-1439.png" alt="" width={278} height={228} style={{ ...abs(76, 274, 278, 228), borderRadius: 8, display: "block" }} />
      <div style={{ ...abs(286, 284, 74, 74), background: CREAM, boxShadow: `inset 0 0 0 1px ${GOLD}`, borderRadius: 37 }} />
      <div style={{ ...abs(292, 303, 62), ...txt(7, 16, GOLD, "center"), whiteSpace: "pre-line" }}>{"A GIFT THAT\nLASTS FOREVER"}</div>
      <div className={playfair.className} style={{ ...abs(36, 516, 358), ...txt(20, 28, INK, "center"), fontWeight: 500 }}>
        24K Gold-Dipped Rose
      </div>
      <div className={playfair.className} style={{ ...abs(36, 546, 358), ...txt(13, 22, GOLD, "center"), fontStyle: "italic" }}>
        Classic Collection
      </div>
      {DETAILS.map((row, i) => (
        <div key={row.text}>
          <Glyph src={row.glyph} x={78} y={578 + i * 24} w={28} h={20} ink={row.ink} />
          <div style={{ ...abs(112, 578 + i * 24, 230), ...txt(11, 20, INK) }}>{row.text}</div>
        </div>
      ))}
      {/* 1523:1450/1451 message plate — ink now, cream Playfair italic on top */}
      <div style={{ ...abs(74, 652, 282, 40), background: INK, borderRadius: 8 }} />
      <div className={playfair.className} style={{ ...abs(84, 660, 262), ...txt(11, 22, CREAM, "center"), fontStyle: "italic" }}>
        “With appreciation — thank you for growing together.”
      </div>
      <div style={{ ...abs(56, 699, 318), ...txt(8, 16, INK, "center") }}>
        ◇&nbsp;&nbsp;Authenticity Certified&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Order #GRB-2026****
      </div>

      {/* share row — inert until a share/render backend exists */}
      <div className={playfair.className} style={{ ...abs(36, 730, 358), ...txt(16, 28, INK), fontWeight: 500 }}>
        Share your card
      </div>
      {SHARE.map((item) => (
        <div key={item.label}>
          <div style={sCard(item.x, 770, 58, 58, { bg: CREAM, r: 29, shadow: false })} />
          {item.glyph ? (
            <Glyph src={item.glyph} x={item.x} y={786} w={58} h={20} ink={item.ink!} />
          ) : (
            <div style={{ ...abs(item.x, 786, 58), ...txt(20, 20, item.label === "Save image" ? INK : GOLD, "center") }}>{item.literal}</div>
          )}
          <div style={{ ...abs(item.x - 8, 838, 74), ...txt(9, 16, INK, "center") }}>{item.label}</div>
        </div>
      ))}

      <div style={{ ...abs(36, 886, 358), ...txt(9, 16, INK, "center") }}>Your card is ready to share or save.</div>
    </ScaleFrame>
  );
}
