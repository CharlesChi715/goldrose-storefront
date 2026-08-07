/**
 * ROLE OF THIS FILE
 * The storefront's read model (§6.3): `getCatalog()` returns what the
 * catalog_products view exposes — active products, safe columns only, no
 * costs, no stock counts. Hosted mode reads the actual SQL view with the
 * PUBLIC anon key (so a leaked key can never see private columns); local
 * mode computes the identical shape from the file store.
 */

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env.ts";
import { getStore } from "./store.ts";
import type { CatalogProduct } from "./types.ts";

/**
 * Fetch the full storefront catalog: active products with safe columns only
 * (no costs, no stock counts). Hosted mode reads the catalog_products SQL
 * view with the public anon key and throws on a query error; local mode
 * computes the identical projection from the file store.
 *
 * Wrapped in cache(): generateMetadata and the page body both call this
 * during one product render — dedupe to a single fetch per request.
 *
 * @returns Catalog products sorted by position.
 */
export const getCatalog = cache(async (): Promise<CatalogProduct[]> => {
  const env = getSupabaseEnv();

  if (env.hosted && env.anonKey) {
    const anon = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon
      .from("catalog_products")
      .select("*")
      .order("position", { ascending: true });
    if (error) {
      throw new Error(`catalog_products: ${error.message}`);
    }
    return (data ?? []) as CatalogProduct[];
  }

  // Local adapter: same projection as the SQL view, computed in TS.
  const store = getStore();
  const [products, variants, images] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("product_images"),
  ]);

  return products
    .filter((product) => product.status === "active")
    .sort((a, b) => a.position - b.position)
    .map((product) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      short_name: product.short_name,
      description: product.description,
      best_for: product.best_for,
      badge: product.badge,
      details: product.details,
      tags: product.tags,
      option_names: product.option_names,
      position: product.position,
      images: images
        .filter((image) => image.product_id === product.id)
        .sort((a, b) => a.position - b.position)
        // Rows written before 0008 carry no focal point; centre is what they
        // were already being cropped to.
        .map(({ path, alt, position, focal_x, focal_y }) => ({
          path,
          alt,
          position,
          focal_x: focal_x ?? 50,
          focal_y: focal_y ?? 50,
        })),
      variants: variants
        .filter((variant) => variant.product_id === product.id)
        .sort((a, b) => a.position - b.position)
        .map((variant) => ({
          id: variant.id,
          option_values: variant.option_values,
          sku: variant.sku,
          position: variant.position,
          price_cents: variant.price_cents,
          compare_at_price_cents: variant.compare_at_price_cents,
          in_stock:
            !variant.track_quantity ||
            variant.continue_selling_when_oos ||
            variant.inventory_on_hand > 0,
          stocked: !variant.track_quantity || variant.inventory_on_hand > 0,
        })),
    }));
});

/**
 * Find one catalog product by URL handle (product detail pages).
 *
 * @param handle - The product's URL handle, e.g. "signature-24k-gold-rose".
 * @returns The matching catalog product, or null if none is active.
 */
export async function getCatalogProduct(
  handle: string,
): Promise<CatalogProduct | null> {
  const catalog = await getCatalog();
  return catalog.find((product) => product.handle === handle) ?? null;
}
