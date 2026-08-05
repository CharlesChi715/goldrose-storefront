/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Shared chrome for the AFTER-SALES returns flow (frames 2030:182…189,
 * imported 2026-08-02): the frames' Brand Navigation header plus the batch's
 * own card and glyph helpers. This batch draws its cards as #FFFEFC with a
 * 1px #E9DFD3 inside-stroke and no drop shadow, so account-chrome's sCard
 * (white + #E5D9C9 + shadow) deliberately is not used here. Every screen in
 * the flow shows the design's mock data — there is no returns backend.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { BrandWordmark } from "@/components/screens/account-chrome";
import { abs } from "@/lib/figma-layout";

/** Page fill of every frame in the batch. */
export const PAGE_BG = "#FFF6EC";
/** Fill of the batch's standard card. */
export const CARD_BG = "#FFFEFC";
/** Inside-stroke of the batch's standard card. */
export const CARD_STROKE = "#E9DFD3";

/**
 * The batch card surface: fill, 1px inside-stroke (boxShadow so absolute
 * children keep frame coordinates — never border), radius per sheet.
 *
 * @param x Card left, frame coordinates.
 * @param y Card top.
 * @param w Card width.
 * @param h Card height.
 * @param opts Fill / stroke color and corner radius overrides.
 * @returns Style object for the card rectangle.
 */
export function card(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { bg?: string; stroke?: string; r?: number } = {},
): React.CSSProperties {
  const { bg = CARD_BG, stroke = CARD_STROKE, r = 14 } = opts;
  return {
    ...abs(x, y, w, h),
    background: bg,
    boxShadow: `inset 0 0 0 1px ${stroke}`,
    borderRadius: r,
  };
}

/**
 * One of Figma's SVG text-glyph exports (cropped to ink), placed at natural
 * size: centred on the node box horizontally (or left-aligned for LEFT
 * nodes) and centred on the glyph's LINE box vertically. These TEXT nodes
 * are TOP-anchored with a line height taller than their 20–24px boxes, so
 * centring on the box (the shared Glyph helper) would sit the ink ~7px high
 * — verified against the frame renders.
 *
 * @param src Figma node id of the export under /eldreve/screens.
 * @param x Node box left, frame coordinates.
 * @param y Node box top.
 * @param w Node box width.
 * @param lh The text node's line height, in px.
 * @param ink The export's natural width/height (from the SVG header).
 * @param align Horizontal anchor; the sheets' glyph nodes are CENTER or LEFT.
 * @param scale Optional uniform scale (used to reuse an export at another
 *   font size when the smaller twin shipped no export of its own).
 */
export function LineGlyph({
  src,
  x,
  y,
  w,
  lh,
  ink,
  align = "center",
  scale = 1,
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  lh: number;
  ink: [number, number];
  align?: "center" | "left";
  scale?: number;
}) {
  const iw = ink[0] * scale;
  const ih = ink[1] * scale;
  const left = align === "left" ? x : x + (w - iw) / 2;
  return (
    <img
      src={`/eldreve/screens/${src}.svg`}
      alt=""
      width={iw}
      height={ih}
      style={{ ...abs(left, y + (lh - ih) / 2, iw, ih), display: "block" }}
    />
  );
}

/**
 * The frames' Brand Navigation band. Component-internal geometry: back
 * 40×43 @ (15,24.5), wordmark 140×51 @ (145,20.5), cart 40×43 @ (375,24.5);
 * each frame embeds the instance a few px off 0 (−4…+2), passed as dy.
 * The frames' wordmark image reads "ELDREVE" — the brand itself (DQ-34) —
 * so the live pages ship that art unchanged. The back arrow reuses the 07-29 返回 raster 1523-3470 (the
 * same source bitmap, hash 147fbe10, as this batch's header art); the cart
 * art links to /checkout, which is the live cart (shared cart convention).
 *
 * @param dy The frame's Brand Navigation instance y-offset.
 * @param backFallback BackButton fallback: /account on the returns root,
 *   /account/returns on the flow's detail pages.
 */
export function ReturnsHeader({
  dy = 0,
  backFallback,
}: {
  dy?: number;
  backFallback: string;
}) {
  return (
    <>
      <BackButton
        fallback={backFallback}
        src="/eldreve/screens/1523-3470.png"
        style={abs(15, 24.5 + dy, 40, 43)}
      />
      <BrandWordmark x={145} y={20.5 + dy} w={140} h={51} />
      <Link
        href="/checkout"
        aria-label="Cart"
        style={{ ...abs(375, 24.5 + dy, 40, 43), display: "block" }}
      >
        <img
          src="/eldreve/screens/2024-320-2024-317.png"
          alt=""
          width={40}
          height={43}
          style={{ display: "block", width: 40, height: 43 }}
        />
      </Link>
    </>
  );
}
