/**
 * ROLE OF THIS FILE
 * The storefront's ONE search engine — the rule that decides what a typed
 * query returns. Both callers run this same function on the same shape:
 * - the header's search overlay, in the browser, on every keystroke; and
 * - `/shop?q=`, on the server, when the shopper presses Enter.
 * A dropdown that previewed different products from the page it hands over to
 * is the bug this file exists to make impossible, so neither side owns a
 * matching rule of its own. It is pure, synchronous and dependency-free for
 * the same reason `lib/catalog/facets.ts` is: it has to run in both places.
 *
 * WHAT IS SEARCHED, AND WHY IT IS NOT JUST THE TITLE
 * `/shop` used to match `title + short_name` and nothing else, while the
 * overlay's own hint promised "Search products, occasions, or recipients" and
 * its own trending chips offered "Anniversary Gift", "For Mom" and "Ready to
 * Ship". Three of the five chips we ship returned an empty grid. Occasions and
 * recipients are not free text we have to guess at — they are the closed
 * vocabulary in `facets.ts`, already stored per product as `best_for` and
 * already the thing the filter drawer filters on. So a product is indexed
 * under its facet LABELS as well as its name, and the promise the design makes
 * becomes true by construction: whatever the drawer's "Mother" chip finds,
 * typing "for mom" finds too.
 *
 * WHY A QUERY MAY NAME A FACET
 * A word that IS a facet ("anniversary", "mom", "ready to ship") is not a
 * hopeful string match, it is the shopper naming a filter we already have. So
 * ALIASES below turn that phrase into the slug and the slug filters, exactly
 * as a tapped chip would — OR inside a heading, AND across headings, the same
 * combination `matchesFacets` uses, so "anniversary for mom" narrows the way a
 * shopper expects instead of widening.
 *
 * WHY IT RELAXES INSTEAD OF RETURNING NOTHING
 * Zero results is a failure state, not an answer — especially in a shop whose
 * whole catalog fits on one screen. So the engine tries the strict reading
 * first (every word must land) and, only if that empties the shop, retries a
 * looser one (any word), reporting which reading it used in `mode` so the UI
 * can say so honestly rather than pretending the loose matches were exact.
 * It never invents a match: `mode: "none"` is a real outcome and the caller is
 * expected to show suggestions LABELLED as suggestions.
 *
 * WHY PREFIXES AND NOT A STEMMER
 * "roses" must find "Rose" and "boxed" must find "Box". A real stemmer is a
 * dependency and a table of English irregulars for a catalogue of gold roses;
 * a 3-character prefix match either way costs four lines and covers the
 * plurals and part-words a gift shopper actually types.
 */

import type { CatalogProduct } from "../supabase/types.ts";
import {
  FACET_GROUPS,
  derivedFacets,
  facetBySlug,
  facetLabel,
  facetSubject,
  type FacetGroupKey,
} from "./facets.ts";

/* ---------- The indexed shape ---------- */

/**
 * What the engine searches: a product reduced to searchable words. Deliberately
 * NOT `CatalogProduct` — this shape is also what the browser downloads
 * (`/api/search`), so it carries what a search needs and nothing else. Adding a
 * field here adds it to a public payload; see `toSearchDoc`.
 */
export type SearchDoc = {
  readonly handle: string;
  readonly title: string;
  readonly shortName: string;
  /**
   * Stored `best_for` slugs PLUS the derived availability/price slugs, resolved
   * at index time. Indexing the slug rather than the label keeps the wording
   * the design team's to change: the label is looked up through `facetLabel`.
   */
  readonly facets: readonly string[];
  readonly tags: readonly string[];
  readonly badge: string;
  readonly description: string;
  /** Merchandised catalog order — the tie-break, so equal scores are stable. */
  readonly position: number;
};

/** Which reading of the query produced the hits. */
export type SearchMode =
  /** No query — every product, in merchandised order. */
  | "all"
  /** Every word (and every named facet) landed. */
  | "exact"
  /** The strict reading was empty, so some words were let go. */
  | "relaxed"
  /** Nothing matched at all. `hits` is empty and suggestions are the caller's. */
  | "none";

/** One product the query found, and how well. */
export type SearchHit<T extends SearchDoc> = {
  readonly doc: T;
  readonly score: number;
};

