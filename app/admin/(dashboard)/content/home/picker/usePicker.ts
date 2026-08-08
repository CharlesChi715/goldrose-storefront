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
 * The preview's own links are real. One click and the frame navigates off `/`,
 * which invalidates every coordinate here and loses the preview. So while the
 * picker is armed a transparent layer covers the frame, and hit-testing is done
 * by translating the pointer into the frame's coordinates and asking the child
 * document what is there. Nothing is ever clicked inside the preview.
 *
 * WHY IT RE-MEASURES ON A FRAME LOOP
 * A one-shot measurement is stale within a second on four of the seven bands.
 * The rails advance every 4.2s with a 900ms eased transition, the width slider
 * re-lays-out at frame rate while dragging, the frame scrolls independently of
 * the admin, and `scroll-behavior: smooth` animates any jump. While a highlight
 * is on screen it is re-measured every frame; when nothing is highlighted the
 * loop stops.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toFramePoint } from "./geometry";
import {
  indexByField,
  rectsOfField,
  resolveTarget,
  targetsIn,
  type Hit,
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
};

const EMPTY: PickerView = { all: [], hover: null, selected: [] };

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
 * The frame loop measures 60 times a second, and every measurement builds new
 * objects. Setting state each time re-renders the whole screen every frame for
 * a picture that usually has not moved — and, because this loop and the panel's
 * feed each other, it is what React reports as "maximum update depth exceeded".
 * Publishing only real change is both the fix and the optimisation.
 *
 * @param a - The view currently on screen.
 * @param b - What was just measured.
 * @returns True when they would look identical.
 */
function sameView(a: PickerView, b: PickerView): boolean {
  if (!sameRect(a.hover, b.hover)) return false;
  if (a.all.length !== b.all.length) return false;
  if (a.selected.length !== b.selected.length) return false;
  return (
    a.all.every((rect, i) => sameRect(rect, b.all[i])) &&
    a.selected.every((rect, i) => sameRect(rect, b.selected[i]))
  );
}

/**
 * Drive the picker over a preview iframe.
 *
 * @param iframeRef - The preview frame.
 * @param armed - Whether the picker is on.
 * @param selectedKey - The field currently being edited, if any.
 * @param onPick - Called with the field keys of whatever the owner clicks.
 * @returns The rectangles to draw, and the pointer handlers for the capture layer.
 */
export function usePicker(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  armed: boolean,
  selectedKey: string | null,
  onPick: (keys: string[]) => void,
) {
  const [view, setView] = useState<PickerView>(EMPTY);
  // The live pointer, so the frame loop can re-resolve as the page moves under
  // a stationary cursor — a carousel slides a card out from under it every 4.2s.
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const hovered = useRef<Hit | null>(null);

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return EMPTY;

    const all = armed
      ? targetsIn(doc)
          .map((target) => {
            const rect = rectsOfField(
              new Map([[target.keys[0], [target.element]]]),
              target.keys[0],
              iframe,
            );
            return rect[0] ?? null;
          })
          .filter((rect): rect is Rect => rect !== null)
      : [];

    let hover: Rect | null = null;
    if (armed && pointer.current) {
      const point = toFramePoint(pointer.current.x, pointer.current.y, iframe);
      const hit = resolveTarget(doc, iframe, pointer.current, point);
      hovered.current = hit;
      hover = hit?.rect ?? null;
    }

    const selected = selectedKey
      ? rectsOfField(indexByField(doc), selectedKey, iframe)
      : [];

    return { all, hover, selected };
  }, [iframeRef, armed, selectedKey]);

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

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    pointer.current = { x: event.clientX, y: event.clientY };
  }, []);

  const onPointerLeave = useCallback(() => {
    pointer.current = null;
    hovered.current = null;
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
      );
      if (hit && hit.keys.length > 0) onPick(hit.keys);
    },
    [iframeRef, onPick],
  );

  return {
    view: active ? view : EMPTY,
    onPointerMove,
    onPointerLeave,
    onClick,
  };
}
