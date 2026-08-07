"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * 取景框 — the framing box in the admin's Media card (owner, 2026-08-06;
 * spotlight areas 2026-08-07).
 *
 * Storefront photo boxes are fixed design rectangles and the photos are not
 * that shape, so every one is drawn with object-fit: cover and the browser
 * crops to the CENTRE. On a rose standing beside its box the centre is the
 * gap between them: the subject gets cut and there was no way to say so.
 *
 * This is one storefront window at its TRUE size — the exact rectangle a
 * shopper sees — with the photo cover-fitted inside it. Drag the photo to pan
 * it under the window and pull the zoom to tighten in; what stays inside is
 * literally what that box will show. The result is a spotlight area
 * (lib/images/spotlight.ts): two object-position percentages plus a zoom.
 *
 * The component is deliberately window-agnostic, because there are two of
 * them and they are different shapes — the PDP viewer (398×250) and the shop
 * card photo (203×204). Each is framed on its own; a single choice cannot
 * serve both, which is the whole reason 0009 stores two areas.
 *
 * Why not a crop rectangle: a crop would have to write a second image file
 * and throw pixels away, and the PDP's fullscreen viewer needs the original
 * whole. An area loses nothing — it is only ever a way of looking.
 */

import { useRef, useState } from "react";
import { RangeSlider } from "@shopify/polaris";
import {
  MAX_ZOOM,
  NO_ZOOM,
  spotlightStyle,
  type SpotlightArea,
} from "@/lib/images/spotlight";

/** Below this the axis has no slack — the photo already fits that dimension. */
const MIN_RANGE_PX = 1;

/**
 * A draggable, zoomable framing box for one product photo and one storefront
 * window.
 *
 * @param url - Servable image URL.
 * @param alt - Alt text, for the preview only.
 * @param box - The storefront window's true pixel size.
 * @param area - The area currently chosen for that window.
 * @param onChange - Called with the new area as the photo is dragged or zoomed.
 * @param hint - Localized instruction shown under the frame.
 * @param fitsHint - Localized note for a photo with no slack to drag.
 * @param zoomLabel - Localized label for the zoom slider.
 * @returns The frame, its zoom slider, and a readout of the stored numbers.
 */
