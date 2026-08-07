/**
 * ROLE OF THIS FILE
 * The shop's filter vocabulary — the single declarative list behind the
 * `/shop` filter drawer (Figma frame `923:252`), the admin's "Best for"
 * picker, and the URL that carries a shopper's selection.
 *
 * WHERE THE VALUES LIVE
 * Two kinds of facet share one namespace:
 * - `best_for` facets (Collections / Occasion / Recipient) are MERCHANDISING
 *   judgements — nothing in the catalog can derive them — so they are stored,
 *   as `products.best_for text[]` (migration 0009). A product may carry any
 *   number of them, from any mix of the three groups, including none.
 * - `derived` facets (Price / Availability) are FACTS the catalog already
 *   knows. They are computed per request from `price_cents` and stock, never
 *   stored: a stored copy is a second truth that goes stale the moment
 *   someone edits a price or sells the last unit.
 *
 * WHY SLUGS AND NOT LABELS
 * Postgres stores `girlfriend`, never "Girlfriend". The design team re-words
 * chips every sync (the "Women"/"All apparel" pair became "Ruby Red"/"Gift
 * Sets" this way), and a re-worded chip must never invalidate a row that was
 * correct. The label lives here, beside the slug; only this file changes.
 *
 * WHY NO GROUP PREFIX ON THE SLUG
 * A slug is unique across ALL groups, so `anniversary` needs no `occasion:`
 * in front of it: the group is a property of the vocabulary, not of the
 * value, and it is recovered from this registry wherever it is needed. That
 * uniqueness is enforced rather than assumed — the build below throws on a
 * duplicate, so a future "Wedding Collection" cannot quietly reuse `wedding`
 * (owner ruling, 2026-08-07).
 *
 * WHY THE VOCABULARY IS CLOSED
 * The eleven stored values are the chips the drawer draws. A product tagged
 * with anything else would be unreachable — invisible to every filter — so an
 * unknown slug is rejected at the admin's save (`assertBestFor`) exactly as an
 * unknown handle is rejected by `lib/admin/product-handle.ts`. Adding a value
 * means adding a chip to the design first; there is no free-text path in.
 */

import type { CatalogProduct } from "@/lib/supabase/types.ts";

/** The five headings the filter drawer draws, top to bottom. */
export type FacetGroupKey =
  "collection" | "occasion" | "recipient" | "price" | "availability";

/**
 * `best_for` = stored on the product; `derived` = computed from catalog facts.
 * See WHERE THE VALUES LIVE in the file header.
 */
export type FacetSource = "best_for" | "derived";

/** One chip: a globally unique slug, its wording, and the group it sits in. */
export type Facet = {
  readonly slug: string;
  /** Storefront + admin English wording — verbatim from frame `923:252`. */
  readonly label: string;
  /** Admin Chinese wording (§9 — the admin is bilingual). */
  readonly labelZh: string;
  readonly group: FacetGroupKey;
};

/** One drawer heading and the chips under it. */
export type FacetGroup = {
  readonly key: FacetGroupKey;
  readonly title: string;
  readonly titleZh: string;
  readonly source: FacetSource;
  readonly facets: readonly Facet[];
};

/**
 * What a facet is tested against — the catalog fields a match can depend on,
 * and nothing else. Built by `facetSubject()` so the shop page and the unit
 * tests agree on what "in stock" means.
 */
export type FacetSubject = {
  /** The product's stored `best_for` slugs. */
  readonly bestFor: readonly string[];
  /** First variant's price, the one the card shows. */
  readonly priceCents: number;
  /** Some variant is sellable — includes sell-when-out-of-stock. */
  readonly sellable: boolean;
  /** Some variant has units on hand (or is untracked). */
  readonly stocked: boolean;
  /** Every variant has units on hand — nothing on the product is backordered. */
  readonly fullyStocked: boolean;
};

/* ---------- The vocabulary ---------- */

