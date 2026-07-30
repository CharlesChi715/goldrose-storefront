"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns — pixel-exact implementation of
 * "mepage-Returns & After-Sales" (1523:3826, 07-29 unified restyle).
 * Geometry, colors, fonts and copy verbatim from the Figma REST data;
 * ornamental glyphs are Figma's own SVG exports; the two product photos are
 * the mock's own renders. The header is the frame's own Brand Navigation
 * art (返回 arrow + wordmark render + 购物车 cart); the eligibility note and
 * the status tags are now ink cards with cream text (were pink). No bottom
 * nav band — gone from every account frame in this delivery.
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
  sCard,
  GoldRoseWordmark,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { goudy, notoSC, playfair } from "@/lib/fonts";

// Per-card offsets from the card's top edge — the two mock cards are
// hand-placed and don't share a grid (design-team finding).
type CasePos = {
  title: number;
  titleW: number;
  order: number;
  delivered: number;
  price: number;
  tag: number;
  btn: number;
  btnH: number;
  btnText: number;
  dateX: number;
  dateW: number;
  date: number;
};

// 1523:3837…3858 — the two mock return cases, frame order. The second space
// after "▣" is U+00A0 so the double spacing survives HTML collapsing.
const CASES: Array<{
  img: string;
  title: string;
  order: string;
  delivered: string;
  price: string;
  status: string;
  action: string;
  date: string;
  pos: CasePos;
}> = [
  {
    img: "1523-3838",
    title: "Gold Heart Necklace• Timeless Love",
    order: "Order #GR202507280642",
    delivered: "▣  Delivered Aug 02, 2025",
    price: "$89.00",
    status: "In Review",
    action: "View Status",
    date: "Applied Aug 15, 2025",
    // 1523:3839 title box 39h ALIGN-V CENTER → 22 + (39−20)/2.
    pos: {
      title: 31.5,
      titleW: 220,
      order: 61,
      delivered: 84,
      price: 140,
      tag: 88,
      btn: 125,
      btnH: 29,
      btnText: 130,
      dateX: 296,
      dateW: 96,
      date: 159,
    },
  },
  {
    img: "1523-3849",
    title: "24K Gold-Plated Rose• Golden Memory",
    order: "Order #GR202506150311",
    delivered: "▣  Delivered Jun 18, 2025",
    price: "$99.00",
    status: "✓ Refunded",
    action: "Refund Details",
    date: "Refunded Jul 02, 2025",
    // 1523:3857 button text ALIGN-V CENTER in the 31h box → 123 + 5.5.
    pos: {
      title: 24,
      titleW: 240,
      order: 58,
      delivered: 79,
      price: 136,
      tag: 78,
      btn: 123,
      btnH: 31,
      btnText: 128.5,
      dateX: 292,
      dateW: 102,
      date: 158,
    },
  },
];

// 1523:3861…3872 — the After-Sales Help items.
const HELP: Array<{
  x: number;
  glyph: string;
  ink: [number, number];
  title: string;
  note: string;
  href?: string;
}> = [
  {
    x: 22,
    glyph: "1523-3862",
    ink: [21, 21],
    title: "Return Policy",
    note: "View eligibility",
  },
  {
    x: 152,
    glyph: "1523-3866",
    ink: [13, 13],
    title: "Refund Timeline",
    note: "How it works",
  },
  {
    x: 282,
    glyph: "1523-3870",
    ink: [19, 19],
    title: "Contact Support",
    note: "We’re here to help",
    href: "/care/chat",
  },
];

