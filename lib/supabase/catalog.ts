/**
 * ROLE OF THIS FILE
 * The storefront's read model (§6.3): `getCatalog()` returns what the
 * catalog_products view exposes — active products, safe columns only, no
 * costs, no stock counts. Hosted mode reads the actual SQL view with the
 * PUBLIC anon key (so a leaked key can never see private columns); local
 * mode computes the identical shape from the file store.
 */

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env.ts";
import { getStore } from "./store.ts";
import type { CatalogProduct } from "./types.ts";

export async function getCatalog(): Promise<CatalogProduct[]> {
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
        .map(({ path, alt, position }) => ({ path, alt, position })),
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
        })),
    }));
}

/** Find one catalog product by URL handle (product detail pages). */
export async function getCatalogProduct(handle: string): Promise<CatalogProduct | null> {
  const catalog = await getCatalog();
  return catalog.find((product) => product.handle === handle) ?? null;
}
