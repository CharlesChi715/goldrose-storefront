/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Helpers for the glyph icons on the 2026-07-27 screens. The designs set
 * their icons as TEXT glyphs (◷ ▢ ♡ ⌖ …) in Noto Sans SC; browsers resolve
 * those to different fallback fonts than Figma does (established gotcha), so
 * every ornamental glyph is served as Figma's own outlined-SVG export from
 * /public/eldreve/screens. The exports are cropped to ink extents, so they
 * are placed at natural size, centred on the glyph's design box.
 */

import { abs } from "@/lib/figma-layout";

/**
 * One glyph SVG at natural (ink) size, centred on the node's design box.
 *
 * @param src - Figma node id of the export under /eldreve/screens.
 * @param x - Node box left, frame coordinates.
 * @param y - Node box top.
 * @param w - Node box width.
 * @param h - Node box height.
 * @param ink - The export's natural width/height (from the SVG header).
 */
export function Glyph({
  src,
  x,
  y,
  w,
  h,
  ink,
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ink: [number, number];
}) {
  const [iw, ih] = ink;
  return (
    <img
      src={`/eldreve/screens/${src}.svg`}
      alt=""
      width={iw}
      height={ih}
      style={{
        ...abs(x + (w - iw) / 2, y + (h - ih) / 2, iw, ih),
        display: "block",
      }}
    />
  );
}
