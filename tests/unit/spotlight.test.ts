/**
 * ROLE OF THIS FILE
 * Unit tests for spotlight areas — the framing maths behind every product
 * photo box.
 *
 * Two things here can silently ruin the storefront. The first is the
 * no-zoom case emitting a transform: `scale(1)` is visually a no-op but it
 * promotes the image to its own compositing layer, which shifts antialiasing
 * and breaks the three pixel baselines — so "unzoomed means no transform at
 * all" is pinned, not assumed. The second is the difference between a card
 * area that was never set and one deliberately framed dead centre: they
 * store differently and must resolve differently, because the first has to
 * keep following the product page and the second must not.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CENTRE,
  MAX_ZOOM,
  NO_ZOOM,
  cardAreaOf,
  clampAxis,
  clampZoom,
  spotlightOf,
  spotlightStyle,
} from "../../lib/images/spotlight.ts";

test("an unzoomed area emits no transform at all", () => {
  const style = spotlightStyle(CENTRE);
  assert.equal(style.objectFit, "cover");
  assert.equal(style.objectPosition, "50% 50%");
  // Not `scale(1)` — the absence of the property is what keeps the pixel
  // baselines byte-identical to before spotlights existed.
  assert.ok(!("transform" in style));
  assert.ok(!("transformOrigin" in style));
});

test("a zoomed area scales about its own focal point", () => {
  const style = spotlightStyle({ x: 30, y: 70, zoom: 250 });
  assert.equal(style.objectPosition, "30% 70%");
  assert.equal(style.transform, "scale(2.5)");
  // The origin MUST match object-position: that is what makes the chosen
  // content point the one the zoom holds still.
  assert.equal(style.transformOrigin, "30% 70%");
});

test("clamping keeps the database's check constraints satisfiable", () => {
  assert.equal(clampAxis(-40), 0);
  assert.equal(clampAxis(140), 100);
  assert.equal(clampAxis(33.6), 34);
  // Missing or unusable means centre — the pre-0008 crop.
  assert.equal(clampAxis(undefined), 50);
  assert.equal(clampAxis(Number.NaN), 50);

  assert.equal(clampZoom(50), NO_ZOOM);
  assert.equal(clampZoom(10_000), MAX_ZOOM);
  assert.equal(clampZoom(undefined), NO_ZOOM);
});

test("rows predating the migrations read as the crop they already had", () => {
  assert.deepEqual(spotlightOf({}), CENTRE);
  assert.deepEqual(spotlightOf(undefined), CENTRE);
  // A 0008 row has a point but no zoom.
  assert.deepEqual(spotlightOf({ focal_x: 20, focal_y: 80 }), {
    x: 20,
    y: 80,
    zoom: NO_ZOOM,
  });
});

test("an unframed card follows the product page's point, unzoomed", () => {
  const image = { focal_x: 20, focal_y: 80, focal_zoom: 300 };
  assert.deepEqual(cardAreaOf(image), { x: 20, y: 80, zoom: NO_ZOOM });
});

test("a framed card ignores the product page entirely", () => {
  const image = {
    focal_x: 20,
    focal_y: 80,
    card_focal_x: 90,
    card_focal_y: 10,
    card_zoom: 150,
  };
  assert.deepEqual(cardAreaOf(image), { x: 90, y: 10, zoom: 150 });
});

test("framing the card dead centre is not the same as never framing it", () => {
  const spotlight = { focal_x: 20, focal_y: 80 };
  const never = cardAreaOf(spotlight);
  const centred = cardAreaOf({
    ...spotlight,
    card_focal_x: 50,
    card_focal_y: 50,
  });
  // Never framed inherits 20/80; deliberately centred stays at 50/50. If
  // these ever collapse together, the owner loses the ability to say "the
  // card should show the middle even though the hero does not".
  assert.deepEqual(never, { x: 20, y: 80, zoom: NO_ZOOM });
  assert.deepEqual(centred, { x: 50, y: 50, zoom: NO_ZOOM });
});

test("a half-written card area falls back rather than half-applying", () => {
  // Only one axis stored — impossible through the admin, but a partial row
  // must not produce a crop nobody chose.
  const image = { focal_x: 20, focal_y: 80, card_focal_x: 90 };
  assert.deepEqual(cardAreaOf(image), { x: 20, y: 80, zoom: NO_ZOOM });
});
