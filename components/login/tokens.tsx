/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Tokens and helpers shared by the two imported ELDREVE account frames —
 * 1523:2470 ("loginpage" sign-in) and 1523:2947 (Business & Partnerships),
 * the 2026-07-29 delivery. Both are 430-wide canvases built from the same
 * palette and the same glyph pipeline, so the values live here rather than
 * being restated per frame.
 *
 * The frames were produced from the Figma sources by the import pipeline,
 * which works around two export traps (per-import notes are in git history).
 */

/* Palette, verbatim from the frames. */
export const INK = "#3B2F2F";
export const MUTED = "#B8A69A";
export const CARD = "#FFFBF6";
export const HAIRLINE = "#E5D9C9";
export const CANVAS = "#FFF6EC";
/** 07-29: the sign-in frame's outer cards and, on both frames, the inactive
    account-type tab went pure white; CARD stays the inner tile/field fill. */
export const WHITE = "#FFFFFF";

/** HTML collapses the design's double/triple spaces; these keep them. */
export const NB = " ";

/**
 * A glyph exported from a Figma TEXT node. Figma crops such exports to ink
 * extents rather than the node box, so `left`/`top` are the ink origin
 * measured from the frame render and width/height are the export's intrinsic
 * size. Centring inside the node box instead lands these 1–6px off.
 *
 * @param src - Public path of the exported asset.
 * @param left - Ink origin x, relative to the positioned parent.
 * @param top - Ink origin y, relative to the positioned parent.
 * @param width - Intrinsic width of the export.
 * @param height - Intrinsic height of the export.
 * @returns The positioned `img`.
 */
export function Glyph({
  src,
  left,
  top,
  width,
  height,
}: {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return (
    <img
      src={src}
      alt=""
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        display: "block",
      }}
    />
  );
}
