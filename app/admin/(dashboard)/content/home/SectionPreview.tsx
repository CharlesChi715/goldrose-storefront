"use client";

/**
 * ROLE OF THIS FILE
 * The live preview that opens every section on Content → Home page: this band
 * of the home page and nothing else, on its own width slider.
 *
 * WHY EACH SECTION GETS ITS OWN
 * The page-wide preview at the top of the screen is the honest one — it shows
 * the bands in order, at their real spacing. It is also 5000 pixels long, so a
 * teammate editing the Craft copy has to scroll a phone-sized window to find
 * the band they are typing into, and then scroll it again after every save.
 * The section preview removes that entirely: the band is already at the top of
 * its own frame, because `/preview/home/[section]` slides it there.
 *
 * WHY EACH SLIDER IS SEPARATE, AND WHY THERE IS A SYNC BUTTON
 * The widths are independent because the question is per band: a hero photo is
 * judged at the narrowest phone, a FAQ list at the widest. But independent
 * controls drift, and eight sections silently sitting at eight widths is a
 * screen that lies about what the page looks like. "Match the main preview"
 * pulls one section back onto the width the page-wide preview is using, and it
 * only appears when the two actually differ — so a screen where everything
 * agrees shows no buttons at all.
 *
 * The frame reloads on save (the parent's nonce) or on demand (Refresh). It
 * cannot show unsaved typing: the preview is the server rendering the stored
 * content, which is the same thing the live page renders.
 */

import { useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  RangeSlider,
  Text,
  Tooltip,
} from "@shopify/polaris";
import { useAdminT } from "../../../PolarisShell";

/** The design's own canvas width — every preview's starting point. */
const DESIGN_WIDTH = 430;

/**
 * The height a section preview is fitted into, in admin pixels.
 *
 * The band is not cropped to this: it is ZOOMED OUT until the whole of it fits
 * (see the zoom maths below). A cropped preview answers "what is at the top of
 * this band", which is the one question you did not need to ask — you already
 * know which section you clicked. The whole band answers "did my heading land,
 * and does the section still hang together", which is the reason to look.
 *
 * The value is deliberately much smaller than the tallest band (Story is 1010
 * stage pixels): eight full-height previews turned the editor into a page of
 * previews with the fields buried between them. At 400 the zoom lands between
 * 40% (Story, Craft) and 100% (the short bands), and "Open in a new tab" is
 * there when small is too small to read.
 */
const FIT_HEIGHT = 400;

/**
 * One section's standalone live preview, with its own width control.
 *
 * @param props.sectionId - The section to preview; also the URL segment.
 * @param props.bandHeight - The band's height in stage pixels, used to give the
 *   frame the exact aspect ratio the band has on the page.
 * @param props.borrowed - True when this section has nothing of its own on the
 *   page and the frame is standing in with another band (the rail speed).
 * @param props.hidden - True when the owner has switched this section off.
 * @param props.width - The phone width this preview is standing in for.
 * @param props.mainWidth - The width the page-wide preview is set to.
 * @param props.min - Narrowest selectable width, shared with the main preview.
 * @param props.max - Widest selectable width, shared with the main preview.
 * @param props.nonce - Bumped by the parent after every save, to reload.
 * @param props.onWidthChange - Called with the width the owner dragged to.
 * @returns The preview card that opens the section.
 */
