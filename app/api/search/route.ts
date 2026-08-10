/**
 * ROLE OF THIS FILE
 * GET /api/search — the storefront's search index, sent whole to the browser
 * the first time a visitor opens the header's search overlay. The overlay then
 * matches locally on every keystroke (see `lib/catalog/search-index.ts` for why
 * an index beats a request per letter).
 *
 * NO QUERY PARAMETER, ON PURPOSE. The handler takes no arguments and reads
 * nothing off the request, which is what lets `revalidate` below actually
 * apply: touching `request.url` would make the segment dynamic and silently
 * turn a cached response into a database read per visitor. The matching that
 * a `?q=` would have done happens in `lib/catalog/search.ts`, in whichever
 * process is asking — the browser here, the server on `/shop?q=`.
 *
 * The payload is public and unauthenticated by construction (`proxy.ts`
 * guards `/admin` and `/api/admin` only), so the projection is explicit and
 * carries nothing the storefront does not already show.
 */

import { NextResponse } from "next/server";
import { toSearchProduct } from "@/lib/catalog/search-index.ts";
import { getCatalog } from "@/lib/supabase/catalog.ts";

/** Same 300s as every other storefront read (§8). */
export const revalidate = 300;

export async function GET() {
  try {
    const catalog = await getCatalog();
    return NextResponse.json({
      ok: true,
      products: catalog.map(toSearchProduct),
    });
  } catch (error) {
    console.error("[search]", error);
    // A dead catalog must not break the overlay: it still opens, still keeps
    // the visitor's recent searches, and Enter still hands over to /shop,
    // which renders its own empty state. An error here means "no suggestions",
    // never a broken search box.
    return NextResponse.json(
      { ok: false, error: "Search is unavailable right now.", products: [] },
      { status: 503 },
    );
  }
}
