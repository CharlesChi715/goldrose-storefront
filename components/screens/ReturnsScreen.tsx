"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns — pixel-exact implementation of
 * ACCOUNT-RETURNS-AFTER-SALES (1230:119, 07-28). Geometry, colors, fonts
 * and copy verbatim from the Figma REST data; ornamental glyphs and icons
 * are Figma's own SVG exports; the two product photos are the mock's own
 * renders. No bottom nav band — the frame draws none (B-3/B-4 precedent),
 * so the screen opts out of the shared bar too.
 *
 * Visual placeholder: both return cases, their order numbers, dates and
 * statuses are the mock's own strings — there is no returns/refunds
 * backend yet (tracked follow-up). The In Progress / Refunded tabs flip
 * visually only (nothing to filter), View Status / Refund Details stay
 * inert, and of the three help items only Contact Support is wired — to
 * /care/chat, its natural target.
 */

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  GOLD,
  INK,
  PINK,
  sCard,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

// 1243:126…147 — the two mock return cases, frame order.
const CASES = [
  {
    img: "1243-127",
    title: "Gold Heart Necklace\n• Timeless Love",
    order: "Order #GR202507280642",
    delivered: "▣  Delivered Aug 02, 2025",
    price: "$89.00",
    status: "In Review",
    action: "View Status",
    date: "Applied Aug 15, 2025",
  },
  {
    img: "1243-138",
    title: "24K Gold-Plated Rose\n• Golden Memory",
    order: "Order #GR202506150311",
    delivered: "▣  Delivered Jun 18, 2025",
    price: "$99.00",
    status: "✓ Refunded",
    action: "Refund Details",
    date: "Refunded Jul 02, 2025",
  },
];

// 1243:150…161 — the After-Sales Help items.
const HELP: Array<{ x: number; glyph: string; ink: [number, number]; title: string; note: string; href?: string }> = [
  { x: 24, glyph: "1243-151", ink: [21, 21], title: "Return Policy", note: "View eligibility" },
  { x: 154, glyph: "1243-155", ink: [13, 13], title: "Refund Timeline", note: "How it works" },
  { x: 284, glyph: "1243-159", ink: [19, 19], title: "Contact Support", note: "We’re here to help", href: "/care/chat" },
];

export function ReturnsScreen() {
  const [tab, setTab] = useState<"in-progress" | "refunded">("in-progress");

  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      {/* header — back, brand, cart */}
      <BackButton fallback="/account" src="/veloria/screens/1243-111.svg" style={abs(18, 20, 24, 24)} />
      <div className={playfair.className} style={{ ...abs(95, 14, 240), ...txt(23, 28, INK, "center"), fontWeight: 500 }}>
        GoldRose
      </div>
      <Link href="/checkout" aria-label="Bag" style={{ ...abs(388, 20, 24, 24), display: "block" }}>
        <img src="/veloria/screens/1243-114.svg" alt="" width={24} height={24} style={{ display: "block" }} />
      </Link>

      <div className={playfair.className} style={{ ...abs(44, 62, 342), ...txt(27, 40, INK, "center"), fontWeight: 500, letterSpacing: -0.2 }}>
        Returns &amp; After-Sales
      </div>
      <div style={{ ...abs(36, 103, 358), ...txt(11, 20, INK, "center"), whiteSpace: "pre-line" }}>
        {"Manage eligible orders, track refund progress,\nand view after-sales status."}
      </div>

      {/* tabs — flip visually only (mock data, nothing to filter) */}
      <div style={sCard(16, 146, 398, 50, { r: 25, shadow: false })} />
      {(
        [
          ["in-progress", "In Progress", 16, 55],
          ["refunded", "Refunded", 215, 254],
        ] as const
      ).map(([key, label, x, ix]) => (
        <button
          key={key}
          type="button"
          aria-pressed={tab === key}
          onClick={() => setTab(key)}
          style={{ ...abs(x, 146, 199, 50), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
        >
          <span style={{ position: "absolute", left: 0, right: 0, top: 16, ...txt(13, 20, INK, "center") }}>{label}</span>
          {tab === key ? <span style={{ ...abs(ix - x, 46, 120, 2), background: GOLD, display: "block" }} /> : null}
        </button>
      ))}

      {/* eligibility note */}
      <div style={sCard(16, 208, 398, 76, { bg: PINK, r: 12 })} />
      <Glyph src="1243-123" x={30} y={226} w={32} h={20} ink={[23, 23]} />
      <div style={{ ...abs(72, 224, 230), ...txt(14, 20, INK) }}>Current Orders Only</div>
      <div style={{ ...abs(72, 248, 290), ...txt(9, 16, INK), whiteSpace: "pre-line" }}>
        {"Showing orders within the return window and\nmeeting product eligibility criteria."}
      </div>

      {/* return cases — the mock's own data */}
      {CASES.map((item, i) => {
        const y = 296 + i * 188;
        return (
          <div key={item.order}>
            <div style={sCard(16, y, 398, 176, { r: 12 })} />
            <img
              src={`/veloria/screens/${item.img}.png`}
              alt=""
              width={116}
              height={144}
              style={{ ...abs(28, y + 16, 116, 144), borderRadius: 10, display: "block" }}
            />
            <div style={{ ...abs(160, y + 16, 220), ...txt(14, 20, INK), whiteSpace: "pre-line" }}>{item.title}</div>
            <div style={{ ...abs(160, y + 52, 220), ...txt(9, 16, INK) }}>{item.order}</div>
            <div style={{ ...abs(160, y + 78, 220), ...txt(9, 16, GOLD) }}>{item.delivered}</div>
            <div style={{ ...abs(160, y + 106, 100), ...txt(15, 20, INK) }}>{item.price}</div>
            <div style={{ ...abs(294, y + 78, 102, 32), background: PINK, borderRadius: 8 }}>
              <span style={{ position: "absolute", left: 0, right: 0, top: 9, ...txt(10, 16, INK, "center") }}>{item.status}</span>
            </div>
            <div style={sCard(268, y + 118, 128, 36, { r: 8, shadow: false })} />
            <div style={{ ...abs(268, y + 129, 128), ...txt(10, 20, INK, "center") }}>{item.action}</div>
            <div style={{ ...abs(262, y + 158, 134), ...txt(8, 16, INK, "right") }}>{item.date}</div>
          </div>
        );
      })}

      {/* after-sales help */}
      <div style={sCard(16, 672, 398, 152)} />
      <div style={{ ...abs(16, 690, 398), ...txt(15, 20, INK, "center") }}>After-Sales Help</div>
      {HELP.map((item) => {
        const body = (
          <>
            <Glyph src={item.glyph} x={0} y={10} w={34} h={20} ink={item.ink} />
            <span style={{ position: "absolute", left: 38, top: 10, width: 84, ...txt(10, 20, INK), display: "block" }}>{item.title}</span>
            <span style={{ position: "absolute", left: 38, top: 34, width: 84, ...txt(8, 16, INK), display: "block" }}>{item.note}</span>
          </>
        );
        return item.href ? (
          <Link key={item.title} href={item.href} style={{ ...abs(item.x, 722, 126, 92), display: "block" }}>
            {body}
          </Link>
        ) : (
          <div key={item.title} style={abs(item.x, 722, 126, 92)}>
            {body}
          </div>
        );
      })}

      <div style={{ ...abs(32, 847, 366), ...txt(9, 16, INK, "center") }}>Need more help? Our support team is available 24/7.</div>
    </ScaleFrame>
  );
}
