/**
 * ROLE OF THIS FILE
 * Unit tests for the homepage content registry and its re-stacking maths.
 *
 * The layout arithmetic is the part that can silently ruin the page: the bands
 * are absolutely positioned, so if the shifts and the stage height ever
 * disagree the homepage gains a hole or a tail of empty cream. These tests pin
 * the contiguity the arithmetic assumes, and the "no override ⇒ design value"
 * invariant the pixel baseline depends on.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HOME_SECTION_LIST,
  allHomeKeys,
  fieldBudget,
  isEditable,
  isSafeHref,
  slotKey,
  visibilityKey,
} from "../../lib/home-content/registry.ts";
import {
  HOME_FRAME_HEIGHT,
  homeLayout,
} from "../../lib/home-content/layout.ts";

/** The stage is 5134px of bands plus the 59px bottom nav. */
const NAV_HEIGHT = 59;

/** Height the design has deleted from inside bands, still spanned by the
 *  imported coordinates. A-3's Real Rose Promise strip is the only one. */
const TOTAL_TRIM = HOME_SECTION_LIST.reduce(
  (sum, s) => sum + (s.band?.trim ?? 0),
  0,
);

test("the bands tile the stage with no gaps and no overlap", () => {
  const bands = HOME_SECTION_LIST.filter((s) => s.band !== null);
  let y = bands[0]!.band!.y;
  for (const section of bands) {
    assert.equal(section.band!.y, y, `${section.id} starts at the wrong y`);
    // Coordinates are the untouched import, so a band still spans its trim —
    // the trim is closed at render time, not in the imported geometry.
    y += section.band!.h + (section.band!.trim ?? 0);
  }
  assert.equal(y + NAV_HEIGHT, HOME_FRAME_HEIGHT);
});

test("with everything visible, only the design's own trims are removed", () => {
  const { shift, frameHeight } = homeLayout({});
  assert.equal(frameHeight, HOME_FRAME_HEIGHT - TOTAL_TRIM);
  // Bands at or above the trimmed one never move.
  assert.equal(shift.hero, 0);
  assert.equal(shift.featured, 0);
  assert.equal(shift.ready, 0);
  // Everything below it slides up by the trim, with no band hidden.
  assert.equal(shift.occasion, -TOTAL_TRIM);
  assert.equal(shift.recipient, -TOTAL_TRIM);
  assert.equal(shift.craft, -TOTAL_TRIM);
  assert.equal(shift.story, -TOTAL_TRIM);
});

test("a trimmed band still removes its full drawn height when hidden", () => {
  // A-3 is 327 tall with 136 trimmed away; hiding it must remove all 463 so
  // the two mechanisms cannot double-count or under-count together.
  const { shift, frameHeight } = homeLayout({ ready: false });
  assert.equal(frameHeight, HOME_FRAME_HEIGHT - 463);
  assert.equal(shift.occasion, -463);
});

test("hiding one band slides only the bands below it, by its height", () => {
  const { shift, frameHeight } = homeLayout({ ready: false });
  assert.equal(frameHeight, HOME_FRAME_HEIGHT - 463);
  // Above the hidden band: untouched.
  assert.equal(shift.hero, 0);
  assert.equal(shift.featured, 0);
  // Below it: every band moves up by exactly the removed height.
  assert.equal(shift.occasion, -463);
  assert.equal(shift.recipient, -463);
  assert.equal(shift.craft, -463);
  assert.equal(shift.story, -463);
});

test("hiding several bands accumulates the shift", () => {
  const { shift, frameHeight } = homeLayout({ featured: false, craft: false });
  assert.equal(frameHeight, HOME_FRAME_HEIGHT - 641 - 991 - TOTAL_TRIM);
  assert.equal(shift.hero, 0);
  // A-3 moves for the band hidden above it, but not for its own trim.
  assert.equal(shift.ready, -641);
  assert.equal(shift.recipient, -641 - TOTAL_TRIM);
  assert.equal(shift.story, -641 - 991 - TOTAL_TRIM);
});

test("chrome sections are never shifted and have no visibility slot", () => {
  const promo = HOME_SECTION_LIST.find((s) => s.id === "promo");
  assert.equal(promo?.band, null);
  assert.equal(homeLayout({ craft: false }).shift.promo, 0);
  assert.ok(!allHomeKeys().includes(visibilityKey("promo")));
});

test("every editable field owns a distinct slot key", () => {
  const seen = new Set<string>();
  for (const section of HOME_SECTION_LIST) {
    for (const field of section.fields) {
      if (!isEditable(field)) continue;
      const key = slotKey(section.id, field);
      assert.ok(!seen.has(key), `duplicate slot key: ${key}`);
      seen.add(key);
    }
  }
  assert.ok(seen.size > 80, `expected the whole page, got ${seen.size} fields`);
  // The promo slogan keeps the key it has had since the first migration, so
  // the row seeded for it is the row this screen edits.
  assert.ok(seen.has("promo.slogan"));
});

test("read-only fields are never given a slot to write to", () => {
  const keys = new Set(allHomeKeys());
  for (const section of HOME_SECTION_LIST) {
    for (const field of section.fields) {
      if (isEditable(field)) continue;
      assert.ok(!keys.has(slotKey(section.id, field)));
    }
  }
});

test("link fields accept in-site and web links, reject executable schemes", () => {
  for (const good of [
    "/shop",
    "/policies/privacy",
    "#craft",
    "https://eldreve.com",
    "http://example.com/a?b=c",
    "mailto:hello@eldreve.com",
    "tel:+61400000000",
  ]) {
    assert.ok(isSafeHref(good), `should accept ${good}`);
  }
  for (const bad of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>",
    "vbscript:msgbox",
    "/shop\x3ajavascript:alert(1)",
    "shop",
    "",
    "   ",
  ]) {
    assert.ok(!isSafeHref(bad), `should reject ${bad}`);
  }
});

test("no design default exceeds its own character budget", () => {
  // A warning that is on the moment the screen opens is a warning nobody reads.
  // fieldBudget's floor guarantees this; the test stops a refactor removing it.
  for (const section of HOME_SECTION_LIST) {
    for (const field of section.fields) {
      const budget = fieldBudget(field);
      if (budget === null) continue;
      assert.ok(
        field.value.length <= budget,
        `${section.id}.${field.id}: default is ${field.value.length} chars, budget ${budget}`,
      );
    }
  }
});

test("every typed-in field carries a length budget", () => {
  // Links are free-length; every other editable field should tell the owner
  // roughly how much room the design's box has.
  for (const section of HOME_SECTION_LIST) {
    for (const field of section.fields) {
      if (!isEditable(field) || field.kind === "url") continue;
      assert.notEqual(
        fieldBudget(field),
        null,
        `${section.id}.${field.id} has no budget`,
      );
    }
  }
});

test("every link field's own default passes the link check", () => {
  for (const section of HOME_SECTION_LIST) {
    for (const field of section.fields) {
      if (field.kind !== "url") continue;
      assert.ok(
        isSafeHref(field.value),
        `${section.id}.${field.id} default is not a safe href`,
      );
    }
  }
});
