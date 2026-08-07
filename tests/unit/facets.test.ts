/**
 * ROLE OF THIS FILE
 * Unit tests for the shop's filter vocabulary (lib/catalog/facets.ts).
 *
 * Two things here are load-bearing and silent when they break. The first is
 * global slug uniqueness: the group is recovered from the value, so the day
 * two groups share a slug every filter starts lying about which heading a
 * product matched. The second is the AND/OR shape of `matchesFacets` — get it
 * backwards and the shop still renders, it just quietly returns the wrong
 * products, which no page test would notice.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BEST_FOR_GROUPS,
  BEST_FOR_SLUGS,
  FACET_GROUPS,
  assertBestFor,
  facetBySlug,
  facetLabel,
  facetSubject,
  matchesFacets,
  parseFacetParam,
  type FacetSubject,
} from "../../lib/catalog/facets.ts";
import type { CatalogProduct } from "../../lib/supabase/types.ts";

/** A product that matches nothing in particular; tests override one field. */
const subject = (over: Partial<FacetSubject> = {}): FacetSubject => ({
  bestFor: [],
  priceCents: 4999,
  sellable: true,
  stocked: true,
  fullyStocked: true,
  ...over,
});

test("every slug is unique across all five groups", () => {
  const slugs = FACET_GROUPS.flatMap((group) =>
    group.facets.map((facet) => facet.slug),
  );
  assert.equal(new Set(slugs).size, slugs.length);
});

test("the stored vocabulary is exactly the three merchandising groups", () => {
  assert.deepEqual(
    BEST_FOR_GROUPS.map((group) => group.key),
    ["collection", "occasion", "recipient"],
  );
  assert.equal(BEST_FOR_SLUGS.length, 11);
});

test("every facet carries both languages and knows its own group", () => {
  for (const group of FACET_GROUPS) {
    for (const facet of group.facets) {
      assert.equal(facet.group, group.key);
      assert.ok(facet.label.length > 0, `${facet.slug} has no label`);
      assert.ok(facet.labelZh.length > 0, `${facet.slug} has no 中文 label`);
    }
  }
});

/* ---------- assertBestFor ---------- */

test("assertBestFor sorts into drawer order and keeps every value", () => {
  assert.deepEqual(assertBestFor(["girlfriend", "jewel", "birthday"]), [
    "jewel",
    "birthday",
    "girlfriend",
  ]);
});

test("assertBestFor puts no ceiling on how many values a product carries", () => {
  assert.deepEqual(assertBestFor(BEST_FOR_SLUGS), [...BEST_FOR_SLUGS]);
  assert.deepEqual(assertBestFor([]), []);
});

test("assertBestFor rejects an unknown value rather than dropping it", () => {
  assert.throws(() => assertBestFor(["girlfriend", "husband"]), /husband/);
});

test("assertBestFor rejects a derived facet — price is never stored", () => {
  assert.throws(() => assertBestFor(["under-100"]), /cannot be stored/);
});

test("assertBestFor rejects a repeated value", () => {
  assert.throws(() => assertBestFor(["wife", "wife"]), /duplicate/);
});

/* ---------- parseFacetParam ---------- */

test("parseFacetParam keeps known slugs in drawer order and de-duplicates", () => {
  assert.deepEqual(parseFacetParam("girlfriend,jewel,girlfriend"), [
    "jewel",
    "girlfriend",
  ]);
});

test("parseFacetParam drops junk instead of throwing — the URL is public", () => {
  assert.deepEqual(parseFacetParam("jewel,<script>,ex-wife"), ["jewel"]);
  assert.deepEqual(parseFacetParam(undefined), []);
  assert.deepEqual(parseFacetParam(""), []);
});

/* ---------- matchesFacets ---------- */

test("no selection matches everything", () => {
  assert.equal(matchesFacets(subject(), []), true);
});

test("OR inside a heading: either occasion is enough", () => {
  const birthdayOnly = subject({ bestFor: ["birthday"] });
  assert.equal(matchesFacets(birthdayOnly, ["birthday", "wedding"]), true);
  assert.equal(matchesFacets(birthdayOnly, ["wedding", "valentines"]), false);
});

test("AND across headings: an occasion hit alone is not enough", () => {
  const product = subject({ bestFor: ["birthday", "wife"] });
  assert.equal(matchesFacets(product, ["birthday", "wife"]), true);
  assert.equal(matchesFacets(product, ["birthday", "mother"]), false);
});

