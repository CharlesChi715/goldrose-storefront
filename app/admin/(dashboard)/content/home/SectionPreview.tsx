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
 * @param props.mainWidth - The width the page-wide preview is set to.
 * @param props.min - Narrowest selectable width, shared with the main preview.
 * @param props.max - Widest selectable width, shared with the main preview.
 * @param props.nonce - Bumped by the parent after every save, to reload.
 * @returns The preview card that opens the section.
 */
export function SectionPreview({
  sectionId,
  bandHeight,
  borrowed,
  hidden,
  mainWidth,
  min,
  max,
  nonce,
}: {
  sectionId: string;
  bandHeight: number;
  borrowed: boolean;
  hidden: boolean;
  mainWidth: number;
  min: number;
  max: number;
  nonce: number;
}) {
  const t = useAdminT();
  // Reloading this one frame without disturbing the other seven.
  const [refreshed, setRefreshed] = useState(0);
  const key = `${nonce}-${refreshed}`;
  /**
   * This section's width lives HERE, not in the editor above.
   *
   * It was in the parent, one map for all nine sections, which is the tidier
   * place for it right up until you drag: a slider pixel became a re-render of
   * the whole screen — nine frames and ~180 Polaris fields — and cost 27ms on
   * top of a 14ms frame. Measured on this machine: 41ms per frame while
   * dragging, against 13.9ms for the transform on its own, which is to say the
   * transform was free and every millisecond of the stutter was React.
   *
   * Held locally, a drag re-renders this one card. The cost: a section filtered
   * out by the search box unmounts and comes back at the design width. That is
   * a way of looking at one band, not a setting, and "Match the main preview"
   * puts it back in a click.
   */
  const [width, setWidth] = useState(DESIGN_WIDTH);

  // The route scales the 430-wide stage to the frame's width, so the frame's
  // natural height is the band's height at the same scale. Never stretched: a
  // wrong height would crop or letterbox the band.
  const fullHeight = Math.round((bandHeight * width) / DESIGN_WIDTH);

  /* --- The geometry, and why the slider is smooth ------------------------
     Three sizes, and only the middle one changes while you drag.

     1. THE STAGE is fixed. It reserves the room the widest setting needs, so
        the admin document's height never changes mid-drag. That is what stops
        the page scrollbar flashing: this page is ~26,000px tall, so a box that
        grows and shrinks by 100px re-computes the scroll thumb on every frame
        of the drag, and the strip strobes. Reserve the space and it is still.

     2. THE FRAME BOX resizes. It is the phone's own outline, so it has to —
        but it sits INSIDE the fixed stage and holds a single absolutely
        positioned child, so resizing it reflows nothing but itself.

     3. THE IFRAME NEVER RESIZES. It is laid out at the design's own 430 and
        the slider's width is applied as an outer `scale()`, which the browser
        composites instead of re-laying out.

     That last one is not an approximation. ScaleFrame already renders a FIXED
     430-wide stage and scales it by `min(100vw, 480px) / 430`, so an iframe
     430 wide scaled by w/430 composes to exactly the transform an iframe w
     wide would have applied itself — and nothing in the previewed tree keys
     off viewport width (globals.css has only `hover`/`pointer` and
     `prefers-reduced-motion` queries). Before this, every pixel of slider
     travel re-laid out a 991px document with twenty images inside it.
     --------------------------------------------------------------------- */

  // Fitted against the WIDEST setting, so the stage it reserves is the biggest
  // the frame will ever be and the reservation is never wrong.
  const widestHeight = (bandHeight * max) / DESIGN_WIDTH;
  const zoom = Math.min(1, FIT_HEIGHT / widestHeight);
  const stageWidth = Math.round(max * zoom);
  const stageHeight = Math.round(widestHeight * zoom);

  // What the band is drawn at right now, against its 430-wide design. One
  // number: the fit zoom and the slider's width both feed it, which is why it
  // moves when the slider does.
  const scale = (zoom * width) / DESIGN_WIDTH;
  const boxWidth = Math.round(width * zoom);
  const boxHeight = Math.round(fullHeight * zoom);
  const shownAt = Math.round(scale * 100);

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
              <Button variant="plain" onClick={() => setWidth(mainWidth)}>
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

        {/* 1 · The stage: fixed size, so the page below never moves. */}
        <div
          style={{
            width: stageWidth,
            height: stageHeight,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* 2 · The frame box — the phone's own outline, so it resizes. The
              border and the rounded corner live HERE rather than on the iframe:
              a scaled iframe scales its own border too, so at 40% the outline
              would thin to a hairline and the corner would tighten. */}
          <div
            style={{
              position: "relative",
              width: boxWidth,
              height: boxHeight,
              overflow: "hidden",
              border: "1px solid #e3e3e3",
              borderRadius: 8,
              background: "#FFF6EC",
            }}
          >
            {/* 3 · The frame itself, at the design's own width forever. */}
            <iframe
              key={key}
              src={`/preview/home/${sectionId}?n=${key}`}
              title={`${t("home.sectionPreview")} — ${sectionId}`}
              style={{
                display: "block",
                position: "absolute",
                top: 0,
                left: 0,
                width: DESIGN_WIDTH,
                height: bandHeight,
                border: 0,
                // Top left, so the scaled frame lands in the box's corner
                // rather than being scaled about its centre and cropped on
                // all sides.
                transformOrigin: "top left",
                transform: `scale(${scale})`,
                // Its own compositor layer: the scale then changes without
                // re-rastering the band on every frame of the drag.
                willChange: "transform",
              }}
            />
          </div>
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
              {/* Always rendered, disabled at the design width, rather than
                  mounted on demand. A button that appears is a row that grows,
                  and this row is directly above the frame: mounting it mid-drag
                  stepped the whole page 4px the moment you left 430. */}
              <Button
                variant="plain"
                disabled={width === DESIGN_WIDTH}
                onClick={() => setWidth(DESIGN_WIDTH)}
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
          onChange={(next) =>
            setWidth(typeof next === "number" ? next : next[0])
          }
        />
      </BlockStack>
    </Box>
  );
}
