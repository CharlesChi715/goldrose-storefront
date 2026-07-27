"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * H-03 · the homepage hero carousel and its pagination dots (Figma 153:63 +
 * 549:97), built on the shared Carousel. The import rendered both as static
 * art — one photo and four inert ellipses.
 *
 * ⚠️ PLACEHOLDER: the design ships one hero photo against four dots, so slides
 * 2–4 repeat the first card, which is what makes the auto-play visible. Slide
 * 1 keeps the design's exact bleed framing (the crop overhangs 343px above the
 * window), so the home pixel baseline is unaffected while the track rests at
 * its first slide.
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
          src="/veloria/home/153-64.png"
          alt="Gold-dipped rose in a gift box"
          width={430}
          height={1003}
          style={{ ...abs(0, -343, 430, 1003), display: "block" }}
        />
      )}
    />
  );
}
