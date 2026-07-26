/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * A-1 · Homepage Hero and Intro — Figma node 138:57 of the VELORIA homepage
 * frame: cream hero panel with eyebrow / title / subtitle / body copy, two
 * pill CTAs, three benefit tiles, the hero gift-box photo window and its
 * static carousel dots. The header (549:87) is shared page chrome and is not
 * rebuilt here. All coordinates/colors are verbatim from the Figma REST data.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { notoSC, playfair } from "@/lib/fonts";

// Both CTA arrows (I155:53;145:55 / I155:56;145:58) share one glyph render.
const ARROW = "/veloria/home/465-156.svg";

// Benefit tiles 155:59 / 155:62 / 155:65 — icon glyphs served as exact SVG
// renders; x offsets are relative to each 118×62 tile.
const TILES = [
  {
    x: 26,
    icon: { src: "/veloria/home/155-60.svg", x: 51, w: 16, alt: "✿" },
    label: { x: 36, w: 46, lines: ["Made from", "Real Roses"] },
  },
  {
    x: 156,
    icon: { src: "/veloria/home/155-63.svg", x: 50.5, w: 17, alt: "✎" },
    label: { x: 32, w: 54, lines: ["Personalized", "Gift Options"] },
  },
  {
    x: 285,
    icon: { src: "/veloria/home/155-66.svg", x: 51, w: 16, alt: "▣" },
    label: { x: 37, w: 44, lines: ["Gift-Ready", "Packaging"] },
  },
];

export function A1() {
  return (
    // 138:57 module frame — children below are positioned relative to it.
    <div
      data-el="HOME-HERO-SECTION"
      style={{ ...abs(0, 32, 430, 811), background: "#FFF6EC", overflow: "hidden" }}
    >
      {/* 153:65 eyebrow — space runs kept via nbsp so HTML doesn't collapse them */}
      <div
        data-el="HOME-HERO-EYEBROW-TEXT"
        className={notoSC.className}
        style={{
          ...abs(115, 402, 200),
          fontSize: 9,
          lineHeight: "14px",
          fontWeight: 500,
          color: "#D4AF37",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {"—   G O L D R O S E   —"}
      </div>

      {/* 153:66 hero title */}
      <div
        data-el="HOME-HERO-TITLE"
        className={playfair.className}
        style={{
          ...abs(34, 429, 362),
          fontSize: 34,
          lineHeight: "38px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
        }}
      >
        Gold-Dipped Roses
        <br />
        Made from Real Roses
      </div>

      {/* 153:67 hero subtitle */}
      <div
        data-el="HOME-HERO-SUBTITLE"
        className={playfair.className}
        style={{
          ...abs(68, 517, 294),
          fontSize: 16,
          lineHeight: "22px",
          fontWeight: 400,
          color: "#F3C6D1",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Eternal Beauty, Endless Love
      </div>

      {/* 153:68 hero body — wraps naturally inside its 306px box */}
      <div
        data-el="HOME-HERO-BODY-TEXT"
        className={notoSC.className}
        style={{
          ...abs(62, 548, 306),
          fontSize: 11,
          lineHeight: "16px",
          fontWeight: 400,
          color: "#3B2F2F",
          textAlign: "center",
        }}
      >
        Discover real preserved rose gifts for anniversaries, birthdays, weddings and
        meaningful moments.
      </div>

      {/* 155:53 CTA · Shop Gold-Dipped Roses */}
      <Link
        data-el="HOME-HERO-SHOP-BTN"
        href="/shop"
        style={{ ...abs(32, 598, 366, 44), display: "block", background: "#3B2F2F", borderRadius: 10 }}
      >
        <div
          data-el="HOME-HERO-SHOP-TEXT"
          className={notoSC.className}
          style={{
            ...abs(79, 15, 181),
            fontSize: 12,
            lineHeight: "14.4px",
            fontWeight: 500,
            letterSpacing: 1.1,
            color: "#FFF6EC",
            whiteSpace: "nowrap",
          }}
        >
          SHOP GOLD-DIPPED ROSES
        </div>
        <img src={ARROW} alt="→" width={15} height={18} style={{ ...abs(272, 13, 15, 18), display: "block" }} />
      </Link>

      {/* 155:56 CTA · Create Personalized Rose Gift (placeholder, not clickable) */}
      <div
        data-el="HOME-HERO-PERSONALIZE-BTN"
        style={{
          ...abs(31, 654, 366, 44),
          background: "#FFF6EC",
          borderRadius: 10,
          boxShadow: "inset 0 0 0 1px #E5D9C9",
        }}
      >
        <div
          data-el="HOME-HERO-PERSONALIZE-TEXT"
          className={notoSC.className}
          style={{
            ...abs(48.5, 15, 242),
            fontSize: 12,
            lineHeight: "14.4px",
            fontWeight: 500,
            letterSpacing: 1.1,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          CREATE A PERSONALIZED ROSE GIFT
        </div>
        <img src={ARROW} alt="→" width={15} height={18} style={{ ...abs(302.5, 13, 15, 18), display: "block" }} />
      </div>

      {/* 155:59 / 155:62 / 155:65 benefit tiles (placeholders, not clickable) */}
      {TILES.map((t, i) => (
        <div
          key={t.x}
          data-el={`HOME-HERO-BENEFIT-CARD-${i + 1}`}
          style={{
            ...abs(t.x, 710, 118, 62),
            background: "#FFF6EC",
            borderRadius: 10,
            boxShadow: "inset 0 0 0 1px #E5D9C9",
            overflow: "hidden",
          }}
        >
          <img
            data-el={`HOME-HERO-BENEFIT-ICON-${i + 1}`}
            src={t.icon.src}
            alt={t.icon.alt}
            width={t.icon.w}
            height={19}
            style={{ ...abs(t.icon.x, 8.5, t.icon.w, 19), display: "block" }}
          />
          <div
            data-el={`HOME-HERO-BENEFIT-TEXT-${i + 1}`}
            className={notoSC.className}
            style={{
              ...abs(t.label.x, 30.5, t.label.w),
              fontSize: 9,
              lineHeight: "12px",
              fontWeight: 400,
              color: "#3B2F2F",
              textAlign: "center",
            }}
          >
            {t.label.lines[0]}
            <br />
            {t.label.lines[1]}
          </div>
        </div>
      ))}

      {/* 153:63 hero photo window + 549:97 dots — interactive per H-03; the
          source crop (153:64) bleeds 343px above the window and 1px past the
          left edge, and the frame clips it. */}
      <HeroCarousel />
    </div>
  );
}
