/**
 * ROLE OF THIS FILE
 * The two-way map between a registry slot and the elements that draw it.
 *
 * Both directions are genuinely many-to-many, and both directions matter:
 *
 * FIELD → ELEMENTS. `ready.card_title` draws twice (the design repeats one
 * product across both Ready-to-Ship rows), `hero.photo_href` covers four slides,
 * `story.faq_href` five. Selecting one and highlighting only the element that was
 * clicked would make editing one row look like it silently changed another — so
 * the picker resolves a click to the FIELD and lights up all of its elements.
 *
 * ELEMENT → FIELDS. A footer link is both the word you see and the place it
 * goes. `data-field` is therefore a space-separated list, most-visible first,
 * and picking that element offers both — which is how a field with no pixels of
 * its own gets edited at all.
 */

import { distanceTo, visibleRect, type Rect } from "./geometry";

/** One addressable thing on the page: an element and the slots it draws. */
export type Target = {
  element: Element;
  /** Field keys (`"<section>.<id>"`), most-visible first. */
  keys: string[];
};

/** A target resolved for the pointer, with where to draw its highlight. */
export type Hit = Target & { rect: Rect };

/**
 * Split a `data-field` attribute into its keys.
 *
 * @param attr - The raw attribute value, or null.
 * @returns The field keys it names, in document order; empty when it names none.
 */
export function parseFieldKeys(attr: string | null): string[] {
  return (attr ?? "").split(/\s+/).filter(Boolean);
}

/**
 * Every tagged element in the preview, in document order.
 *
 * @param doc - The preview's document.
 * @returns One entry per tagged element.
 */
export function targetsIn(doc: Document): Target[] {
  return [...doc.querySelectorAll("[data-field]")].map((element) => ({
    element,
    keys: parseFieldKeys(element.getAttribute("data-field")),
  }));
}

/**
 * Group the page's elements by the field they draw.
 *
 * @param doc - The preview's document.
 * @returns Field key → every element drawing it, in document order.
 */
export function indexByField(doc: Document): Map<string, Element[]> {
  const index = new Map<string, Element[]>();
  for (const { element, keys } of targetsIn(doc)) {
    for (const key of keys) {
      const list = index.get(key);
      if (list) list.push(element);
      else index.set(key, [element]);
    }
  }
  return index;
}

/**
 * What the pointer is over, topmost first.
 *
 * Uses `elementsFromPoint` — PLURAL — on purpose. A-11's eight footer links are
 * individually positioned overlapping boxes with no z-index, so DOM order alone
 * decides which paints on top and parts of the biggest ("OUR STORY", 160×39) are
 * physically unreachable beneath its neighbours. Asking only for the topmost
 * element would make those fields permanently unselectable; returning the stack
 * lets the caller offer them.
 *
 * @param doc - The preview's document.
 * @param point - The pointer, already translated by `toFramePoint`.
 * @returns Tagged ancestors under the point, nearest-to-front first.
 */
export function stackAt(
  doc: Document,
  point: { x: number; y: number },
): Target[] {
  const seen = new Set<Element>();
  const found: Target[] = [];
  for (const node of doc.elementsFromPoint(point.x, point.y)) {
    // The tag may sit on an ancestor — the text is in the div, but the link
    // that owns its href is its parent.
    const tagged = node.closest("[data-field]");
    if (!tagged || seen.has(tagged)) continue;
    seen.add(tagged);
    found.push({
      element: tagged,
      keys: parseFieldKeys(tagged.getAttribute("data-field")),
    });
  }
  return found;
}

/**
 * The target the picker should highlight for a pointer position.
 *
 * Resolution order, and why:
 * 1. Whatever is directly under the pointer wins. That is what the owner means
 *    by pointing at something.
 * 2. Failing that, the nearest target within `snap` pixels. This page is full of
 *    boxes no pointer can hit — A-11's eighth footer link is 39×4, A-9's
 *    certificate numbers are 5px text in 6px boxes, about three admin pixels
 *    tall at preview scale. Demanding precision there would simply make those
 *    fields uneditable, so proximity stands in for a hit.
 *
 * @param doc - The preview's document.
 * @param iframe - The frame, for measuring.
 * @param client - The pointer in admin-viewport coordinates.
 * @param point - The same pointer inside the frame.
 * @param snap - How far to reach for a small target, in admin pixels.
 * @returns The target to highlight, or null when nothing is near.
 */
export function resolveTarget(
  doc: Document,
  iframe: HTMLIFrameElement,
  client: { x: number; y: number },
  point: { x: number; y: number },
  snap = 14,
): Hit | null {
  for (const target of stackAt(doc, point)) {
    const rect = visibleRect(target.element, iframe);
    if (rect) return { ...target, rect };
  }

  let best: Hit | null = null;
  let bestDistance = snap;
  for (const target of targetsIn(doc)) {
    const rect = visibleRect(target.element, iframe);
    if (!rect) continue;
    const distance = distanceTo(rect, client.x, client.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { ...target, rect };
    }
  }
  return best;
}

/**
 * Every visible rectangle a field occupies.
 *
 * @param index - The map from `indexByField`.
 * @param key - The field key.
 * @param iframe - The frame, for measuring.
 * @returns One rect per element of that field that is actually on show.
 */
export function rectsOfField(
  index: Map<string, Element[]>,
  key: string,
  iframe: HTMLIFrameElement,
): Rect[] {
  const rects: Rect[] = [];
  for (const element of index.get(key) ?? []) {
    const rect = visibleRect(element, iframe);
    if (rect) rects.push(rect);
  }
  return rects;
}
