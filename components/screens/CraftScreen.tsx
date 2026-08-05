/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /craft — pixel-exact implementation of MECRAFT-OUR-CRAFT-IMAGE-LED-PAGE
 * (1573:107, 430×1368, 07-29 delivery; imported from the live frame after
 * it stabilized — the team was still growing it during the batch, so a
 * re-check next round is cheap insurance). The craft page the homepage's
 * H-17/H-31 cards and the menu drawer's OUR CRAFT row have pointed at since
 * 07-25. Unlike its STORY sibling, this page ships real photography
 * (workshop hero + three process shots). Header brand is the design's own
 * "ELDREVE" Playfair text.
 *
 * Wiring: header cart → /checkout (the live cart), SHOP THE COLLECTION →
 * /shop, READ OUR STORY → /story. The frame draws a five-tab glyph TEXT nav
 * ("Me" active — its STORY sibling draws the owner-art band instead); the
 * shared owner-art BottomNav ships on both for one consistent chrome (DQ
 * raised on the sibling nav mismatch), so the canvas ends at the frame's
 * nav top (1288) + 59.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { abs, txt } from "@/lib/figma-layout";
import { playfair } from "@/lib/fonts";

const A = "/veloria/screens";
const INK = "#3B2F2F";
const GOLD = "#D4AF37";
const SAND = "#E5D9C9";
const CREAM = "#FFF6EC";
const PINK = "#F3C6D1";

function card(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  bg: string | null = CREAM,
): React.CSSProperties {
  return {
    ...abs(x, y, w, h),
    ...(bg ? { background: bg } : {}),
    boxShadow: `inset 0 0 0 1px ${SAND}`,
    borderRadius: r,
  };
}

/** Ink-cropped SVG export of a symbol TEXT node, centred in its node box. */
function Glyph({
  src,
  x,
  y,
  w,
  h,
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <img
      src={src}
      alt=""
      width={w}
      height={h}
      style={{ ...abs(x, y, w, h), display: "block", objectFit: "none" }}
    />
  );
}

/** 1580:119/124/129 · the three process cards (image alternates sides). */
const STEPS = [
  {
    y: 503,
    img: "1580-120",
    imgX: 26,
    copyX: 194,
    title: "01  Select",
    tw: 88,
    body: "Chosen for shape and structure.",
  },
  {
    y: 651,
    img: "1580-128",
    imgX: 250,
    copyX: 26,
    title: "02  Preserve",
    tw: 117,
    body: "The natural form is carefully held.",
  },
  {
    y: 799,
    img: "1580-130",
    imgX: 26,
    copyX: 194,
    title: "03  Finish",
    tw: 93,
    body: "Refined, inspected, and protected.",
  },
] as const;

