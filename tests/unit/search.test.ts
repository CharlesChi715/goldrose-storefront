/**
 * ROLE OF THIS FILE
 * Unit tests for the storefront search engine (lib/catalog/search.ts).
 *
 * Four things here break silently. The first is the PROMISE THE DESIGN MAKES:
 * the overlay's hint offers "products, occasions, or recipients" and its
 * trending chips say "For Mom" and "Ready to Ship". Those are facets, not
 * words in any title, so if the alias table or the facet filter regresses the
 * search box still works perfectly — it just answers three of our own chips
 * with an empty shop, exactly as it did before 2026-08-10.
 *
 * The second is the ZERO-RESULT CONTRACT that /shop depends on: a query that
 * genuinely matches nothing must return nothing (`mode: "none"`), because the
 * relaxation ladder in the engine is one step away from "and if all else
 * fails, show everything" — which is what the page used to do, and what
 * tests/e2e/screens.spec.ts pins it against.
 *
 * The third is RANKING STABILITY. Ties fall back to merchandised position; if
 * that tiebreak is dropped the results reorder between two identical searches
 * and nobody notices until a shopper says the shop "keeps moving".
 *
 * The fourth is highlightRuns' index mapping: it matches on folded text and
 * slices the ORIGINAL, so an off-by-one there silently bolds the wrong letters
 * of any name containing an accent or a curly apostrophe.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  highlightRuns,
  normalizeSearchText,
  searchDocs,
  toSearchDoc,
  type SearchDoc,
} from "../../lib/catalog/search.ts";
import type { CatalogProduct } from "../../lib/supabase/types.ts";

/** A product that matches nothing in particular; tests override one field. */
const doc = (over: Partial<SearchDoc> = {}): SearchDoc => ({
  handle: "a-product",
  title: "ELDREVE Something",
  shortName: "Something",
  facets: [],
  tags: [],
  badge: "",
  description: "",
  position: 1,
  ...over,
});

/** The three products the local seed ships, reduced to what search reads. */
const SIGNATURE = doc({
  handle: "signature-24k-gold-rose",
  title: "ELDREVE Signature 24K Gold Rose",
  shortName: "Signature Rose",
  facets: [
    "classic",
    "anniversary",
    "birthday",
    "wife",
    "girlfriend",
    "in-stock",
    "ready-to-ship",
  ],
  description:
    "A genuine rose preserved with a luminous 24K gold dipped finish.",
  position: 1,
});
const KEEPSAKE = doc({
  handle: "boxed-keepsake-gold-rose",
  title: "ELDREVE Boxed Keepsake Rose",
  shortName: "Boxed Keepsake",
  facets: [
    "jewel",
    "valentines",
    "wedding",
    "mother",
    "girlfriend",
    "in-stock",
    "ready-to-ship",
  ],
  description:
    "The rose plus presentation packaging for a more finished gift moment.",
  position: 2,
});
const BUNDLE = doc({
  handle: "premium-gold-rose-gift-bundle",
  title: "ELDREVE Premium Gift Bundle",
  shortName: "Premium Bundle",
  facets: [
    "sparkle",
    "anniversary",
    "wedding",
    "wife",
    "friends",
    "in-stock",
    "ready-to-ship",
  ],
  description:
    "A higher-value bundle focused on material detail and a stronger reveal.",
  position: 3,
});
const SEED = [SIGNATURE, KEEPSAKE, BUNDLE];

const handles = (docs: readonly SearchDoc[], query: string) =>
  searchDocs(docs, query).hits.map((hit) => hit.doc.handle);

/* ---------- Normalising ---------- */

test("folding drops accents and closes up apostrophes", () => {
  // Figma writes "Valentine’s" with a curly apostrophe; a shopper types
  // "valentines". These have to be the same word or the chip finds nothing.
  assert.equal(normalizeSearchText("Valentine’s"), "valentines");
  assert.equal(normalizeSearchText("Valentine's"), "valentines");
  assert.equal(normalizeSearchText("Café Rosé"), "cafe rose");
  assert.equal(normalizeSearchText("  24K  GOLD-ROSE! "), "24k gold rose");
  assert.equal(normalizeSearchText("!!!"), "");
});

/* ---------- The empty query ---------- */

test("an empty query is every product in merchandised order", () => {
  const result = searchDocs(SEED, "");
  assert.equal(result.mode, "all");
  assert.deepEqual(
    result.hits.map((hit) => hit.doc.position),
    [1, 2, 3],
  );
});

test("a query of nothing but stop words is treated as no query, not a failed one", () => {
  // "gifts for the" is grammar, not a question. Answering it with "no gifts
  // match" would be a dead end a shopper reached by being polite.
  const result = searchDocs(SEED, "gifts for the");
  assert.equal(result.mode, "all");
  assert.equal(result.hits.length, 3);
});

