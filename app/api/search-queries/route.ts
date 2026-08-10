/**
 * ROLE OF THIS FILE
 * POST /api/search-queries (docs/features/storefront-search.md, OQ-1):
 * server-side insert of one SUBMITTED search. Sits outside the auth middleware
 * and, like /api/beacon, there is deliberately no anon write policy on the
 * table — this route, on service credentials, is the only writer.
 *
 * NAMED FOR THE TABLE, NOT THE FEATURE. `/api/search` is the storefront's
 * search INDEX (it answers "what is in the catalogue"); this is the analytics
 * sink. Two routes one letter apart would be a permanent invitation to wire the
 * wrong one, so the plural table name is the path.
 *
 * ALWAYS 200, ALWAYS FAST. Every failure below is swallowed into console.error
 * and answered `ok: true`. A shopper's search must run whether or not we manage
 * to write it down, and the caller (`lib/search/record.ts`) fires this off
 * immediately before navigating to /shop — so a slow or angry response here
 * would be a slow or broken search.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { facetBySlug } from "@/lib/catalog/facets.ts";
import {
  SEARCH_QUERY_MAX_LENGTH,
  searchGroupingKey,
} from "@/lib/search/query-log.ts";
import { getStore } from "@/lib/supabase/store.ts";

const requestSchema = z.object({
  /** Raw shopper input. Trimmed and bounded; empty is rejected as "not a search". */
  query: z.string().trim().min(1).max(SEARCH_QUERY_MAX_LENGTH),
  /**
   * The engine's fold of `query`. Optional and allowed to be empty: 玫瑰 and 🌹
   * legitimately fold to nothing, and older cached bundles may not send it at
   * all — `searchGroupingKey` covers both by falling back to the raw text.
   */
  queryNormalized: z.string().max(SEARCH_QUERY_MAX_LENGTH).optional(),
  resultCount: z.number().int().min(0).max(100_000),
  mode: z.enum(["exact", "relaxed", "none"]),
  /**
   * Facet slugs the query named. Bounded in both directions — the closed
   * vocabulary is ~13 slugs, so a longer list is not a real search.
   */
  facets: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // The grouping key the report will read. Never empty (see searchGroupingKey),
  // which is also what keeps the row inside its CHECK constraint.
  const query = searchGroupingKey(
    parsed.query,
    parsed.queryNormalized ?? "",
  ).slice(0, SEARCH_QUERY_MAX_LENGTH);
  if (!query) {
    // Belt and braces: zod already refused an empty `query`, so reaching here
    // means the trim rules disagree. Answer 200 rather than storing a row that
    // the database would reject anyway.
    return NextResponse.json({ ok: true });
  }

  // Facets are a CLOSED vocabulary (lib/catalog/facets.ts). Validating here
  // rather than trusting the client keeps the column joinable against the
  // filter drawer: an unknown slug is dropped, not stored, so the report can
  // never show demand for a shelf that does not exist.
  const facets = [
    ...new Set((parsed.facets ?? []).filter((slug) => facetBySlug(slug))),
  ];

  try {
    await getStore().insert("search_queries", [
      {
        id: randomUUID(),
        query,
        query_raw: parsed.query.slice(0, SEARCH_QUERY_MAX_LENGTH),
        result_count: parsed.resultCount,
        mode: parsed.mode,
        facets,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error("[search-queries]", error);
  }
  // Always 200 fast — analytics must never break browsing.
  return NextResponse.json({ ok: true });
}