export function CraftScreen() {
  return (
    <>
      {/* 1573:113 · header — ‹ back, ELDREVE brand line, title, ornament, cart */}
      <BackButton
        fallback="/"
        src={`${A}/1573-114.svg`}
        style={abs(16, 16, 12, 46)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(152.5, 16, 125),
          ...txt(29, 38.7, GOLD),
          fontWeight: 500,
        }}
      >
        ELDREVE
      </div>
      <Link
        href="/checkout"
        aria-label="Cart"
        style={{ ...abs(386, 23, 24, 24), display: "block" }}
      >
        <img
          src={`${A}/1586-113.svg`}
          alt=""
          width={24}
          height={24}
          style={{ display: "block" }}
        />
      </Link>
      <div
        className={playfair.className}
        style={{
          ...abs(139.5, 60, 151),
          ...txt(34, 45.3, INK),
          fontWeight: 600,
        }}
      >
        Our Craft
      </div>
      <Glyph src={`${A}/1573-118.svg`} x={192.5} y={104} w={45} h={14} />

      {/* 1580:109 · intro card */}
      <div style={card(16, 140, 398, 108, 16)} />
      <div
        className={playfair.className}
        style={{ ...abs(36, 160, 186), ...txt(24, 32, INK), fontWeight: 500 }}
      >
        Craft you can see
      </div>
      <div style={{ ...abs(36, 204, 302), ...txt(13, 15.6, INK) }}>
        A real rose. Preserved by hand. Finished with care.
      </div>
      <img
        src={`${A}/1580-112.svg`}
        alt=""
        width={30}
        height={30}
        style={{ ...abs(360, 179, 30, 30), display: "block" }}
      />

      {/* 1580:114 · workshop hero + caption */}
      <img
        src={`${A}/1580-115.png`}
        alt=""
        width={398}
        height={172}
        style={{
          ...abs(16, 260, 398, 172),
          borderRadius: 16,
          display: "block",
          objectFit: "cover",
        }}
      />
      <div
        style={{ ...abs(16, 437, 223), ...txt(10, 12, GOLD), fontWeight: 500 }}
      >
        {"REAL ROSE  ·  HAND-FINISHED  ·  INSPECTED"}
      </div>

      {/* 1580:117 · process cards */}
      <div
        className={playfair.className}
        style={{ ...abs(16, 461, 265), ...txt(24, 32, INK), fontWeight: 500 }}
      >
        From bloom to keepsake
      </div>
      {STEPS.map((s) => (
        <div key={s.title}>
          <div style={card(16, s.y, 398, 138, 10)} />
          <img
            src={`${A}/${s.img}.png`}
            alt=""
            width={154}
            height={118}
            style={{
              ...abs(s.imgX, s.y + 10, 154, 118),
              borderRadius: 10,
              display: "block",
              objectFit: "cover",
            }}
          />
          <div
            className={playfair.className}
            style={{
              ...abs(s.copyX, s.y + 35.5, s.tw + 60),
              ...txt(21, 28, GOLD),
              fontWeight: 500,
            }}
          >
            {s.title}
          </div>
          <div
            style={{
              ...abs(s.copyX, s.y + 70.5, 210),
              ...txt(12, 14.4, INK),
              whiteSpace: "normal",
            }}
          >
            {s.body}
          </div>
        </div>
      ))}

      {/* 1580:134 · quality cards */}
      <div
        className={playfair.className}
        style={{ ...abs(16, 949, 217), ...txt(23, 30.7, INK), fontWeight: 500 }}
      >
        Quality you can trust
      </div>
      {(
        [
          {
            x: 16,
            glyph: "1580-138",
            gx: 68.1,
            gw: 23,
            label: "Real rose",
            lx: 52.1,
            lw: 55,
          },
          {
            x: 151.3,
            glyph: "1580-141",
            gx: 203.4,
            gw: 15,
            label: "Hand check",
            lx: 179.9,
            lw: 70,
          },
          {
            x: 286.6,
            glyph: "1580-144",
            gx: 338.8,
            gw: 23,
            label: "Gift-ready",
            lx: 319.3,
            lw: 62,
          },
        ] as const
      ).map((q) => (
        <div key={q.label}>
          <div style={card(q.x, 988, 127.3, 84, 10, null)} />
          <Glyph
            src={`${A}/${q.glyph}.svg`}
            x={q.gx}
            y={1000}
            w={q.gw}
            h={28}
          />
          <div
            className={playfair.className}
            style={{
              ...abs(q.lx, 1040, q.lw),
              ...txt(13, 17.3, INK),
              fontWeight: 500,
            }}
          >
            {q.label}
          </div>
        </div>
      ))}

      {/* 1580:146 · closing card — the delivery's one pink accent here */}
      <div style={card(16, 1084, 398, 84, 16, PINK)} />
      <img
        src={`${A}/1580-149.svg`}
        alt=""
        width={30}
        height={30}
        style={{ ...abs(36, 1111, 30, 30), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{ ...abs(86, 1098, 171), ...txt(21, 28, INK), fontWeight: 500 }}
      >
        Crafted with care.
      </div>
      <div style={{ ...abs(86, 1133, 129), ...txt(11, 13.2, GOLD) }}>
        Made to be remembered.
      </div>

      {/* 1580:151 · CTAs — component-board button instances */}
      <Link
        href="/shop"
        aria-label="Shop the collection"
        style={{
          ...abs(16, 1180, 398, 44),
          background: INK,
          borderRadius: 10,
          display: "block",
        }}
      >
        <span
          style={{
            ...abs(108, 15, 155),
            ...txt(12, 14.4, CREAM),
            fontWeight: 500,
            letterSpacing: 1.1,
            display: "block",
          }}
        >
          SHOP THE COLLECTION
        </span>
        <span
          style={{
            ...abs(275, 13, 15),
            ...txt(15, 18, GOLD),
            fontWeight: 500,
            display: "block",
          }}
        >
          →
        </span>
      </Link>
      <Link
        href="/story"
        aria-label="Read our story"
        style={{
          ...abs(16, 1232, 398, 44),
          background: CREAM,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 10,
          display: "block",
        }}
      >
        <span
          style={{
            ...abs(128.5, 15, 114),
            ...txt(12, 14.4, INK),
            fontWeight: 500,
            letterSpacing: 1.1,
            display: "block",
          }}
        >
          READ OUR STORY
        </span>
        <span
          style={{
            ...abs(254.5, 13, 15),
            ...txt(15, 18, GOLD),
            fontWeight: 500,
            display: "block",
          }}
        >
          →
        </span>
      </Link>
    </>
  );
}
