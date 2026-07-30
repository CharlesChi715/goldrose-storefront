/**
 * ROLE OF THIS FILE
 * Guards the product-handle rule (docs/ixd/naming/product-handles.md):
 * `productHandle` in lib/admin/product-handle.ts must reproduce every row of
 * the doc's fixture table exactly.
 *
 * The fixtures are PARSED OUT OF THE DOC rather than copied here, so the two
 * cannot drift: changing a fixture in the doc without matching code fails.
 *
 * Runs under plain Node: `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { productHandle } from "../../lib/admin/product-handle.ts";

const DOC = join(
  import.meta.dirname,
  "..",
  "..",
  "docs",
  "ixd",
  "naming",
  "product-handles.md",
);

/** Pulls `title` → expected-handle pairs out of the doc's fixture table. */
function fixtures(): Array<{ title: string; expected: string }> {
  const md = readFileSync(DOC, "utf8");
  const rows: Array<{ title: string; expected: string }> = [];
  // Fixture rows look like: | 1 | `Some Title` | `some-title` |
  for (const match of md.matchAll(
    /^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm,
  )) {
    rows.push({ title: match[1], expected: match[2] });
  }
  return rows;
}

test("the doc's fixture table is present and non-trivial", () => {
  assert.ok(
    fixtures().length >= 8,
    "expected at least 8 fixture rows in product-handles.md",
  );
});

test("productHandle reproduces every fixture row exactly", () => {
  for (const { title, expected } of fixtures()) {
    assert.equal(productHandle(title), expected, `title: ${title}`);
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
