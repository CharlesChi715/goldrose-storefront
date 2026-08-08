"use client";

/**
 * ROLE OF THIS FILE
 * The page-wide live preview at the top of Content → Home page: the real home
 * page in a phone-shaped window, on a width slider.
 *
 * WHY IT IS ITS OWN COMPONENT
 * Only so that dragging its slider does not re-render the editor. The width
 * used to be state on HomeSectionsEditor, which renders nine preview frames and
 * ~180 Polaris fields, so one pixel of slider travel cost about 30ms of React
 * on top of a 14ms frame — measured at 44ms per frame while dragging, against
 * 13.7ms idle. Neither the iframe's re-layout nor any paint was in that number:
 * sweeping the same iframe's width, and separately its transform, by hand cost
 * 13.89ms, which is idle. It was all React.
 *
 * The live width therefore lives here, where a drag re-renders one card. Since
 * 2026-08-08 this is the screen's ONLY width control — every section's window
 * is held at whatever it says, because a section frame at another width is at
 * another scale and would stop being a picture of what this preview shows. So
 * the settled value is published upward inside `startTransition`: React then
 * treats the editor's re-render as interruptible and drops the intermediate
 * ones, and the drag stays at frame rate while the nine windows catch up at
 * rest.
 *
 * Be careful what you claim for this control: ScaleFrame scales the whole 430
 * stage as ONE, so a narrower width shrinks everything rather than re-wrapping
 * any text. It answers "is this legible on a small phone", NOT "does this copy
 * still fit its box" — that is what the per-field character budgets are for.
 */

import { startTransition, useEffect, useRef, useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  RangeSlider,
  Text,
} from "@shopify/polaris";
import { useAdminT } from "../../../PolarisShell";

/**
 * The whole home page, at whatever phone width the owner picks.
 *
 * @param props.designWidth - The frame's own canvas width; where the slider
 *   starts and what "Back to design width" returns to.
 * @param props.min - Narrowest selectable width.
 * @param props.max - Widest selectable width.
 * @param props.nonce - Bumped by the editor after every save, to reload.
 * @param props.onRefresh - Ask the editor to bump the nonce.
 * @param props.onWidthSettled - Publish the width the sections should match.
 * @returns The page-wide preview card.
 */
/** The picker's pointer handlers, when it is armed. */
export type CaptureHandlers = {
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerLeave: () => void;
  onClick: (event: React.MouseEvent) => void;
};