/** Everything a caller needs to render results honestly. */
export type SearchResult<T extends SearchDoc> = {
  readonly hits: readonly SearchHit<T>[];
  readonly mode: SearchMode;
  /** Facet slugs the query itself named, e.g. "for mom" → ["mother"]. */
  readonly facets: readonly string[];
  /** The words actually searched, after aliases and stop words came out. */
  readonly terms: readonly string[];
};

/* ---------- Normalising ---------- */

/**
 * Fold text to the plain lowercase words a match is made of: accents dropped,
 * apostrophes closed up (so Figma's curly "Valentine’s" and a typed
 * "valentines" are the same word), everything else a separator.
 *
 * @param text - Any product text or shopper input.
 * @returns Space-separated lowercase words; "" when nothing survives.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Words a gift shopper types for grammar rather than meaning. They are dropped
 * from the query only — never from the index — so "gifts for mom" and "mom"
 * ask the same question, while a product legitimately called "Gift Bundle"
 * keeps every one of its own words.
 */
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "best",
  "buy",
  "for",
  "from",
  "gift",
  "gifts",
  "good",
  "her",
  "his",
  "idea",
  "ideas",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "present",
  "presents",
  "shop",
  "the",
  "to",
  "top",
  "with",
]);

/* ---------- Query → facet ---------- */

/**
 * Phrases that MEAN a facet. Every facet's own label is registered
 * automatically below; this table is only for the words shoppers use instead.
 * Keys are normalised phrases (see {@link normalizeSearchText}) and may be
 * several words — the longest phrase wins, so "mothers day" is read as the
 * occasion it is and not as the recipient "mother".
 */
const ALIASES: Readonly<Record<string, string>> = {
  // Recipient
  mom: "mother",
  mum: "mother",
  mummy: "mother",
  mommy: "mother",
  mama: "mother",
  mother: "mother",
  // "Mother's Day" folds to "mothers day". It is an occasion and we have no
  // occasion facet for it, so it resolves to the RECIPIENT — which is what the
  // shopper actually wants. Registered as a phrase so "day" is consumed with
  // it rather than left behind as a word that matches nothing.
  mothers: "mother",
  "mothers day": "mother",
  moms: "mother",
  mums: "mother",
  wife: "wife",
  spouse: "wife",
  gf: "girlfriend",
  girlfriend: "girlfriend",
  partner: "girlfriend",
  friend: "friends",
  friends: "friends",
  bff: "friends",
  bestie: "friends",
  // Occasion
  anniversary: "anniversary",
  anniversaries: "anniversary",
  birthday: "birthday",
  bday: "birthday",
  birthdays: "birthday",
  wedding: "wedding",
  weddings: "wedding",
  bride: "wedding",
  bridal: "wedding",
  engagement: "wedding",
  valentine: "valentines",
  valentines: "valentines",
  "valentines day": "valentines",
  romantic: "valentines",
  // Collection
  jewel: "jewel",
  jewelled: "jewel",
  jewellery: "jewel",
  jewelry: "jewel",
  classic: "classic",
  timeless: "classic",
  sparkle: "sparkle",
  sparkling: "sparkle",
  glitter: "sparkle",
  // Availability
  "in stock": "in-stock",
  instock: "in-stock",
  available: "in-stock",
  "ready to ship": "ready-to-ship",
  "ready to send": "ready-to-ship",
  "ships now": "ready-to-ship",
  "ship now": "ready-to-ship",
  "fast delivery": "ready-to-ship",
  preorder: "pre-order",
  "pre order": "pre-order",
  // Price. Only the cheap end is aliased, and deliberately so: the words for
  // the expensive end ("premium", "luxury") are words that appear in PRODUCT
  // NAMES here, and an alias CONSUMES the word — mapping "premium" to a price
  // band would stop "Premium Bundle" being findable by name.
  "under 100": "under-100",
  "under 100 dollars": "under-100",
  cheap: "under-100",
  cheapest: "under-100",
  affordable: "under-100",
  budget: "under-100",
  inexpensive: "under-100",
  "300 plus": "300-plus",
};

