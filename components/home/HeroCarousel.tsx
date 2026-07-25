"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * H-03 · the homepage hero carousel and its pagination dots (Figma 153:63 +
 * 549:97). The import rendered both as static art — one photo and four inert
 * ellipses — so the spec's swipe, dot taps, wrap-around and auto-play were all
 * missing (owner report, 2026-07-25).
 *
 * ⚠️ PLACEHOLDER DATA. The design ships a single hero photo but four dots, and
 * H-03 says the dot count comes from carousel data that does not exist yet
 * (OQ-3, real product content). Slides 2–4 therefore reuse existing catalog
 * photography, and every slide links to /shop rather than to "the
 * corresponding product detail page" — that mapping is not decided. Replace
 * SLIDES when the real carousel content lands.
 *
 * Slide 1 keeps the design's exact framing (the source crop bleeds 343px above
 * the window), so the pixel baseline is unaffected while the carousel rests at
 * its first slide.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { abs } from "@/components/veloria";

type Slide = {
  src: string;
  alt: string;
  /** Slide 1 reproduces the design's oversized bleed crop; the rest cover. */
  bleed?: boolean;
};

const SLIDES: Slide[] = [
  { src: "/veloria/home/153-64.png", alt: "Gold-dipped rose in a gift box", bleed: true },
  { src: "/veloria/home/162-97.png", alt: "GoldRose gift for Valentine's Day" },
  { src: "/veloria/home/436-279.png", alt: "GoldRose anniversary gift" },
  { src: "/veloria/home/436-293.png", alt: "GoldRose birthday gift" },
];

// 549:97 — the design draws the active dot at 9px and the rest at 7px, at
// fixed x positions. Only the colour changes as the slide advances; moving or
// resizing the dots would drift from the frame.
const DOTS = [
  { x: 184, size: 9 },
  { x: 203, size: 7 },
  { x: 220, size: 7 },
  { x: 237, size: 7 },
];

const AUTOPLAY_MS = 5000;

/**
 * The hero photo window plus its pagination dots, as an interactive carousel.
 *
 * @returns The clipped hero window and the four dots.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    // Wrap around at both ends, per H-03.
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    // Respect reduced-motion: no auto-play. This also keeps the pixel-diff
    // suite deterministic, which pins reducedMotion.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [index, paused, go]);

  return (
    <>
      {/* 153:63 hero photo window — the frame clips the bleeding crop. */}
      <div
        style={{ ...abs(-1, 66, 430, 317), overflow: "hidden" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          setPaused(true);
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          setPaused(false);
          if (start === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? start) - start;
          // Ignore taps and tiny drags; 40px is a deliberate swipe.
          if (Math.abs(dx) < 40) return;
          go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {SLIDES.map((slide, i) => (
          <Link
            key={slide.src + i}
            href="/shop"
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            style={{
              ...abs(0, 0, 430, 317),
              display: "block",
              opacity: i === index ? 1 : 0,
              // Only the visible slide takes pointer events, so the hidden
              // ones cannot swallow a swipe.
              pointerEvents: i === index ? "auto" : "none",
              transition: "opacity 400ms ease",
            }}
          >
            <img
              src={slide.src}
              alt={i === index ? slide.alt : ""}
              width={430}
              height={slide.bleed ? 1003 : 317}
              style={
                slide.bleed
                  ? { ...abs(0, -343, 430, 1003), display: "block" }
                  : { ...abs(0, 0, 430, 317), display: "block", objectFit: "cover" }
              }
            />
          </Link>
        ))}
      </div>

      {/* 549:97 pagination dots. */}
      {DOTS.map((dot, i) => (
        <button
          key={dot.x}
          type="button"
          onClick={() => go(i)}
          aria-label={`Show hero slide ${i + 1}`}
          aria-current={i === index}
          style={{
            ...abs(dot.x, 365, dot.size, dot.size),
            background: i === index ? "#D4AF37" : "#FFF6EC",
            borderRadius: 9999,
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        />
      ))}
    </>
  );
}
