"use client";
/**
 * ROLE OF THIS FILE
 * The shared homepage carousel (H-03, H-19 and the other card rails). The
 * Figma import rendered every rail as static art with inert pagination dots,
 * so none of the spec's behaviour existed: no swipe, no dot taps, no
 * wrap-around, no auto-play.
 *
 * Slides move as a continuous horizontal track — the outgoing slide travels
 * left while the next arrives from the right — rather than crossfading, which
 * is what the owner asked for (2026-07-25).
 *
 * ⚠️ PLACEHOLDER: the rails repeat their first card, because the real carousel
 * content does not exist yet (OQ-3) and the design parks its extra rail items
 * off-canvas. Cards link to /placeholder because the IxD table's "corresponding
 * product detail page" mapping is undecided. Both go away with real content.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { abs } from "@/components/veloria";

/** Where a carousel's cards live on the module canvas. */
export type Window = { left: number; top: number; width: number; height: number };

/** One pagination dot, at the exact position/size the design draws it. */
export type Dot = { x: number; y: number; size: number };

/** Auto-play interval. Deliberately brisk — the owner asked for faster. */
export const AUTOPLAY_MS = 1800;

const SLIDE_MS = 420;

/**
 * A horizontally sliding carousel with pagination dots.
 *
 * Renders `count` cells inside `window`; `renderSlide` draws each one at cell
 * coordinates (0,0 is the cell's own top-left). The track translates so the
 * active cell fills the window.
 *
 * @param window - Position and size of the clipped viewport on the canvas.
 * @param count - Number of slides.
 * @param dots - Dot positions/sizes, verbatim from the design.
 * @param activeColor - Dot colour when current.
 * @param idleColor - Dot colour when not current.
 * @param href - Destination for a card tap.
 * @param label - Human name used in the dots' accessible labels.
 * @param renderSlide - Draws slide `i` inside its cell.
 * @returns The clipped track plus its dots.
 */
export function Carousel({
  window: win,
  count,
  dots,
  activeColor,
  idleColor,
  href = "/placeholder",
  label,
  renderSlide,
}: {
  window: Window;
  count: number;
  dots: Dot[];
  activeColor: string;
  idleColor: string;
  href?: string;
  label: string;
  renderSlide: (index: number) => React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused) return;
    // Reduced motion disables auto-play; the pixel suite pins it, so baselines
    // stay parked on slide 1.
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = globalThis.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => globalThis.clearInterval(timer);
  }, [index, paused, go]);

  return (
    <>
      <div
        style={{ ...abs(win.left, win.top, win.width, win.height), overflow: "hidden" }}
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
          if (Math.abs(dx) < 40) return; // a tap, not a swipe
          go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {/* The track: one cell per slide, shifted so the active cell shows. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: win.width * count,
            height: win.height,
            transform: `translateX(${-index * win.width}px)`,
            transition: `transform ${SLIDE_MS}ms ease`,
          }}
        >
          {Array.from({ length: count }, (_, i) => (
            <Link
              key={i}
              href={href}
              aria-label={`${label} ${i + 1}`}
              tabIndex={i === index ? 0 : -1}
              style={{
                position: "absolute",
                left: i * win.width,
                top: 0,
                width: win.width,
                height: win.height,
                display: "block",
                overflow: "hidden",
              }}
            >
              {renderSlide(i)}
            </Link>
          ))}
        </div>
      </div>

      {dots.map((dot, i) => (
        <button
          key={`${dot.x}-${dot.y}`}
          type="button"
          onClick={() => go(i)}
          aria-label={`Show ${label} ${i + 1}`}
          aria-current={i === index}
          style={{
            ...abs(dot.x, dot.y, dot.size, dot.size),
            background: i === index ? activeColor : idleColor,
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