/** Alias phrase → slug, with every facet's own label folded in. */
const PHRASE_TO_SLUG = new Map<string, string>();
for (const [phrase, slug] of Object.entries(ALIASES)) {
  if (!facetBySlug(slug)) {
    throw new Error(
      `search: alias "${phrase}" points at unknown facet "${slug}" — the vocabulary is closed (lib/catalog/facets.ts)`,
    );
  }
  const folded = normalizeSearchText(phrase);
  if (!folded) {
    // An empty phrase would make `extractFacets` search for a needle of two
    // spaces and replace it with two spaces — forever. Caught at import, the
    // way facets.ts catches a duplicate slug, so a bad alias is a startup
    // error and never a hung browser tab.
    throw new Error(
      `search: alias "${phrase}" has no searchable characters — it would match everything and terminate nothing`,
    );
  }
  PHRASE_TO_SLUG.set(folded, slug);
}
// Every facet's own wording finds it, without anyone maintaining a copy of the
// label here: a re-worded chip keeps working, which is the whole reason
// facets.ts stores slugs rather than labels. Driven off the vocabulary rather
// than off ALIASES so a facet nobody wrote an alias for is still searchable.
for (const group of FACET_GROUPS) {
  // PRICE LABELS ARE EXCLUDED. They are symbols, not words: "$100–$199" folds
  // to the phrase "100 199", which no shopper types, and "$300+" folds to the
  // bare token "300" — so typing a number would silently mean a price BAND
  // rather than a number in a product name. The price bands a shopper can
  // actually ask for by name ("under 100", "cheap") are written out in
  // ALIASES above, deliberately and one at a time.
  if (group.key === "price") continue;
  for (const facet of group.facets) {
    const label = normalizeSearchText(facet.label);
    // An alias always wins over a label it collides with — the aliases are
    // deliberate, and a label like "In Stock" would otherwise re-register
    // itself identically anyway.
    if (label && !PHRASE_TO_SLUG.has(label)) {
      PHRASE_TO_SLUG.set(label, facet.slug);
    }
  }
}

/** Longest phrases first, so "valentines day" beats "valentines". */
const PHRASES: readonly string[] = [...PHRASE_TO_SLUG.keys()].sort(
  (a, b) => b.length - a.length || a.localeCompare(b),
);

/**
 * Pull the facets a query names out of it, leaving the rest as free words.
 *
 * @param normalized - A query already through {@link normalizeSearchText}.
 * @returns The slugs named (in first-seen order) and the words left over.
 */
function extractFacets(normalized: string): {
  facets: string[];
  rest: string;
} {
  let rest = ` ${normalized} `;
  const facets: string[] = [];
  for (const phrase of PHRASES) {
    const needle = ` ${phrase} `;
    if (!rest.includes(needle)) continue;
    const slug = PHRASE_TO_SLUG.get(phrase);
    if (slug && !facets.includes(slug)) facets.push(slug);
    // Replace every occurrence, keeping the separators either side intact.
    while (rest.includes(needle)) rest = rest.replace(needle, "  ");
  }
  return { facets, rest: rest.trim().replace(/\s+/g, " ") };
}

/**
 * Does a product carry the facets a query named? OR inside a heading, AND
 * across headings — the same combination the filter drawer applies, so
 * "birthday or wedding, for a wife" narrows rather than empties.
 *
 * @param docFacets - The product's indexed slugs.
 * @param wanted - Slugs the query named.
 * @returns True when the product satisfies every heading the query touched.
 */
function carriesFacets(
  docFacets: readonly string[],
  wanted: readonly string[],
): boolean {
  if (wanted.length === 0) return true;
  const byGroup = new Map<FacetGroupKey, string[]>();
  for (const slug of wanted) {
    const facet = facetBySlug(slug);
    if (!facet) continue;
    const bucket = byGroup.get(facet.group);
    if (bucket) bucket.push(slug);
    else byGroup.set(facet.group, [slug]);
  }
  for (const [, slugs] of byGroup) {
    if (!slugs.some((slug) => docFacets.includes(slug))) return false;
  }
  return true;
}

/* ---------- Scoring ---------- */

/**
 * What a hit in each field is worth. The order is the claim: a shopper who
 * types a product's name means that product; one who types an occasion means
 * the shelf; the description is a tiebreaker, not a reason.
 */
const WEIGHTS = {
  shortName: 100,
  title: 90,
  facet: 60,
  tag: 30,
  badge: 20,
  /**
   * The URL handle. Usually a duplicate of the title, and weighted low for
   * that reason — it must never outrank a real name. It earns its place on
   * the day the two diverge: handles are FROZEN once a product leaves draft
   * (`lib/admin/product-handle.ts`), so the handle is the name a product
   * launched with and the one every existing link still calls it by. The
   * seed's "Premium Gift Bundle" is exactly this case — its title says
   * nothing about roses, and only `premium-gold-rose-gift-bundle` puts it in
   * front of a shopper who searched the one word this whole shop is about.
   */
  handle: 15,
  description: 8,
} as const;

