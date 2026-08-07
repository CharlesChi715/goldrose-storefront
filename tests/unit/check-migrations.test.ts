/**
 * ROLE OF THIS FILE
 * Unit tests for the migration-sequence guard (scripts/check-migrations.mjs).
 *
 * The guard exists because this failure class is silent: on 2026-08-07 two
 * branches each added a `0009`, git merged them cleanly because the filenames
 * differed, and lint, typecheck, the build and all 129 tests still passed —
 * nothing in CI reads a `.sql` file. So the guard itself is the only thing
 * standing between a parallel-branch collision and a broken `db push`, and a
 * guard that stops detecting is worse than none: it reports "migrations ok"
 * either way.
 *
 * These tests therefore pin the two findings that matter — a duplicate
 * version, and a rebuilt view that quietly drops a column an earlier
 * migration added — using hand-written sequences rather than the real
 * directory, so they keep testing the same thing as the real one grows.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  KNOWN_SKIPPED,
  inspectMigrations,
  parseMigrationName,
  viewDefinitions,
} from "../../scripts/check-migrations.mjs";

const sql = (body: string) => body;

test("a well-formed sequence reports nothing", () => {
  const { errors, warnings } = inspectMigrations([
    { name: "0001_init.sql", sql: sql("create table a();") },
    { name: "0002_more.sql", sql: sql("create table b();") },
  ]);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test("two files claiming one version is an ERROR, and names both", () => {
  const { errors } = inspectMigrations([
    { name: "0001_init.sql", sql: "" },
    { name: "0002_spotlight.sql", sql: "" },
    { name: "0002_facets.sql", sql: "" },
  ]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /version 0002 is claimed by 2 files/);
  assert.match(errors[0], /0002_facets\.sql/);
  assert.match(errors[0], /0002_spotlight\.sql/);
});

test("three files on one version are still a single, complete error", () => {
  const { errors } = inspectMigrations([
    { name: "0001_a.sql", sql: "" },
    { name: "0001_b.sql", sql: "" },
    { name: "0001_c.sql", sql: "" },
  ]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /claimed by 3 files/);
});

test("a filename off-convention is an ERROR, not silently skipped", () => {
  // The danger is skipping: a name with no version would drop out of the
  // duplicate check, so a bad name must fail loudly rather than pass quietly.
  for (const name of [
    "9_init.sql",
    "00010_init.sql",
    "0001-init.sql",
    "0001_Init.sql",
    "0001_init.SQL",
    "init.sql",
  ]) {
    const { errors } = inspectMigrations([{ name, sql: "" }]);
    assert.equal(errors.length, 1, `expected ${name} to be rejected`);
    assert.match(errors[0], /filename must be NNNN_lower_snake_case\.sql/);
  }
});

test("a gap warns, but the deliberately skipped 0004 never does", () => {
  const files = ["0003", "0005", "0006", "0008"].map((v) => ({
    name: `${v}_x.sql`,
    sql: "",
  }));
  const { errors, warnings } = inspectMigrations(files);
  assert.deepEqual(errors, [], "a gap must not fail the build");
  // 0004 is skipped on purpose; 0007 is a real hole.
  assert.ok(KNOWN_SKIPPED.has("0004"));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /version 0007 is missing/);
});

test("a later view definition that drops an earlier column warns", () => {
  // The 2026-08-07 near-miss in miniature: 0002 adds a column to the view,
  // 0003 rebuilds the view from an older shape and loses it.
  const { errors, warnings } = inspectMigrations([
    {
      name: "0002_spotlight.sql",
      sql: `create or replace view public.catalog_products as
              select p.id, p.handle, i.focal_x, i.focal_zoom from products p;`,
    },
    {
      name: "0003_facets.sql",
      sql: `drop view if exists public.catalog_products;
            create view public.catalog_products as
              select p.id, p.handle, i.focal_x from products p;`,
    },
  ]);
  assert.deepEqual(errors, [], "this is a judgement call, not a hard failure");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /view catalog_products/);
  assert.match(warnings[0], /0003 is the definition that survives/);
  assert.match(warnings[0], /focal_zoom/);
});

test("the same views in the safe order warn about nothing", () => {
  const { warnings } = inspectMigrations([
    {
      name: "0002_facets.sql",
      sql: `create view public.catalog_products as
              select p.id, i.focal_x from products p;`,
    },
    {
      name: "0003_spotlight.sql",
      sql: `create or replace view public.catalog_products as
              select p.id, i.focal_x, i.focal_zoom from products p;`,
    },
  ]);
  assert.deepEqual(warnings, []);
});

test("parseMigrationName splits version from slug", () => {
  assert.deepEqual(parseMigrationName("0009_product_best_for_facets.sql"), {
    version: "0009",
    slug: "product_best_for_facets",
  });
  assert.equal(parseMigrationName("nope.sql"), null);
});

test("viewDefinitions reads the whole statement, subqueries included", () => {
  const defs = viewDefinitions(
    `create or replace view public.v as
       select p.id, p.handle as slug, jsonb_agg(i.path) as images
       from products p where p.status = 'active';`,
  );
  assert.equal(defs.length, 1);
  assert.equal(defs[0].view, "v");
  assert.ok(defs[0].columns.has("id"));
  assert.ok(defs[0].columns.has("slug"));
  assert.ok(defs[0].columns.has("images"));
  // `status` comes from the WHERE and is not a column of the view. Collecting
  // it is deliberate: reading only up to the first `from` used to truncate the
  // real catalog view at its FIRST subquery, hiding everything after it. The
  // extra names are harmless because both definitions are read the same way,
  // so a name present in both cancels out of the comparison.
  assert.ok(defs[0].columns.has("status"));
});

test("viewDefinitions sees jsonb_build_object keys, not just columns", () => {
  // The shape of catalog_products: the storefront's real contract is the keys
  // INSIDE the JSON payload, one level below the view's own column list.
  const defs = viewDefinitions(
    `create or replace view public.v as
       select
         p.id,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'path', i.path, 'card_zoom', i.card_zoom
           ) order by i.position)
           from product_images i where i.product_id = p.id
         ), '[]'::jsonb) as images,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'in_stock', v.inventory_on_hand > 0,
             'stocked', (not v.track_quantity) or v.inventory_on_hand > 0
           ) order by v.position)
           from product_variants v where v.product_id = p.id
         ), '[]'::jsonb) as variants
       from products p where p.status = 'active';`,
  );
  assert.equal(defs.length, 1);
  // Past the first `from` — the variants subquery is the second one.
  assert.ok(defs[0].columns.has("variants"));
  assert.ok(defs[0].columns.has("stocked"));
  assert.ok(defs[0].columns.has("in_stock"));
  assert.ok(defs[0].columns.has("card_zoom"));
});

test("a rebuilt view that drops a JSON key is caught, as a dropped column is", () => {
  // The 2026-08-07 regression, reduced: 0009 added `stocked` to the variants
  // object, 0010 rebuilt the view from the pre-0009 definition and dropped it.
  // Both files' view COLUMNS were identical, so nothing was flagged and the
  // loss reached the hosted database.
  const { errors, warnings } = inspectMigrations([
    {
      name: "0009_facets.sql",
      sql: `create view public.catalog_products as
              select p.id, (select jsonb_build_object(
                'in_stock', v.a, 'stocked', v.b) from variants v) as variants
              from products p;`,
    },
    {
      name: "0010_spotlight.sql",
      sql: `create or replace view public.catalog_products as
              select p.id, (select jsonb_build_object(
                'in_stock', v.a) from variants v) as variants
              from products p;`,
    },
  ]);
  assert.deepEqual(errors, [], "still a judgement call, not a hard failure");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /view catalog_products/);
  assert.match(warnings[0], /stocked/);
});
