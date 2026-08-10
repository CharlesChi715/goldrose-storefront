/**
 * ROLE OF THIS FILE
 * Unit tests for the promo strip's resolver.
 *
 * The bar draws on three pages that read their content by different routes, so
 * the thing worth pinning is that ONE function decides what the strip says: how
 * many lines it has, whether line 1 is still the design's own render (§11), and
 * how long each line is held. The rotation itself is a transform in
 * components/PromoRotator.tsx; what can go wrong here is the content.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DESIGN_PROMO_BAR,
  PROMO_CYCLE_MS,
  promoBarFrom,
} from "../../lib/home-content/promo.ts";
import { homeDefault } from "../../lib/home-content/registry.ts";

const DESIGN_SLOGAN = homeDefault("promo", "slogan");

/**
 * Build the resolver's input from a few promo fields.
 *
 * @param promo - The promo section's resolved values.
 * @param overridden - Slot keys the owner has edited.
 * @returns The structural slice of HomeContent the resolver reads.
 */
function content(
  promo: Record<string, string>,
  overridden: string[] = [],
): {
  text: { promo: Record<string, string> };
  overridden: ReadonlySet<string>;
} {
  return {
    text: { promo: { slogan: DESIGN_SLOGAN, ...promo } },
    overridden: new Set(overridden),
  };
}

test("the untouched design is one line, still Figma's own render", () => {
  const bar = promoBarFrom(content({}));
  assert.deepEqual(bar.lines, [DESIGN_SLOGAN]);
  assert.equal(bar.isDefault, true);
  assert.equal(bar.cycleMs, PROMO_CYCLE_MS);
  assert.deepEqual(DESIGN_PROMO_BAR.lines, [DESIGN_SLOGAN]);
});

test("filled lines play in order, and blanks are not slides", () => {
  // Line 2 left empty while 3 and 5 are filled: the strip plays three lines,
  // not five with two silent gaps in it.
  const bar = promoBarFrom(
    content({ line_2: "", line_3: "  FREE GIFT WRAP  ", line_5: "24K GOLD" }),
  );
  assert.deepEqual(bar.lines, [DESIGN_SLOGAN, "FREE GIFT WRAP", "24K GOLD"]);
});

test("editing the slogan retires the design's render (§11)", () => {
  const bar = promoBarFrom(
    content({ slogan: "FREE SHIPPING OVER $75" }, ["promo.slogan"]),
  );
  assert.equal(bar.isDefault, false);
  assert.equal(bar.lines[0], "FREE SHIPPING OVER $75");
});

test("a slogan emptied to nothing still leaves the strip something to say", () => {
  const bar = promoBarFrom(content({ slogan: "   " }, ["promo.slogan"]));
  assert.deepEqual(bar.lines, [DESIGN_SLOGAN]);
});

test("an unusable hold falls back to the design's rather than to zero", () => {
  // A zero or NaN interval would make setInterval fire continuously.
  for (const bad of ["", "   ", "soon", "0", "-1"]) {
    assert.equal(
      promoBarFrom(content({ cycle_ms: bad })).cycleMs,
      PROMO_CYCLE_MS,
    );
  }
  assert.equal(promoBarFrom(content({ cycle_ms: "8000" })).cycleMs, 8000);
});