/* ---------- The promise the design makes ---------- */

test("“For Mom” finds what the drawer's Mother chip finds, and nothing else", () => {
  const result = searchDocs(SEED, "For Mom");
  assert.deepEqual(result.facets, ["mother"]);
  assert.equal(result.mode, "exact");
  assert.deepEqual(
    result.hits.map((hit) => hit.doc.handle),
    ["boxed-keepsake-gold-rose"],
  );
});

test("“Anniversary Gift” drops the word gift and matches the occasion", () => {
  const result = searchDocs(SEED, "Anniversary Gift");
  assert.deepEqual(result.facets, ["anniversary"]);
  assert.deepEqual(
    result.hits.map((hit) => hit.doc.handle),
    ["signature-24k-gold-rose", "premium-gold-rose-gift-bundle"],
  );
});

test("“Ready to Ship” matches the derived availability facet", () => {
  const result = searchDocs(SEED, "Ready to Ship");
  assert.deepEqual(result.facets, ["ready-to-ship"]);
  assert.equal(result.hits.length, 3);

  // And a product that is merely sellable is not swept in with the stocked.
  const preorder = doc({
    handle: "preorder",
    facets: ["in-stock", "pre-order"],
  });
  assert.deepEqual(handles([preorder], "ready to ship"), []);
});

test("every trending chip the overlay ships returns something", () => {
  // The five chips in components/SearchOverlay.tsx. This is the regression
  // that started the work: three of them used to return an empty grid.
  for (const chip of [
    "24K Gold Rose",
    "Anniversary Gift",
    "Rose Gift Set",
    "For Mom",
    "Ready to Ship",
  ]) {
    const result = searchDocs(SEED, chip);
    assert.notEqual(result.mode, "none", `"${chip}" found nothing`);
    assert.ok(result.hits.length > 0, `"${chip}" found nothing`);
  }
});

/* ---------- Facet combination ---------- */

test("facets from different headings narrow, facets from one heading widen", () => {
  // AND across headings: an anniversary gift for a wife.
  assert.deepEqual(handles(SEED, "anniversary wife"), [
    "signature-24k-gold-rose",
    "premium-gold-rose-gift-bundle",
  ]);
  // OR inside a heading: for a mother or a wife.
  assert.deepEqual(handles(SEED, "mother wife").sort(), [
    "boxed-keepsake-gold-rose",
    "premium-gold-rose-gift-bundle",
    "signature-24k-gold-rose",
  ]);
  // AND across headings, with no product carrying both.
  assert.deepEqual(handles(SEED, "mother birthday"), []);
});

/* ---------- Words ---------- */

test("a name match outranks a description match", () => {
  const named = doc({
    handle: "named",
    shortName: "Keepsake Rose",
    position: 9,
  });
  const mentioned = doc({
    handle: "mentioned",
    shortName: "Something Else",
    description: "comes with a keepsake card",
    position: 1,
  });
  // `mentioned` is earlier in the catalog, so only the score can put the
  // named product first.
  assert.deepEqual(handles([mentioned, named], "keepsake"), [
    "named",
    "mentioned",
  ]);
});

test("a longer word that merely STARTS with ours is not our word", () => {
  // The plural rule is "the term may be a few characters longer than the
  // indexed word". Unbounded, it reads as "any term beginning with one of our
  // words", and then a shopper searching for a rosewood table is told we sell
  // it — as an EXACT match, because every one of their words landed.
  assert.deepEqual(handles([SIGNATURE], "rosewood"), []);
  assert.deepEqual(handles([SIGNATURE], "rosewood dining table"), []);
  // A pasted paragraph must not match the whole catalog either.
  assert.deepEqual(handles(SEED, "rose".repeat(300)), []);
});

test("the words for a mother's day gift all arrive at the same shelf", () => {
  // "Mother's Day" folds to "mothers day"; without the phrase alias, "day"
  // survives as a word that matches nothing and drags the search off course.
  for (const query of ["mom", "mum", "mother", "mother's day", "for my mum"]) {
    const result = searchDocs(SEED, query);
    assert.deepEqual(result.facets, ["mother"], `"${query}" missed the facet`);
    assert.deepEqual(
      result.hits.map((hit) => hit.doc.handle),
      ["boxed-keepsake-gold-rose"],
      `"${query}" found the wrong products`,
    );
  }
});

