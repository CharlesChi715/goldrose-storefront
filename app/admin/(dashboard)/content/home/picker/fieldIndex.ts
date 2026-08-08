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

import {
  distanceTo,
  visibleRect,
  type FrameView,
  type Rect,
} from "./geometry";

/** One addressable thing on the page: an element and the slots it draws. */
export type Target = {
  element: Element;
  /** Field keys (`"<section>.<id>"`), most-visible first. */
  keys: string[];
};

/** A target resolved for the pointer, with where to draw its highlight. */
export type Hit = Target & { rect: Rect };

/**
 * Which field keys a picker is allowed to offer, or null for all of them.
 *
 * Every preview frame renders the WHOLE home page, so a section's window is
 * showing 176 tagged elements and drawing about twenty of them. Scope is what
 * makes a card's window a window onto that card: it is filtered by the keys the
 * section owns, not by the pixels it covers.
 *
 * That distinction is load-bearing rather than an optimisation. Each window
 * shows its band plus 48px of slack at either end, so the neighbouring band
 * peeks in — and a filter by geometry would let a click on that peek open a
 * field belonging to a different card, in this card's editor. Filtering by key
 * makes it unrepresentable. The nine-fold drop in per-frame measuring is the
 * side benefit.
 */
export type FieldScope = ReadonlySet<string> | null;

/**
 * Whether a tagged element belongs to the picker asking about it.
 *
 * @param keys - The keys the element names.
 * @param scope - The keys on offer, or null for every key on the page.
 * @returns True when at least one of its keys is in scope.
 */
function inScope(keys: string[], scope: FieldScope): boolean {
  return scope === null || keys.some((key) => scope.has(key));
}

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
 * Every tagged element in the preview that is in scope, in document order.
 *
 * @param doc - The preview's document.
 * @param scope - The keys on offer, or null for every key on the page.
 * @returns One entry per tagged element the caller may offer.
 */
export function targetsIn(doc: Document, scope: FieldScope = null): Target[] {
  const targets: Target[] = [];
  for (const element of doc.querySelectorAll("[data-field]")) {
    const keys = parseFieldKeys(element.getAttribute("data-field"));
    if (inScope(keys, scope)) targets.push({ element, keys });
  }
  return targets;
}

/**
 * Group the page's in-scope elements by the field they draw.
 *
 * @param doc - The preview's document.
 * @param scope - The keys on offer, or null for every key on the page.
 * @returns Field key → every element drawing it, in document order.
 */
export function indexByField(
  doc: Document,
  scope: FieldScope = null,
): Map<string, Element[]> {
  const index = new Map<string, Element[]>();
  for (const { element, keys } of targetsIn(doc, scope)) {
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
  scope: FieldScope = null,
): Target[] {
  const seen = new Set<Element>();
  const found: Target[] = [];
  for (const node of doc.elementsFromPoint(point.x, point.y)) {
    // The tag may sit on an ancestor — the text is in the div, but the link
    // that owns its href is its parent.
    const tagged = node.closest("[data-field]");
    if (!tagged || seen.has(tagged)) continue;
    seen.add(tagged);
    const keys = parseFieldKeys(tagged.getAttribute("data-field"));
    // Out of scope is not "skip and keep looking under it": an element another
    // card owns still covers this one, and offering whatever is beneath would
    // hand the owner a field they cannot see. It is simply not a target here.
    if (!inScope(keys, scope)) continue;
    found.push({ element: tagged, keys });
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
 * @param scope - The keys on offer, or null for every key on the page.
 * @param seen - The frame measured once for this pass.
 * @param snap - How far to reach for a small target, in admin pixels.
 * @returns The target to highlight, or null when nothing is near.
 */
export function resolveTarget(
  doc: Document,
  iframe: HTMLIFrameElement,
  client: { x: number; y: number },
  point: { x: number; y: number },
  scope: FieldScope = null,
  seen?: FrameView,
  snap = 14,
): Hit | null {
  for (const target of stackAt(doc, point, scope)) {
    const rect = visibleRect(target.element, iframe, seen);
    if (rect) return { ...target, rect };
  }

  // The snap fallback walks every target again, so it is the expensive half of
  // a frame — and it runs on exactly the frames where the pointer hit nothing.
  // Scope is what keeps it affordable: about twenty candidates per card rather
  // than the page's 176.
  let best: Hit | null = null;
  let bestDistance = snap;
  for (const target of targetsIn(doc, scope)) {
    const rect = visibleRect(target.element, iframe, seen);
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
 * @param seen - The frame measured once for this pass.
 * @returns One rect per element of that field that is actually on show.
 */
export function rectsOfField(
  index: Map<string, Element[]>,
  key: string,
  iframe: HTMLIFrameElement,
  seen?: FrameView,
): Rect[] {
  const rects: Rect[] = [];
  for (const element of index.get(key) ?? []) {
    const rect = visibleRect(element, iframe, seen);
    if (rect) rects.push(rect);
  }
  return rects;
}
