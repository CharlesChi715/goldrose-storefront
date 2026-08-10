/**
 * ROLE OF THIS FILE
 * The search index the BROWSER downloads — the projection `/api/search` sends
 * and the search overlay filters on every keystroke.
 *
 * WHY THE BROWSER GETS AN INDEX INSTEAD OF ASKING PER KEYSTROKE
 * A request per keystroke means a debounce, an AbortController, out-of-order
 * responses to discard, and a spinner between a letter and its results. For a
 * catalogue this size the whole searchable index is a few kilobytes, so it is
 * fetched ONCE when the overlay first opens and every keystroke after that is
 * a synchronous array filter — no network, no race, no stale-response bug,
 * and results that keep up with typing. It also means the dropdown runs the
 * exact same `searchDocs` the server runs for `/shop?q=`, rather than a
 * lookalike written for the client.
 *
 * WHY THE PROJECTION IS EXPLICIT
 * This payload is public and unauthenticated — `proxy.ts` guards `/admin` and
 * `/api/admin`, nothing else. So the fields are listed one by one rather than
 * spread from the catalog row: adding a field here publishes it. Everything
 * below already appears on the storefront (`/shop` cards and product pages),
 * and the stock BOOLEANS never become counts (§7.2).
 */

import { cardAreaOf, type SpotlightArea } from "../images/spotlight.ts";
import { fileUrl } from "../files-url.ts";
import { formatMoney } from "../money.ts";
import type { CatalogProduct } from "../supabase/types.ts";
import { facetLabel } from "./facets.ts";
import { toSearchDoc, type SearchDoc } from "./search.ts";

/**
 * One product as the browser receives it: everything `searchDocs` matches on,
 * plus the handful of values a result row draws.
 */
export type SearchProduct = SearchDoc & {
  /** The row's price, already formatted (`formatMoney`). */
  readonly price: string;
  /** Struck-through was-price, or null when there is none. */
  readonly compareAt: string | null;
  /** Resolved photo URL, or null when the product has no photo at all. */
  readonly image: string | null;
  readonly imageAlt: string;
  /**
   * The framing to draw the thumbnail with. The SHOP CARD's area is used
   * rather than the product page's: the row's thumbnail is a small square and
   * the card box (203x204) is the near-square one of the two the owner frames.
   */
  readonly area: SpotlightArea;
  /**
   * The one availability word the row shows — "Ready to Ship", "In Stock" or
   * "Pre-Order" — or null when nothing on the product is sellable. Taken from
   * the same derived facets the filter drawer uses, so a row can never
   * disagree with the chip that found it.
   */
  readonly availability: string | null;
};

/**
 * Availability wording, strongest promise first. Every string here is a facet
 * label from `lib/catalog/facets.ts`, so re-wording a chip re-words the row.
 */
const AVAILABILITY_ORDER = ["ready-to-ship", "in-stock", "pre-order"] as const;

/**
 * Project one catalog product into the public search index.
 *
 * @param product - A row of the catalog_products view.
 * @returns The product as the browser will receive it.
 */
export function toSearchProduct(product: CatalogProduct): SearchProduct {
  const doc = toSearchDoc(product);
  const photo = product.images[0] ?? null;
  const variant = product.variants[0];
  const availabilitySlug = AVAILABILITY_ORDER.find((slug) =>
    doc.facets.includes(slug),
  );
  return {
    // `doc.description` is already capped by toSearchDoc — deliberately there
    // and not here, so the browser and /shop index the same text.
    ...doc,
    price: formatMoney(variant?.price_cents ?? 0),
    compareAt:
      variant?.compare_at_price_cents != null
        ? formatMoney(variant.compare_at_price_cents)
        : null,
    image: photo ? fileUrl(photo.path) : null,
    imageAlt: photo?.alt || doc.shortName,
    area: cardAreaOf(photo),
    availability: availabilitySlug ? facetLabel(availabilitySlug) : null,
  };
}
