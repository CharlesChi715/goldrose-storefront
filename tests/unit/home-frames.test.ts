/**
 * ROLE OF THIS FILE
 * Unit tests for homepage photo framing — the numbers that decide which part
 * of a replaced picture survives its box's crop.
 *
 * Two things are worth pinning here rather than discovering on the live page.
 * The DEFAULT must round-trip to the plain centre cover-crop, because that is
 * what makes an unframed photo render exactly as it always did and keeps the
 * home pixel baseline honest. And parsing must never throw or return something
 * unusable: the value comes out of a database row that a bad write, an old
 * shape or a hand edit could have left as anything at all, and a stray number
 * must not be able to move somebody's homepage.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CENTRE,
  FRAME_DEFAULT,
  formatFrame,
  frameKey,
  isDefaultFrame,
  parseFrame,
} from "../../lib/home-content/frames.ts";
import { HOME_SECTIONS, slotKey } from "../../lib/home-content/registry.ts";
import { MAX_ZOOM, NO_ZOOM } from "../../lib/images/spotlight.ts";

test("the default frame is the plain centre cover-crop", () => {
  assert.deepEqual(CENTRE, { x: 50, y: 50, zoom: NO_ZOOM });
  assert.equal(FRAME_DEFAULT, "50,50,100");
  assert.ok(isDefaultFrame(CENTRE));
  // The invariant the store relies on: equal to the design ⇒ no row.
  assert.equal(formatFrame(parseFrame(FRAME_DEFAULT)), FRAME_DEFAULT);
});

test("a frame round-trips through its stored form", () => {
  const area = { x: 20, y: 80, zoom: 250 };
  assert.deepEqual(parseFrame(formatFrame(area)), area);
});

test("anything unusable reads as the centre rather than throwing", () => {
  for (const bad of [
    undefined,
    null,
    "",
    "50,50",
    "50,50,100,7",
    "a,b,c",
    "NaN,50,100",
    "50,,100",
  ]) {
    assert.deepEqual(parseFrame(bad), CENTRE, `parseFrame(${String(bad)})`);
  }
});

test("out-of-range numbers are clamped, not rejected", () => {
  assert.deepEqual(parseFrame("-40,900,10"), { x: 0, y: 100, zoom: NO_ZOOM });
  assert.deepEqual(parseFrame("50,50,9999"), { x: 50, y: 50, zoom: MAX_ZOOM });
  // Fractions round: the store holds integers so the two forms cannot disagree.
  assert.deepEqual(parseFrame("33.4,66.6,150.5"), {
    x: 33,
    y: 67,
    zoom: 151,
  });
});

test("a frame is stored beside the photo it frames, never colliding with it", () => {
  const keys = new Set<string>();
  for (const section of HOME_SECTIONS) {
    for (const field of section.fields) {
      keys.add(slotKey(section.id, field));
    }
  }
  for (const section of HOME_SECTIONS) {
    for (const field of section.fields) {
      if (field.kind !== "image") continue;
      const frame = frameKey(slotKey(section.id, field));
      assert.ok(
        frame.startsWith(slotKey(section.id, field)),
        `${frame} should sit beside its photo`,
      );
      assert.ok(
        !keys.has(frame),
        `${frame} must not collide with a registry field's own slot`,
      );
    }
  }
});

test("every image field declares the box its framing is measured against", () => {
  // The framer frames against `box`, so an image field without one would offer
  // the owner a crop of a rectangle nobody ever draws.
  for (const section of HOME_SECTIONS) {
    for (const field of section.fields) {
      if (field.kind !== "image") continue;
      assert.ok(
        field.box && field.box.w > 0 && field.box.h > 0,
        `${section.id}.${field.id} has no box`,
      );
    }
  }
});
