"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * H-03 · the homepage hero carousel and its pagination dots (Figma 153:63 +
 * 549:97), built on the shared Carousel. The import rendered both as static
 * art — one photo and four inert ellipses.
 *
 * ⚠️ PLACEHOLDER: the design ships one hero photo against four dots, so slides
 * 2–4 repeat the first card, which is what makes the auto-play visible. The
 * 07-29 delivery replaced the slide-1 art with a flat 430×317 photo
 * (1523:1675 — the candle-lit "Real Rose" box scene), so the old 343px
 * overhang crop is gone.
 */

import { Carousel } from "@/components/home/Carousel";
import { abs } from "@/lib/figma-layout";

// 549:97 — the design draws the active dot at 9px and the rest at 7px, at
// fixed x positions. Only the colour changes as the slide advances; moving or
// resizing the dots would drift from the frame.
const DOTS = [
  { x: 184, y: 365, size: 9 },
  { x: 203, y: 365, size: 7 },
  { x: 220, y: 365, size: 7 },
  { x: 237, y: 365, size: 7 },
];

/**
 * The hero photo window plus its pagination dots, as an interactive carousel.
 *
 * @returns The clipped hero track and the four dots.
 */
export function HeroCarousel() {
  return (
    <Carousel
      window={{ left: -1, top: 66, width: 430, height: 317 }}
      count={DOTS.length}
      dots={DOTS}
      activeColor="#D4AF37"
      idleColor="#FFF6EC"
      label="hero slide"
      name="HOME-HERO"
      renderSlide={() => (
        <img
          src="/veloria/screens/1523-1675.png"
          alt="Gold-dipped rose in a gift box"
          width={430}
          height={317}
          style={{ ...abs(0, 0, 430, 317), display: "block" }}
        />
      )}
    />
  );
}
