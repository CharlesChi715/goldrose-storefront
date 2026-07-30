/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /care/chat — pixel-exact implementation of the 07-29
 * "mepage-my orders-Order Detail-customer service" frame (1523:1470).
 * Geometry, colors, fonts and copy verbatim from the Figma REST data;
 * ornamental glyphs are Figma's own SVG exports (the composer's ☺ is a
 * crop of the frame render — it exports as a .notdef box, the C-2 ✉
 * precedent; the crop's box and cream surroundings are unchanged from
 * 07-28, so the same crop still serves); the product photo and the 返回
 * back arrow are the mock's own renders. No bottom nav band — the frame
 * draws none.
 *
 * Visual placeholder end to end: the conversation, timestamps, "linked"
 * order card and read receipts are the mock's own strings, and the
 * composer is a styled div — there is no support-chat backend yet (the
 * /care hero's "Chat with us" lands here so the designed flow can be
 * reviewed; flagged in docs/ixd/README.md).
 */

import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  GOLD,
  INK,
  PINK,
  SAND,
  sCard,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

// 1523:1488…1511 — the mock conversation, frame order. tickX is the ✓✓
// node's box left (388 on the first bubble, 386 after — the mock drifts 2px).
const USER_BUBBLES = [
  {
    box: [228, 300, 188, 76],
    text: "Hi, I have a question about\nmy order #GRB-20260821.",
    textW: 160,
    time: "11:54 AM",
    timeX: 344,
    timeY: 358,
    tickX: 388,
  },
  {
    box: [230, 516, 184, 66],
    text: "When will my order\nbe shipped?",
    textW: 156,
    time: "11:56 AM",
    timeX: 342,
    timeY: 564,
    tickX: 386,
  },
  {
    box: [290, 740, 124, 52],
    text: "Thank you!",
    textW: 96,
    time: "11:57 AM",
    timeX: 342,
    timeY: 774,
    tickX: 386,
  },
] as const;

const AGENT_BUBBLES = [
  {
    box: [54, 390, 248, 108],
    text: "Hello! Thanks for reaching out.\nI’ll be happy to help with your order.\nHow can I assist you today?",
    textW: 220,
    time: "11:55 AM",
    timeX: 230,
    timeY: 480,
    avatarY: 394,
    senderY: 376,
  },
  {
    box: [54, 600, 260, 122],
    text: "Your order is currently in review and\nwill ship within May 18–23. You’ll\nreceive tracking once it’s on the way.",
    textW: 232,
    time: "11:57 AM",
    timeX: 242,
    timeY: 704,
    avatarY: 604,
    senderY: 586,
  },
  {
    box: [54, 810, 220, 42],
    text: "You’re welcome!",
    textW: 192,
    time: "11:58 AM",
    timeX: 202,
    timeY: 834,
    avatarY: 814,
    senderY: 796,
  },
] as const;

