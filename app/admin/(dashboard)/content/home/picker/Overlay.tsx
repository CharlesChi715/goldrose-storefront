"use client";

/**
 * ROLE OF THIS FILE
 * Everything the picker draws on top of the preview: the faint outline on every
 * editable thing, the strong one under the pointer, the ring on what is
 * selected, and the curve joining the selection to the editor beside it.
 *
 * It draws in the ADMIN's coordinate space, over the frame, never inside it —
 * the preview's document belongs to the storefront and is not ours to decorate.
 *
 * `position: fixed` because every rectangle here comes from
 * `getBoundingClientRect()`, which is viewport-relative; anything else would
 * need the scroll offsets added back and would drift the moment either the admin
 * or the frame scrolled.
 */

import type { Rect } from "./geometry";

/** Polaris' focus blue, so a selection reads as a selection everywhere. */
const SELECTED = "#005bd3";
const HOVER = "#0094d5";

/**
 * A curve from the selected element to the editor panel beside it.
 *
 * A straight line would cross the preview diagonally and cover the very thing
 * being edited. This leaves horizontally, arrives horizontally, and bows through
 * the gap between the two — so the eye follows it without it ever crossing the
 * page.
 *
 * @param from - The selected element's rectangle.
 * @param to - The editor panel's rectangle.
 * @returns An SVG path, or null when either end is unknown.
 */
function connector(from: Rect, to: Rect): string | null {
  if (!from || !to) return null;
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + Math.min(28, to.h / 2);
  const mid = x1 + (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

export function Overlay({
  all,
  hover,
  selected,
  panel,
  armed,
}: {
  all: Rect[];
  hover: Rect | null;
  selected: Rect[];
  /** Where the docked editor is, so the connector knows what to reach for. */
  panel: Rect | null;
  armed: boolean;
}) {
  const anchor = selected[0] ?? null;
  const path = anchor && panel ? connector(anchor, panel) : null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        // Drawing only. The capture layer over the frame takes the pointer;
        // this must never intercept it, or the picker would hit itself.
        pointerEvents: "none",
        zIndex: 519,
      }}
    >
      {/* Everything editable, faintly — so a teammate can see what is on offer
          without sweeping the page to discover it. */}
      {armed &&
        all.map((rect, i) => (
          <div
            key={`all-${i}`}
            style={{
              position: "fixed",
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              outline: `1px dashed rgba(0, 91, 211, 0.35)`,
              borderRadius: 2,
            }}
          />
        ))}

      {hover ? (
        <div
          style={{
            position: "fixed",
            left: hover.x,
            top: hover.y,
            width: hover.w,
            height: hover.h,
            outline: `2px solid ${HOVER}`,
            background: "rgba(0, 148, 213, 0.10)",
            borderRadius: 2,
          }}
        />
      ) : null}

      {/* Every rectangle the selected FIELD occupies. Often more than one — the
          design repeats one product across both Ready-to-Ship rows, and one
          destination sits behind all four hero slides. Showing them all is what
          stops an edit looking like it changed something it did not. */}
      {selected.map((rect, i) => (
        <div
          key={`sel-${i}`}
          style={{
            position: "fixed",
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            outline: `2px solid ${SELECTED}`,
            outlineOffset: 1,
            borderRadius: 2,
          }}
        />
      ))}

      {path ? (
        <svg
          style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
        >
          <path
            d={path}
            fill="none"
            stroke={SELECTED}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.8}
          />
          <circle
            cx={anchor!.x + anchor!.w}
            cy={anchor!.y + anchor!.h / 2}
            r={3}
            fill={SELECTED}
          />
        </svg>
      ) : null}
    </div>
  );
}
