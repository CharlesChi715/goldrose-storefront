/**
 * ROLE OF THIS FILE
 * Unit tests for the geometry behind the admin's per-section live previews.
 *
 * A section preview is the real home page in an iframe, held still over one
 * band. Two things can go silently wrong with that and neither shows up as an
 * error: the window can open over the WRONG band (which shows a teammate the
 * next section under this section's name), and the scroll range can be wider
 * than the band (which quietly breaks "you cannot leave the section", the one
 * promise the feature makes). Both are pure arithmetic, so both are pinned
 * here rather than discovered in a browser.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  homePreviewTarget,
  homePreviewWindow,
} from "../../lib/home-content/preview.ts";
import { homeLayout } from "../../lib/home-content/layout.ts";
import { findSection } from "../../lib/home-content/registry.ts";

/** Everything shown, which is the state the design was imported in. */
const ALL_VISIBLE = {};

test("a band's window is its live rectangle, not its imported one", () => {
  const { shift } = homeLayout({ hero: false });
  const craft = homePreviewTarget("craft", { hero: false }, shift);
  const band = findSection("craft")?.band;
  assert.ok(band && craft);
  // TWO things move Craft up, and a window that knew about only one would open
  // 136px into the wrong band: hiding A-1 takes its 732, and A-3's permanent
  // 136px trim comes off whether or not anything is hidden. The imported y is
  // 3133; the live one is 2265.
  assert.equal(craft.y, band.y - 732 - 136);
  assert.equal(craft.y, 2265);
  assert.equal(craft.h, band.h);
  assert.equal(craft.onPage, true);
});

test("a switched-off band reports itself as not on the page", () => {
  const { shift } = homeLayout({ craft: false });
  const craft = homePreviewTarget("craft", { craft: false }, shift);
  assert.ok(craft);
  assert.equal(craft.onPage, false);
});

test("motion borrows Featured, and follows Featured off the page", () => {
  const { shift } = homeLayout(ALL_VISIBLE);
  const motion = homePreviewTarget("motion", ALL_VISIBLE, shift);
  const featured = homePreviewTarget("featured", ALL_VISIBLE, shift);
  assert.deepEqual(motion, { ...featured, from: "featured" });

  // The flag is computed on the band actually shown, so hiding Featured takes
  // motion's picture with it — it has no band of its own to fall back on.
  const hidden = { featured: false };
  const after = homePreviewTarget("motion", hidden, homeLayout(hidden).shift);
  assert.equal(after?.onPage, false);
});

test("promo is the strip above the first band, taken from the first band", () => {
  const { shift } = homeLayout(ALL_VISIBLE);
  const promo = homePreviewTarget("promo", ALL_VISIBLE, shift);
  assert.equal(promo?.y, 0);
  assert.equal(promo?.h, findSection("hero")?.band?.y);
  // Chrome is not hideable, so it is always there to look at.
  assert.equal(promo?.onPage, true);
});

test("an unknown section has nothing to show", () => {
  const { shift } = homeLayout(ALL_VISIBLE);
  assert.equal(homePreviewTarget("nonsense", ALL_VISIBLE, shift), null);
});

test("the scrollable rail is exactly the band plus its two slacks", () => {
  const w = homePreviewWindow({ y: 3000, h: 991 }, 5057, 1, 360, 48);
  // 991 + 48 + 48 = 1087, all of it inside the stage.
  assert.equal(w.railHeight, 1087);
  assert.equal(w.filmTop, -2952); // 3000 - 48
  // THE PROMISE: the browser's own scroll range is the band plus slack, so it
  // cannot be scrolled anywhere else.
  assert.equal(w.range, 1087 - 360);
});

test("the window opens on the band, with the slack above out of sight", () => {
  const w = homePreviewWindow({ y: 3000, h: 991 }, 5057, 1, 360, 48);
  // Scrolled down by exactly the top slack: the band's first pixel is at the
  // window's top edge, and the slack is somewhere to scroll UP into.
  assert.equal(w.parkAt, 48);
});

test("the slack is design pixels, so a narrower phone peeks at the same page", () => {
  const wide = homePreviewWindow({ y: 3000, h: 991 }, 5057, 1, 360, 48);
  const narrow = homePreviewWindow(
    { y: 3000, h: 991 },
    5057,
    320 / 430,
    360,
    48,
  );
  // Same page either side of the band; the pixels differ only by the scale.
  assert.equal(narrow.railHeight, Math.round(1087 * (320 / 430)));
  assert.ok(narrow.railHeight < wide.railHeight);
});

test("a band shorter than the window does not scroll at all", () => {
  // Ready to Ship is 327 tall; 327 + 96 = 423, still more than 360, so it does
  // scroll. The promo strip at 32 is the case that cannot.
  const promo = homePreviewWindow({ y: 0, h: 32 }, 5057, 1, 360, 48);
  assert.equal(promo.range, 0);
  assert.equal(promo.railHeight, 360);
  assert.equal(promo.parkAt, 0);
  // Nothing above the top of the page to centre into, so it sits at the top.
  assert.equal(promo.filmTop, 0);
});

test("the slack runs out at the ends of the page rather than inventing space", () => {
  // A band flush against the bottom of the stage: the reveal stops at the
  // stage's own height, so the window never opens onto blank space below it.
  const w = homePreviewWindow({ y: 4000, h: 1057 }, 5057, 1, 360, 48);
  assert.equal(w.railHeight, 5057 - (4000 - 48));
  assert.equal(w.filmTop, -3952);
});

test("every real section produces a window inside the page", () => {
  const { shift, frameHeight } = homeLayout(ALL_VISIBLE);
  for (const id of [
    "promo",
    "hero",
    "featured",
    "ready",
    "occasion",
    "recipient",
    "craft",
    "story",
    "motion",
  ]) {
    const target = homePreviewTarget(id, ALL_VISIBLE, shift);
    assert.ok(target, `${id} has no preview target`);
    const w = homePreviewWindow(target, frameHeight, 1, 360, 48);
    // The film is never pulled down, and never so far up that the rail runs
    // past the bottom of the page.
    assert.ok(w.filmTop <= 0, `${id} filmTop ${w.filmTop}`);
    assert.ok(
      -w.filmTop + w.railHeight <= frameHeight + 1,
      `${id} rail runs past the stage`,
    );
    // You can always see where you are, and you can never leave.
    assert.ok(w.range >= 0, `${id} negative range`);
    assert.ok(w.parkAt <= w.range, `${id} opens past its own end`);
  }
});
