/**
 * ROLE OF THIS FILE
 * Turning "this node, inside the preview iframe" into "this rectangle, on the
 * admin page" — and back again for hit-testing.
 *
 * WHY NOT JUST USE ScaleFrame'S FORMULA
 * The storefront scales its fixed 430 stage by `min(100vw, 480px) / 430`, and it
 * would be possible to redo that arithmetic here. Don't. `getBoundingClientRect()`
 * called from the parent on a node in the child document ALREADY has that scale,
 * `abs()`'s sub-pixel translate and the iframe's own scrollY applied. Re-deriving
 * any of it is a second source of truth that drifts — and the CSS formula reads
 * `100vw` (which includes a classic scrollbar) against a `100%` that does not, so
 * on a platform with space-taking scrollbars it is 1-8px wrong where the rect is
 * exact. Measure; don't calculate.
 *
 * WHY CLIPPING IS NOT OPTIONAL
 * `getBoundingClientRect()` reports an element's own border box even when none of
 * it is painted. This page clips at nine levels — the stage and its wrap, every
 * band root, A-11's sub-frames, the card and photo windows, the carousel window —
 * and its rails render every cell at all times, clipped to the window. So an
 * unclipped highlight will happily draw a box over a neighbouring band for a card
 * that is currently off-window. `visibleRect` walks the ancestors and intersects.
 */

/** A rectangle in admin-viewport CSS pixels. */
export type Rect = { x: number; y: number; w: number; h: number };

/** How the admin's own layout scales the iframe surface, and its border inset. */
type Frame = { left: number; top: number; scale: number; bl: number; bt: number };

/**
 * Measure the iframe once per batch of conversions.
 *
 * `scale` is derived from the rects rather than from a constant so it stays
 * honest whatever the admin does to the element — laid out at width (the main
 * preview) or CSS-scaled (the section windows and the map).
 *
 * @param iframe - The preview frame.
 * @returns Its offset, border inset and parent-side scale.
 */
function measure(iframe: HTMLIFrameElement): Frame {
  const f = iframe.getBoundingClientRect();
  const cs = getComputedStyle(iframe);
  return {
    left: f.left,
    top: f.top,
    // offsetWidth is the UNtransformed border box, so this ratio is exactly the
    // parent-side scale — 1 when nothing transforms it.
    scale: iframe.offsetWidth > 0 ? f.width / iframe.offsetWidth : 1,
    bl: parseFloat(cs.borderLeftWidth) || 0,
    bt: parseFloat(cs.borderTopWidth) || 0,
  };
}

/**
 * Map a rect measured inside the iframe into admin-viewport coordinates.
 *
 * @param r - A rect from `getBoundingClientRect()` in the child document.
 * @param frame - The measurement from `measure()`.
 * @returns The same rectangle, where the admin can draw on it.
 */
function toAdmin(r: DOMRect | Rect, frame: Frame): Rect {
  const left = "x" in r ? r.x : (r as DOMRect).left;
  const top = "y" in r ? r.y : (r as DOMRect).top;
  const width = "w" in r ? r.w : (r as DOMRect).width;
  const height = "h" in r ? r.h : (r as DOMRect).height;
  return {
    x: frame.left + frame.scale * (frame.bl + left),
    y: frame.top + frame.scale * (frame.bt + top),
    w: frame.scale * width,
    h: frame.scale * height,
  };
}

/**
 * The overlap of two rectangles.
 *
 * @param a - First rectangle.
 * @param b - Second rectangle.
 * @returns The intersection, or null when they do not overlap at all.
 */
export function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  if (right <= x || bottom <= y) return null;
  return { x, y, w: right - x, h: bottom - y };
}

/**
 * Where a node in the preview actually appears on the admin page, clipped by
 * everything that clips it — or null when none of it is on show.
 *
 * @param node - An element inside the iframe's document.
 * @param iframe - The frame it lives in.
 * @returns Its visible rectangle in admin-viewport coordinates, or null.
 */
export function visibleRect(
  node: Element,
  iframe: HTMLIFrameElement,
): Rect | null {
  const doc = node.ownerDocument;
  const view = doc.defaultView;
  if (!view) return null;
  const frame = measure(iframe);

  let box: Rect | null = toAdmin(node.getBoundingClientRect(), frame);

  // Every ancestor that clips shrinks what is visible of this node.
  for (
    let parent = node.parentElement;
    parent && box;
    parent = parent.parentElement
  ) {
    const style = view.getComputedStyle(parent);
    const clips =
      style.overflow !== "visible" ||
      style.overflowX !== "visible" ||
      style.overflowY !== "visible";
    if (clips) {
      box = intersect(box, toAdmin(parent.getBoundingClientRect(), frame));
    }
  }
  if (!box) return null;

  // Finally the frame's own content box: a node scrolled out of the window is
  // not on show either.
  return intersect(box, {
    x: frame.left + frame.scale * frame.bl,
    y: frame.top + frame.scale * frame.bt,
    w: frame.scale * iframe.clientWidth,
    h: frame.scale * iframe.clientHeight,
  });
}

/**
 * Translate an admin pointer position into the preview's own coordinates.
 *
 * This is how the picker hit-tests WITHOUT letting the pointer reach the page:
 * a real click inside the frame would follow a `<Link>` and navigate the
 * preview off `/`, which invalidates every number here.
 *
 * @param clientX - Pointer x in the admin viewport.
 * @param clientY - Pointer y in the admin viewport.
 * @param iframe - The preview frame.
 * @returns The equivalent point inside the child document.
 */
export function toFramePoint(
  clientX: number,
  clientY: number,
  iframe: HTMLIFrameElement,
): { x: number; y: number } {
  const frame = measure(iframe);
  return {
    x: (clientX - frame.left) / frame.scale - frame.bl,
    y: (clientY - frame.top) / frame.scale - frame.bt,
  };
}

/**
 * Whether a rectangle is too small to hover accurately.
 *
 * A-11's eighth footer link is a 39×4 box; A-9's certificate numbers are 5px
 * text in 6px boxes. At preview scale those are ~3 admin pixels tall, which no
 * pointer can reliably hit — so the picker snaps to the nearest of these rather
 * than demanding precision.
 */
export const TINY_TARGET_PX = 12;

/**
 * The distance from a point to a rectangle, 0 when inside it.
 *
 * @param rect - The candidate target.
 * @param x - Pointer x, admin viewport.
 * @param y - Pointer y, admin viewport.
 * @returns Distance in admin pixels.
 */
export function distanceTo(rect: Rect, x: number, y: number): number {
  const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
  const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}