/** How much of a field's weight each quality of match earns. */
const WHOLE_WORD = 1;
const WORD_PREFIX = 0.8;
const WORD_PARTIAL = 0.55;
const ANYWHERE = 0.35;
/**
 * Longest query this engine will read. Anything past it is dropped rather than
 * scanned: the string arrives from `?q=`, which a stranger controls.
 */
const MAX_QUERY_LENGTH = 200;

/**
 * Shortest prefix that may match. Two, so the shop's own vocabulary works from
 * the second keystroke — "ro" finds Rose and "24" finds 24K — while a single
 * letter still matches nothing. It has to agree with `highlightRuns`, which
 * bolds from two characters: a row bolded for a reason the engine says did not
 * happen is a bug shoppers see and nobody can explain.
 */
const MIN_PREFIX = 2;
/**
 * How much longer than the indexed word a query term may be and still count as
 * the same word. This exists to catch plurals and possessives ("roses" for
 * "rose", "moms" for "mom"), and it is BOUNDED because the rule is otherwise
 * "any term that happens to start with one of our words": unbounded, a search
 * for "rosewood dining table" matches every rose we sell, and a pasted
 * paragraph beginning "rose…" matches the whole catalogue as an exact hit.
 */
const MAX_SUFFIX = 3;

type IndexedField = {
  readonly weight: number;
  readonly text: string;
  readonly words: readonly string[];
};

const INDEX_CACHE = new WeakMap<SearchDoc, readonly IndexedField[]>();

/** Normalise one document's fields once, then reuse across keystrokes. */
function fieldsOf(doc: SearchDoc): readonly IndexedField[] {
  const cached = INDEX_CACHE.get(doc);
  if (cached) return cached;
  const build = (weight: number, raw: string): IndexedField => {
    const text = normalizeSearchText(raw);
    return { weight, text, words: text ? text.split(" ") : [] };
  };
  const fields: IndexedField[] = [
    build(WEIGHTS.shortName, doc.shortName),
    build(WEIGHTS.title, doc.title),
    // Facets are indexed through their labels, so the words a shopper reads on
    // a chip are the words that find the product.
    build(WEIGHTS.facet, doc.facets.map(facetLabel).join(" ")),
    build(WEIGHTS.tag, doc.tags.join(" ")),
    build(WEIGHTS.badge, doc.badge),
    build(WEIGHTS.handle, doc.handle),
    build(WEIGHTS.description, doc.description),
  ];
  INDEX_CACHE.set(doc, fields);
  return fields;
}

/** The best match one term makes anywhere in one field, as a weighted score. */
function scoreField(field: IndexedField, term: string): number {
  if (!field.text) return 0;
  let best = 0;
  for (const word of field.words) {
    if (word === term) {
      best = Math.max(best, WHOLE_WORD);
      break;
    }
    if (term.length >= MIN_PREFIX && word.startsWith(term)) {
      best = Math.max(best, WORD_PREFIX);
    } else if (
      word.length >= MIN_PREFIX &&
      term.length - word.length <= MAX_SUFFIX &&
      term.startsWith(word)
    ) {
      // "roses" typed against a "rose" product — but not "rosewood".
      best = Math.max(best, WORD_PARTIAL);
    }
  }
  if (best === 0 && term.length >= MIN_PREFIX && field.text.includes(term)) {
    best = ANYWHERE;
  }
  return best * field.weight;
}

/** Every term's score against one document, and how many of them landed. */
function scoreDoc(
  doc: SearchDoc,
  terms: readonly string[],
  phrase: string,
): { score: number; matched: number } {
  const fields = fieldsOf(doc);
  let score = 0;
  let matched = 0;
  for (const term of terms) {
    let termScore = 0;
    for (const field of fields) termScore += scoreField(field, term);
    if (termScore > 0) matched += 1;
    score += termScore;
  }
  // A multi-word query that appears verbatim in the name is the strongest
  // signal there is ("gold rose" against "24K Gold Rose").
  if (phrase.includes(" ")) {
    for (const field of fields.slice(0, 2)) {
      if (field.text.includes(phrase)) score += field.weight;
    }
  }
  return { score, matched };
}

/* ---------- The engine ---------- */

const EMPTY_RESULT = { hits: [], mode: "none", facets: [], terms: [] } as const;