export function SupportChatScreen() {
  return (
    <ScaleFrame
      height={932}
      background="#FFFFFF"
      fontClass={notoSC.className}
      nav={false}
    >
      {/* header — the 返回 arrow (1523:1524) is the frame's own render */}
      <BackButton
        fallback="/care"
        src="/veloria/screens/1523-1524.png"
        style={abs(13, 17, 40, 43)}
      />
      <div
        className={playfair.className}
        style={{ ...abs(80, 17, 270), ...txt(22, 28, INK), fontWeight: 500 }}
      >
        GoldRose Support
      </div>
      <div
        style={{ ...abs(80, 54, 8, 8), background: "#2EB24F", borderRadius: 4 }}
      />
      <div style={{ ...abs(96, 48, 230), ...txt(10, 16, INK) }}>
        We’re here to help 24/7
      </div>

      {/* secure notice — ink now, cream text */}
      <div style={sCard(16, 76, 398, 42, { bg: INK, r: 10 })} />
      <Glyph src="1523-1475" x={90} y={86} w={24} h={20} ink={[14, 14]} />
      <div style={{ ...abs(120, 88, 278), ...txt(9, 16, CREAM) }}>
        Your conversation is secure and handled with care.
      </div>

      {/* order context card — the mock's own order */}
      <div style={sCard(16, 138, 398, 126, { bg: CREAM, r: 12 })} />
      <div style={{ ...abs(30, 150, 255), ...txt(9, 16, INK) }}>
        ✦&nbsp;&nbsp;You may be asking about this order
      </div>
      <div
        style={{ ...abs(292, 146, 106, 24), background: INK, borderRadius: 7 }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 4,
            ...txt(8, 16, GOLD, "center"),
          }}
        >
          Automatically linked
        </span>
      </div>
      <img
        src="/veloria/screens/1523-1481.png"
        alt=""
        width={82}
        height={78}
        style={{ ...abs(30, 176, 82, 78), borderRadius: 8, display: "block" }}
      />
      <div style={{ ...abs(128, 181, 200), ...txt(12, 20, INK) }}>
        Gold Preserved Rose – 24K
      </div>
      <div style={{ ...abs(128, 205, 190), ...txt(9, 16, INK) }}>
        Classic collection&nbsp;&nbsp;·&nbsp;&nbsp;Qty 1
      </div>
      <div style={{ ...abs(128, 230, 90), ...txt(14, 20, INK) }}>$129</div>
      <div style={sCard(314, 220, 84, 32, { bg: INK, r: 8, stroke: false })} />
      <div style={{ ...abs(314, 226, 84), ...txt(9, 16, CREAM, "center") }}>
        ✓ Attached
      </div>

      <div style={{ ...abs(0, 272, 430), ...txt(9, 16, INK, "center") }}>
        Today, 11:54 AM
      </div>

      {/* the conversation — the mock's own messages */}
      {USER_BUBBLES.map((bubble) => {
        const [x, y, w, h] = bubble.box;
        return (
          <div key={bubble.text}>
            <div
              style={{
                ...abs(x, y, w, h),
                background: CREAM,
                boxShadow: `inset 0 0 0 1px ${SAND}`,
                borderRadius: 12,
              }}
            />
            <div
              style={{
                ...abs(x + 14, y + 12, bubble.textW),
                ...txt(10, 20, INK),
                whiteSpace: "pre-line",
              }}
            >
              {bubble.text}
            </div>
            <div
              style={{
                ...abs(bubble.timeX, bubble.timeY, 60),
                ...txt(7, 16, INK, "right"),
              }}
            >
              {bubble.time}
            </div>
            {/* ✓✓ (1523:1491/1501/1511, identical exports) — ink 10×6 sits
                right/top-aligned in its 20×20 box: +10, +5 from the box origin */}
            <Glyph
              src="1523-1491"
              x={bubble.tickX + 10}
              y={bubble.timeY + 5}
              w={10}
              h={6}
              ink={[10, 6]}
            />
          </div>
        );
      })}
      {AGENT_BUBBLES.map((bubble) => {
        const [x, y, w, h] = bubble.box;
        return (
          <div key={bubble.text}>
            <div
              style={{ ...abs(54, bubble.senderY, 150), ...txt(8, 16, GOLD) }}
            >
              GoldRose Support
            </div>
            {/* 1523:1495/1505/1515 — identical avatar exports, one file serves all */}
            <img
              src="/veloria/screens/1523-1495.svg"
              alt=""
              width={28}
              height={28}
              style={{ ...abs(18, bubble.avatarY, 28, 28), display: "block" }}
            />
            <div
              style={{ ...abs(x, y, w, h), background: PINK, borderRadius: 12 }}
            />
            <div
              style={{
                ...abs(x + 14, y + 12, bubble.textW),
                ...txt(10, 20, INK),
                whiteSpace: "pre-line",
              }}
            >
              {bubble.text}
            </div>
            <div
              style={{
                ...abs(bubble.timeX, bubble.timeY, 60),
                ...txt(7, 16, INK, "right"),
              }}
            >
              {bubble.time}
            </div>
          </div>
        );
      })}

      {/* composer — styled div, not a live input (no chat backend) */}
      <div
        style={sCard(16, 872, 398, 46, { bg: CREAM, r: 12, shadow: false })}
      />
      <div style={{ ...abs(30, 886, 240), ...txt(10, 16, INK) }}>
        Type a message…
      </div>
      <Glyph src="1523-1520" x={294} y={883} w={30} h={20} ink={[9, 9]} />
      {/* ☺ (1523:1521) — the 07-28 frame-render crop, box centre unchanged at (349,893) */}
      <img
        src="/veloria/screens/1244-163.png"
        alt=""
        width={16}
        height={16}
        style={{ ...abs(341, 885, 16, 16), display: "block" }}
      />
      <div
        style={{ ...abs(370, 877, 36, 36), background: GOLD, borderRadius: 18 }}
      />
      <Glyph src="1523-1523" x={370} y={886} w={36} h={20} ink={[14, 11]} />
    </ScaleFrame>
  );
}
