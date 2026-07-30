"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The homepage "Best Sellers" rail (H-09) — Figma card 376:176 plus its photo
 * frame 157:76 and the four dots 377:190, rebuilt on the shared Carousel so it
 * auto-advances one card at a time, slowly, right to left (owner, 2026-07-26).
 *
 * ⚠️ MOCKED DATA: the design specifies one best-seller card, so the rail is
 * that card repeated four times — one real slide plus the three copies the
 * owner asked for — matching the four dots the design draws. The frame's
 * second, smaller card (376:183 "Enchanted Rose with LED Light", 184×349 at
 * y=237) is superseded by this uniform rail; its markup is in git history and
 * comes back when real best-seller products exist (OQ-3). Because every slide
 * is the first card, the peeking card is 250×366 at y=220 rather than the
 * design's smaller inset peek.
 */

import { abs } from "@/lib/figma-layout";
import {
  Carousel,
  RAIL_AUTOPLAY_MS,
  RAIL_SLIDE_MS,
} from "@/components/home/Carousel";
import { playfair, notoSC } from "@/lib/fonts";

/** 377:190 — dot x/size verbatim; only the colour changes as the rail moves. */
const DOTS = [
  { x: 185, y: 619, size: 9 },
  { x: 204, y: 619, size: 7 },
  { x: 221, y: 619, size: 7 },
  { x: 238, y: 619, size: 7 },
];

/** Card 376:176 is 250 wide; the next card starts at x=285, so the pitch is 267. */
const CARD_W = 250;
const CARD_H = 366;
const PITCH = 267;

/**
 * One best-seller card, drawn at its cell's own origin. `n` is the 1-based
 * slide number: the element names carry it so the
 * rail's repeated copies stay unique in the DOM. Built at runtime, so the
 * static naming test skips them, exactly as it does for Carousel's own
 * `name`-derived names.
 */
function Card({ n }: { n: number }) {
  return (
    <>
      {/* 376:177 image placeholder — the photo frame overlays it */}
      <div style={{ ...abs(0, 0, CARD_W, 240), background: "#F3C6D1" }} />
      {/* 157:76 photo frame: rounded top corners, clipping the bleeding photo */}
      <div
        style={{
          ...abs(0, 0, CARD_W, 240),
          borderRadius: "15px 15px 0 0",
          overflow: "hidden",
        }}
      >
        {/* 373:174 bleeds 1px left / 7px above its clipping frame (design
            values); maxWidth none so preflight can't squash 252px to 250px */}
        <img
          className="gr-photo"
          data-el={`HOME-FEATURED-PRODUCT-IMG-${n}`}
          src="/veloria/home/373-174.png"
          alt="Personalized gold-dipped rose"
          width={252}
          height={271}
          style={{
            ...abs(-1, -7, 252, 271),
            display: "block",
            objectFit: "cover",
            borderRadius: 22,
            maxWidth: "none",
          }}
        />
      </div>
      {/* 376:178 content */}
      <div style={{ ...abs(0, 240, CARD_W, 126), overflow: "hidden" }}>
        <div
          className={playfair.className}
          data-el={`HOME-FEATURED-PRODUCT-TITLE-${n}`}
          style={{
            ...abs(12, 12, 160),
            fontSize: 18,
            lineHeight: "22px",
            fontWeight: 500,
            color: "#3B2F2F",
          }}
        >
          Personalized Gold-Dipped Rose
        </div>
        <div
          className={notoSC.className}
          data-el={`HOME-FEATURED-PRODUCT-PRICE-${n}`}
          style={{
            ...abs(12, 57, 45),
            fontSize: 14,
            lineHeight: "16.8px",
            fontWeight: 500,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          $79.00
        </div>
        <div
          className={notoSC.className}
          data-el={`HOME-FEATURED-PRODUCT-NOTE-${n}`}
          style={{
            ...abs(12, 75, 160),
            fontSize: 11,
            lineHeight: "16px",
            fontWeight: 400,
            color: "#D4AF37",
          }}
        >
          Personalization available
        </div>
        {/* 376:182 cta — Figma-rendered strip */}
        <img
          data-el={`HOME-FEATURED-PRODUCT-CTA-${n}`}
          src="/veloria/home/376-182.svg"
          alt="View Product →"
          width={86}
          height={13}
          style={{
            ...abs(12, 108, 86, 13),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
      </div>
    </>
  );
}

/**
 * The Best Sellers card rail plus its four dots.
 *
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function BestSellersRail() {
  return (
    <Carousel
      // 18 → 430: the window ends at the canvas edge, so the next card peeks
      // exactly as far as the design shows it.
      window={{ left: 18, top: 220, width: 412, height: CARD_H }}
      count={DOTS.length}
      cellWidth={CARD_W}
      step={PITCH}
      autoplayMs={RAIL_AUTOPLAY_MS}
      slideMs={RAIL_SLIDE_MS}
      dots={DOTS}
      activeColor="#D4AF37"
      idleColor="#E5D9C9"
      href="/shop"
      label="best seller"
      name="HOME-FEATURED"
      renderSlide={(i) => (
        <div
          className="gr-card-zoom"
          style={{
            ...abs(0, 0, CARD_W, CARD_H),
            background: "#FFF6EC",
            borderRadius: 10,
            boxShadow: "inset 0 0 0 1px #E5D9C9",
            overflow: "hidden",
          }}
        >
          <Card n={i + 1} />
        </div>
      )}
    />
  );
}
