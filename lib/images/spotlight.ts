/**
 * ROLE OF THIS FILE
 * Spotlight areas — the one place that knows how a framing choice becomes CSS.
 *
 * Every storefront photo box is a fixed design rectangle and the photos are
 * not that shape, so each is drawn with object-fit: cover and the browser
 * crops to the CENTRE. Migration 0008 added a focal POINT so the admin could
 * say which pixel must survive that crop. A point cannot say how much of the
 * photo to show, though: on a wide packshot the rose is a fifth of the frame
 * and the PDP window shows it small no matter where the point sits.
 *
 * A spotlight AREA is the point plus a zoom. Two of them are stored per photo
 * because the two windows are different shapes and the owner frames each on
 * its own: the PDP viewer window (398x250) and the shop card photo (203x204).
 *
 * WHY THIS IS A POINT-AND-ZOOM AND NOT A CROP RECTANGLE
 * `object-position: X% Y%` already lines the image's X% content point up with
 * the box's X% point. So scaling about `transform-origin: X% Y%` pins exactly
 * that content point while the rest grows outward — a true area selection out
 * of two numbers and a multiplier. No second image file is written, no pixels
 * are lost, the fullscreen viewer still has the whole original to show, and
 * the same stored area re-solves at any rendered size.
 */

import type { CSSProperties } from "react";

/** A framed area: the content point to keep, and how tight to crop to it. */
export type SpotlightArea = {
  /** CSS object-position X percentage (0-100); 50 = horizontal centre. */
  x: number;
  /** CSS object-position Y percentage (0-100); 50 = vertical centre. */
  y: number;
  /** Zoom percentage (100-400); 100 = plain cover-fit, the pre-0009 crop. */
  zoom: number;
};

/** Zoom floor: the whole cover-fitted photo, i.e. what every box did before. */
export const NO_ZOOM = 100;

/**
 * Zoom ceiling. 4x is where a 1000px-wide photo stops having the pixels to
 * fill a 398px window sharply, so letting the owner go further would only let
 * them ship a blurry hero.
 */
export const MAX_ZOOM = 400;

/** The PDP viewer window — components/pdp/PdpOverlays hero Carousel. */
export const PDP_VIEWER_BOX = { w: 398, h: 250 } as const;

/** The shop grid card photo — components/shop/ShopInteractive card slot. */
export const SHOP_CARD_BOX = { w: 203, h: 204 } as const;

/** The plain centre cover-crop: what an unframed photo has always shown. */
export const CENTRE: SpotlightArea = { x: 50, y: 50, zoom: NO_ZOOM };

/**
 * Force one axis percentage into the 0-100 the database column accepts.
 * A stray value would fail the check constraint and take the whole product
 * save down with it, so anything missing or non-finite reads as centre.
 *
 * @param value - Candidate percentage.
 * @returns An integer 0-100; 50 when the input is absent or not a number.
 */
export function clampAxis(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Force a zoom into the 100-400 the database column accepts, for the same
 * reason as {@link clampAxis}. Absent means 100 — no zoom, the pre-0009 crop.
 *
 * @param value - Candidate zoom percentage.
 * @returns An integer 100-400; 100 when the input is absent or not a number.
 */
export function clampZoom(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return NO_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(NO_ZOOM, Math.round(value)));
}

/**
 * The area the PDP viewer window shows. Rows written before 0008 carry no
 * point and rows before 0009 carry no zoom; both read as the centre crop
 * they were already being drawn with.
 *
 * @param image - A catalog image, or undefined when the product has none.
 * @returns The spotlight area to draw that photo with.
 */
export function spotlightOf(
  image:
    | {
        focal_x?: number | null;
        focal_y?: number | null;
        focal_zoom?: number | null;
      }
    | null
    | undefined,
): SpotlightArea {
  return {
    x: clampAxis(image?.focal_x),
    y: clampAxis(image?.focal_y),
    zoom: clampZoom(image?.focal_zoom),
  };
}

/**
 * The area the shop card shows. The card is framed separately because it is a
 * different shape, but a photo whose card area was never set inherits the
 * spotlight's POINT at no zoom — which is exactly what the card did before
 * 0009, so nothing moves until the owner frames it.
 *
 * @param image - A catalog image, or undefined when the product has none.
 * @returns The card area to draw that photo with.
 */
export function cardAreaOf(
  image:
    | {
        focal_x?: number | null;
        focal_y?: number | null;
        card_focal_x?: number | null;
        card_focal_y?: number | null;
        card_zoom?: number | null;
      }
    | null
    | undefined,
): SpotlightArea {
  if (image?.card_focal_x == null || image?.card_focal_y == null) {
    return {
      x: clampAxis(image?.focal_x),
      y: clampAxis(image?.focal_y),
      zoom: NO_ZOOM,
    };
  }
  return {
    x: clampAxis(image.card_focal_x),
    y: clampAxis(image.card_focal_y),
    zoom: clampZoom(image.card_zoom),
  };
}

/**
 * The `<img>` style that draws a photo through its framed area. The element
 * MUST sit in a box with `overflow: hidden`, because a zoomed photo is
 * deliberately bigger than the box it is seen through.
 *
 * `transform` is omitted entirely at zoom 100 rather than emitted as
 * `scale(1)`: a no-op transform still promotes the element to its own
 * compositing layer, which can shift antialiasing by a pixel and break the
 * pixel baselines. No zoom, no transform, byte-identical output.
 *
 * @param area - The framed area, from {@link spotlightOf} or {@link cardAreaOf}.
 * @returns Style properties to spread onto the image element.
 */
export function spotlightStyle(area: SpotlightArea): CSSProperties {
  const objectPosition = `${area.x}% ${area.y}%`;
  return {
    objectFit: "cover",
    objectPosition,
    ...(area.zoom > NO_ZOOM
      ? {
          transform: `scale(${area.zoom / 100})`,
          transformOrigin: objectPosition,
        }
      : {}),
  };
}