export const FACET_GROUPS: readonly FacetGroup[] = [
  {
    key: "collection",
    title: "Collections",
    titleZh: "系列",
    source: "best_for",
    facets: [
      {
        slug: "jewel",
        label: "Jewel Collection",
        labelZh: "珠宝系列",
        group: "collection",
      },
      {
        slug: "classic",
        label: "Classic Collection",
        labelZh: "经典系列",
        group: "collection",
      },
      {
        slug: "sparkle",
        label: "Sparkle Collection",
        labelZh: "闪耀系列",
        group: "collection",
      },
    ],
  },
  {
    key: "occasion",
    title: "Occasion",
    titleZh: "场合",
    source: "best_for",
    facets: [
      {
        slug: "anniversary",
        label: "Anniversary",
        labelZh: "周年纪念",
        group: "occasion",
      },
      {
        slug: "birthday",
        label: "Birthday",
        labelZh: "生日",
        group: "occasion",
      },
      { slug: "wedding", label: "Wedding", labelZh: "婚礼", group: "occasion" },
      {
        slug: "valentines",
        label: "Valentine’s",
        labelZh: "情人节",
        group: "occasion",
      },
    ],
  },
  {
    key: "recipient",
    title: "Recipient",
    titleZh: "送礼对象",
    source: "best_for",
    facets: [
      { slug: "wife", label: "Wife", labelZh: "妻子", group: "recipient" },
      {
        slug: "girlfriend",
        label: "Girlfriend",
        labelZh: "女友",
        group: "recipient",
      },
      { slug: "mother", label: "Mother", labelZh: "母亲", group: "recipient" },
      {
        slug: "friends",
        label: "Friends",
        labelZh: "朋友",
        group: "recipient",
      },
    ],
  },
  {
    key: "price",
    title: "Price",
    titleZh: "价格",
    source: "derived",
    facets: [
      {
        slug: "under-100",
        label: "Under $100",
        labelZh: "100 美元以下",
        group: "price",
      },
      {
        slug: "100-199",
        label: "$100–$199",
        labelZh: "100–199 美元",
        group: "price",
      },
      {
        slug: "200-299",
        label: "$200–$299",
        labelZh: "200–299 美元",
        group: "price",
      },
      {
        slug: "300-plus",
        label: "$300+",
        labelZh: "300 美元以上",
        group: "price",
      },
    ],
  },
  {
    key: "availability",
    title: "Availability",
    titleZh: "库存状态",
    source: "derived",
    facets: [
      {
        slug: "in-stock",
        label: "In Stock",
        labelZh: "现货",
        group: "availability",
      },
      {
        slug: "ready-to-ship",
        label: "Ready to Ship",
        labelZh: "可立即发货",
        group: "availability",
      },
      {
        slug: "pre-order",
        label: "Pre-Order",
        labelZh: "预售",
        group: "availability",
      },
    ],
  },
];

/**
 * How each derived facet is decided. Availability reads the three shades the
 * catalog view exposes and nothing more:
 * - In Stock — something on this product can be bought right now.
 * - Ready to Ship — every variant has units on hand, so no line of the order
 *   waits on a restock. A product with one backordered variant is deliberately
 *   NOT "ready to ship"; the shopper picking that variant would be misled.
 * - Pre-Order — sellable, but nothing is on the shelf (sell-when-out-of-stock).
 * These three are the only availability meanings the data can support; a
 * merchandised "ships in 24h" promise would need its own field.
 */
const DERIVED_TESTS: Readonly<
  Record<string, (subject: FacetSubject) => boolean>
> = {
  "under-100": (s) => s.priceCents < 100_00,
  "100-199": (s) => s.priceCents >= 100_00 && s.priceCents < 200_00,
  "200-299": (s) => s.priceCents >= 200_00 && s.priceCents < 300_00,
  "300-plus": (s) => s.priceCents >= 300_00,
  "in-stock": (s) => s.sellable && s.stocked,
  "ready-to-ship": (s) => s.sellable && s.fullyStocked,
  "pre-order": (s) => s.sellable && !s.stocked,
};

/* ---------- Index (uniqueness is enforced here, not assumed) ---------- */

const BY_SLUG = new Map<string, Facet>();
for (const group of FACET_GROUPS) {
  for (const facet of group.facets) {
    const clash = BY_SLUG.get(facet.slug);
    if (clash) {
      throw new Error(
        `facets: duplicate slug "${facet.slug}" in ${group.key} — already used by ${clash.group}. ` +
          `Slugs are globally unique so the group can be recovered from the value alone; rename one.`,
      );
    }
    if (group.source === "derived" && !DERIVED_TESTS[facet.slug]) {
      throw new Error(`facets: derived slug "${facet.slug}" has no test`);
    }
    BY_SLUG.set(facet.slug, facet);
  }
}

/** Every slug a product may be tagged with, in drawer order. */
export const BEST_FOR_SLUGS: readonly string[] = FACET_GROUPS.filter(
  (group) => group.source === "best_for",
).flatMap((group) => group.facets.map((facet) => facet.slug));

/** The three drawer groups a product's `best_for` is picked from. */
export const BEST_FOR_GROUPS: readonly FacetGroup[] = FACET_GROUPS.filter(
  (group) => group.source === "best_for",
);

/* ---------- Lookups ---------- */

/**
 * Look up one facet by slug.
 *
 * @param slug - A facet slug, e.g. "girlfriend".
 * @returns The facet, or null when the slug is not in the vocabulary.
 */
