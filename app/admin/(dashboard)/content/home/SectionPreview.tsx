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
} from "@shopify/polaris";
import { useAdminT } from "../../../PolarisShell";

/** The design's own canvas width — every preview's starting point. */
const DESIGN_WIDTH = 430;

/**
 * Tallest frame a section preview is given before it scrolls inside itself.
 * The Story band is 1010 stage pixels; eight bands at full height would make
 * the editor unusable, and a band that scrolls is still a band you can read.
 */
const MAX_FRAME_HEIGHT = 720;

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
  // natural height is the band's height at the same scale. Capped, never
  // stretched: a wrong height would crop or letterbox the band.
  const scaled = Math.round((bandHeight * width) / DESIGN_WIDTH);
  const frameHeight = Math.min(scaled, MAX_FRAME_HEIGHT);

  return (
    <Box background="bg-surface-secondary" borderRadius="200" padding="300">
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center" gap="200">
          <Text as="h3" variant="headingSm">
            {t("home.sectionPreview")}
          </Text>
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
          </InlineStack>
        </InlineStack>

        <Text as="p" variant="bodySm" tone="subdued">
          {t("home.sectionPreviewHelp")}
        </Text>
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

        <iframe
          key={key}
          src={`/preview/home/${sectionId}?n=${key}`}
          title={`${t("home.sectionPreview")} — ${sectionId}`}
          style={{
            display: "block",
            // This width IS the viewport the storefront sees, so the band
            // scales against it exactly as it would on that phone.
            width,
            height: frameHeight,
            maxWidth: "100%",
            margin: "0 auto",
            border: "1px solid #e3e3e3",
            borderRadius: 8,
            background: "#FFF6EC",
          }}
        />

        <RangeSlider
          label={
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="bodyMd">
                {t("home.previewWidth")}
              </Text>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
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
          output
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

        <InlineStack align="end">
          <Button
            variant="plain"
            url={`/preview/home/${sectionId}`}
            target="_blank"
          >
            {t("home.previewOpen")}
          </Button>
        </InlineStack>
      </BlockStack>
    </Box>
  );
}
