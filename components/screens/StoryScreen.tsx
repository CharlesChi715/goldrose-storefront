/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /story — pixel-exact implementation of MESTORY-OUR-STORY-IMAGE-LED-PAGE
 * (1573:106, 430×1276, 07-29 delivery). The brand-story page the homepage's
 * H-34 story card and the menu drawer's OUR STORY row have waited for since
 * 07-25. "Image-led" is aspirational for now: the hero and the two memory
 * cards ship as the design's own #EDE0D1 placeholder blocks (no imagery
 * drawn at the pinned snapshot); the team dropped real photos in the same
 * day, so the hero and both memory cards now carry their photography.
 * Header brand is the design's own "ELDREVE" Playfair text.
 *
 * Wiring: SHOP THE COLLECTION → /shop, EXPLORE OUR CRAFT → /craft (both
 * CTAs are instances from the delivery's new component board). The bottom
 * band is the owner-art nav → shared BottomNav via ScaleFrame (canvas =
 * navY + 59 = 1260; the frame's trailing 16px pad is dropped, the bag
 * precedent).
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { abs, txt } from "@/lib/figma-layout";
import { playfair } from "@/lib/fonts";

const A = "/eldreve/screens";
const INK = "#3B2F2F";
const GOLD = "#D4AF37";
const SAND = "#E5D9C9";
const CREAM = "#FFF6EC";

function card(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  bg = CREAM,
): React.CSSProperties {
  return {
    ...abs(x, y, w, h),
    background: bg,
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

export function StoryScreen() {
  return (
    <>
      {/* 1573:108 · header — ‹ back, ELDREVE brand line, title, ornament */}
      <BackButton
        fallback="/"
        src={`${A}/1573-109.svg`}
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
      <div
        className={playfair.className}
        style={{
          ...abs(138.5, 60, 153),
          ...txt(34, 45.3, INK),
          fontWeight: 600,
        }}
      >
        Our Story
      </div>
      <Glyph src={`${A}/1573-112.svg`} x={192.5} y={104} w={45} h={14} />

      {/* 1573:119 · intro card */}
      <div style={card(16, 140, 398, 120, 16)} />
      <div
        className={playfair.className}
        style={{ ...abs(36, 162, 362), ...txt(25, 33.3, INK), fontWeight: 500 }}
      >
        Every rose begins with a reason.
      </div>
      <div style={{ ...abs(36, 208, 255), ...txt(13, 15.6, INK) }}>
        A moment to celebrate. A person to thank.
      </div>
      <img
        src={`${A}/1573-122.svg`}
        alt=""
        width={30}
        height={30}
        style={{ ...abs(360, 184, 30, 30), display: "block" }}
      />

      {/* 1573:124 · hero — real photo since the team's same-day edit */}
      <img
        src={`${A}/1573-125.png`}
        alt=""
        width={398}
        height={172}
        style={{
          ...abs(16, 272, 398, 172),
          borderRadius: 16,
          display: "block",
          objectFit: "cover",
        }}
      />
      <div
        style={{ ...abs(16, 449, 142), ...txt(10, 12, GOLD), fontWeight: 500 }}
      >
        A REAL ROSE. A LASTING GIFT.
      </div>

      {/* 1574:105 · memory cards */}
      <div
        className={playfair.className}
        style={{ ...abs(16, 473, 274), ...txt(24, 32, INK), fontWeight: 500 }}
      >
        A gift becomes a memory
      </div>
      <div style={{ ...abs(16, 513, 142), ...txt(12, 14.4, INK) }}>
        Less to read. More to feel.
      </div>
      <div style={card(16, 535, 194, 133, 10, "transparent")} />
      <img
        src={`${A}/1574-110.png`}
        alt=""
        width={182}
        height={100}
        style={{
          ...abs(22, 541, 182, 100),
          borderRadius: 10,
          display: "block",
          objectFit: "cover",
        }}
      />
      <div style={{ ...abs(22, 647, 136), ...txt(11, 13.2, GOLD) }}>
        Anniversary, remembered.
      </div>
      <div style={card(220, 535, 194, 133, 10, "transparent")} />
      <img
        src={`${A}/1574-113.png`}
        alt=""
        width={182}
        height={100}
        style={{
          ...abs(226, 541, 182, 100),
          borderRadius: 10,
          display: "block",
          objectFit: "cover",
        }}
      />
      <div style={{ ...abs(226, 647, 88), ...txt(11, 13.2, GOLD) }}>
        A note that stays.
      </div>

      {/* 1575:105 · moments scene — the page's one real photo */}
      <img
        src={`${A}/1575-105.png`}
        alt=""
        width={398}
        height={178}
        style={{
          ...abs(16, 680, 398, 178),
          borderRadius: 16,
          display: "block",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          ...abs(32, 790, 366, 52),
          background: CREAM,
          borderRadius: 16,
        }}
      />
      <div
        className={playfair.className}
        style={{ ...abs(46, 797, 213), ...txt(18, 24, INK), fontWeight: 500 }}
      >
        For the moments that stay
      </div>
      <div style={{ ...abs(46, 821, 189), ...txt(10, 12, GOLD) }}>
        {"LOVE  ·  GRATITUDE  ·  REMEMBRANCE"}
      </div>

      {/* 1575:109 · beliefs */}
      <div
        className={playfair.className}
        style={{ ...abs(16, 870, 167), ...txt(23, 30.7, INK), fontWeight: 500 }}
      >
        What we believe
      </div>
      {(
        [
          {
            x: 16,
            glyph: "1575-113",
            gx: 67.6,
            label: "Meaning",
            lx: 52.1,
            lw: 55,
          },
          {
            x: 151.3,
            glyph: "1575-116",
            gx: 202.9,
            label: "Sincerity",
            lx: 186.4,
            lw: 57,
          },
          {
            x: 286.6,
            glyph: "1575-119",
            gx: 338.3,
            label: "Memory",
            lx: 323.8,
            lw: 53,
          },
        ] as const
      ).map((b) => (
        <div key={b.label}>
          <div style={card(b.x, 909, 127.3, 84, 10, "transparent")} />
          <Glyph src={`${A}/${b.glyph}.svg`} x={b.gx} y={921} w={24} h={29} />
          <div
            className={playfair.className}
            style={{
              ...abs(b.lx, 961, b.lw),
              ...txt(14, 18.7, INK),
              fontWeight: 500,
            }}
          >
            {b.label}
          </div>
        </div>
      ))}

      {/* 1576:105 · CTAs — component-board button instances */}
      <Link
        href="/shop"
        aria-label="Shop the collection"
        style={{
          ...abs(16, 1005, 398, 44),
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
        href="/craft"
        aria-label="Explore our craft"
        style={{
          ...abs(16, 1057, 398, 44),
          background: CREAM,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 10,
          display: "block",
        }}
      >
        <span
          style={{
            ...abs(116, 15, 139),
            ...txt(12, 14.4, INK),
            fontWeight: 500,
            letterSpacing: 1.1,
            display: "block",
          }}
        >
          EXPLORE OUR CRAFT
        </span>
        <span
          style={{
            ...abs(267, 13, 15),
            ...txt(15, 18, GOLD),
            fontWeight: 500,
            display: "block",
          }}
        >
          →
        </span>
      </Link>

      {/* 1578:109 · closing card */}
      <div style={card(16, 1113, 398, 76, 16)} />
      <div
        className={playfair.className}
        style={{
          ...abs(115.5, 1127, 199),
          ...txt(20, 26.7, INK),
          fontWeight: 500,
        }}
      >
        Every gift tells a story.
      </div>
      <div style={{ ...abs(147.5, 1158, 135), ...txt(11, 13.2, GOLD) }}>
        Let yours be remembered.
      </div>
    </>
  );
}
