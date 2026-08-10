/**
 * ROLE OF THIS FILE
 * The browser's copy of the search index: one fetch of `/api/search`, cached
 * for the life of the tab, shared by every mounted search overlay.
 *
 * WHY A MODULE-SCOPE CACHE RATHER THAN COMPONENT STATE
 * The header's search button is rendered on several screens, and a client-side
 * navigation remounts it. Holding the index in component state would refetch
 * the whole catalogue every time a visitor closed and reopened the panel. It
 * is the same list either way for 300 seconds (the route's `revalidate`), so
 * it is fetched once and kept.
 *
 * THE IN-FLIGHT PROMISE IS PART OF THE CACHE, NOT AN OPTIMISATION
 * Without it, hovering the button (which prefetches) and then clicking it
 * before the response lands would start a second identical request. Callers
 * await the same promise instead.
 *
 * A FAILURE IS NOT CACHED. A visitor who opened the panel on a dead
 * connection must get a real attempt the next time they open it, so only a
 * successful load is remembered.
 */

import type { SearchProduct } from "./search-index.ts";

let cached: SearchProduct[] | null = null;
let inFlight: Promise<SearchProduct[]> | null = null;

/**
 * The index if it is already in memory, without starting a fetch.
 *
 * Lets a component render results on its very first frame after a prefetch,
 * rather than flashing a loading state it does not need.
 *
 * @returns The cached products, or null when nothing has loaded yet.
 */
export function peekSearchIndex(): SearchProduct[] | null {
  return cached;
}

/**
 * Load the search index, reusing the cached copy or an in-flight request.
 *
 * @returns Every searchable product.
 * @throws When the request fails, the response is not JSON, or the route
 *   answers `ok: false`. A failure MUST throw rather than resolve to an empty
 *   list: "the catalogue is unavailable" and "nothing you typed matched" are
 *   different sentences, and resolving `[]` would make a database outage read
 *   to every shopper as "this shop sells nothing".
 */
export async function loadSearchIndex(): Promise<SearchProduct[]> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const response = await fetch("/api/search", {
      headers: { accept: "application/json" },
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      products?: SearchProduct[];
    };
    if (!response.ok || !payload.ok || !Array.isArray(payload.products)) {
      throw new Error(`search index unavailable (${response.status})`);
    }
    // Only a real answer is remembered; see A FAILURE IS NOT CACHED.
    cached = payload.products;
    return payload.products;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/**
 * Start loading the index without waiting for it — for pointer-enter and focus
 * on the search button, so the panel usually has its results before the tap
 * that opens it finishes.
 *
 * Deliberately swallows failures: a prefetch that fails must be silent, and
 * the real open will surface the problem if it persists.
 */
export function prefetchSearchIndex(): void {
  if (cached || inFlight) return;
  void loadSearchIndex().catch(() => {});
}
