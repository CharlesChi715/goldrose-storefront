import { test } from "node:test";
import assert from "node:assert/strict";
import { productHandle } from "../../lib/admin/product-handle.ts";

/**
 * The handle rule, stated as the cases it must reproduce. These lived in a
 * naming document until 2026-09-20 and the test parsed them back out of its
 * Markdown table; the document was deleted because everything else in it
 * described what `lib/admin/product-handle.ts` already does. The fixtures were
 * the one part that could not be read off the code, so they moved here, where
 * changing one without changing the code fails immediately.
 *
 * Each row names why it is here — a rule with no case behind it is a rule
 * nobody can check.
 */
const FIXTURES: Array<{ title: string; expected: string; why: string }> = [
  {
    title: "24K Gold Dipped Eternal Rose",
    expected: "24k-gold-dipped-eternal-rose",
    why: "digits and letters in one token (24k)",
  },
  {
    title: "24K Gold Dipped Rose — Valentine's Gift Set",
    expected: "24k-gold-dipped-rose-valentines-gift-set",
    why: "apostrophe deleted, not hyphenated; em dash as a separator",
  },
  {
    title: "Eternal Rose in Glass Dome",
    expected: "eternal-rose-in-glass-dome",
    why: "stop word retained, deliberately",
  },
  {
    title: "Rosé Éternelle",
    expected: "rose-eternelle",
    why: "NFKD — diacritics stripped, not turned into separators",
  },
  {
    title: "Rose & Box  Set",
    expected: "rose-box-set",
    why: "space + & + double space collapses to a single hyphen",
  },
  {
    title: "Display Box, Large",
    expected: "display-box-large",
    why: "comma as a separator; size word retained",
  },
  {
    title: "24K Gold Dipped Rose — Ruby Red",
    expected: "24k-gold-dipped-rose-ruby-red",
    why: "colour word retained",
  },
  {
    title:
      "Eternal Rose Anniversary Keepsake Collection Gift Box Presentation Edition",
    expected:
      "eternal-rose-anniversary-keepsake-collection-gift-box-presentation-edition",
    why: "74 characters — long, but not truncated",
  },
];

test("productHandle reproduces every fixture row exactly", () => {
  for (const { title, expected, why } of FIXTURES) {
    assert.equal(productHandle(title), expected, `${why} — title: ${title}`);
  }
});

test("underivable titles throw instead of inventing a handle", () => {
  for (const bad of ["", "   ", "🌹", "副本", "'’"]) {
    assert.throws(
      () => productHandle(bad),
      /set one manually/,
      `title: ${JSON.stringify(bad)}`,
    );
  }
});

test("over-length handles throw instead of truncating", () => {
  assert.throws(() => productHandle("rose ".repeat(30)), /set one manually/);
});