test("a product with no facets survives only an unfiltered shop", () => {
  const bare = subject({ bestFor: [] });
  assert.equal(matchesFacets(bare, []), true);
  assert.equal(matchesFacets(bare, ["jewel"]), false);
  // ...but it is still reachable by the derived groups, which do not read
  // best_for at all. An untagged product is not an invisible one.
  assert.equal(matchesFacets(bare, ["under-100"]), true);
});

test("price bands are half-open, so $100.00 is not 'Under $100'", () => {
  assert.equal(
    matchesFacets(subject({ priceCents: 9999 }), ["under-100"]),
    true,
  );
  assert.equal(
    matchesFacets(subject({ priceCents: 10000 }), ["under-100"]),
    false,
  );
  assert.equal(
    matchesFacets(subject({ priceCents: 10000 }), ["100-199"]),
    true,
  );
  assert.equal(
    matchesFacets(subject({ priceCents: 29999 }), ["200-299"]),
    true,
  );
  assert.equal(
    matchesFacets(subject({ priceCents: 30000 }), ["300-plus"]),
    true,
  );
});

test("availability separates a shelf item from a pre-order", () => {
  const onShelf = subject({
    sellable: true,
    stocked: true,
    fullyStocked: true,
  });
  const preorder = subject({
    sellable: true,
    stocked: false,
    fullyStocked: false,
  });
  // One variant on backorder: buyable and partly on the shelf, but the order
  // as a whole would wait — so it is In Stock and NOT Ready to Ship.
  const partly = subject({
    sellable: true,
    stocked: true,
    fullyStocked: false,
  });

  assert.equal(matchesFacets(onShelf, ["in-stock"]), true);
  assert.equal(matchesFacets(onShelf, ["ready-to-ship"]), true);
  assert.equal(matchesFacets(onShelf, ["pre-order"]), false);

  assert.equal(matchesFacets(preorder, ["in-stock"]), false);
  assert.equal(matchesFacets(preorder, ["pre-order"]), true);

  assert.equal(matchesFacets(partly, ["in-stock"]), true);
  assert.equal(matchesFacets(partly, ["ready-to-ship"]), false);
});

test("nothing sellable matches no availability chip at all", () => {
  const dead = subject({
    sellable: false,
    stocked: false,
    fullyStocked: false,
  });
  for (const slug of ["in-stock", "ready-to-ship", "pre-order"]) {
    assert.equal(matchesFacets(dead, [slug]), false, slug);
  }
});

/* ---------- facetSubject ---------- */

/**
 * A whole catalog row, spelled out rather than cast from a partial: the point
 * of these tests is that `facetSubject` reads only `best_for` and `variants`,
 * and a cast that hid the other columns would hide a regression that started
 * reading one.
 */
const product = (
  variants: Array<{ price_cents: number; in_stock: boolean; stocked: boolean }>,
  bestFor: string[] = [],
): CatalogProduct => ({
  id: "p1",
  handle: "p1",
  title: "Product",
  short_name: "Product",
  description: "",
  best_for: bestFor,
  badge: "",
  details: [],
  tags: [],
  option_names: [],
  position: 1,
  images: [],
  variants: variants.map((variant, index) => ({
    id: `v${index}`,
    option_values: [],
    sku: "",
    position: index,
    compare_at_price_cents: null,
    ...variant,
  })),
});

test("facetSubject prices off the first variant — the one the card shows", () => {
  const built = facetSubject(
    product([
      { price_cents: 4999, in_stock: true, stocked: true },
      { price_cents: 39999, in_stock: true, stocked: true },
    ]),
  );
  assert.equal(built.priceCents, 4999);
  assert.equal(built.fullyStocked, true);
});

test("facetSubject: one empty variant breaks 'ready to ship', not 'in stock'", () => {
  const built = facetSubject(
    product([
      { price_cents: 4999, in_stock: true, stocked: true },
      { price_cents: 5999, in_stock: true, stocked: false },
    ]),
  );
  assert.equal(built.stocked, true);
  assert.equal(built.fullyStocked, false);
});

test("facetSubject: a product with no variants is not 'fully stocked'", () => {
  const built = facetSubject(product([]));
  assert.equal(built.fullyStocked, false);
  assert.equal(built.priceCents, 0);
});

/* ---------- labels ---------- */

test("facetLabel falls back to the slug rather than blanking a chip", () => {
  assert.equal(facetLabel("girlfriend"), "Girlfriend");
  assert.equal(facetLabel("retired-slug"), "retired-slug");
  assert.equal(facetBySlug("retired-slug"), null);
});
