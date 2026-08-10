/**
 * ROLE OF THIS FILE
 * The search overlay's geometry — every y coordinate and the stage height that
 * follows from them, kept out of the component so it can be unit-tested.
 *
 * WHY THE HEIGHT IS COMPUTED AND NOT MEASURED
 * The overlay is a Figma frame drawn at 430x932 and scaled to the viewport by
 * a CSS transform. A transform does not change layout size, so the scroll
 * wrapper's height is a NUMBER the component has to state, and NoCalcScale's
 * fallback path clips that wrapper at `height x scale` on old engines. Content
 * that spills past the stated height is therefore not merely ugly — on those
 * engines it is unreachable. Measuring the DOM would also mean a layout effect
 * on every keystroke. So the height is arithmetic on the row count and the
 * frame's own pitch, exactly as the shop canvas derives its height from its
 * grid rows (`app/shop/page.tsx` CANVAS) and the bag from its lines.
 *
 * WHY 932 IS A FLOOR RATHER THAN THE ANSWER
 * The imported frame is 932 tall and its idle state (trending chips + four
 * recent searches) ends at y=663, so the design ships with 269px of slack
 * below the content. Shortening the stage to fit would move the design; the
 * floor keeps the idle overlay byte-identical to the import while still
 * letting a long result list grow the stage rather than be clipped by it.
 * Same lesson as the shop's DRAWER_FLOOR, from the other direction.
 *
 * CHANGING THE HEIGHT MEANS CHANGING FOUR NUMBERS TOGETHER
 * The stage height, the wrapper's base height, the `@supports` wrapper ratio
 * and NoCalcScale's `height` prop all describe the same rectangle. They are
 * derived here from one input so they cannot drift apart.
 */

/** The design width every imported frame is authored at. */
export const STAGE_WIDTH = 430;

/**
 * The imported frame's own height (1523:3266). Also the floor: the overlay is
 * never shorter than the design, only taller. See WHY 932 IS A FLOOR.
 */
export const STAGE_MIN_HEIGHT = 932;

/**
 * Empty space kept below the last element when the stage has to grow. The
 * frame's own 16px of bottom slack (its content ends at 663 of 932 with the
 * design's four recent rows) is not a useful guide at full height, so this is
 * the comfortable thumb-room a scrolled list wants instead.
 */
export const BOTTOM_SLACK = 48;

/* ---------- The frame's own landmarks (verbatim from 1523:3266) ---------- */

/** Bottom edge of the "Press enter to search" hint — where our panel starts. */
export const HINT_BOTTOM = 152;

/** Section heading baseline box top ("Trending Searches" / "Recent Searches"). */
export const SECTION_HEADING_TOP = 181;

/** Height a 25/30 Playfair section heading occupies before its content. */
export const SECTION_HEADING_H = 30;

/** First trending chip row; also where a result list begins. */
export const LIST_TOP = 231;

/** Trending chips: two rows at y=231 and y=283, each 40 tall. */
export const CHIP_ROW_TOP = [231, 283] as const;
export const CHIP_H = 40;

/** The hairline under the trending block. */
export const SEPARATOR_TOP = 351;

/** "Recent Searches" heading, and the first recent row. */
export const RECENTS_HEADING_TOP = 383;
export const RECENTS_TOP = 439;

/** Recent rows sit on a 58px pitch and are 50 tall (the frame's own numbers). */
export const RECENT_PITCH = 58;
export const RECENT_H = 50;

/* ---------- The result list (new; drawn in the frame's language) ---------- */

/**
 * One result row: a 64px photo with 10px of air above and below, then the
 * hairline the frame uses between recent searches. Chosen so a row is legible
 * at the ~0.87 scale a 375px-wide phone renders the 430 stage at, and so six
 * of them plus the footer still fit inside the design's own 932.
 */
export const RESULT_ROW_H = 84;
export const RESULT_PHOTO = 64;
export const RESULT_PHOTO_INSET = 10;

/** The "See all N gifts" footer button under a result list. */
export const FOOTER_GAP = 16;
export const FOOTER_H = 48;

/**
 * How many rows each state draws. Six results is the most that fits above the
 * design's own 932 with the footer; the rest are one tap away on /shop, which
 * is the page built to show a grid. The idle list is shorter because it starts
 * lower down, under the trending block.
 */
export const MAX_RESULT_ROWS = 6;
export const MAX_IDLE_ROWS = 5;

/**
 * The top edge of one row in a list.
 *
 * @param top - The list's own first-row top edge, in design px.
 * @param index - Zero-based row number.
 * @param pitch - Row pitch; defaults to a result row's height.
 * @returns The row's top edge, in design px.
 */
export function rowTop(
  top: number,
  index: number,
  pitch: number = RESULT_ROW_H,
): number {
  return top + index * pitch;
}

/**
 * The bottom edge of a list of rows.
 *
 * The last row contributes its HEIGHT, not its pitch. For result rows the two
 * are the same number, but the frame's recent-search rows are 50 tall on a 58
 * pitch — the 8px is the gap to the next row, and counting it on the last one
 * would put the stage's content 8px lower than the design's.
 *
 * @param top - The list's first-row top edge, in design px.
 * @param rows - How many rows are drawn. Zero or fewer returns the top edge.
 * @param pitch - Row pitch; defaults to a result row's height.
 * @param rowHeight - One row's drawn height; defaults to the pitch.
 * @returns The bottom edge, in design px.
 */
export function listBottom(
  top: number,
  rows: number,
  pitch: number = RESULT_ROW_H,
  rowHeight: number = pitch,
): number {
  return rows <= 0 ? top : top + (rows - 1) * pitch + rowHeight;
}

/**
 * The stage height for a panel whose content ends at `contentBottom`.
 *
 * @param contentBottom - Bottom edge of the last drawn element, in design px.
 * @returns The stage height: never below the frame's own 932, and otherwise
 *   the content plus {@link BOTTOM_SLACK}, rounded up to a whole pixel.
 */
export function stageHeight(contentBottom: number): number {
  return Math.max(STAGE_MIN_HEIGHT, Math.ceil(contentBottom + BOTTOM_SLACK));
}

/**
 * The `@supports` wrapper ratio for a stage height — the multiplier that keeps
 * the scroll wrapper as tall as the transform-scaled stage actually looks.
 *
 * The wrapper's height is `min(100vw, 480px) * ratio` because the stage is
 * scaled by `min(100vw, 480px) / 430`. Seven decimal places is what the
 * imported frame shipped (932/430 = 2.1674419) and is well inside a pixel at
 * the 480px cap.
 *
 * @param height - The stage height, in design px.
 * @returns The ratio as a fixed-precision string, ready for the CSS text.
 */
export function wrapRatio(height: number): string {
  return (height / STAGE_WIDTH).toFixed(7);
}
