"use client";

/**
 * ROLE OF THIS FILE
 * The picker's state: armed or not, what the pointer is over, what is selected,
 * and where all of it currently sits on screen.
 *
 * ONE MODE, NOT TWO
 * Arming the picker outlines everything editable faintly and strengthens
 * whatever is under the pointer. The owner asked for both "show me everything
 * editable" and "let me point at one thing"; these are the same mode seen at
 * rest and in use, and a second toggle would be one more thing to explain on a
 * thirty-second edit.
 *
 * WHY THE POINTER NEVER REACHES THE PAGE
 * The preview's own links are real, and one click would navigate the frame off
 * `/` — losing the preview and invalidating every coordinate here. The section
 * windows already prevent that structurally: the film is `pointer-events: none`
 * inside a box that scrolls, so a click lands on the WINDOW and the storefront
 * never sees it. Hit-testing translates that click into the frame's own
 * coordinates and asks the child document what is there.
 *
 * That is also why nothing here calls `preventDefault`, and why this picker is
 * hosted on the section windows rather than on the page-wide preview (owner,
 * 2026-08-08). The page-wide preview answers the pointer, so pointing at it
 * needed a transparent capture layer — which swallowed the wheel, so the scroll
 * had to be re-issued programmatically, which the storefront's own
 * `scroll-behavior: smooth` then turned into an eased animation restarted by
 * every wheel event. A gesture asking for 2,000px travelled 118. Scroll
 * chaining and touch went the same way. None of it is worked around here; the
 * layer that caused it is simply not needed on a window whose film is inert.
 *
 * WHY IT RE-MEASURES ON A FRAME LOOP
 * A one-shot measurement is stale within a second on four of the seven bands.
 * The rails advance every 4.2s with a 900ms eased transition, the width slider
 * re-lays-out at frame rate, and the window scrolls over its own band. While a
 * highlight is on screen it is re-measured every frame; when nothing is
 * highlighted, or the card is off screen, the loop stops.
 *
 * WHY THE POINTER AND THE MEASUREMENT ARE TWO HOOKS
 * They live at different heights in the tree ON PURPOSE, and splitting them is
 * what fixed the "Maximum update depth exceeded" crash (2026-08-08).
 *
 * The pointer handlers never change and never hold state, so the editor screen
 * can own them and hand them to the capture layer. The measurement publishes up
 * to sixty times a second, so it is owned by the leaf that draws it — nothing
 * else re-renders when it changes.
 *
 * That matters because the screen's root is a Polaris `Page`, and Polaris'
 * `ActionsMeasurer` re-measures the header's action buttons in a `useEffect`
 * every single time that `Page` re-renders, calling `setState` from inside the
 * effect each time. (It cannot be talked out of it from here: `Page`'s own
 * `Header` builds a fresh `actionGroups = []` default per render, so the
 * measurer's dependencies change even when ours do not.) One such re-measure
 * per keystroke is invisible. Sixty per second, while a page scrolls under a
 * selection, is a nested-update storm that React refuses to keep flushing — and
 * the screen dies. Keeping the frame loop below the `Page` removes the storm at
 * its source rather than rationing it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { measureFrame, toFramePoint, visibleRect } from "./geometry";
import {
  indexByField,
  rectsOfField,
  resolveTarget,
  targetsIn,
  type FieldScope,
} from "./fieldIndex";
import type { Rect } from "./geometry";

/** What the overlay should draw right now. */
export type PickerView = {
  /** Faint outlines: every editable thing, so nothing has to be hunted for. */
  all: Rect[];
  /** The target under the pointer, drawn strongly. */
  hover: Rect | null;
  /** Every rectangle the SELECTED field occupies — often more than one. */
  selected: Rect[];
  /** The docked editor, so the connector knows what to reach for. */
  panel: Rect | null;
};

/** Where the pointer is, shared between the capture layer and the frame loop. */
export type PointerRef = React.RefObject<{ x: number; y: number } | null>;

const EMPTY: PickerView = { all: [], hover: null, selected: [], panel: null };

/** Sub-pixel movement nobody can see, and re-rendering for it is not free. */
const EPSILON = 0.5;

/**
 * Whether two rectangles are the same to the nearest visible half-pixel.
 *
 * @param a - One rectangle, or null.
 * @param b - The other, or null.
 * @returns True when redrawing would change nothing on screen.
 */
function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    Math.abs(a.x - b.x) < EPSILON &&
    Math.abs(a.y - b.y) < EPSILON &&
    Math.abs(a.w - b.w) < EPSILON &&
    Math.abs(a.h - b.h) < EPSILON
  );
}

/**
 * Whether a freshly measured view is worth publishing.
 *
 * The frame loop measures 60 times a second and every measurement builds new
 * objects. Publishing only real change keeps the overlay's own re-renders down
 * to the frames on which something actually moved.
 *
 * @param a - The view currently on screen.
 * @param b - What was just measured.
 * @returns True when they would look identical.
 */
function sameView(a: PickerView, b: PickerView): boolean {
  if (!sameRect(a.hover, b.hover)) return false;
  if (!sameRect(a.panel, b.panel)) return false;
  if (a.all.length !== b.all.length) return false;
  if (a.selected.length !== b.selected.length) return false;
  return (
    a.all.every((rect, i) => sameRect(rect, b.all[i])) &&
    a.selected.every((rect, i) => sameRect(rect, b.selected[i]))
  );
}

