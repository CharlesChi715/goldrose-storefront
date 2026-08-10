/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * A-1 · Homepage Hero and Intro — Figma node 2380:374 of the simplified
 * homepage frame 2380:370: cream hero panel with the gift-box photo window
 * and its carousel dots on top, then eyebrow / title / subtitle / body copy,
 * closing on one pill CTA. The header (2380:388) is shared page chrome
 * (chrome.tsx `HomeHeader`) and is not rebuilt here. All coordinates/colors
 * are verbatim from the Figma REST data.
 *
 * 2026-08-10 sync: the band is the one that changed SHAPE (732 → 749). The
 * two benefit tiles at its foot are deleted at source; the photo window grew
 * 317 → 405 and now bleeds a taller source behind its opening; and every text
 * node was reset by the page-wide typography pass — most visibly the subtitle,
 * which went 16px pink to 24px GOLD, and the CTA label, which stopped being
 * tracked-out 12px caps and became 20px sentence case in Goudy.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { goudy, notoSC, playfair } from "@/lib/fonts";
import type { HomeFrames } from "@/lib/home-content/frames";
import type { HomeText } from "@/lib/home-content/registry";

// The CTA arrow glyph (I2380:379;1523:389) as an exact render.
const ARROW = "/eldreve/home/465-156.svg";

export function A1({
  c,
  frames,
}: {
  c: HomeText["hero"];
  frames?: HomeFrames;
}) {
  return (
    // 2380:374 module frame — children below are positioned relative to it.
    <div
      data-el="HOME-HERO-SECTION"
      style={{
        ...abs(0, 32, 430, 749),
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
          ...abs(113, 478, 200),
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
          ...abs(32, 494, 362),
          fontSize: 36,
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
          ...abs(55, 583, 332),
          fontSize: 24,
          lineHeight: "22px",
          fontWeight: 400,
          // The design sets this one line ITALIC — the only italic in A-1.
          fontStyle: "italic",
          color: "#D4AF37",
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
          ...abs(61, 626, 306),
          fontSize: 13,
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
          ...abs(32, 690, 366, 44),
          display: "block",
          background: "#3B2F2F",
          borderRadius: 10,
        }}
      >
        <div
          data-el="HOME-HERO-SHOP-TEXT"
          data-field="hero.cta_label"
          className={goudy.className}
          style={{
            ...abs(49, 7, 242),
            fontSize: 20,
            lineHeight: "30px",
            fontWeight: 400,
            letterSpacing: 1.1,
            color: "#FFF6EC",
            textAlign: "center",
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
          style={{ ...abs(303, 13, 15, 18), display: "block" }}
        />
      </Link>

      {/* The two benefit tiles that used to close this band (2380:380 /
          2380:383) are deleted at source in this revision, along with their
          two editable labels. */}

      {/* 2380:386 hero photo window + 2380:394 dots — interactive per H-03.
          The window sits at the TOP of the band in this frame, directly under
          the header, with the dots overlaid on its lower edge. */}
      <HeroCarousel c={c} frames={frames} />
    </div>
  );
}