export function MainPreview({
  designWidth,
  min,
  max,
  nonce,
  onRefresh,
  onWidthSettled,
  iframeRef,
  capture,
  armed = false,
  onToggleArm,
}: {
  designWidth: number;
  min: number;
  max: number;
  nonce: number;
  onRefresh: () => void;
  onWidthSettled: (width: number) => void;
  /** Handed up so the picker can read the preview's own document. */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  /** Present only while the picker is armed. */
  capture?: CaptureHandlers | null;
  /** Whether point-and-edit is on. */
  armed?: boolean;
  /** Omit to hide the picker control entirely. */
  onToggleArm?: () => void;
}) {
  const t = useAdminT();
  const [width, setWidth] = useState(designWidth);
  const captureRef = useRef<HTMLDivElement | null>(null);

  /**
   * While the picker is armed, its capture layer swallows the wheel — so the
   * preview could not be scrolled, and only the top 620px of a 5,000px page was
   * ever reachable to point at. The layer forwards the wheel into the frame
   * instead.
   *
   * A native listener rather than React's `onWheel`, because React registers
   * wheel handlers passively at the root and a passive listener cannot
   * `preventDefault()` — without which the admin page scrolls away underneath
   * at the same time.
   */
  useEffect(() => {
    const node = captureRef.current;
    if (!node || !capture) return;
    const onWheel = (event: WheelEvent) => {
      const frame = iframeRef?.current?.contentWindow;
      if (!frame) return;
      event.preventDefault();
      // `deltaY` is only in PIXELS when deltaMode is 0. A mouse wheel usually
      // reports LINES (deltaMode 1, ~3 per notch), which is why forwarding the
      // raw number felt like treacle next to a normal scroll — three pixels a
      // notch instead of fifty. Converted here rather than scaled by a fudge
      // factor, so it tracks the platform.
      const LINE = 16;
      const unit =
        event.deltaMode === 1
          ? LINE
          : event.deltaMode === 2
            ? node.clientHeight || LINE * 20
            : 1;
      frame.scrollBy({
        top: event.deltaY * unit,
        left: event.deltaX * unit,
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [capture, iframeRef]);

  /** Move the frame now; tell the editor when it can afford to listen. */
  function change(next: number) {
    setWidth(next);
    startTransition(() => onWidthSettled(next));
  }

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center" gap="200">
          <Text as="h2" variant="headingSm">
            {t("home.livePreview")}
          </Text>
          <InlineStack gap="300" blockAlign="center">
            <Button variant="plain" onClick={onRefresh}>
              {t("home.refreshPreview")}
            </Button>
            {/* The picker lives HERE rather than in a card of its own: it acts
                on this frame and nothing else, and a control sitting apart from
                the thing it changes has to be explained before it can be used. */}
            {onToggleArm ? (
              <Button
                variant={armed ? "primary" : "secondary"}
                onClick={onToggleArm}
              >
                {armed ? t("home.picker.disarm") : t("home.picker.arm")}
              </Button>
            ) : null}
          </InlineStack>
        </InlineStack>
        <Text as="p" variant="bodySm" tone="subdued">
          {armed ? t("home.picker.armed") : t("home.livePreviewHelp")}
        </Text>

        <RangeSlider
          label={
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="bodyMd">
                {t("home.previewWidth")}
              </Text>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {`${width} px`}
              </Text>
              {/* Always rendered, disabled at the design width: a button that
                  appears is a row that grows, and this row sits directly above
                  the frame, so mounting it mid-drag stepped the page. */}
              <Button
                variant="plain"
                disabled={width === designWidth}
                onClick={() => change(designWidth)}
              >
                {t("home.previewWidthReset")}
              </Button>
            </InlineStack>
          }
          min={min}
          max={max}
          step={1}
          value={width}
          prefix={
            <Text as="span" variant="bodySm" tone="subdued">
              {min}
            </Text>
          }
          suffix={
            <Text as="span" variant="bodySm" tone="subdued">
              {max}
            </Text>
          }
          helpText={t("home.previewWidthHelp")}
          onChange={(next) => change(typeof next === "number" ? next : next[0])}
        />

        <Box background="bg-surface-secondary" borderRadius="200" padding="200">
          {/* `relative` so the capture layer can cover exactly the frame. */}
          <div
            style={{
              position: "relative",
              width,
              maxWidth: "100%",
              margin: "0 auto",
            }}
          >
            <iframe
              ref={iframeRef}
              key={nonce}
              src={`/?adminPreview=${nonce}`}
              title={t("home.livePreview")}
              // This card sits below the section map, which is already a full
              // render of the same page. Loading only on scroll means opening the
              // screen builds the home page once rather than twice at the same
              // moment. (The map has no such attribute on purpose: it is the
              // thing above the fold, so it is the one that must be there.)
              loading="lazy"
              style={{
                display: "block",
                // The whole point of the slider: this width IS the viewport the
                // storefront sees, so ScaleFrame scales the 430 canvas against it
                // exactly as a real phone would. Unlike the per-section frames
                // this one is a fixed-height WINDOW onto a 5000px page rather
                // than a whole band, so it is laid out at the width rather than
                // scaled to it — scaling would shrink the window too.
                width,
                height: 620,
                maxWidth: "100%",
                margin: "0 auto",
                border: "1px solid #e3e3e3",
                borderRadius: 8,
                background: "#FFF6EC",
              }}
            />
            {/* The picker's capture layer. It exists only while armed, and only
              to keep the pointer OUT of the preview: the storefront's links are
              real, and one click would navigate the frame off `/` and lose the
              preview entirely. Hit-testing happens by translating the pointer
              into the frame's own coordinates instead. */}
            {capture ? (
              <div
                ref={captureRef}
                data-home-picker-capture
                onPointerMove={capture.onPointerMove}
                onPointerLeave={capture.onPointerLeave}
                onClick={capture.onClick}
                style={{
                  position: "absolute",
                  inset: 0,
                  cursor: "crosshair",
                  zIndex: 2,
                }}
              />
            ) : null}
          </div>
        </Box>
      </BlockStack>
    </Card>
  );
}
