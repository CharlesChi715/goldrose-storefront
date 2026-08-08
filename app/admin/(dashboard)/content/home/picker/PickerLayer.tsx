"use client";

/**
 * ROLE OF THIS FILE
 * The only component that re-renders at frame rate — one per section window.
 *
 * It measures the picker's rectangles and draws them, and it is deliberately a
 * LEAF: nothing renders below it and nothing above it re-renders when it
 * changes. That containment is the whole point. `usePickerView` publishes up to
 * sixty times a second while a selection is on screen, and until 2026-08-08 it
 * did so from the editor screen itself — under a Polaris `Page`, whose header
 * re-measures its action buttons from a `useEffect` on every render and
 * `setState`s from inside it. Sixty of those a second, nested, is the storm
 * React ends with "Maximum update depth exceeded".
 *
 * So the rule this file exists to keep is one line long: the frame loop lives
 * below the `Page`, not beside it.
 *
 * There are now up to nine of these, one per card. Two things keep that
 * affordable: `scope` narrows each one to the ~20 fields its own section owns
 * rather than the page's 176, and `armed` is false for any card that is not on
 * screen — so the six cards scrolled past cost nothing at all.
 */

import { Overlay } from "./Overlay";
import { usePickerView, type PointerRef } from "./usePicker";
import type { FieldScope } from "./fieldIndex";

export function PickerLayer({
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
  /** The field being edited, if any — it keeps its ring while unarmed. */
  selectedKey: string | null;
  /** The docked editor, measured here so the connector can reach it. */
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** The keys this window owns; see fieldIndex's FieldScope. */
  scope: FieldScope;
}) {
  const view = usePickerView({
    iframeRef,
    pointer,
    armed,
    selectedKey,
    panelRef,
    scope,
  });

  return (
    <Overlay
      all={view.all}
      hover={view.hover}
      selected={view.selected}
      // No selection means no panel to point at, even if one is mid-unmount.
      panel={selectedKey === null ? null : view.panel}
      armed={armed}
    />
  );
}