export function ReturnsScreen() {
  const [tab, setTab] = useState<"in-progress" | "refunded">("in-progress");

  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:3874 Brand Navigation — the frame's own art: 返回 arrow,
          wordmark render, 购物车 cart */}
      <BackButton
        fallback="/account"
        src="/veloria/screens/1523-3875.png"
        style={abs(13, 24.5, 40, 43)}
      />
      <GoldRoseWordmark x={143} y={20.5} w={140} h={51} />
      <Link
        href="/checkout"
        aria-label="Bag"
        style={{ ...abs(373, 24.5, 40, 43), display: "block" }}
      >
        <img
          src="/veloria/screens/1523-3877.png"
          alt=""
          width={40}
          height={43}
          style={{ display: "block" }}
        />
      </Link>

      {/* 1523:3827/3828 title + subtitle */}
      <div
        className={playfair.className}
        style={{
          ...abs(42, 92, 342),
          ...txt(27, 40, INK, "center"),
          fontWeight: 500,
          letterSpacing: -0.2,
        }}
      >
        Returns &amp; After-Sales
      </div>
      <div
        style={{
          ...abs(34, 134, 358),
          ...txt(11, 20, INK, "center"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "Manage eligible orders, track refund progress,\nand view after-sales status."
        }
      </div>

      {/* 1523:3829 tabs — flip visually only (mock data, nothing to filter);
          the sheet draws only the In Progress indicator (1523:3832, rel 39),
          Refunded mirrors it */}
      <div style={sCard(14, 188, 398, 50, { r: 25, shadow: false })} />
      {(
        [
          ["in-progress", "In Progress", 14],
          ["refunded", "Refunded", 213],
        ] as const
      ).map(([key, label, x]) => (
        <button
          key={key}
          type="button"
          aria-pressed={tab === key}
          onClick={() => setTab(key)}
          style={{
            ...abs(x, 188, 199, 50),
            border: 0,
            padding: 0,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 16,
              ...txt(13, 20, INK, "center"),
            }}
          >
            {label}
          </span>
          {tab === key ? (
            <span
              style={{
                ...abs(39, 41, 120, 2),
                background: GOLD,
                display: "block",
              }}
            />
          ) : null}
        </button>
      ))}

      {/* 1523:3833 eligibility note — ink card, cream text (07-29) */}
      <div style={sCard(14, 256, 398, 76, { bg: INK, r: 12 })} />
      <Glyph src="1523-3834" x={27} y={287} w={32} h={20} ink={[23, 23]} />
      <div style={{ ...abs(71, 268, 230), ...txt(14, 20, CREAM) }}>
        Current Orders Only
      </div>
      <div
        style={{
          ...abs(71, 292, 290),
          ...txt(9, 16, CREAM),
          whiteSpace: "pre-line",
        }}
      >
        {
          "Showing orders within the return window and\nmeeting product eligibility criteria."
        }
      </div>

      {/* return cases — the mock's own data; status tags ink (07-29) */}
      {CASES.map((item, i) => {
        const y = 349 + i * 188;
        const p = item.pos;
        return (
          <div key={item.order}>
            <div style={sCard(14, y, 398, 176, { r: 12 })} />
            <img
              src={`/veloria/screens/${item.img}.png`}
              alt=""
              width={116}
              height={144}
              style={{
                ...abs(26, y + 16, 116, 144),
                borderRadius: 10,
                display: "block",
              }}
            />
            <div
              className={goudy.className}
              style={{
                ...abs(158, y + p.title, p.titleW),
                ...txt(14, 20, INK),
                fontWeight: 500,
              }}
            >
              {item.title}
            </div>
            <div style={{ ...abs(158, y + p.order, 220), ...txt(9, 16, INK) }}>
              {item.order}
            </div>
            <div
              style={{ ...abs(158, y + p.delivered, 220), ...txt(9, 16, GOLD) }}
            >
              {item.delivered}
            </div>
            <div style={{ ...abs(158, y + p.price, 100), ...txt(15, 20, INK) }}>
              {item.price}
            </div>
            <div
              style={{
                ...abs(292, y + p.tag, 102, 32),
                background: INK,
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 6,
                  ...txt(10, 16, CREAM, "center"),
                }}
              >
                {item.status}
              </span>
            </div>
            <div
              style={sCard(292, y + p.btn, 102, p.btnH, {
                bg: CREAM,
                r: 8,
                shadow: false,
              })}
            />
            <div
              style={{
                ...abs(292, y + p.btnText, 102),
                ...txt(10, 20, INK, "center"),
              }}
            >
              {item.action}
            </div>
            <div
              style={{
                ...abs(p.dateX, y + p.date, p.dateW),
                ...txt(8, 16, INK, "center"),
              }}
            >
              {item.date}
            </div>
          </div>
        );
      })}

      {/* 1523:3859 after-sales help */}
      <div style={sCard(14, 725, 398, 152)} />
      <div style={{ ...abs(14, 743, 398), ...txt(15, 20, INK, "center") }}>
        After-Sales Help
      </div>
      {HELP.map((item) => {
        const body = (
          <>
            <Glyph src={item.glyph} x={0} y={10} w={34} h={20} ink={item.ink} />
            <span
              style={{
                position: "absolute",
                left: 38,
                top: 10,
                width: 84,
                ...txt(10, 20, INK),
                display: "block",
              }}
            >
              {item.title}
            </span>
            <span
              style={{
                position: "absolute",
                left: 38,
                top: 34,
                width: 84,
                ...txt(8, 16, INK),
                display: "block",
              }}
            >
              {item.note}
            </span>
          </>
        );
        return item.href ? (
          <Link
            key={item.title}
            href={item.href}
            style={{ ...abs(item.x, 775, 126, 92), display: "block" }}
          >
            {body}
          </Link>
        ) : (
          <div key={item.title} style={abs(item.x, 775, 126, 92)}>
            {body}
          </div>
        );
      })}

      <div style={{ ...abs(30, 894, 366), ...txt(9, 16, INK, "center") }}>
        Need more help? Our support team is available 24/7.
      </div>
    </ScaleFrame>
  );
}