/**
 * Search a set of indexed products.
 *
 * Runs the strict reading first (every word lands, and the product carries
 * every facet the query named), then relaxes rather than returning nothing:
 * first by letting go of the word requirement, then by letting go of the named
 * facets. `mode` says which reading produced the hits so the UI can label
 * loose results as loose. See WHY IT RELAXES in the file header.
 *
 * @param docs - The indexed catalog (`toSearchDoc` per product).
 * @param query - Raw shopper input; empty means "everything".
 * @returns Ranked hits, the reading used, and the facets/terms understood.
 */
export function searchDocs<T extends SearchDoc>(
  docs: readonly T[],
  query: string,
): SearchResult<T> {
  const raw = (query ?? "").trim();
  // Bounded before any of the scanning below touches it. The query reaches the
  // server through `/shop?q=`, where its length is a stranger's choice, and
  // `extractFacets` rescans the whole string once per occurrence of each of
  // some sixty phrases. No real search is longer than this.
  const normalized = normalizeSearchText(raw.slice(0, MAX_QUERY_LENGTH));

  if (!normalized) {
    // An EMPTY box means "show me everything" — but a box with 玫瑰 or 🌹 in it
    // does not. Both fold to "", and treating them alike returned the whole
    // catalogue labelled as matches for a query none of it matched. Only a
    // genuinely empty box is "all"; anything we could not read is "none", and
    // the caller shows the catalogue as SUGGESTIONS instead, which is honest.
    if (raw) return { ...EMPTY_RESULT, facets: [], terms: [] };
    return {
      hits: [...docs]
        .sort((a, b) => a.position - b.position)
        .map((doc) => ({ doc, score: 0 })),
      mode: "all",
      facets: [],
      terms: [],
    };
  }

  const { facets, rest } = extractFacets(normalized);
  const terms = rest
    .split(" ")
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));

  // A query that was ENTIRELY facet words ("for mom") has no free terms left:
  // the facet filter alone is the whole question, and it is a precise one.
  if (terms.length === 0) {
    if (facets.length === 0) {
      // Every word was a stop word ("gifts for the"). Treat it as no query
      // rather than as a failed one.
      return { ...searchDocs(docs, ""), facets: [], terms: [] };
    }
    const kept = docs.filter((doc) => carriesFacets(doc.facets, facets));
    if (kept.length > 0) {
      return {
        hits: kept
          .sort((a, b) => a.position - b.position)
          .map((doc) => ({ doc, score: WEIGHTS.facet })),
        mode: "exact",
        facets,
        terms: [],
      };
    }
    return { ...EMPTY_RESULT, facets, terms: [] };
  }

  const scored = docs.map((doc) => ({
    doc,
    ...scoreDoc(doc, terms, normalized),
    carries: carriesFacets(doc.facets, facets),
  }));

  /** Best score first; ties fall back to merchandised order, never to chance. */
  const rank = (list: typeof scored): SearchHit<T>[] =>
    list
      .slice()
      .sort((a, b) => b.score - a.score || a.doc.position - b.doc.position)
      .map(({ doc, score }) => ({ doc, score }));

  // 1. Strict: carries every named facet AND every word landed.
  const strict = scored.filter(
    (row) => row.carries && row.matched === terms.length,
  );
  if (strict.length > 0) {
    return { hits: rank(strict), mode: "exact", facets, terms };
  }

  // 2. Relax the words, keep the facets — "for mom sparkly" still means mom.
  const someWords = scored.filter((row) => row.carries && row.matched > 0);
  if (someWords.length > 0) {
    return { hits: rank(someWords), mode: "relaxed", facets, terms };
  }

  // 3. Relax the facets too — a word that actually names a product we sell
  // beats a category with nothing in it. "mom premium" finds Premium Bundle.
  const anyWords = scored.filter((row) => row.matched > 0);
  if (anyWords.length > 0) {
    return { hits: rank(anyWords), mode: "relaxed", facets, terms };
  }

  // 4. No word landed anywhere — but if the query named a facet, we still know
  // exactly what was asked for. "mom sparkly" is a shopper buying for their
  // mother who used a word we do not stock; the mother's shelf is a far better
  // answer than an empty panel. Ordered by position: with no word to score,
  // relevance is merchandising order.
  if (facets.length > 0) {
    const carried = scored.filter((row) => row.carries);
    if (carried.length > 0) {
      return {
        hits: carried
          .slice()
          .sort((a, b) => a.doc.position - b.doc.position)
          .map(({ doc }) => ({ doc, score: WEIGHTS.facet })),
        mode: "relaxed",
        facets,
        terms,
      };
    }
  }

  // 4. Nothing. The caller shows suggestions, LABELLED as suggestions.
  return { ...EMPTY_RESULT, facets, terms };
}

