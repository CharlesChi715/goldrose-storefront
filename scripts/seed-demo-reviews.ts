/**
 * ROLE OF THIS FILE
 * Put two published demo reviews on a product — `npm run seed:reviews`.
 * Runs directly under Node (type stripping; no build step) against whichever
 * backend the environment selects, exactly like `npm run seed`.
 *
 * These rows are pre-launch demonstration content, not customer reviews.
 * They carry fixed ids so the script is idempotent, and
 * `npm run seed:reviews -- --remove` deletes precisely those rows again —
 * which is how they must leave the database before launch (release queue).
 *
 * Flags: --handle=<product-handle> (default signature-24k-gold-rose),
 *        --remove (delete the demo rows instead of inserting them).
 */

import { promises as fs } from "fs";
import path from "path";
import { getSupabaseEnv } from "../lib/supabase/env.ts";
import { createLocalStore } from "../lib/supabase/local.ts";
import { createRemoteStore } from "../lib/supabase/remote.ts";
import type { ProductReviewRow, TableStore } from "../lib/supabase/types.ts";

/** Minimal .env.local loader (Node scripts don't get Next's env handling). */
async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), ".env.local"),
      "utf8",
    );
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

/** Fixed ids: re-running never duplicates, and --remove finds them again. */
const DEMO_REVIEWS = [
  {
    id: "0a2b1a10-4b7e-4d7a-9d24-00000000e001",
    author_name: "Rachel P.",
    rating: 5,
    daysAgo: 4,
    body: "Ordered this for our anniversary and it arrived a day early. The gold edging catches the light beautifully and the presentation box feels genuinely luxurious.",
  },
  {
    id: "0a2b1a10-4b7e-4d7a-9d24-00000000e002",
    author_name: "James W.",
    rating: 4,
    daysAgo: 11,
    body: "Beautiful rose and lovely packaging. Delivery took a little longer than I expected, but my mother adored it — she has it on her mantelpiece.",
  },
] as const;

function storeForEnvironment(): TableStore {
  return getSupabaseEnv().hosted ? createRemoteStore() : createLocalStore();
}

async function main(): Promise<void> {
  await loadEnvLocal();

  const handleArg = process.argv.find((arg) => arg.startsWith("--handle="));
  const handle = handleArg?.split("=")[1] ?? "signature-24k-gold-rose";
  const remove = process.argv.includes("--remove");

  const store = storeForEnvironment();
  const products = await store.where("products", { handle });
  const product = products[0];
  if (!product) {
    console.error(
      `No product with handle "${handle}" in the ${store.backend} database.`,
    );
    process.exitCode = 1;
    return;
  }

  if (remove) {
    let deleted = 0;
    for (const review of DEMO_REVIEWS) {
      deleted += await store.remove("product_reviews", { id: review.id });
    }
    console.log(
      `Removed ${deleted} demo review${deleted === 1 ? "" : "s"} (${store.backend} backend).`,
    );
    return;
  }

  const existing = await store.where("product_reviews", {
    product_id: product.id,
  });
  const known = new Set(existing.map((review) => review.id));
  const now = Date.now();
  const rows: ProductReviewRow[] = DEMO_REVIEWS.filter(
    (review) => !known.has(review.id),
  ).map((review) => ({
    id: review.id,
    product_id: product.id,
    order_id: null,
    user_id: null,
    author_name: review.author_name,
    rating: review.rating,
    body: review.body,
    photo_urls: [],
    status: "published",
    rejected_reason: null,
    created_at: new Date(now - review.daysAgo * 86_400_000).toISOString(),
  }));

  if (rows.length > 0) await store.insert("product_reviews", rows);

  const all = await store.where("product_reviews", {
    product_id: product.id,
    status: "published",
  });
  const average =
    Math.round(
      (all.reduce((sum, review) => sum + review.rating, 0) / all.length) * 10,
    ) / 10;
  console.log(
    `${rows.length} inserted, ${DEMO_REVIEWS.length - rows.length} already present (${store.backend} backend).`,
  );
  console.log(
    `${product.title} now shows ${average} · ${all.length} published review${all.length === 1 ? "" : "s"}.`,
  );
}

await main();