/**
 * The picker's pointer: the handlers for the window, and where it is.
 *
 * Holds no state, so nothing re-renders as the pointer moves — the frame loop
 * reads the ref instead. Every value returned is stable for as long as its
 * inputs are.
 *
 * These go on the SECTION WINDOW, which is a scrolling box with the film inside
 * it at `pointer-events: none`. That is the whole reason this needs no capture
 * layer and no `preventDefault`: the pointer already cannot reach the
 * storefront's links, so the wheel is never taken away from the browser and
 * scrolling stays native — momentum, chaining at the ends, touch and all.
 *
 * @param iframeRef - The preview frame.
 * @param scope - The keys this window may offer.
 * @param onPick - Called with the field keys of whatever the owner clicks.
 * @returns The pointer position, and the window's handlers.
 */
export function usePickerPointer({
  iframeRef,
  scope,
  onPick,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  scope: FieldScope;
  onPick: (keys: string[]) => void;
}) {
  // The live pointer, so the frame loop can re-resolve as the page moves under
  // a stationary cursor — a carousel slides a card out from under it every 4.2s.
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    pointer.current = { x: event.clientX, y: event.clientY };
  }, []);

  const onPointerLeave = useCallback(() => {
    pointer.current = null;
  }, []);

  /**
   * Resolve what was clicked from the CLICK'S OWN position, not from whatever
   * the last hover happened to land on.
   *
   * A pointer that never moved — a tap, a click after a scroll, anything
   * synthetic — leaves no hover to inherit, and reading the stale one would
   * either do nothing or open the wrong field. The click knows where it is.
   */
  const onClick = useCallback(
    (event: React.MouseEvent) => {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      if (!iframe || !doc) return;
      const client = { x: event.clientX, y: event.clientY };
      const hit = resolveTarget(
        doc,
        iframe,
        client,
        toFramePoint(client.x, client.y, iframe),
        scope,
      );
      if (hit && hit.keys.length > 0) onPick(hit.keys);
    },
    [iframeRef, scope, onPick],
  );

  return { pointer, onPointerMove, onPointerLeave, onClick };
}

/**
 * Measure everything the overlay draws, every frame, while anything is on it.
 *
 * Call this ONLY from the component that draws the result. Its state changes at
 * frame rate; anything that re-renders with it pays that price sixty times a
 * second, and a Polaris `Page` cannot afford it — see the note at the top.
 *
 * @param iframeRef - The preview frame.
 * @param pointer - Where the pointer is, from `usePickerPointer`.
 * @param armed - Whether the picker is on AND this window is worth measuring.
 * @param selectedKey - The field currently being edited, if any.
 * @param panelRef - The docked editor, measured for the connector.
 * @param scope - The keys this window may offer.
 * @returns The rectangles to draw.
 */
export function usePickerView({
  iframeRef,
  pointer,
  armed,
  selectedKey,
  panelRef,
  scope,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  pointer: PointerRef;
  armed: boolean;
  selectedKey: string | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  scope: FieldScope;
}): PickerView {
  const [view, setView] = useState<PickerView>(EMPTY);

  const measure = useCallback((): PickerView => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return EMPTY;

    // Once for the whole pass. It carries the frame's own geometry AND the box
    // it is seen through — which on a section window is the rail and window
    // clipping it from the admin side, not its own content box.
    const seen = measureFrame(iframe);

    const all = armed
      ? targetsIn(doc, scope)
          .map((target) => visibleRect(target.element, iframe, seen))
          .filter((rect): rect is Rect => rect !== null)
      : [];

    let hover: Rect | null = null;
    if (armed && pointer.current) {
      const point = toFramePoint(pointer.current.x, pointer.current.y, iframe);
      hover =
        resolveTarget(doc, iframe, pointer.current, point, scope, seen)?.rect ??
        null;
    }

    const selected = selectedKey
      ? rectsOfField(indexByField(doc, scope), selectedKey, iframe, seen)
      : [];

    // The panel moves for the same reasons and on the same frames as the
    // selection it points at, so it is measured here rather than in a second
    // loop of its own. Two loops feeding each other was the first wrong guess
    // at this crash; one loop that nobody else listens to is the answer.
    const node = panelRef.current;
    const box = node?.getBoundingClientRect();
    const panel = box
      ? { x: box.x, y: box.y, w: box.width, h: box.height }
      : null;

    return { all, hover, selected, panel };
  }, [iframeRef, pointer, armed, selectedKey, panelRef, scope]);

  // Re-measure every frame while anything is on screen. Cheap relative to being
  // wrong: a highlight that lags the page it points at is worse than none.
  const active = armed || selectedKey !== null;

  useEffect(() => {
    // Nothing to draw: leave the stale rects in state and let the return value
    // below report EMPTY instead. Clearing them here would be a setState inside
    // an effect for a value that is already derivable.
    if (!active) return;
    let running = true;
    let raf = 0;
    const tick = () => {
      if (!running) return;
      const next = measure();
      setView((current) => (sameView(current, next) ? current : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [active, measure]);

  return active ? view : EMPTY;
}
