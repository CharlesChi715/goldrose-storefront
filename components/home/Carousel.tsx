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
 * The track follows the finger: it tracks the pointer pixel-for-pixel while
 * held, so pausing mid-swipe leaves the slide parked wherever the finger
 * stopped, and only the release decides whether to advance or spring back
 * (owner, 2026-07-25).
 *
 * ⚠️ PLACEHOLDER: the rails repeat their first card, because the real carousel
 * content does not exist yet (OQ-3) and the design parks its extra rail items
 * off-canvas. Cards link to /placeholder because the IxD table's "corresponding
 * product detail page" mapping is undecided. Both go away with real content.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { abs } from "@/lib/figma-layout";

/** Where a carousel's cards live on the module canvas. */
export type Window = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** One pagination dot, at the exact position/size the design draws it. */
export type Dot = { x: number; y: number; size: number };

/** Auto-play interval. Deliberately brisk — the owner asked for faster. */
export const AUTOPLAY_MS = 1800;

const SLIDE_MS = 420;

/**
 * The four card rails advance one card at a time and the owner asked for them
 * to move SLOWLY (2026-07-26), so they override both timings: a long pause on
 * each card and a long glide between them.
 *
 * These are the DESIGN defaults. Since 2026-08-07 the live values come from the
 * registry's `motion` section (Content → Home page → Slideshow speed) and are
 * threaded to every rail as one shared `timing` prop, so the four never drift
 * apart. The registry's bounds keep the glide strictly shorter than the cycle,
 * which is what stops a rail advancing before it has finished sliding.
 */
export const RAIL_AUTOPLAY_MS = 4200;
export const RAIL_SLIDE_MS = 900;

/** The shared rail timing, resolved from the registry and passed down. */
export type RailTiming = { autoplayMs: number; slideMs: number };

/** The design's own timing, used when nothing has been saved. */
export const DESIGN_RAIL_TIMING: RailTiming = {
  autoplayMs: RAIL_AUTOPLAY_MS,
  slideMs: RAIL_SLIDE_MS,
};

/**
 * Turn the registry's two stored strings into a usable timing.
 *
 * Falls back to the design value per field rather than for the pair, so one
 * unreadable slot cannot silently retime the other — and a rail always gets a
 * number, never NaN, which would make setInterval fire continuously.
 *
 * @param cycle - The stored "how long each card stays" value.
 * @param glide - The stored "how long the slide takes" value.
 * @returns The timing to hand to every rail.
 */
export function railTiming(cycle: string, glide: string): RailTiming {
  const parsedCycle = Number(cycle);
  const parsedGlide = Number(glide);
  return {
    autoplayMs:
      Number.isFinite(parsedCycle) && parsedCycle > 0
        ? parsedCycle
        : RAIL_AUTOPLAY_MS,
    slideMs:
      Number.isFinite(parsedGlide) && parsedGlide > 0
        ? parsedGlide
        : RAIL_SLIDE_MS,
  };
}

/** Release travel that commits to the neighbouring slide; less springs back. */
const SWIPE_PX = 40;

/** Pointer travel below this is a tap on the card, not a drag. */
const TAP_SLOP = 6;

/**
 * Drag past the first/last cell is damped — the track has no cell rendered
 * beyond the ends, so the finger would otherwise drag blank canvas into view.
 *
 * The damping is a *display* effect only. `go()` wraps, so an edge swipe does
 * have somewhere to land, and the commit decision therefore reads the raw
 * finger travel (see `rawX`). Testing the damped value instead — as this did
 * until 2026-08-07 — silently tripled the swipe distance needed at either end,
 * and since auto-play parks each rail on a different slide, that read as "the
 * carousel isn't swipeable".
 */
const EDGE_RESISTANCE = 3;

