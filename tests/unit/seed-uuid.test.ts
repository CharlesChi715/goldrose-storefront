/**
 * ROLE OF THIS FILE
 * Regression net for the 2026-07-22 live-seed failure: demo ids carried
 * non-hex letters ("do01") that the local file adapter accepted but
 * Postgres's uuid type rejected mid-seed. Every demo row id — and the FK
 * fields pointing at uuid columns — must be a well-formed uuid so the
 * hosted top-up can never fail halfway again. (order_lines.product_id is
 * excluded: products use text slugs, not uuids.)
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeedTables } from "../../lib/supabase/seed-data.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const DEMO_TABLES = [
  "customers",
  "customer_events",
  "orders",
  "order_lines",
  "order_events",
  "checkouts",
  "discounts",
  "page_views",
  "feedback",
  "forum_threads",
  "forum_posts",
] as const;

const UUID_FK_FIELDS = [
  "customer_id",
  "order_id",
  "thread_id",
  "variant_id",
] as const;

test("every demo row id and uuid foreign key is a well-formed uuid", () => {
  const tables = buildSeedTables(new Date().toISOString(), {
    includeDemo: true,
  });
  for (const table of DEMO_TABLES) {
    for (const row of tables[table] as Array<Record<string, unknown>>) {
      assert.match(
        String(row.id),
        UUID,
        `${table} id "${row.id}" is not a valid uuid — Postgres would reject the seed`,
      );
      for (const field of UUID_FK_FIELDS) {
        const value = row[field];
        if (typeof value === "string") {
          assert.match(
            value,
            UUID,
            `${table}.${field} "${value}" is not a valid uuid`,
          );
        }
      }
    }
  }
});
