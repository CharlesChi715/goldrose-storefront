"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * H-03 · the homepage hero carousel and its pagination dots (Figma 153:63 +
 * 549:97), built on the shared Carousel. The import rendered both as static
 * art — one photo and four inert ellipses.
 *
 * The design ships ONE hero photo against four dots, so the registry defaults
 * all four slides to that same render (1523:1675 — the candle-lit "Real Rose"
 * box scene, a flat 430×317 photo since the 07-29 delivery). That keeps the
 * untouched page byte-identical to the import while giving the owner four real
 * slots: upload a different photo to any of slides 2–4 in Content → Home page
 * and the auto-play becomes a genuine slideshow, with no layout change at all
 * because the four dots were always there.
 */

import { Carousel } from "@/components/home/Carousel";
import { abs } from "@/lib/figma-layout";
import { fileUrl } from "@/lib/files-url";
import type { HomeText } from "@/lib/home-content/registry";

// 549:97 — keep every indicator at the same visible size. The active slide is
// communicated by colour, so it does not also need a larger first dot.
const DOTS = [
  { x: 185, y: 365, size: 7 },
  { x: 203, y: 365, size: 7 },
  { x: 220, y: 365, size: 7 },
  { x: 237, y: 365, size: 7 },
];

/**
 * The hero photo window plus its pagination dots, as an interactive carousel.
 *
 * @param c - The resolved `hero` section copy, supplying the four slide photos,
 *   their descriptions and the destination they share.
 * @returns The clipped hero track and the four dots.
 */
export function HeroCarousel({ c }: { c: HomeText["hero"] }) {
  // One entry per dot: the dot row is hand-placed at Figma's own irregular
  // pitch, so the slide count stays pinned to it rather than to the data.
  const slides = [
    { photo: c.photo_1, alt: c.photo_1_alt },
    { photo: c.photo_2, alt: c.photo_2_alt },
    { photo: c.photo_3, alt: c.photo_3_alt },
    { photo: c.photo_4, alt: c.photo_4_alt },
  ];

  return (
    <Carousel
      window={{ left: -1, top: 66, width: 430, height: 317 }}
      count={DOTS.length}
      dots={DOTS}
      activeColor="#D4AF37"
      idleColor="#FFF6EC"
      href={c.photo_href}
      label="hero slide"
      name="HOME-HERO"
      renderSlide={(i) => (
        <img
          src={fileUrl(slides[i].photo)}
          alt={slides[i].alt}
          width={430}
          height={317}
          style={{ ...abs(0, 0, 430, 317), display: "block" }}
        />
      )}
    />
  );
}