test("asking for something cheap is a price band, not a dead end", () => {
  // The price bands are derived, so a real doc carries "under-100" from
  // toSearchDoc. A shopper who types "cheap" and is told nothing matches is a
  // shopper who leaves.
  const affordable = doc({ handle: "affordable", facets: ["under-100"] });
  for (const query of ["cheap", "cheap gift", "affordable", "budget"]) {
    assert.deepEqual(
      handles([affordable], query),
      ["affordable"],
      `"${query}" found nothing`,
    );
  }
  // But "premium" stays a NAME: an alias consumes the word it maps, so
  // pricing it would make the Premium Bundle unfindable by its own name.
  assert.deepEqual(handles(SEED, "premium"), ["premium-gold-rose-gift-bundle"]);
});

test("plurals and part-words find the product anyway", () => {
  assert.deepEqual(handles([SIGNATURE], "roses"), ["signature-24k-gold-rose"]);
  assert.deepEqual(handles([KEEPSAKE], "box"), ["boxed-keepsake-gold-rose"]);
});

test("results arrive from the second keystroke, and the highlighter agrees", () => {
  // MIN_PREFIX and highlightRuns' own floor have to be the same number. When
  // the engine needed three characters and the highlighter bolded from two,
  // "ro" produced "no exact match" over a list of rows with "Ro" bolded in
  // them — a contradiction on screen that no error would ever report.
  assert.deepEqual(handles([SIGNATURE], "ro"), ["signature-24k-gold-rose"]);
  assert.deepEqual(handles([SIGNATURE], "24"), ["signature-24k-gold-rose"]);
  assert.ok(
    highlightRuns("Signature Rose", ["ro"]).some((run) => run.hit),
    "the highlighter must bold what the engine matched",
  );
  // One letter is still not a search.
  assert.deepEqual(handles([SIGNATURE], "r"), []);
});

test("a query we cannot read is not a request for the whole shop", () => {
  // 玫瑰 and 🌹 fold away to nothing, exactly as an empty box does. Treating
  // them alike returned the entire catalogue reported as MATCHES for a query
  // none of it matched; the caller shows the same products as SUGGESTIONS
  // under "No exact match" instead, which is the honest version.
  for (const query of ["玫瑰", "🌹", "!!!", "...", "   ."]) {
    const result = searchDocs(SEED, query);
    assert.equal(result.mode, "none", `"${query}" claimed to match`);
    assert.deepEqual(result.hits, []);
  }
  // A genuinely empty box is still everything.
  assert.equal(searchDocs(SEED, "").mode, "all");
  assert.equal(searchDocs(SEED, "   ").mode, "all");
});

test("an absurdly long query is bounded rather than scanned", () => {
  // ?q= is a stranger's to write, and extractFacets rescans the string once
  // per occurrence of each of some sixty phrases.
  const long = "rose ".repeat(5_000);
  const started = process.hrtime.bigint();
  const result = searchDocs(SEED, long);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(
    ms < 50,
    `a ${long.length}-character query took ${ms.toFixed(0)}ms`,
  );
  assert.ok(result.hits.length > 0);
});

test("a product whose title lost the word is still found by its handle", () => {
  // The seed's Premium Bundle is called "ELDREVE Premium Gift Bundle" — no
  // "rose" anywhere in its title or copy — in a shop that sells nothing but
  // gold roses. Its frozen handle still says so, and that is the only reason
  // searching "rose" returns all three products instead of two.
  assert.deepEqual(handles(SEED, "rose").sort(), [
    "boxed-keepsake-gold-rose",
    "premium-gold-rose-gift-bundle",
    "signature-24k-gold-rose",
  ]);
  // But a handle match must never outrank a product actually named for it.
  assert.equal(
    searchDocs(SEED, "rose").hits[0].doc.handle,
    "signature-24k-gold-rose",
  );
});

test("a multi-word query beats the same words scattered", () => {
  const together = doc({
    handle: "together",
    shortName: "Gold Rose",
    position: 9,
  });
  const apart = doc({
    handle: "apart",
    shortName: "Rose Stand",
    description: "finished in gold",
    position: 1,
  });
  assert.deepEqual(handles([apart, together], "gold rose"), [
    "together",
    "apart",
  ]);
});

/* ---------- The relaxation ladder ---------- */

test("a query where every word lands is exact", () => {
  const result = searchDocs(SEED, "premium bundle");
  assert.equal(result.mode, "exact");
  assert.deepEqual(
    result.hits.map((hit) => hit.doc.handle),
    ["premium-gold-rose-gift-bundle"],
  );
});

test("a query with one unmatchable word relaxes rather than emptying the shop", () => {
  // "Rose Gift Set" is one of our own trending chips: "gift" is dropped as a
  // stop word, "rose" lands, "set" matches nothing we sell.
  const result = searchDocs(SEED, "Rose Gift Set");
  assert.equal(result.mode, "relaxed");
  assert.ok(result.hits.length > 0);
});

