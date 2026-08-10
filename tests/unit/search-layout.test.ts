/**
 * ROLE OF THIS FILE
 * Unit tests for the search overlay's geometry (lib/catalog/search-layout.ts).
 *
 * The silent failure here is the FLOOR. The overlay's idle panel is the
 * imported Figma frame, and the frame is 932 tall with its content ending at
 * y=663 — 269px of deliberate slack. If `stageHeight` ever starts returning
 * "content plus a margin" for the idle panel, nothing breaks and no test goes
 * red: the overlay simply stops being the design, by 221px, on every screen.
 *
 * The second is the RATIO. The stage is transform-scaled, so its layout height
 * is a number the component states rather than something the browser measures,
 * and the scroll wrapper's height is that number times the scale. Let the
 * ratio drift from the height and the panel either scrolls past its own end or
 * refuses to reach it — and on the engines NoCalcScale falls back for, the
 * overflow is clipped and genuinely unreachable.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BOTTOM_SLACK,
  MAX_IDLE_ROWS,
  MAX_RESULT_ROWS,
  RECENT_H,
  RECENT_PITCH,
  RECENTS_TOP,
  RESULT_ROW_H,
  STAGE_MIN_HEIGHT,
  STAGE_WIDTH,
  LIST_TOP,
  FOOTER_GAP,
  FOOTER_H,
  listBottom,
  rowTop,
  stageHeight,
  wrapRatio,
} from "../../lib/catalog/search-layout.ts";

test("the imported frame's own panel keeps the imported frame's own height", () => {
  // Four recent rows on the frame's 58px pitch end at 663, exactly where the
  // Figma sheet says the content ends. The stage must still be 932.
  const idle = listBottom(RECENTS_TOP, 4, RECENT_PITCH, RECENT_H);
  assert.equal(idle, 663);
  assert.equal(stageHeight(idle), STAGE_MIN_HEIGHT);
});

test("the frame's ratio is reproduced to the digit it shipped with", () => {
  // 2.1674419 is the literal in the imported CSS. If this changes, the panel
  // no longer scales the way the import did.
  assert.equal(wrapRatio(STAGE_MIN_HEIGHT), "2.1674419");
  assert.equal(wrapRatio(STAGE_MIN_HEIGHT), (932 / STAGE_WIDTH).toFixed(7));
});

test("a full result list still fits inside the design's own height", () => {
  // Six rows plus the footer. This is why the panel caps at six: one more and
  // the overlay would start growing past the frame on every search.
  const bottom = listBottom(LIST_TOP, MAX_RESULT_ROWS) + FOOTER_GAP + FOOTER_H;
  assert.ok(
    bottom <= STAGE_MIN_HEIGHT,
    `a full result panel ends at ${bottom}, past the frame's ${STAGE_MIN_HEIGHT}`,
  );
  assert.equal(stageHeight(bottom), STAGE_MIN_HEIGHT);
});

test("a full idle suggestion list also fits", () => {
  const bottom = listBottom(RECENTS_TOP, MAX_IDLE_ROWS);
  assert.ok(
    bottom <= STAGE_MIN_HEIGHT,
    `an idle panel ends at ${bottom}, past the frame's ${STAGE_MIN_HEIGHT}`,
  );
});

test("content past the frame grows the stage, with room to breathe", () => {
  // The caps above mean this cannot happen today. It is pinned because the
  // caps are the only thing preventing it, and a cap is one edit away from
  // being raised by someone who does not know the height is stated, not
  // measured.
  assert.equal(stageHeight(1000), 1000 + BOTTOM_SLACK);
  // Fractional design coordinates must not produce a fractional stage.
  assert.equal(stageHeight(1000.5), Math.ceil(1000.5 + BOTTOM_SLACK));
  assert.equal(stageHeight(1000) % 1, 0);
});

test("the ratio always describes the height it was asked about", () => {
  for (const height of [STAGE_MIN_HEIGHT, 1048, 1600]) {
    assert.equal(wrapRatio(height), (height / STAGE_WIDTH).toFixed(7));
  }
});

test("rows sit on their pitch, and an empty list takes no space", () => {
  assert.equal(rowTop(LIST_TOP, 0), LIST_TOP);
  assert.equal(rowTop(LIST_TOP, 2), LIST_TOP + 2 * RESULT_ROW_H);
  // The recent list keeps the frame's own 58, not a result row's 84.
  assert.equal(rowTop(RECENTS_TOP, 3, RECENT_PITCH), 439 + 3 * 58);
  // A one-row list is one row tall, not one pitch tall.
  assert.equal(listBottom(RECENTS_TOP, 1, RECENT_PITCH, RECENT_H), 489);
  // No rows means the list ends where it began — the footer must not float
  // 84px below nothing.
  assert.equal(listBottom(LIST_TOP, 0), LIST_TOP);
  assert.equal(listBottom(LIST_TOP, -1), LIST_TOP);
});
