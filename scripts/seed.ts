/**
 * ROLE OF THIS FILE
 * Seed the database — `npm run seed`. Runs directly under Node (type
 * stripping; no build step):
 *
 * - Local file adapter (no Supabase env): writes a fresh .data/db.json.
 *   Refuses to overwrite an existing database unless --reset is passed.
 * - Hosted Supabase (env vars set, e.g. in .env.local): inserts the seed
 *   rows, but only into an EMPTY database — it never deletes hosted data.
 *   The admin_users row is skipped (it must reference a real auth.users
 *   uid — activation checklist).
 *
 * Ends by printing the seeded products/variants + settings/content keys, so
 * the Stage 1 acceptance check is the script output itself.
 */

import { promises as fs } from "fs";
import path from "path";
import { getSupabaseEnv } from "../lib/supabase/env.ts";
import { createLocalStore } from "../lib/supabase/local.ts";
import { createRemoteStore } from "../lib/supabase/remote.ts";
import { buildSeedTables } from "../lib/supabase/seed-data.ts";
import type { TableStore } from "../lib/supabase/types.ts";

/** Minimal .env.local loader (Node scripts don't get Next's env handling). */
async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — fine.
  }
}

async function printSummary(store: TableStore): Promise<void> {
  const [products, variants, settings, content] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("settings"),
    store.all("site_content"),
  ]);

  console.log(`\nSeeded (${store.backend} backend):`);
  for (const product of products.sort((a, b) => a.position - b.position)) {
    const own = variants.filter((variant) => variant.product_id === product.id);
    const price = own[0] ? `$${(own[0].price_cents / 100).toFixed(2)}` : "—";
    const stock = own.reduce((sum, variant) => sum + variant.inventory_on_hand, 0);
    console.log(
      `  • ${product.title} [${product.status}] — ${own.length} variants @ ${price}, ${stock} on hand`,
    );
    for (const variant of own.sort((a, b) => a.position - b.position)) {
      console.log(`      - ${variant.option_values.join(" / ")} (${variant.sku})`);
    }
  }
  console.log(`  Settings keys: ${settings.map((row) => row.key).join(", ")}`);
  console.log(`  Content slots: ${content.map((row) => row.key).join(", ")}`);
}

async function seedLocal(reset: boolean): Promise<void> {
  const dbFile = path.join(process.cwd(), ".data", "db.json");
  const exists = await fs
    .access(dbFile)
    .then(() => true)
    .catch(() => false);

  if (exists && !reset) {
    console.error(
      `${dbFile} already exists. Re-run with --reset to overwrite it with a fresh seed.`,
    );
    process.exitCode = 1;
    return;
  }

  const store = createLocalStore();
  await store.reset();
  await printSummary(store);
}

async function seedHosted(): Promise<void> {
  const store = createRemoteStore();
  const existing = await store.all("products");
  if (existing.length > 0) {
    console.error(
      "Hosted database already has products — refusing to seed. (This script never deletes hosted data.)",
    );
    process.exitCode = 1;
    return;
  }

  // Real store: no demo data (that exists for the testing phase only).
  const tables = buildSeedTables(new Date().toISOString(), { includeDemo: false });
  // FK-safe insert order; admin_users deliberately skipped for hosted (see header).
  await store.insert("products", tables.products);
  await store.insert("product_images", tables.product_images);
  await store.insert("product_variants", tables.product_variants);
  await store.insert("site_content", tables.site_content);
  await store.insert("settings", tables.settings);
  await printSummary(store);
  console.log(
    "\nRemember (activation checklist): create the owner user in Supabase Auth and insert their uid + email into admin_users.",
  );
}

async function main(): Promise<void> {
  await loadEnvLocal();
  const reset = process.argv.includes("--reset");
  if (getSupabaseEnv().hosted) {
    await seedHosted();
  } else {
    await seedLocal(reset);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