/* ---------- Indexing ---------- */

/**
 * How much description is indexed.
 *
 * The description is the weakest signal here and is never displayed in a
 * result row, so it is carried only as a haystack — capped so a catalogue of
 * long product stories cannot quietly turn the browser's copy of the index
 * into a large download.
 *
 * THE CAP LIVES HERE, NOT AT THE WIRE. It used to be applied while building
 * the payload for `/api/search`, which meant the browser searched 240
 * characters of description and `/shop?q=` searched all of them: a word in
 * character 300 of a product's story was findable on the page but not in the
 * panel that hands over to it. Two indexes that disagree is precisely the bug
 * one shared engine exists to prevent, so the truncation is part of indexing.
 */
const DESCRIPTION_LIMIT = 240;

/**
 * Reduce a catalog product to its searchable words.
 *
 * The product's facets are resolved here, at index time, so `best_for` and the
 * derived Availability/Price shades arrive as one flat list the engine can
 * treat alike. Nothing private is copied: this shape is what `/api/search`
 * sends to the browser.
 *
 * @param product - A row of the catalog_products view.
 * @returns The product as an indexed document.
 */
export function toSearchDoc(product: CatalogProduct): SearchDoc {
  return {
    handle: product.handle,
    title: product.title,
    shortName: product.short_name || product.title,
    facets: [...product.best_for, ...derivedFacets(facetSubject(product))],
    tags: product.tags,
    badge: product.badge,
    description: product.description.slice(0, DESCRIPTION_LIMIT),
    position: product.position,
  };
}

/* ---------- Highlighting ---------- */

/**
 * Split a label into the runs a query matched and the runs it did not, so the
 * UI can bold the reason a row is on screen. Matching is done on the folded
 * text but the ORIGINAL characters are returned, so an accent or a curly
 * apostrophe is never lost to the highlight.
 *
 * @param text - The label to display, unmodified.
 * @param terms - The searched terms (`SearchResult.terms`).
 * @returns Runs in order; `hit` marks a run the query is responsible for.
 */
export function highlightRuns(
  text: string,
  terms: readonly string[],
): Array<{ text: string; hit: boolean }> {
  if (!text) return [];
  const usable = terms.filter((term) => term.length >= 2);
  if (usable.length === 0) return [{ text, hit: false }];

  // Fold each character in place so folded offsets map back to originals. The
  // three cases have to stay distinct: an accent folds to one character, a
  // separator folds to a space, and an APOSTROPHE FOLDS TO NOTHING AT ALL —
  // fold it to a space instead and "Valentine’s" becomes the two words
  // "valentine s", which the query "valentines" can never match.
  const joiner = /['‘’]/;
  const map: number[] = [];
  const vanished: number[] = [];
  let folded = "";
  for (let i = 0; i < text.length; i += 1) {
    if (joiner.test(text[i])) {
      vanished.push(i);
      continue;
    }
    const piece = normalizeSearchText(text[i]);
    if (!piece) {
      // A separator between original characters must not glue words together.
      if (folded && !folded.endsWith(" ")) {
        folded += " ";
        map.push(i);
      }
      continue;
    }
    for (const character of piece) {
      folded += character;
      map.push(i);
    }
  }

  const covered = new Array<boolean>(text.length).fill(false);
  for (const term of usable) {
    let from = folded.indexOf(term);
    while (from !== -1) {
      // Only from a word boundary — "on" must not light up inside "Anniversary".
      if (from === 0 || folded[from - 1] === " ") {
        for (let i = from; i < from + term.length && i < map.length; i += 1) {
          covered[map[i]] = true;
        }
      }
      from = folded.indexOf(term, from + 1);
    }
  }
  // A character that folded away sits INSIDE a match whenever both its
  // neighbours matched, so it joins them rather than splitting the run and
  // leaving an unbolded apostrophe in the middle of a bolded word.
  for (const i of vanished) {
    if (covered[i - 1] && covered[i + 1]) covered[i] = true;
  }

  const runs: Array<{ text: string; hit: boolean }> = [];
  for (let i = 0; i < text.length; i += 1) {
    const hit = covered[i];
    const last = runs[runs.length - 1];
    if (last && last.hit === hit) last.text += text[i];
    else runs.push({ text: text[i], hit });
  }
  return runs;
}