export function ImageFramer({
  url,
  alt,
  box,
  area,
  onChange,
  hint,
  fitsHint,
  zoomLabel,
}: {
  url: string;
  alt: string;
  box: { w: number; h: number };
  area: SpotlightArea;
  onChange: (area: SpotlightArea) => void;
  hint: string;
  /** Shown instead of `hint` when the photo has no room to move. */
  fitsHint: string;
  zoomLabel: string;
}) {
  // Natural size decides how much slack each axis has; unknown until load.
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  /**
   * Record the photo's natural size. A callback ref rather than onLoad alone:
   * a cached image is already `complete` by the time React attaches handlers,
   * so onLoad never fires and the frame would sit locked forever. Returning
   * the same object when nothing changed keeps the ref from looping.
   */
  const measure = (img: HTMLImageElement | null) => {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    setNatural((current) =>
      current &&
      current.w === img.naturalWidth &&
      current.h === img.naturalHeight
        ? current
        : { w: img.naturalWidth, h: img.naturalHeight },
    );
  };
  const dragging = useRef<{ x: number; y: number } | null>(null);

  /**
   * How far the photo can pan on each axis, in cover-scaled pixels — the
   * range 0-100% of object-position spans.
   *
   * Unzoomed that is just the overflow, the part hanging outside the window.
   * Zoomed, the window itself covers less of the photo: it sees `w / zoom` of
   * the cover-scaled width, so the pan range grows by the `w · (1 − 1/zoom)`
   * the window gave up. That extra term is why a photo with no overflow at
   * all — one already exactly the window's shape — still becomes draggable
   * the moment it is zoomed.
   */
  const panRange = () => {
    if (!natural) return { x: 0, y: 0 };
    const scale = Math.max(box.w / natural.w, box.h / natural.h);
    const zoom = area.zoom / 100;
    return {
      x: natural.w * scale - box.w / zoom,
      y: natural.h * scale - box.h / zoom,
    };
  };

  const clamp = (value: number) => Math.min(100, Math.max(0, value));

  const onPointerMove = (event: React.PointerEvent) => {
    const start = dragging.current;
    if (!start) return;
    const { x: rangeX, y: rangeY } = panRange();
    const zoom = area.zoom / 100;
    // A finger travels on the ZOOMED photo, so a screen pixel is only
    // `1 / zoom` of a cover-scaled pixel of pan.
    const dx = (event.clientX - start.x) / zoom;
    const dy = (event.clientY - start.y) / zoom;
    // The photo follows the finger, so dragging RIGHT reveals more of its
    // left-hand side — which is a LOWER object-position percentage.
    const nextX =
      rangeX >= MIN_RANGE_PX ? clamp(area.x - (dx / rangeX) * 100) : area.x;
    const nextY =
      rangeY >= MIN_RANGE_PX ? clamp(area.y - (dy / rangeY) * 100) : area.y;
    dragging.current = { x: event.clientX, y: event.clientY };
    if (nextX !== area.x || nextY !== area.y) {
      onChange({ ...area, x: Math.round(nextX), y: Math.round(nextY) });
    }
  };

  const { x: rangeX, y: rangeY } = panRange();
  const locked = rangeX < MIN_RANGE_PX && rangeY < MIN_RANGE_PX;

  return (
    <div>
      <div
        onPointerDown={(event) => {
          if (locked) return;
          dragging.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragging.current = null)}
        onPointerCancel={() => (dragging.current = null)}
        onDragStart={(event) => event.preventDefault()}
        style={{
          position: "relative",
          width: box.w,
          height: box.h,
          maxWidth: "100%",
          // The storefront box clips too, and a zoomed photo depends on it.
          overflow: "hidden",
          borderRadius: 8,
          // Inset shadow, not a border: under border-box a 1px border would
          // shrink the photo area by 2px each way and the frame would stop
          // being the storefront box's true size.
          boxShadow: "inset 0 0 0 1px var(--p-color-border)",
          background: "var(--p-color-bg-surface-secondary)",
          cursor: locked ? "default" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        <img
          ref={measure}
          src={url}
          alt={alt}
          onLoad={(event) =>
            setNatural({
              w: event.currentTarget.naturalWidth,
              h: event.currentTarget.naturalHeight,
            })
          }
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
            // The same helper the storefront draws with, so the frame is not
            // an approximation of the result — it is the result.
            ...spotlightStyle(area),
          }}
        />
        {/* Rule-of-thirds guides, drawn over the photo so the drag reads as
            framing rather than scrolling. Purely visual, and outside the
            transformed image so zooming never thickens them. */}
        {[1, 2].map((n) => (
          <div
            key={`v${n}`}
            style={{
              position: "absolute",
              left: (box.w / 3) * n,
              top: 0,
              width: 1,
              height: "100%",
              background: "rgba(255,255,255,0.35)",
              pointerEvents: "none",
            }}
          />
        ))}
        {[1, 2].map((n) => (
          <div
            key={`h${n}`}
            style={{
              position: "absolute",
              top: (box.h / 3) * n,
              left: 0,
              height: 1,
              width: "100%",
              background: "rgba(255,255,255,0.35)",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 8, maxWidth: box.w }}>
        <RangeSlider
          label={zoomLabel}
          labelHidden
          min={NO_ZOOM}
          max={MAX_ZOOM}
          step={5}
          value={area.zoom}
          onChange={(zoom) =>
            onChange({
              ...area,
              zoom: typeof zoom === "number" ? zoom : area.zoom,
            })
          }
          output
        />
      </div>
      <p
        style={{
          marginTop: 4,
          fontSize: 12,
          color: "var(--p-color-text-secondary)",
        }}
      >
        {locked ? fitsHint : hint} · {area.x}% / {area.y}% · {area.zoom}%
      </p>
    </div>
  );
}