export function facetBySlug(slug: string): Facet | null {
  return BY_SLUG.get(slug) ?? null;
}

/**
 * The English chip wording for a slug, for storefront chips and admin lists.
 *
 * @param slug - A facet slug, e.g. "valentines".
 * @returns The label, or the slug itself if it is unknown (never throws — a
 *   label is only ever drawn, and a retired slug should not blank the page).
 */
export function facetLabel(slug: string): string {
  return BY_SLUG.get(slug)?.label ?? slug;
}

/**
 * Validate a set of `best_for` slugs on its way into the database.
 *
 * Unknown slugs and duplicates are rejected rather than dropped: silently
 * discarding one would let the admin's save look successful while the product
 * quietly lost a filter it was meant to appear under. There is no maximum —
 * a product may carry every slug in the vocabulary (owner, 2026-08-07).
 *
 * @param values - Slugs from the admin form, in any order.
 * @returns The same slugs, de-duplicated and sorted into drawer order.
 * @throws If a slug is unknown or belongs to a derived group.
 */
export function assertBestFor(values: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const facet = BY_SLUG.get(value);
    if (!facet) {
      throw new Error(`best_for: unknown value "${value}"`);
    }
    if (!BEST_FOR_SLUGS.includes(value)) {
      throw new Error(
        `best_for: "${value}" is a ${facet.group} facet, which is computed from the catalog and cannot be stored`,
      );
    }
    if (seen.has(value)) {
      throw new Error(`best_for: duplicate value "${value}"`);
    }
    seen.add(value);
  }
  return BEST_FOR_SLUGS.filter((slug) => seen.has(slug));
}

/**
 * Read a shopper's selection out of the `?f=` query parameter.
 *
 * Unknown slugs are DROPPED here rather than thrown: the string comes from a
 * URL a stranger can type, and a stale bookmark from a retired chip should
 * show a wider shop, not an error page.
 *
 * @param raw - The raw `?f=` value, e.g. "jewel,anniversary" (or undefined).
 * @returns Recognised slugs, de-duplicated, in drawer order.
 */
export function parseFacetParam(raw: string | undefined): string[] {
  if (!raw) return [];
  const wanted = new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter((part) => BY_SLUG.has(part)),
  );
  return FACET_GROUPS.flatMap((group) => group.facets)
    .filter((facet) => wanted.has(facet.slug))
    .map((facet) => facet.slug);
}

/* ---------- Matching ---------- */

/**
 * Reduce a catalog product to the facts a filter may look at.
 *
 * Both the server (which filters the grid) and the drawer (which counts a
 * pending selection) go through this, so "Ready to Ship" cannot come to mean
 * two different things on the two sides of one tap.
 *
 * @param product - A row of the catalog_products view.
 * @returns The product's filterable facts.
 */
export function facetSubject(product: CatalogProduct): FacetSubject {
  const variants = product.variants;
  return {
    bestFor: product.best_for,
    // The card shows the first variant's price, so that is the price a shopper
    // is filtering on.
    priceCents: variants[0]?.price_cents ?? 0,
    sellable: variants.some((variant) => variant.in_stock),
    stocked: variants.some((variant) => variant.stocked),
    // A product with no variants at all cannot be "fully stocked" — `every`
    // would say yes to the empty list.
    fullyStocked:
      variants.length > 0 && variants.every((variant) => variant.stocked),
  };
}

/**
 * Does one product match a shopper's selection?
 *
 * OR inside a group, AND across groups — "Birthday or Wedding, for a Wife".
 * This is what every storefront filter does and it is the only combination
 * that stays useful as chips are added: OR everywhere would widen the results
 * with each tap, AND everywhere would empty them.
 *
 * @param subject - The product's filterable facts (`facetSubject()`).
 * @param selected - Chosen slugs, any groups, any order. Empty matches all.
 * @returns True when the product should stay in the grid.
 */
export function matchesFacets(
  subject: FacetSubject,
  selected: readonly string[],
): boolean {
  if (selected.length === 0) return true;

  const byGroup = new Map<FacetGroupKey, string[]>();
  for (const slug of selected) {
    const facet = BY_SLUG.get(slug);
    if (!facet) continue;
    const bucket = byGroup.get(facet.group);
    if (bucket) bucket.push(slug);
    else byGroup.set(facet.group, [slug]);
  }

  for (const [, slugs] of byGroup) {
    const hit = slugs.some((slug) => {
      const test = DERIVED_TESTS[slug];
      return test ? test(subject) : subject.bestFor.includes(slug);
    });
    if (!hit) return false;
  }
  return true;
}
