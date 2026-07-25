/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-1 · Shopping Bag (Figma frame 561:87, content frame 747:95) — the bag
 * canvas above the tab bar: brand nav, member-benefit strip, shipping meter,
 * the single line-item card, gift add-ons, the rose story panel, gift note,
 * order summary, concierge card, FAQ rows and the sticky checkout bar.
 * The line item / totals / add-ons are the design's own placeholder data (the
 * real cart is client-side localStorage, wired in a follow-up); only the
 * checkout CTA and the product thumbnail/title link anywhere. The frame's own
 * bottom navigation (763:154) is dropped — <BottomNav> renders it.
 */

import { Fragment } from "react";
import Link from "next/link";
import { abs } from "@/components/veloria";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";

// 747:96 … 747:101 — the six module frames [top, height]. All carry the same
// #FFF6EC fill, so they are painted as plain backgrounds and their children
// are positioned at frame-absolute coordinates below.
const SECTIONS: readonly (readonly [number, number])[] = [
  [0, 232],
  [232, 292],
  [524, 258],
  [782, 238],
  [1020, 356],
  [1376, 315],
];

// 749:104 / 749:105 / 749:106 — member-benefit labels, glyph-led so each is
// Figma's own SVG render placed at the TEXT node's box (x is card-relative).
const BENEFITS = [
  { x: 10, w: 98, src: "749-104", alt: "▣  Member Rewards" },
  { x: 164, w: 86, src: "749-105", alt: "✦  30-Day Returns" },
  { x: 306, w: 82, src: "749-106", alt: "♔  Gift Concierge" },
];

// 750:102 / 750:104 / 750:106 — craft tag pills, card-relative. Each pill is
// 62×24; only the label's inset and width differ.
const TAGS = [
  { x: 176, labelX: 15, labelW: 32, label: "LIMITED" },
  { x: 244, labelX: 12, labelW: 38, label: "24K GOLD" },
  { x: 312, labelX: 2, labelW: 58, label: "HANDCRAFTED" },
];

// 750:121 / 750:127 / 750:133 / 750:139 — gift add-on cards. Identical 95×188
// geometry; only x, art and copy differ.
const GIFTS = [
  { x: 16, src: "750-122", alt: "Red and gold dipped roses on an acrylic stand", name: "Acrylic Stand", price: "+$20" },
  { x: 117, src: "750-128", alt: "Gold dipped rose in a luxury gift box", name: "Luxury Gift Box", price: "+$25" },
  { x: 218, src: "750-134", alt: "Blush gift card and gold rose", name: "Rose Bouquet", price: "+$25" },
  { x: 319, src: "750-140", alt: "Red rose gift set with certificate", name: "Personal Card", price: "+$5" },
];

// 750:149 … 750:152 — two-line glyph-led story rows, card-relative y.
const STORY = [
  { y: 43, src: "750-149", alt: "✦ Symbolism — Love that endures beyond the moment" },
  { y: 74, src: "750-150", alt: "◇ Rose finish — Deep sapphire preserved rose" },
  { y: 105, src: "750-151", alt: "⌁ Stem — Alloy core with 24K gold finish" },
  { y: 136, src: "750-152", alt: "♧ Presentation — Luxury box, care card and soft pouch" },
];

// 752:102 / 752:105 / 752:108 — order-summary rows, card-relative.
const SUMMARY = [
  { y: 42, label: "Merchandise", labelW: 72, valueX: 337, valueW: 45, value: "$159.00", valueColor: "#3B2F2F" },
  { y: 71, label: "Gift services", labelW: 68, valueX: 351, valueW: 31, value: "$0.00", valueColor: "#3B2F2F" },
  { y: 100, label: "Shipping", labelW: 51, valueX: 292, valueW: 90, value: "Complimentary", valueColor: "#09442E" },
];

// 753:103 / 753:106 / 753:109 — FAQ rows. Their stroke is bound to the hairline
// colour variable but has weight 0, so the design draws no divider at all.
const FAQS = [
  { y: 1464, q: "Rose care guide", w: 88 },
  { y: 1516, q: "Shipping, returns & exchanges", w: 169 },
  { y: 1568, q: "Frequently asked questions", w: 154 },
];

const HAIRLINE_RING = "inset 0 0 0 1px #E5D9C9";