/**
 * A horizontally sliding carousel with pagination dots.
 *
 * Renders `count` cells inside `window`; `renderSlide` draws each one at cell
 * coordinates (0,0 is the cell's own top-left). The track translates so the
 * active cell fills the window.
 *
 * A rail (several cards visible, advancing one card at a time) sets
 * `cellWidth`/`step` smaller than the window: the window then shows the active
 * card plus the edge of the next one, exactly as the design draws it.
 *
 * @param window - Position and size of the clipped viewport on the canvas.
 * @param count - Number of slides.
 * @param dots - Dot positions/sizes, verbatim from the design.
 * @param activeColor - Dot colour when current.
 * @param idleColor - Dot colour when not current.
 * @param href - Destination for a card tap. Ignored when `onActivate` is set.
 * @param onActivate - Tap handler; when given, slides are buttons rather than
 * links (the PDP hero opens an overlay instead of navigating).
 * @param radius - Corner radius of the clipped window.
 * @param label - Human name used in the dots' accessible labels.
 * @param name - Element-name prefix, e.g.
 * `HOME-HERO`. Stamps `data-el` on the window (`-MEDIA`), each slide
 * (`-SLIDE-n`) and each dot (`-DOT-n`). Omit to leave the rail untagged.
 * @param cellWidth - Width of one slide; defaults to the whole window.
 * @param step - Distance the track travels per slide; defaults to `cellWidth`.
 * @param autoplayMs - Pause on each slide before advancing.
 * @param slideMs - Duration of the slide animation itself.
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
  onActivate,
  radius,
  label,
  name,
  cellWidth,
  step,
  autoplayMs = AUTOPLAY_MS,
  slideMs = SLIDE_MS,
  renderSlide,
}: {
  window: Window;
  count: number;
  dots: Dot[];
  activeColor: string;
  idleColor: string;
  href?: string;
  onActivate?: () => void;
  radius?: number;
  label: string;
  name?: string;
  cellWidth?: number;
  step?: number;
  autoplayMs?: number;
  slideMs?: number;
  renderSlide: (index: number) => React.ReactNode;
}) {
  const cell = cellWidth ?? win.width;
  const pitch = step ?? cell;
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  // Live pointer offset in px; null = no pointer down, so it doubles as the
  // "is dragging" flag (a resting finger still holds a fixed offset).
  const [drag, setDrag] = useState<number | null>(null);
  const startX = useRef(0);
  const dragged = useRef(false);
  // Undamped finger travel. `drag` may be divided by EDGE_RESISTANCE for the
  // transform, so it cannot be what decides whether the swipe commits.
  const rawX = useRef(0);

  const paused = hovering || drag !== null;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  /** Release: commit to the neighbour if the finger travelled far enough. */
  const endDrag = () => {
    if (drag === null) return;
    // The finger's own travel, not the possibly-damped transform offset.
    const dx = rawX.current;
    setDrag(null);
    rawX.current = 0;
    if (Math.abs(dx) >= SWIPE_PX) go(index + (dx < 0 ? 1 : -1));
  };

  useEffect(() => {
    if (paused) return;
    // Reduced motion disables auto-play; the pixel suite pins it, so baselines
    // stay parked on slide 1.
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = globalThis.setInterval(() => go(index + 1), autoplayMs);
    return () => globalThis.clearInterval(timer);
  }, [index, paused, go, autoplayMs]);

  return (
    <>
      <div
        data-el={name && `${name}-MEDIA`}
        style={{
          ...abs(win.left, win.top, win.width, win.height),
          overflow: "hidden",
          ...(radius != null ? { borderRadius: radius } : {}),
          // Horizontal drags are ours; vertical ones must still scroll the page.
          touchAction: "pan-y",
        }}
        // pointerType-gated so a tap's emulated mouse events cannot leave a
        // touch device stuck in the hover pause.
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovering(false)}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          startX.current = e.clientX;
          dragged.current = false;
          rawX.current = 0;
          setDrag(0);
        }}
        onPointerMove={(e) => {
          if (drag === null) return;
          let dx = e.clientX - startX.current;
          rawX.current = dx;
          if (!dragged.current && Math.abs(dx) > TAP_SLOP) {
            dragged.current = true;
            // Capture only once it is a drag: a captured pointer retargets the
            // click to this window, which would swallow a plain tap on a card.
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          if ((index === 0 && dx > 0) || (index === count - 1 && dx < 0)) {
            dx /= EDGE_RESISTANCE;
          }
          setDrag(dx);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // A drag that ends on a card must not also open it.
        onClickCapture={(e) => {
          if (!dragged.current) return;
          e.preventDefault();
          e.stopPropagation();
          dragged.current = false;
        }}
        // Otherwise the browser's own image drag hijacks a mouse swipe.
        onDragStart={(e) => e.preventDefault()}
      >
        {/* The track: one cell per slide, shifted so the active cell shows. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: pitch * (count - 1) + cell,
            height: win.height,
            transform: `translateX(${-index * pitch + (drag ?? 0)}px)`,
            // While held, the track IS the finger — easing it would lag behind.
            transition: drag === null ? `transform ${slideMs}ms ease` : "none",
            userSelect: "none",
          }}
        >
          {Array.from({ length: count }, (_, i) => {
            const cellStyle: React.CSSProperties = {
              position: "absolute",
              left: i * pitch,
              top: 0,
              width: cell,
              height: win.height,
              display: "block",
              overflow: "hidden",
            };
            const el = name && `${name}-SLIDE-${i + 1}`;
            const slideLabel = `${label} ${i + 1}`;
            const focus = i === index ? 0 : -1;
            // A slide that opens an overlay cannot be a link — there is no
            // URL to go to — but it must stay the same drag target, so the
            // window's tap/drag discrimination still governs it.
            return onActivate ? (
              <button
                key={i}
                data-el={el}
                type="button"
                onClick={onActivate}
                aria-label={slideLabel}
                tabIndex={focus}
                style={{
                  ...cellStyle,
                  appearance: "none",
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {renderSlide(i)}
              </button>
            ) : (
              <Link
                key={i}
                data-el={el}
                href={href}
                aria-label={slideLabel}
                tabIndex={focus}
                style={cellStyle}
              >
                {renderSlide(i)}
              </Link>
            );
          })}
        </div>
      </div>

      {dots.map((dot, i) => (
        <button
          key={`${dot.x}-${dot.y}`}
          data-el={name && `${name}-DOT-${i + 1}`}
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
