"use client";
/**
 * ROLE OF THIS FILE
 * The promo strip's autoplay: several lines shown in turn, each sliding UP as
 * the next one arrives from below (owner, 2026-08-10).
 *
 * WHY A TRACK AND A CLONE, NOT A SWAP
 * The slides are stacked in one 32px-pitch column that translates upward, so the
 * outgoing line and the incoming line move together as one piece — the same
 * continuous-track idiom as the card rails (components/home/Carousel.tsx), just
 * on the other axis. The first line is repeated once at the bottom so the wrap
 * keeps travelling up: on reaching the clone the track jumps back to the real
 * first slide with the transition switched off, which is invisible because both
 * show the same line. Animating the index back to 0 instead would sweep the
 * whole strip downward once per cycle.
 *
 * WHY THE SLIDES ARE PASSED IN RATHER THAN BUILT HERE
 * Line 1 is not always text: while the slogan is still the design's, it is
 * Figma's own rendered strip (§11), and the two sit at different coordinates.
 * The server builds each slide with the geometry it needs and this file only
 * moves them, which also keeps every string a *server* prop — the admin picker
 * writes into these DOM nodes as the owner types, and React only reverts a
 * write when its own vdom value changes (see picker/patch.ts).
 *
 * ACCESSIBILITY
 * - Reduced motion keeps the rotation but drops the movement: the lines change
 *   in place. Freezing on line 1 instead would make the other lines unreachable
 *   for exactly the visitors who cannot ask them to move on.
 * - Pointer or keyboard focus on the strip pauses it, so a line can be read at
 *   its own pace (WCAG 2.2.2).
 */

import { useEffect, useState, type ReactNode } from "react";

/**
 * A vertically rotating promo strip.
 *
 * @param slides - One node per line, in play order; each is drawn inside its own
 *   430×`height` cell whose top-left is that cell's origin.
 * @param height - The strip's height in stage pixels; also the track's pitch.
 * @param cycleMs - How long each line is held before the next slides up.
 * @param slideMs - How long the upward movement itself takes.
 * @returns The clipped strip with its moving track.
 */
export function PromoRotator({
  slides,
  height,
  cycleMs,
  slideMs,
}: {
  slides: readonly ReactNode[];
  height: number;
  cycleMs: number;
  slideMs: number;
}) {
  const count = slides.length;
  // 0 … count-1 are the real lines; `count` is the clone of line 1 that the
  // wrap lands on before the silent jump home.
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Read once on mount rather than at render: the server has no matchMedia, and
  // a first client render that disagreed with the server's HTML is a hydration
  // mismatch — which React 19 resolves by re-rendering from its own props.
  useEffect(() => {
    const query = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = globalThis.setInterval(
      () => setIndex((current) => current + 1),
      cycleMs,
    );
    return () => globalThis.clearInterval(timer);
  }, [paused, count, cycleMs]);

  // Landed on the clone: once its slide has finished, go home without one.
  useEffect(() => {
    if (index !== count) return;
    const timer = globalThis.setTimeout(
      () => {
        setAnimate(false);
        setIndex(0);
      },
      reduced ? 0 : slideMs,
    );
    return () => globalThis.clearTimeout(timer);
  }, [index, count, slideMs, reduced]);

  // Re-arm the transition only after the browser has painted the jump, or it
  // would animate the jump it was switched off for.
  useEffect(() => {
    if (animate) return;
    const frame = globalThis.requestAnimationFrame(() =>
      globalThis.requestAnimationFrame(() => setAnimate(true)),
    );
    return () => globalThis.cancelAnimationFrame(frame);
  }, [animate]);

  const cells = [...slides, slides[0]];

  return (
    <div
      data-el="PROMO-ROTATOR"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 430,
        height,
        overflow: "hidden",
      }}
      onPointerEnter={(event) =>
        event.pointerType === "mouse" && setPaused(true)
      }
      onPointerLeave={(event) =>
        event.pointerType === "mouse" && setPaused(false)
      }
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 430,
          height: height * cells.length,
          transform: `translateY(${-index * height}px)`,
          transition:
            animate && !reduced
              ? `transform ${slideMs}ms cubic-bezier(0.4, 0, 0.2, 1)`
              : "none",
        }}
      >
        {cells.map((slide, cell) => (
          <div
            key={cell}
            // The clone repeats line 1 verbatim, so it is hidden from assistive
            // tech — a reader should hear the strip's lines once each.
            aria-hidden={cell === count ? true : undefined}
            style={{
              position: "absolute",
              left: 0,
              top: cell * height,
              width: 430,
              height,
            }}
          >
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
}
