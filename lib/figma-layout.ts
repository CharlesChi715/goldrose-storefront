/**
 * ROLE OF THIS FILE
 * The two style helpers every imported Figma screen builds its absolute
 * layout from. They are pure CSS-value math with no JSX, so they live in lib/
 * rather than in the chrome component that used to export them.
 */

import type { CSSProperties } from "react";

/**
 * Absolute positioning at integer coordinates, with any fractional part
 * applied via transform. Chrome rounds fractional left/top when painting
 * (Figma doesn't); a translate() keeps true sub-pixel placement.
 *
 * @param left Distance from the frame's left edge, in Figma pixels.
 * @param top Distance from the frame's top edge, in Figma pixels.
 * @param width Optional fixed width, in pixels.
 * @param height Optional fixed height, in pixels.
 * @returns Style object positioning the element inside its frame.
 */
export const abs = (
  left: number,
  top: number,
  width?: number,
  height?: number,
): CSSProperties => {
  const li = Math.floor(left);
  const ti = Math.floor(top);
  const fx = Math.round((left - li) * 1000) / 1000;
  const fy = Math.round((top - ti) * 1000) / 1000;
  const s: CSSProperties = { position: "absolute", left: li, top: ti };
  if (fx || fy) s.transform = `translate(${fx}px, ${fy}px)`;
  if (width !== undefined) s.width = width;
  if (height !== undefined) s.height = height;
  return s;
};

/**
 * Type styling for a single-line Figma text node.
 *
 * @param size Font size in pixels.
 * @param lineHeight Line height in pixels, as authored in Figma.
 * @param color Any CSS color, taken verbatim from the design.
 * @param align Optional horizontal alignment; omitted means left.
 * @returns Style object for the text node. Wrapping is off by design — the
 *   frames size every text box to its content.
 */
export const txt = (
  size: number,
  lineHeight: number,
  color: string,
  align?: "center" | "right",
): CSSProperties => ({
  fontSize: size,
  lineHeight: `${lineHeight}px`,
  color,
  whiteSpace: "nowrap",
  ...(align ? { textAlign: align } : {}),
});
