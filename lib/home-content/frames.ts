/**
 * ROLE OF THIS FILE
 * Framing for the homepage's own photos: which part of a replaced picture
 * survives the crop.
 *
 * WHY THIS EXISTS
 * Every homepage photo box is a fixed design rectangle and nobody's photo is
 * that shape, so a replacement is drawn with `object-fit: cover` and the
 * browser trims to the CENTRE. If the rose is off to one side, the centre is
 * the tablecloth. Until now there was no way to say otherwise, and the photo
 * dialog made it worse by previewing with `object-fit: contain` — showing the
 * whole picture, which is not what the page draws.
 *
 * WHAT A FRAME IS
 * The same thing a product photo already stores: a `SpotlightArea` — an
 * object-position point plus a zoom about that same point
 * (`lib/images/spotlight.ts`). No second file is written and no pixels are
 * lost, so the original is always still there, and the numbers re-solve at any
 * rendered size. One area per field here, not two: a homepage photo appears in
 * exactly one box, where a product photo appears in two of different shapes.
 *
 * WHY IT IS NOT A REGISTRY FIELD
 * A frame is metadata ABOUT an image field, not a field of its own. Declaring
 * 21 companion fields would put them in the form list, in the search index, in
 * the per-section edited counts and in the picker — and then need excluding
 * from all four. Its own slot key sidesteps every one of those while keeping
 * the invariant that matters: a row exists if and only if the value differs
 * from the design, so an unframed photo stores nothing and `resetHomeSection`
 * clears framing with everything else.
 */

// Relative, not the `@/` alias: this module is unit-tested directly by
// `node --test`, which does not resolve tsconfig paths.
import {
  CENTRE,
  clampAxis,
  clampZoom,
  type SpotlightArea,
} from "../images/spotlight.ts";

export { CENTRE, type SpotlightArea };

/**
 * Every image field's framing, keyed `"<section>.<field>"`.
 *
 * Threaded through the bands as ONE opaque prop rather than resolved per photo,
 * because `HomePhoto` already knows which slot it is drawing and can look its
 * own up. Every band then forwards a single value it never has to reason about,
 * which is the difference between seven pass-throughs and twenty-one.
 *
 * A React context would be tidier still and is not available: the bands are
 * server components.
 */
export type HomeFrames = ReadonlyMap<string, SpotlightArea>;

/**
 * One field's framing out of the page's map.
 *
 * @param frames - The page's framings, or undefined before they are threaded.
 * @param section - The section that owns the field.
 * @param field - The image field's id.
 * @returns Its framing; the centre crop when nobody has framed it.
 */
export function frameFor(
  frames: HomeFrames | undefined,
  section: string,
  field: string,
): SpotlightArea {
  return frames?.get(`${section}.${field}`) ?? CENTRE;
}

/**
 * The `site_content` key holding one image field's framing.
 *
 * Derived from the field's own slot key rather than rebuilt from ids, so a
 * field carrying a `key` override keeps its framing beside it.
 *
 * @param slot - The image field's slot key, from `slotKey()`.
 * @returns The framing slot key, e.g. `"home.hero.photo_1.__frame"`.
 */
export function frameKey(slot: string): string {
  return `${slot}.__frame`;
}

/**
 * The stored form of a frame: three integers, so it fits the `{ text }` shape
 * every other homepage slot already uses and needs no schema change.
 *
 * @param area - The framing to store.
 * @returns `"x,y,zoom"`.
 */
export function formatFrame(area: SpotlightArea): string {
  return `${clampAxis(area.x)},${clampAxis(area.y)},${clampZoom(area.zoom)}`;
}

/** What an unframed photo has always shown: the plain centre cover-crop. */
export const FRAME_DEFAULT = formatFrame(CENTRE);

/**
 * Read a stored frame, tolerating anything.
 *
 * Never throws and never returns something unusable: a malformed value reads
 * as the centre, which is exactly what the photo was being drawn with before
 * anybody framed it. A stray number cannot move somebody's homepage.
 *
 * @param stored - The stored text, or undefined when nothing is stored.
 * @returns The framing to draw with.
 */
export function parseFrame(stored: string | undefined | null): SpotlightArea {
  if (!stored) return CENTRE;
  const parts = stored.split(",").map((part) => part.trim());
  if (parts.length !== 3) return CENTRE;
  // An EMPTY part is rejected rather than parsed. `Number("")` is 0, which is
  // perfectly finite — so "50,,100" would quietly become "pin the top edge"
  // instead of "this value is broken, use the centre".
  if (parts.some((part) => part === "")) return CENTRE;
  const [x, y, zoom] = parts.map(Number);
  if (![x, y, zoom].every(Number.isFinite)) return CENTRE;
  return { x: clampAxis(x), y: clampAxis(y), zoom: clampZoom(zoom) };
}

/**
 * Whether a frame is the design's own — i.e. nothing to store.
 *
 * @param area - The framing to test.
 * @returns True when it is the plain centre crop.
 */
export function isDefaultFrame(area: SpotlightArea): boolean {
  return formatFrame(area) === FRAME_DEFAULT;
}
