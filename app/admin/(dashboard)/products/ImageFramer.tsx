"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * 取景框 — the framing box in the admin's Media card (owner, 2026-08-06).
 *
 * Storefront photo boxes are fixed design rectangles and the photos are not
 * that shape, so every one is drawn with object-fit: cover and the browser
 * crops to the CENTRE. On a rose standing beside its box the centre is the
 * gap between them: the subject gets cut and there was no way to say so.
 *
 * This is the PDP hero window at its true size — 398x250, the exact rectangle
 * a shopper sees — with the photo cover-fitted inside it. Drag the photo and
 * it moves under the frame; what stays inside is what the product page will
 * show. The result is a pair of CSS object-position percentages
 * (product_images.focal_x / focal_y, migration 0008), which re-solve for
 * every other box, so the shop card follows the same choice.
 *
 * Why not a crop rectangle: a crop would have to write a second image file
 * and pick a winner between the boxes' different aspect ratios. A focal point
 * is one number pair, loses no pixels, and every box honours it.
 */

import { useRef, useState } from "react";

/** The PDP hero photo window (components/pdp/PdpOverlays Carousel window). */
export const FRAME_W = 398;
export const FRAME_H = 250;

/** Below this the axis has no slack — the photo already fits that dimension. */
const MIN_OVERFLOW_PX = 1;

/**
 * A draggable framing box for one product photo.
 *
 * @param url - Servable image URL.
 * @param alt - Alt text, for the preview only.
 * @param focalX - Current object-position X percentage (0-100).
 * @param focalY - Current object-position Y percentage (0-100).
 * @param onChange - Called with the new percentages as the photo is dragged.
 * @param hint - Localized instruction shown under the frame.
 * @param fitsHint - Localized note for a photo with no slack to drag.
 * @returns The frame plus its readout.
 */
export function ImageFramer({
  url,
  alt,
  focalX,
  focalY,
  onChange,
  hint,
  fitsHint,
}: {
  url: string;
  alt: string;
  focalX: number;
  focalY: number;
  onChange: (focalX: number, focalY: number) => void;
  hint: string;
  /** Shown instead of `hint` when the photo already fits the frame exactly. */
  fitsHint: string;
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
   * How many pixels of the cover-scaled photo hang outside the frame. That
   * overflow IS the drag range: object-position 0% pins one edge, 100% the
   * other, so a pixel of finger travel is `100 / overflow` percent.
   */
  const overflow = () => {
    if (!natural) return { x: 0, y: 0 };
    const scale = Math.max(FRAME_W / natural.w, FRAME_H / natural.h);
    return {
      x: natural.w * scale - FRAME_W,
      y: natural.h * scale - FRAME_H,
    };
  };

  const clamp = (value: number) => Math.min(100, Math.max(0, value));

  const onPointerMove = (event: React.PointerEvent) => {
    const start = dragging.current;
    if (!start) return;
    const { x: overflowX, y: overflowY } = overflow();
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // The photo follows the finger, so dragging RIGHT reveals more of its
    // left-hand side — which is a LOWER object-position percentage.
    const nextX =
      overflowX >= MIN_OVERFLOW_PX
        ? clamp(focalX - (dx / overflowX) * 100)
        : focalX;
    const nextY =
      overflowY >= MIN_OVERFLOW_PX
        ? clamp(focalY - (dy / overflowY) * 100)
        : focalY;
    dragging.current = { x: event.clientX, y: event.clientY };
    if (nextX !== focalX || nextY !== focalY) {
      onChange(Math.round(nextX), Math.round(nextY));
    }
  };

  const { x: overflowX, y: overflowY } = overflow();
  const locked = overflowX < MIN_OVERFLOW_PX && overflowY < MIN_OVERFLOW_PX;

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
          width: FRAME_W,
          height: FRAME_H,
          maxWidth: "100%",
          overflow: "hidden",
          borderRadius: 8,
          // Inset shadow, not a border: under border-box a 1px border would
          // shrink the photo area to 396×248 and the frame would stop being
          // the PDP box's true size.
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
            objectFit: "cover",
            objectPosition: `${focalX}% ${focalY}%`,
            display: "block",
            pointerEvents: "none",
          }}
        />
        {/* Rule-of-thirds guides, drawn over the photo so the drag reads as
            framing rather than scrolling. Purely visual. */}
        {[1, 2].map((n) => (
          <div
            key={`v${n}`}
            style={{
              position: "absolute",
              left: (FRAME_W / 3) * n,
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
              top: (FRAME_H / 3) * n,
              left: 0,
              height: 1,
              width: "100%",
              background: "rgba(255,255,255,0.35)",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "var(--p-color-text-secondary)",
        }}
      >
        {locked ? fitsHint : `${hint} · ${focalX}% / ${focalY}%`}
      </p>
    </div>
  );
}
