/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-1 · Shopping Bag (Figma frame 1523:3059 " Homepage-Shopping Bag ",
 * 430×1726; re-imported 2026-07-29 from the file-wide restyle delivery) —
 * the bag canvas above the tab bar: brand nav, member-benefit strip,
 * shipping meter, the single line-item card, gift add-ons, the rose story
 * panel, gift note, order summary (with the "safe pay" bar), concierge
 * card, FAQ rows and the sticky checkout bar. Geometry is unchanged from
 * the 07-27 frame; the 07-29 changes are the header (the brand logo is now
 * a back arrow, wired as BackButton) and the shipping panel going WHITE
 * per the restyle's card language.
 * The line item / totals / add-ons are the design's own placeholder data (the
 * real cart is client-side localStorage, wired in a follow-up); only the
 * checkout CTA, the product thumbnail/title and the back arrow go anywhere.
 * The frame's own bottom navigation (1523:3188) is dropped — <BottomNav>
 * renders it. (The frame is 2px shorter than its own content: the inner
 * 1523:3060 runs to 1728, so the source crops its nav band's last 2px.)
 *
 * ⚠️ Brand substitution: the frame's header wordmark is an image reading
 * "ELDREVE" (the delivery's placeholder brand, DQ raised) — per the
 * OrderConfirmedScreen precedent the live page keeps GoldRose in Playfair
 * at the image's box. The image still overhangs the nav frame's top (6.4px
 * now, was 4.5px) — the text substitution centres in the same box, so the
 * clip no longer crops any ink.
 */

import { Fragment } from "react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { abs } from "@/lib/figma-layout";
import { goudy, notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";

// 1523:3067 / 3068 / 3069 — member-benefit labels, glyph-led so each is
// Figma's own SVG render placed at the TEXT node's box (x is card-relative).
// The 07-29 delivery shipped no exports for these nodes; the 07-27 renders
// (749-10x) are equivalent — same strings, boxes and #3B2F2F fill.
const BENEFITS = [
  { x: 10, w: 98, src: "749-104", alt: "▣  Member Rewards" },
  { x: 164, w: 86, src: "749-105", alt: "✦  30-Day Returns" },
  { x: 306, w: 82, src: "749-106", alt: "♔  Gift Concierge" },
];

// 1523:3083 / 3085 / 3087 — craft tag pills, card-relative. Each pill is
// 62×24; only the label's inset and width differ.
const TAGS = [
  { x: 176, labelX: 15, labelW: 32, label: "LIMITED" },
  { x: 244, labelX: 12, labelW: 38, label: "24K GOLD" },
  { x: 312, labelX: 2, labelW: 58, label: "HANDCRAFTED" },
];

// 1523:3104 / 3111 / 3118 / 3125 — gift add-on cards. Identical 95×167
// geometry; only x, art and copy differ.
const GIFTS = [
  {
    x: 16,
    src: "1523-3105",
    alt: "Red and gold dipped roses on an acrylic stand",
    name: "Acrylic Stand",
    price: "+$20",
  },
  {
    x: 117,
    src: "1523-3112",
    alt: "Gold dipped rose in a luxury gift box",
    name: "Luxury Gift Box",
    price: "+$25",
  },
  {
    x: 218,
    src: "1523-3119",
    alt: "Blush preserved rose bouquet",
    name: "Rose Bouquet",
    price: "+$25",
  },
  {
    x: 319,
    src: "1523-3126",
    alt: "Red rose gift set with certificate",
    name: "Personal Card",
    price: "+$5",
  },
];

// 1523:3137 … 3140 — two-line glyph-led story rows, card-relative y. No
// 07-29 exports for these nodes either; the 07-27 renders match the sheet
// (same strings, 212×24 boxes, #3B2F2F).
const STORY = [
  {
    y: 43,
    src: "750-149",
    alt: "✦ Symbolism — Love that endures beyond the moment",
  },
  {
    y: 74,
    src: "750-150",
    alt: "◇ Rose finish — Deep sapphire preserved rose",
  },
  { y: 105, src: "750-151", alt: "⌁ Stem — Alloy core with 24K gold finish" },
  {
    y: 136,
    src: "750-152",
    alt: "♧ Presentation — Luxury box, care card and soft pouch",
  },
];

// 1523:3149 / 3152 / 3155 — order-summary rows, card-relative.
const SUMMARY = [
  {
    y: 43,
    label: "Merchandise",
    labelW: 72,
    valueX: 337,
    valueW: 45,
    value: "$159.00",
    valueColor: "#3B2F2F",
  },
  {
    y: 73,
    label: "Gift services",
    labelW: 68,
    valueX: 351,
    valueW: 31,
    value: "$0.00",
    valueColor: "#3B2F2F",
  },
  {
    y: 103,
    label: "Shipping",
    labelW: 51,
    valueX: 292,
    valueW: 90,
    value: "Complimentary",
    valueColor: "#09442E",
  },
];

// 1523:3180 / 3181 / 3182 — FAQ rows, now component instances carrying a
// bottom-only 1px inside stroke (t0r0b1l0).
const FAQS = [
  { y: 1432, q: "Rose care guide", w: 88 },
  { y: 1484, q: "Shipping, returns & exchanges", w: 169 },
  { y: 1536, q: "Frequently asked questions", w: 154 },
];

// The three FAQ ＋ instance exports are byte-identical, so one file serves
// every row. Filename is the raw node id (";"/":" intact — this delivery's
// downloader skipped the I753-103_151-55-style sanitising).
const FAQ_PLUS = "I1523-3180_1523-415.svg";

const HAIRLINE_RING = "inset 0 0 0 1px #E5D9C9";

export function BagScreen() {
  return (
    <>
      {/* ---------- 01 · Header + Benefits (1523:3061) ---------- */}

      {/* 1523:3062 Brand Navigation — clips. The leading 40×42 image is no
          longer the rose logo but the frame's back arrow (layer "返回 2"),
          wired as the flow's BackButton; / is the fallback when the bag is
          the first page of the visit. */}
      <div style={{ ...abs(16, 20, 398, 42), overflow: "hidden" }}>
        <BackButton
          fallback="/"
          src={`${A}/1523-3063.png`}
          style={abs(0, 0, 40, 42)}
        />
        {/* 1523:3064 wordmark box (nav-rel 122,−6.4 152×54.8): GoldRose for
            the frame's "ELDREVE" placeholder image — see the file header. */}
        <div
          className={playfair.className}
          style={{
            ...abs(122, -6.4, 152, 54.8),
            fontSize: 26,
            lineHeight: "54.8px",
            fontWeight: 600,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          GoldRose
        </div>
      </div>

      {/* 1523:3065 page title */}
      <div
        className={playfair.className}
        style={{
          ...abs(16, 68, 184),
          fontSize: 29,
          lineHeight: "38.66px",
          fontWeight: 600,
          color: "#09442E",
          whiteSpace: "nowrap",
        }}
      >
        Shopping Bag
      </div>

      {/* 1523:3066 Member Benefits strip — 72% pink so the labels stay opaque */}
      <div
        style={{
          ...abs(16, 113, 398, 42),
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
            style={{
              ...abs(b.x, 15, b.w, 12),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        ))}
      </div>

      {/* 1523:3070 Complimentary Shipping panel — WHITE in the 07-29 restyle
          (was cream); the card language moved every card to white. */}
      <div
        style={{
          ...abs(16, 161, 398, 74),
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        {/* 1523:3071 — no 07-29 export; the 07-27 render matches (#09442E) */}
        <img
          src={`${A}/749-108.svg`}
          alt="●  COMPLIMENTARY SHIPPING UNLOCKED"
          width={223}
          height={13}
          style={{
            ...abs(12, 10, 223, 13),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
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
          {"Order by 4:00 PM for same-day dispatch  ·  $0 remaining"}
        </div>
        {/* 1523:3073 shipping meter — already full width (nothing left to earn) */}
        <div
          style={{
            ...abs(12, 59, 374, 4),
            background: "#09442E",
            borderRadius: 2,
          }}
        />
      </div>

      {/* ---------- 02 · Product Card (1523:3074) ---------- */}

      {/* 1523:3075 Artisan Blue Rose card */}
      <div
        style={{
          ...abs(16, 249, 398, 272),
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow: `${HAIRLINE_RING}, 0 4px 12px rgba(59, 47, 47, 0.08)`,
          overflow: "hidden",
        }}
      >
        {/* 1523:3076 thumbnail → /shop until per-line product links are wired */}
        <Link
          href="/shop"
          style={{ ...abs(14, 14, 148, 244), display: "block" }}
        >
          <img
            src={`${A}/1523-3076.png`}
            alt="Artisan Blue Rose — gold-trimmed blue preserved rose"
            width={148}
            height={244}
            style={{
              display: "block",
              width: 148,
              height: 244,
              borderRadius: 10,
            }}
          />
        </Link>

        {/* 1523:3079 title → /shop */}
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

        {/* 1523:3080 colour line (ends in a ● swatch glyph) — no 07-29
            export; the 07-27 render matches the sheet */}
        <img
          src={`${A}/750-99.svg`}
          alt="Color  ·  Deep sapphire  ●"
          width={152}
          height={14}
          style={{
            ...abs(176, 55, 152, 14),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />

        {/* 1523:3081 presentation line */}
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
          {"Presentation  ·  Signature black gift box"}
        </div>

        {/* 1523:3082 craft tags */}
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

        {/* 1523:3090 price row */}
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

        {/* 1523:3093 quantity stepper (static — the cart is not wired here) */}
        <div
          style={{
            ...abs(176, 198, 132, 36),
            borderRadius: 8,
            boxShadow: HAIRLINE_RING,
            overflow: "hidden",
          }}
        >
          {/* 1523:3094 is a U+2212 minus; Figma crops its SVG to the 9×2 bar */}
          <img
            src={`${A}/1523-3094.svg`}
            alt="−"
            width={11}
            height={22}
            style={{
              ...abs(33, 7, 11, 22),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
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

        {/* 1523:3097 line-item actions (static) — the design pads the slash
            with five spaces on each side */}
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
          {"Move to Wishlist     /     Remove"}
        </div>
      </div>

      {/* ---------- 03 · Gift Services (1523:3098) ---------- */}

      {/* 1523:3099 heading with its two em-dash rules */}
      <div
        className={notoSC.className}
        style={{
          ...abs(129, 535.5, 15),
          fontSize: 16,
          lineHeight: "19.2px",
          fontWeight: 400,
          color: "#C88217",
          whiteSpace: "nowrap",
        }}
      >
        —
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(152, 530.5, 126),
          fontSize: 22,
          lineHeight: "29.33px",
          fontWeight: 500,
          color: "#3B2F2F",
          whiteSpace: "nowrap",
        }}
      >
        Gift Services
      </div>
      <div
        className={notoSC.className}
        style={{
          ...abs(286, 535.5, 15),
          fontSize: 16,
          lineHeight: "19.2px",
          fontWeight: 400,
          color: "#C88217",
          whiteSpace: "nowrap",
        }}
      >
        —
      </div>

      {/* 1523:3103 gift add-on cards (ADD buttons are static placeholders) */}
      {GIFTS.map((g) => (
        <div
          key={g.name}
          style={{
            ...abs(g.x, 571, 95, 167),
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
          {/* Goudy 12/17.86 centred rows. The source mixes ALIGN-V CENTER
              and TOP across the four cards (a file inconsistency); the 1px
              difference is served uniformly as the CENTER placement. */}
          <div
            className={goudy.className}
            style={{
              ...abs(0, 96, 95, 20),
              fontSize: 12,
              lineHeight: "17.86px",
              fontWeight: 500,
              color: "#3B2F2F",
              textAlign: "center",
              whiteSpace: "nowrap",
              paddingTop: 1,
            }}
          >
            {g.name}
          </div>
          <div
            className={goudy.className}
            style={{
              ...abs(0, 116, 95, 20),
              fontSize: 12,
              lineHeight: "17.86px",
              fontWeight: 500,
              color: "#09442E",
              textAlign: "center",
              whiteSpace: "nowrap",
              paddingTop: 1,
            }}
          >
            {g.price}
          </div>
          <div
            style={{
              ...abs(12, 136, 73, 25),
              background: "#3B2F2F",
              borderRadius: 7,
              overflow: "hidden",
            }}
          >
            <div
              className={notoSC.className}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 7,
                fontSize: 9,
                lineHeight: "10.8px",
                fontWeight: 500,
                color: "#FFFFFF",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              ADD
            </div>
          </div>
        </div>
      ))}

      {/* ---------- 04 · Product Story (1523:3132) ---------- */}

      {/* 1523:3133 Rose Craftsmanship panel — hairline ring only, no fill */}
      <div
        style={{
          ...abs(16, 748, 398, 218),
          borderRadius: 14,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        {/* 1523:3134 — the 07-29 frame reuses the product thumbnail's photo
            here (same image hash as 1523:3076; the old close-up is gone) */}
        <img
          src={`${A}/1523-3134.png`}
          alt="The Artisan Blue Rose"
          width={148}
          height={194}
          style={{
            ...abs(12, 12, 148, 194),
            display: "block",
            borderRadius: 10,
          }}
        />
        <div
          className={playfair.className}
          style={{
            ...abs(174, 12, 212),
            fontSize: 17,
            lineHeight: "22.66px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
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
            style={{
              ...abs(174, s.y, 212, 24),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        ))}
      </div>

      {/* ---------- 05 · Note + Order Summary (1523:3141) ---------- */}

      {/* The design paints the empty gift-note field in #8C8075; ::placeholder
          cannot be styled inline, so a scoped rule (WholesaleScreen precedent). */}
      <style>{`.b1-note::placeholder { color: #8C8075; opacity: 1; }`}</style>

      {/* 1523:3142 Gift Note card */}
      <div
        style={{
          ...abs(16, 985, 398, 84),
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <div
          className={playfair.className}
          style={{
            ...abs(12, 10, 65),
            fontSize: 16,
            lineHeight: "21.33px",
            fontWeight: 500,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          Gift Note
        </div>
        {/* 1523:3144 note field — a real input; its ADD affordance is a static
            placeholder (nothing to submit to yet) */}
        <div
          style={{
            ...abs(12, 37, 374, 34),
            borderRadius: 7,
            boxShadow: HAIRLINE_RING,
            overflow: "hidden",
          }}
        >
          <input
            type="text"
            name="giftNote"
            placeholder="Add a personal message"
            aria-label="Gift note"
            className={`${notoSC.className} b1-note`}
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
          {/* 1523:3146 — no 07-29 export; the 07-27 render matches (#C88217) */}
          <img
            src={`${A}/752-99.svg`}
            alt="ADD  →"
            width={32}
            height={11}
            style={{
              ...abs(334, 11.5, 32, 11),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </div>
      </div>

      {/* 1523:3147 Order Summary card */}
      <div
        style={{
          ...abs(16, 1079, 398, 263),
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <div
          className={playfair.className}
          style={{
            ...abs(16, 12, 140),
            fontSize: 19,
            lineHeight: "25.33px",
            fontWeight: 500,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
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

        {/* 1523:3158 divider */}
        <div style={{ ...abs(16, 133, 366, 1), background: "#E5D9C9" }} />

        {/* 1523:3159 total row */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 144.5, 40),
            fontSize: 17,
            lineHeight: "22.66px",
            fontWeight: 500,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          Total
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(305, 140.5, 77),
            fontSize: 23,
            lineHeight: "30.66px",
            fontWeight: 500,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          $159.00
        </div>

        {/* 1523:3162 savings note */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 178, 122),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 500,
            color: "#C88217",
            whiteSpace: "nowrap",
          }}
        >
          You saved $39.00 today
        </div>

        {/* 1523:3163 "safe pay" bar — a dark band between the savings note
            and the payment marks (static art). The source layer is literally
            named "Ask Auri" — a copy-paste artifact, not this card's button. */}
        <div
          style={{
            ...abs(16, 197, 366, 34),
            background: "#3B2F2F",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            className={notoSC.className}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 11.5,
              fontSize: 9,
              lineHeight: "10.8px",
              fontWeight: 500,
              color: "#FFFFFF",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {"safe  pay"}
          </div>
        </div>

        {/* 1523:3165 payment marks — brand wordmarks set as coloured text in
            the design; the two glyph marks come from Figma's own renders */}
        <div
          className={notoSC.className}
          style={{
            ...abs(87, 237, 24),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 500,
            color: "#1A4DB2",
            whiteSpace: "nowrap",
          }}
        >
          VISA
        </div>
        <img
          src={`${A}/1523-3167.svg`}
          alt="●●"
          width={24}
          height={14}
          style={{
            ...abs(129, 237, 24, 14),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
        <div
          className={notoSC.className}
          style={{
            ...abs(171, 237, 36),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 500,
            color: "#0D4D99",
            whiteSpace: "nowrap",
          }}
        >
          PayPal
        </div>
        {/* 1523:3169 —  Pay. Figma's SVG export silently drops the U+F8FF
            Apple mark, so this is a crop of the frame render: fills the whole
            box, no objectFit. No 07-29 crop was delivered; the 07-27 one
            matches (ink on the same white card). */}
        <img
          src={`${A}/752-120.png`}
          alt="Apple Pay"
          width={33}
          height={13}
          style={{ ...abs(225, 237, 33, 13), display: "block" }}
        />
        <div
          className={notoSC.className}
          style={{
            ...abs(276, 237, 35),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 500,
            color: "#1A1A1A",
            whiteSpace: "nowrap",
          }}
        >
          Klarna.
        </div>
      </div>

      {/* ---------- 06 · Concierge + Checkout + Nav (1523:3171) ---------- */}

      {/* 1523:3172 Auri concierge card (ASK AURI is a static placeholder) */}
      <div
        style={{
          ...abs(16, 1354, 398, 70),
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...abs(12, 13, 44, 44),
            background: "#F7DAE1",
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          <img
            src={`${A}/1523-3174.svg`}
            alt="✦"
            width={21}
            height={31}
            style={{
              ...abs(11.5, 6.5, 21, 31),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(66, 13, 140),
            fontSize: 15,
            lineHeight: "19.99px",
            fontWeight: 500,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          Need help choosing?
        </div>
        <div
          className={notoSC.className}
          style={{
            ...abs(66, 35, 226),
            fontSize: 9,
            lineHeight: "10.8px",
            fontWeight: 400,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          Auri, your VELORIA concierge, is here 24/7.
        </div>
        <div
          style={{
            ...abs(302, 18, 86, 34),
            background: "#3B2F2F",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(23, 11.5, 40),
              fontSize: 9,
              lineHeight: "10.8px",
              fontWeight: 500,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            ASK AURI
          </div>
        </div>
      </div>

      {/* 1523:3180 / 3181 / 3182 FAQ rows (static; the instances carry a
          bottom-only inside hairline, drawn as the 1px strip) */}
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
            src={`${A}/${FAQ_PLUS}`}
            alt="＋"
            width={18}
            height={22}
            style={{
              ...abs(380, f.y + 11, 18, 22),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
          {/* bottom hairline (the instance's t0r0b1l0 stroke) */}
          <div
            style={{ ...abs(16, f.y + 43, 398, 1), background: "#E5D9C9" }}
          />
        </Fragment>
      ))}

      {/* 1523:3183 sticky checkout bar */}
      <div
        style={{
          ...abs(16, 1588, 398, 68),
          background: "#FFF6EC",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          className={playfair.className}
          style={{
            ...abs(10, 11, 74),
            fontSize: 22,
            lineHeight: "29.33px",
            fontWeight: 500,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          $159.00
        </div>
        <div
          className={notoSC.className}
          style={{
            ...abs(10, 41, 68),
            fontSize: 9,
            lineHeight: "10.8px",
            fontWeight: 500,
            color: "#C88217",
            whiteSpace: "nowrap",
          }}
        >
          You save $39.00
        </div>

        {/* 1523:3187 primary CTA → /checkout */}
        <Link
          href="/checkout"
          style={{
            ...abs(142, 10, 250, 48),
            display: "block",
            background: "#3B2F2F",
            borderRadius: 10,
          }}
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
          {/* the arrow is gold (#D4AF37) in the 07-29 export */}
          <img
            src={`${A}/I1523-3187_1523-389.svg`}
            alt="→"
            width={15}
            height={18}
            style={{
              ...abs(188, 15, 15, 18),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </Link>
      </div>
    </>
  );
}
