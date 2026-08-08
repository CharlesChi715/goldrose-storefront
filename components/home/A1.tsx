/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * A-1 · Homepage Hero and Intro — Figma node 2380:374 of the simplified
 * homepage frame 2380:370: cream hero panel with the gift-box photo window
 * and its carousel dots on top, then eyebrow / title / subtitle / body copy,
 * one pill CTA and two benefit tiles. The header (2380:388) is shared page
 * chrome (chrome.tsx `HomeHeader`) and is not rebuilt here. All
 * coordinates/colors are verbatim from the Figma REST data.
 *
 * 2026-08-04 sync: the design dropped the secondary "CREATE A PERSONALIZED
 * ROSE GIFT" CTA and the middle "Personalized Gift Options" tile, and widened
 * the two survivors to fill the row (176 + 174 instead of 3 × 118). The band
 * is 79px shorter as a result.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { notoSC, playfair } from "@/lib/fonts";
import type { HomeText } from "@/lib/home-content/registry";

// The CTA arrow glyph (I2380:379;1523:389) as an exact render.
const ARROW = "/eldreve/home/465-156.svg";

// Benefit tiles 2380:380 / 2380:383 — icon glyphs served as exact SVG
// renders; x offsets are relative to each tile's own box. The two labels are
// owner-editable, so they arrive as `c.benefit_1` / `c.benefit_2`.
const TILES = [
  {
    x: 32,
    w: 176,
    icon: { src: "/eldreve/home/155-60.svg", x: 80, w: 16, alt: "✿" },
    label: { x: 65, w: 46 },
  },
  {
    x: 224,
    w: 174,
    icon: { src: "/eldreve/home/155-66.svg", x: 79, w: 16, alt: "▣" },
    label: { x: 65, w: 44 },
  },
];

export function A1({ c }: { c: HomeText["hero"] }) {
  const benefits = [c.benefit_1, c.benefit_2];
  return (
    // 2380:374 module frame — children below are positioned relative to it.
    <div
      data-el="HOME-HERO-SECTION"
      style={{
        ...abs(0, 32, 430, 732),
        background: "#FFF6EC",
        overflow: "hidden",
      }}
    >
      {/* 2380:375 eyebrow — space runs kept via nbsp so HTML doesn't collapse them */}
      <div
        data-el="HOME-HERO-EYEBROW-TEXT"
        data-field="hero.eyebrow"
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
        {c.eyebrow}
      </div>

      {/* 2380:376 hero title */}
      <div
        data-el="HOME-HERO-TITLE"
        data-field="hero.title"
        className={playfair.className}
        style={{
          ...abs(34, 429, 362),
          fontSize: 34,
          lineHeight: "38px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "pre-line",
        }}
      >
        {c.title}
      </div>

      {/* 2380:377 hero subtitle */}
      <div
        data-el="HOME-HERO-SUBTITLE"
        data-field="hero.subtitle"
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
        {c.subtitle}
      </div>

      {/* 2380:378 hero body — wraps naturally inside its 306px box */}
      <div
        data-el="HOME-HERO-BODY-TEXT"
        data-field="hero.body"
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
        {c.body}
      </div>

      {/* 2380:379 CTA · Shop Gold-Dipped Roses */}
      <Link
        data-el="HOME-HERO-SHOP-BTN"
        data-field="hero.cta_href"
        href={c.cta_href}
        style={{
          ...abs(32, 598, 366, 44),
          display: "block",
          background: "#3B2F2F",
          borderRadius: 10,
        }}
      >
        <div
          data-el="HOME-HERO-SHOP-TEXT"
          data-field="hero.cta_label"
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
          {c.cta_label}
        </div>
        <img
          src={ARROW}
          alt="→"
          width={15}
          height={18}
          style={{ ...abs(272, 13, 15, 18), display: "block" }}
        />
      </Link>

      {/* 2380:380 / 2380:383 benefit tiles (statements, not links — the design
          gives them no prototype target) */}
      {TILES.map((t, i) => (
        <div
          key={t.x}
          data-el={`HOME-HERO-BENEFIT-CARD-${i + 1}`}
          style={{
            ...abs(t.x, 664, t.w, 62),
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
            data-field={`hero.benefit_${i + 1}`}
            className={notoSC.className}
            style={{
              ...abs(t.label.x, 30.5, t.label.w),
              fontSize: 9,
              lineHeight: "12px",
              fontWeight: 400,
              color: "#3B2F2F",
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {benefits[i]}
          </div>
        </div>
      ))}

      {/* 2380:386 hero photo window + 2380:394 dots — interactive per H-03.
          The window sits at the TOP of the band in this frame, directly under
          the header, with the dots overlaid on its lower edge. */}
      <HeroCarousel c={c} />
    </div>
  );
}