export function BagScreen() {
  return (
    <>
      {/* 747:96 … 747:101 module backgrounds */}
      {SECTIONS.map(([y, h]) => (
        <div key={y} style={{ ...abs(0, y, 430, h), background: "#FFF6EC" }} />
      ))}

      {/* ---------- 01 · Header + benefits (747:96) ---------- */}

      {/* 749:98 Brand Navigation — clips, and the wordmark sits 4.5px above the
          frame's top edge, so its top row of pixels is cropped by design. */}
      <div style={{ ...abs(16, 15, 398, 42), overflow: "hidden" }}>
        <img
          src={`${A}/786-176.png`}
          alt=""
          width={40}
          height={42}
          style={{ ...abs(0, 0, 40, 42), display: "block", objectFit: "cover" }}
        />
        <img
          src={`${A}/786-169.png`}
          alt="GoldRose"
          width={140}
          height={51}
          style={{ ...abs(131, -4.5, 140, 51), display: "block", objectFit: "cover" }}
        />
      </div>

      {/* 749:102 page title */}
      <div
        className={playfair.className}
        style={{
          ...abs(16, 63, 184),
          fontSize: 29,
          lineHeight: "38.66px",
          fontWeight: 600,
          color: "#09442E",
          whiteSpace: "nowrap",
        }}
      >
        Shopping Bag
      </div>

      {/* 749:103 Member Benefits strip — 72% pink so the labels stay opaque */}
      <div
        style={{
          ...abs(16, 108, 398, 42),
          background: "rgba(247, 218, 225, 0.72)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {BENEFITS.map((b) => (
          <img
            key={b.src}
            src={`${A}/${b.src}.svg`}
            alt={b.alt}
            width={b.w}
            height={12}
            style={{ ...abs(b.x, 15, b.w, 12), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        ))}
      </div>

      {/* 749:107 Complimentary Shipping panel */}
      <div
        style={{
          ...abs(16, 156, 398, 74),
          background: "#FFF6EC",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <img
          src={`${A}/749-108.svg`}
          alt="●  COMPLIMENTARY SHIPPING UNLOCKED"
          width={223}
          height={13}
          style={{ ...abs(12, 10, 223, 13), display: "block", objectFit: "none", objectPosition: "left center" }}
        />
        <div
          className={notoSC.className}
          style={{
            ...abs(12, 35, 264),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 400,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          {"Order by 4:00 PM for same-day dispatch  ·  $0 remaining"}
        </div>
        {/* 749:110 shipping meter — already full width (nothing left to earn) */}
        <div style={{ ...abs(12, 59, 374, 4), background: "#09442E", borderRadius: 2 }} />
      </div>

      {/* ---------- 02 · Line item (747:97) ---------- */}

      {/* 750:95 Artisan Blue Rose card */}
      <div
        style={{
          ...abs(16, 244, 398, 272),
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow: `${HAIRLINE_RING}, 0 4px 12px rgba(59, 47, 47, 0.08)`,
          overflow: "hidden",
        }}
      >
        {/* 750:96 thumbnail → /shop until per-line product links are wired */}
        <Link href="/shop" style={{ ...abs(14, 14, 148, 244), display: "block" }}>
          <img
            src={`${A}/750-96.png`}
            alt="Artisan Blue Rose — gold-trimmed blue preserved rose"
            width={148}
            height={244}
            style={{ display: "block", width: 148, height: 244, borderRadius: 10 }}
          />
        </Link>

        {/* 750:98 title → /shop */}
        <Link
          href="/shop"
          className={playfair.className}
          style={{
            ...abs(176, 16, 208),
            display: "block",
            fontSize: 22,
            lineHeight: "29.33px",
            fontWeight: 500,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          Artisan Blue Rose
        </Link>

        {/* 750:99 colour line (ends in a ● swatch glyph) */}
        <img
          src={`${A}/750-99.svg`}
          alt="Color  ·  Deep sapphire  ●"
          width={152}
          height={14}
          style={{ ...abs(176, 55, 152, 14), display: "block", objectFit: "none", objectPosition: "left center" }}
        />

        {/* 750:100 presentation line */}
        <div
          className={notoSC.className}
          style={{
            ...abs(176, 84, 208),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 400,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          {"Presentation  ·  Signature black gift box"}
        </div>

        {/* 750:101 craft tags */}
        {TAGS.map((t) => (
          <div
            key={t.label}
            style={{
              ...abs(t.x, 112, 62, 24),
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1px #C88217",
              overflow: "hidden",
            }}
          >
            <div
              className={notoSC.className}
              style={{
                ...abs(t.labelX, 7, t.labelW),
                fontSize: 8,
                lineHeight: "9.6px",
                fontWeight: 500,
                color: "#C88217",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </div>
          </div>
        ))}

        {/* 799:181 price row */}
        <div
          className={playfair.className}
          style={{
            ...abs(176, 146.5, 87),
            fontSize: 26,
            lineHeight: "34.66px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          $159.00
        </div>
        <div
          className={notoSC.className}
          style={{
            ...abs(271, 157.5, 40),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 400,
            color: "#736B66",
            textDecoration: "line-through",
            whiteSpace: "nowrap",
          }}
        >
          $198.00
        </div>

        {/* 799:184 quantity stepper (static — the cart is not wired here) */}
        <div
          style={{
            ...abs(176, 198, 132, 36),
            borderRadius: 8,
            boxShadow: HAIRLINE_RING,
            overflow: "hidden",
          }}
        >
          {/* 799:185 is a U+2212 minus; Figma crops its SVG to the 9×2 bar */}
          <img
            src={`${A}/799-185.svg`}
            alt="−"
            width={11}
            height={22}
            style={{ ...abs(33, 7, 11, 22), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
          <div
            className={notoSC.className}
            style={{
              ...abs(62, 9.5, 8),
              fontSize: 14,
              lineHeight: "16.8px",
              fontWeight: 500,
              color: "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            1
          </div>
          <div
            className={notoSC.className}
            style={{
              ...abs(88, 7, 11),
              fontSize: 18,
              lineHeight: "21.6px",
              fontWeight: 500,
              color: "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            +
          </div>
        </div>

        {/* 799:188 line-item actions (static) — the design pads the slash with
            five spaces on each side */}
        <div
          className={notoSC.className}
          style={{
            ...abs(176, 248, 208),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 500,
            color: "#C88217",
            whiteSpace: "nowrap",
          }}
        >
          {"Move to Wishlist     /     Remove"}
        </div>
      </div>

      {/* ---------- 03 · Gift services (747:98) ---------- */}

      {/* 750:116 heading with its two em-dash rules */}
      <div
        className={notoSC.className}
        style={{ ...abs(129, 530.5, 15), fontSize: 16, lineHeight: "19.2px", fontWeight: 400, color: "#C88217", whiteSpace: "nowrap" }}
      >
        —
      </div>
      <div
        className={playfair.className}
        style={{ ...abs(152, 525.5, 126), fontSize: 22, lineHeight: "29.33px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
      >
        Gift Services
      </div>
      <div
        className={notoSC.className}
        style={{ ...abs(286, 530.5, 15), fontSize: 16, lineHeight: "19.2px", fontWeight: 400, color: "#C88217", whiteSpace: "nowrap" }}
      >
        —
      </div>

      {/* 750:120 gift add-on cards (ADD buttons are static placeholders) */}
      {GIFTS.map((g) => (
        <div
          key={g.name}
          style={{
            ...abs(g.x, 566, 95, 188),
            background: "#FFFFFF",
            borderRadius: 10,
            boxShadow: HAIRLINE_RING,
            overflow: "hidden",
          }}
        >
          <img
            src={`${A}/${g.src}.png`}
            alt={g.alt}
            width={95}
            height={96}
            style={{ ...abs(0, 0, 95, 96), display: "block" }}
          />
          <div
            className={notoSC.className}
            style={{
              ...abs(0, 100, 87),
              fontSize: 9,
              lineHeight: "10.8px",
              fontWeight: 500,
              color: "#3B2F2F",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {g.name}
          </div>
          <div
            className={notoSC.className}
            style={{
              ...abs(0, 124, 87),
              fontSize: 12,
              lineHeight: "14.4px",
              fontWeight: 500,
              color: "#09442E",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {g.price}
          </div>
          <div style={{ ...abs(0, 148, 79, 26), background: "#3B2F2F", borderRadius: 7, overflow: "hidden" }}>
            <div
              className={notoSC.className}
              style={{
                ...abs(30, 7.5, 19),
                fontSize: 9,
                lineHeight: "10.8px",
                fontWeight: 500,
                color: "#FFFFFF",
                whiteSpace: "nowrap",
              }}
            >
              ADD
            </div>
          </div>
        </div>
      ))}

      {/* ---------- 04 · Product story (747:99) ---------- */}

      {/* 750:145 Rose Craftsmanship panel — hairline ring only, no fill */}
      <div style={{ ...abs(16, 792, 398, 218), borderRadius: 14, boxShadow: HAIRLINE_RING, overflow: "hidden" }}>
        <img
          src={`${A}/750-146.png`}
          alt="Close-up of the Artisan Blue Rose petals and gilded stem"
          width={148}
          height={194}
          style={{ ...abs(12, 12, 148, 194), display: "block", borderRadius: 10 }}
        />
        <div
          className={playfair.className}
          style={{ ...abs(174, 12, 212), fontSize: 17, lineHeight: "22.66px", fontWeight: 500, color: "#09442E", whiteSpace: "nowrap" }}
        >
          A Rose Made to Last
        </div>
        {STORY.map((s) => (
          <img
            key={s.src}
            src={`${A}/${s.src}.svg`}
            alt={s.alt}
            width={212}
            height={24}
            style={{ ...abs(174, s.y, 212, 24), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        ))}
      </div>

      {/* ---------- 05 · Gift note + order summary (747:100) ---------- */}

      {/* 752:95 Gift Note card */}
      <div
        style={{
          ...abs(16, 1030, 398, 84),
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <div
          className={playfair.className}
          style={{ ...abs(12, 10, 65), fontSize: 16, lineHeight: "21.33px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          Gift Note
        </div>
        {/* 752:97 note field — a real input; its ADD affordance is a static
            placeholder (nothing to submit to yet) */}
        <div style={{ ...abs(12, 37, 374, 34), borderRadius: 7, boxShadow: HAIRLINE_RING, overflow: "hidden" }}>
          <input
            type="text"
            name="giftNote"
            placeholder="Add a personal message"
            aria-label="Gift note"
            className={notoSC.className}
            style={{
              position: "absolute",
              left: 10,
              top: 0,
              width: 318,
              height: 34,
              appearance: "none",
              border: 0,
              outline: "none",
              background: "transparent",
              padding: 0,
              fontSize: 10,
              // 34px (the box height), not the node's 12px: centring the line
              // in the full-height field puts the placeholder's glyph box at
              // the design's y offset while leaving room to type.
              lineHeight: "34px",
              fontWeight: 400,
              color: "#3B2F2F",
            }}
          />
          <img
            src={`${A}/752-99.svg`}
            alt="ADD  →"
            width={32}
            height={11}
            style={{ ...abs(334, 11.5, 32, 11), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        </div>
      </div>

      {/* 752:100 Order Summary card */}
      <div
        style={{
          ...abs(16, 1124, 398, 220),
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <div
          className={playfair.className}
          style={{ ...abs(16, 12, 140), fontSize: 19, lineHeight: "25.33px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          Order Summary
        </div>

        {SUMMARY.map((r) => (
          <Fragment key={r.label}>
            <div
              className={notoSC.className}
              style={{
                ...abs(16, r.y + 5, r.labelW),
                fontSize: 12,
                lineHeight: "14.4px",
                fontWeight: 400,
                color: "#3B2F2F",
                whiteSpace: "nowrap",
              }}
            >
              {r.label}
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(r.valueX, r.y + 5, r.valueW),
                fontSize: 12,
                lineHeight: "14.4px",
                fontWeight: 500,
                color: r.valueColor,
                whiteSpace: "nowrap",
              }}
            >
              {r.value}
            </div>
          </Fragment>
        ))}

        {/* 752:111 divider */}
        <div style={{ ...abs(16, 129, 366, 1), background: "#E5D9C9" }} />

        {/* 752:112 total row */}
        <div
          className={playfair.className}
          style={{ ...abs(16, 139.5, 40), fontSize: 17, lineHeight: "22.66px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          Total
        </div>
        <div
          className={playfair.className}
          style={{ ...abs(305, 135.5, 77), fontSize: 23, lineHeight: "30.66px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          $159.00
        </div>

        {/* 752:115 savings note */}
        <div
          className={notoSC.className}
          style={{ ...abs(16, 172, 122), fontSize: 11, lineHeight: "13.2px", fontWeight: 500, color: "#C88217", whiteSpace: "nowrap" }}
        >
          You saved $39.00 today
        </div>

        {/* 752:116 payment marks — brand wordmarks set as coloured text in the
            design; the two glyph marks come from Figma's own renders */}
        <div
          className={notoSC.className}
          style={{ ...abs(87, 190, 24), fontSize: 11, lineHeight: "13.2px", fontWeight: 500, color: "#1A4DB2", whiteSpace: "nowrap" }}
        >
          VISA
        </div>
        <img
          src={`${A}/752-118.svg`}
          alt="●●"
          width={24}
          height={14}
          style={{ ...abs(129, 190, 24, 14), display: "block", objectFit: "none", objectPosition: "left center" }}
        />
        <div
          className={notoSC.className}
          style={{ ...abs(171, 190, 36), fontSize: 11, lineHeight: "13.2px", fontWeight: 500, color: "#0D4D99", whiteSpace: "nowrap" }}
        >
          PayPal
        </div>
        {/* 752:120 —  Pay. Figma's SVG export silently drops the U+F8FF Apple
            mark, so this is a crop of the frame render: fills the whole box, no
            objectFit. */}
        <img
          src={`${A}/752-120.png`}
          alt="Apple Pay"
          width={33}
          height={13}
          style={{ ...abs(225, 190, 33, 13), display: "block" }}
        />
        <div
          className={notoSC.className}
          style={{ ...abs(276, 190, 35), fontSize: 10, lineHeight: "12px", fontWeight: 500, color: "#1A1A1A", whiteSpace: "nowrap" }}
        >
          Klarna.
        </div>
      </div>

      {/* ---------- 06 · Concierge + FAQ + checkout (747:101) ---------- */}

      {/* 753:95 Auri concierge card (ASK AURI is a static placeholder) */}
      <div
        style={{
          ...abs(16, 1386, 398, 70),
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <div style={{ ...abs(12, 13, 44, 44), background: "#F7DAE1", borderRadius: 22, overflow: "hidden" }}>
          <img
            src={`${A}/753-97.svg`}
            alt="✦"
            width={21}
            height={31}
            style={{ ...abs(11.5, 6.5, 21, 31), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        </div>
        <div
          className={playfair.className}
          style={{ ...abs(66, 13, 140), fontSize: 15, lineHeight: "19.99px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          Need help choosing?
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(66, 35, 226), fontSize: 9, lineHeight: "10.8px", fontWeight: 400, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          Auri, your VELORIA concierge, is here 24/7.
        </div>
        <div style={{ ...abs(302, 18, 86, 34), background: "#3B2F2F", borderRadius: 8, overflow: "hidden" }}>
          <div
            className={notoSC.className}
            style={{ ...abs(23, 11.5, 40), fontSize: 9, lineHeight: "10.8px", fontWeight: 500, color: "#FFFFFF", whiteSpace: "nowrap" }}
          >
            ASK AURI
          </div>
        </div>
      </div>

      {/* 753:103 / 753:106 / 753:109 FAQ rows (static, no divider by design) */}
      {FAQS.map((f) => (
        <Fragment key={f.y}>
          <div
            className={notoSC.className}
            style={{
              ...abs(32, f.y + 15, f.w),
              fontSize: 12,
              lineHeight: "14.4px",
              fontWeight: 400,
              color: "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            {f.q}
          </div>
          <img
            src={`${A}/I753-103_151-55.svg`}
            alt="＋"
            width={18}
            height={22}
            style={{ ...abs(380, f.y + 11, 18, 22), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        </Fragment>
      ))}

      {/* 753:112 sticky checkout bar */}
      <div style={{ ...abs(16, 1620, 398, 68), background: "#FFF6EC", borderRadius: 12, overflow: "hidden" }}>
        <div
          className={playfair.className}
          style={{ ...abs(10, 11, 74), fontSize: 22, lineHeight: "29.33px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          $159.00
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(10, 41, 68), fontSize: 9, lineHeight: "10.8px", fontWeight: 500, color: "#C88217", whiteSpace: "nowrap" }}
        >
          You save $39.00
        </div>

        {/* 753:116 primary CTA → /checkout */}
        <Link
          href="/checkout"
          style={{ ...abs(142, 10, 250, 48), display: "block", background: "#3B2F2F", borderRadius: 10 }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(47, 17, 129),
              fontSize: 12,
              lineHeight: "14.4px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: "#FFF6EC",
              whiteSpace: "nowrap",
            }}
          >
            SECURE CHECKOUT
          </div>
          <img
            src={`${A}/I753-116_145-55.svg`}
            alt="→"
            width={15}
            height={18}
            style={{ ...abs(188, 15, 15, 18), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        </Link>
      </div>
    </>
  );
}
