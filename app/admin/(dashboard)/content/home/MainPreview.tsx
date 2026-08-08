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
 * The live width therefore lives here, where a drag re-renders one card. The
 * sections' "Match the main preview" still needs to know it, so it is published
 * upward inside `startTransition` — React then treats the editor's re-render as
 * interruptible and drops the intermediate ones, and the drag stays at frame
 * rate while the sections learn the settled value.
 *
 * Be careful what you claim for this control: ScaleFrame scales the whole 430
 * stage as ONE, so a narrower width shrinks everything rather than re-wrapping
 * any text. It answers "is this legible on a small phone", NOT "does this copy
 * still fit its box" — that is what the per-field character budgets are for.
 */

import { startTransition, useState } from "react";
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
export function MainPreview({
  designWidth,
  min,
  max,
  nonce,
  onRefresh,
  onWidthSettled,
}: {
  designWidth: number;
  min: number;
  max: number;
  nonce: number;
  onRefresh: () => void;
  onWidthSettled: (width: number) => void;
}) {
  const t = useAdminT();
  const [width, setWidth] = useState(designWidth);

  /** Move the frame now; tell the editor when it can afford to listen. */
  function change(next: number) {
    setWidth(next);
    startTransition(() => onWidthSettled(next));
  }

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingSm">
            {t("home.livePreview")}
          </Text>
          <Button variant="plain" onClick={onRefresh}>
            {t("home.refreshPreview")}
          </Button>
        </InlineStack>
        <Text as="p" variant="bodySm" tone="subdued">
          {t("home.livePreviewHelp")}
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
          <iframe
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
        </Box>
      </BlockStack>
    </Card>
  );
}
