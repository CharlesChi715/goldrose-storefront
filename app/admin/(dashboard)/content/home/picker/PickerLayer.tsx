"use client";

/**
 * ROLE OF THIS FILE
 * The one component that re-renders at frame rate.
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
 */

import { Overlay } from "./Overlay";
import { usePickerView, type PointerRef } from "./usePicker";

export function PickerLayer({
  iframeRef,
  pointer,
  armed,
  selectedKey,
  panelRef,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  pointer: PointerRef;
  armed: boolean;
  /** The field being edited, if any — it keeps its ring while unarmed. */
  selectedKey: string | null;
  /** The docked editor, measured here so the connector can reach it. */
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const view = usePickerView(iframeRef, pointer, armed, selectedKey, panelRef);

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