export function SectionPreview({
  sectionId,
  bandHeight,
  borrowed,
  hidden,
  width,
  mainWidth,
  min,
  max,
  nonce,
  onWidthChange,
}: {
  sectionId: string;
  bandHeight: number;
  borrowed: boolean;
  hidden: boolean;
  width: number;
  mainWidth: number;
  min: number;
  max: number;
  nonce: number;
  onWidthChange: (width: number) => void;
}) {
  const t = useAdminT();
  // Reloading this one frame without disturbing the other seven.
  const [refreshed, setRefreshed] = useState(0);
  const key = `${nonce}-${refreshed}`;

  // The route scales the 430-wide stage to the frame's width, so the frame's
  // natural height is the band's height at the same scale. Never stretched: a
  // wrong height would crop or letterbox the band.
  const fullHeight = Math.round((bandHeight * width) / DESIGN_WIDTH);
  // Then the whole frame is zoomed out to fit.
  //
  // The zoom is fixed PER BAND — derived from the band's own design height,
  // never from the slider's width. Deriving it from `fullHeight` (the obvious
  // way, and how this shipped first) made the slider do nothing at all: the
  // frame grew with the width and the zoom shrank by exactly the same factor,
  // so the box came out the same size at 320 as at 440, pixel for pixel. The
  // control looked live and moved nothing.
  //
  // Held constant, the box is `width × zoom` — proportional to the width
  // again, so dragging narrower visibly shrinks the preview, which is the same
  // thing the page-wide preview does and the only thing phone width CAN show
  // here: ScaleFrame scales the whole 430 stage as one, so a narrow phone
  // makes everything smaller rather than re-wrapping any line.
  const zoom = Math.min(1, FIT_HEIGHT / bandHeight);
  const boxWidth = Math.round(width * zoom);
  const boxHeight = Math.round(fullHeight * zoom);
  // What the band is actually shown at, against its 430-wide design: the zoom
  // AND the width both feed it, so the number moves when the slider does.
  const shownAt = Math.round((zoom * width * 100) / DESIGN_WIDTH);

  return (
    <Box background="bg-surface-secondary" borderRadius="200" padding="200">
      {/* Every row here earns its height: the block repeats eight times, so a
          line of prose that reads well once is 8 lines of scrolling on the
          screen. The explanation lives in the title's tooltip and the help text
          below the slider instead. */}
      <BlockStack gap="150">
        <InlineStack align="space-between" blockAlign="center" gap="200">
          <InlineStack gap="200" blockAlign="center">
            <Tooltip content={t("home.sectionPreviewHelp")}>
              <Text
                as="h3"
                variant="bodySm"
                fontWeight="semibold"
                tone="subdued"
              >
                {t("home.sectionPreview")}
              </Text>
            </Tooltip>
            {/* Said out loud, because small type that nobody asked for reads
                as a rendering fault rather than a deliberate zoom. */}
            {shownAt < 100 ? (
              <Tooltip content={t("home.previewZoomed")}>
                <Text as="span" variant="bodySm" tone="subdued">
                  {`${shownAt}%`}
                </Text>
              </Tooltip>
            ) : null}
          </InlineStack>
          <InlineStack gap="300" blockAlign="center">
            {width !== mainWidth ? (
              <Button variant="plain" onClick={() => onWidthChange(mainWidth)}>
                {t("home.previewSync")}
              </Button>
            ) : null}
            <Button
              variant="plain"
              onClick={() => setRefreshed((count) => count + 1)}
            >
              {t("home.refreshPreview")}
            </Button>
            <Button
              variant="plain"
              url={`/preview/home/${sectionId}`}
              target="_blank"
            >
              {t("home.previewOpen")}
            </Button>
          </InlineStack>
        </InlineStack>

        {/* Only the two exceptional states get a line of their own. */}
        {borrowed ? (
          <Text as="p" variant="bodySm" tone="subdued">
            {t("home.sectionPreviewBorrowed")}
          </Text>
        ) : null}
        {hidden ? (
          <Text as="p" variant="bodySm" tone="caution">
            {t("home.sectionPreviewHidden")}
          </Text>
        ) : null}

        {/* The border and the rounded corner belong to the BOX, not the frame:
            a scaled iframe scales its own border too, so at 40% the outline
            would thin to a hairline and the corner would tighten. */}
        <div
          style={{
            width: boxWidth,
            height: boxHeight,
            maxWidth: "100%",
            margin: "0 auto",
            overflow: "hidden",
            border: "1px solid #e3e3e3",
            borderRadius: 8,
            background: "#FFF6EC",
          }}
        >
          <iframe
            key={key}
            src={`/preview/home/${sectionId}?n=${key}`}
            title={`${t("home.sectionPreview")} — ${sectionId}`}
            style={{
              display: "block",
              // This width IS the viewport the storefront sees, so the band
              // lays out against it exactly as it would on that phone.
              width,
              height: fullHeight,
              border: 0,
              // Top left, so the scaled frame lands in the box's corner rather
              // than being scaled about its centre and cropped on all sides.
              transformOrigin: "top left",
              transform: zoom < 1 ? `scale(${zoom})` : undefined,
            }}
          />
        </div>

        {/* The width control is one row: the label carries the number and the
            reset, and the min/max ends sit on the track rather than above it.
            `labelHidden` would have been shorter still, but a bare slider under
            a phone-shaped frame reads as a carousel position, not a width. */}
        <RangeSlider
          label={
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">
                {t("home.previewWidth")}
              </Text>
              <Text as="span" variant="bodySm" fontWeight="semibold">
                {`${width} px`}
              </Text>
              {width !== DESIGN_WIDTH ? (
                <Button
                  variant="plain"
                  onClick={() => onWidthChange(DESIGN_WIDTH)}
                >
                  {t("home.previewWidthReset")}
                </Button>
              ) : null}
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
          onChange={(next) =>
            onWidthChange(typeof next === "number" ? next : next[0])
          }
        />
      </BlockStack>
    </Box>
  );
}