test("a named facet survives one step of relaxation, then gives way", () => {
  // "mom" is a facet and "sparkly" matches nothing: the mother product is
  // still the honest answer, so the facet is kept and the word let go.
  const kept = searchDocs(SEED, "mom sparkly");
  assert.equal(kept.mode, "relaxed");
  assert.deepEqual(
    kept.hits.map((hit) => hit.doc.handle),
    ["boxed-keepsake-gold-rose"],
  );

  // "mom" plus a word only OTHER products have: the words win, because a
  // result set is better than an empty one and the shopper can see the names.
  const given = searchDocs(SEED, "mom premium");
  assert.equal(given.mode, "relaxed");
  assert.deepEqual(
    given.hits.map((hit) => hit.doc.handle),
    ["premium-gold-rose-gift-bundle"],
  );
});

test("a query that matches nothing at all returns nothing at all", () => {
  // The contract /shop is built on — see tests/e2e/screens.spec.ts. If this
  // ever returns the catalog, the shop silently starts answering every typo
  // with a full grid.
  const result = searchDocs(SEED, "zzzznotaproduct");
  assert.equal(result.mode, "none");
  assert.deepEqual(result.hits, []);
});

test("a facet nothing carries returns nothing, rather than every product", () => {
  const result = searchDocs(SEED, "pre-order");
  assert.equal(result.mode, "none");
  assert.deepEqual(result.hits, []);
});

/* ---------- Ranking stability ---------- */

test("equal scores fall back to merchandised order, both directions", () => {
  const first = doc({ handle: "first", shortName: "Gold Rose", position: 1 });
  const second = doc({ handle: "second", shortName: "Gold Rose", position: 2 });
  // Identical text, so only position can decide — and it must decide the same
  // way whichever order the catalog arrives in.
  assert.deepEqual(handles([first, second], "gold rose"), ["first", "second"]);
  assert.deepEqual(handles([second, first], "gold rose"), ["first", "second"]);
});

/* ---------- Indexing ---------- */

test("indexing a product folds its stored and derived facets into one list", () => {
  const product = {
    id: "1",
    handle: "h",
    title: "ELDREVE Rose",
    short_name: "Rose",
    description: "d",
    best_for: ["mother", "wedding"],
    badge: "",
    details: [],
    tags: ["gold"],
    option_names: [],
    position: 4,
    images: [],
    variants: [
      {
        id: "v",
        option_values: [],
        sku: "",
        position: 1,
        price_cents: 4999,
        compare_at_price_cents: null,
        in_stock: true,
        stocked: true,
      },
    ],
  } satisfies CatalogProduct;
  const indexed = toSearchDoc(product);
  assert.equal(indexed.shortName, "Rose");
  // Stored merchandising plus the availability/price the catalog knows — the
  // whole reason typing "ready to ship" can work at all.
  assert.deepEqual(indexed.facets, [
    "mother",
    "wedding",
    "under-100",
    "in-stock",
    "ready-to-ship",
  ]);
});

test("a product with no short name is indexed under its title", () => {
  const indexed = toSearchDoc({
    id: "1",
    handle: "h",
    title: "ELDREVE Rose",
    short_name: "",
    description: "",
    best_for: [],
    badge: "",
    details: [],
    tags: [],
    option_names: [],
    position: 1,
    images: [],
    variants: [],
  } satisfies CatalogProduct);
  assert.equal(indexed.shortName, "ELDREVE Rose");
});

/* ---------- Highlighting ---------- */

test("highlighting returns the original characters, not the folded ones", () => {
  const runs = highlightRuns("Valentine’s Rose", ["valentines"]);
  assert.equal(runs.map((run) => run.text).join(""), "Valentine’s Rose");
  assert.deepEqual(
    runs.filter((run) => run.hit).map((run) => run.text),
    ["Valentine’s"],
  );
});

test("highlighting only lights up whole words from the start", () => {
  // "ann" must bold "Anniversary" but "ver" must not bold its middle — a
  // highlight inside a word reads as a rendering fault, not a match.
  assert.deepEqual(
    highlightRuns("Anniversary Rose", ["ann"]).filter((run) => run.hit),
    [{ text: "Ann", hit: true }],
  );
  assert.deepEqual(
    highlightRuns("Anniversary Rose", ["ver"]).filter((run) => run.hit),
    [],
  );
});

test("highlighting with no usable terms returns the label in one piece", () => {
  assert.deepEqual(highlightRuns("Signature Rose", []), [
    { text: "Signature Rose", hit: false },
  ]);
  assert.deepEqual(highlightRuns("", ["rose"]), []);
});
