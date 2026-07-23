/**
 * ROLE OF THIS FILE
 * Typed access to the settings table (§7.10): store details, shipping
 * zones, tax, notifications, low-stock threshold, checkout options, and the
 * search-engine & AI listing. Server-only writes via saveSetting; reads are
 * defaulted so a missing key can never crash a page.
 */

import { getStore } from "@/lib/supabase/store.ts";
import type { ShippingZone } from "@/lib/checkout/zones";
import { SEED_SETTINGS, type SettingsShape } from "@/lib/supabase/seed-data.ts";

export type { SettingsShape };

/**
 * Every setting as one typed object, with seed defaults papering over any
 * missing key so a partially seeded database can never crash a page.
 */
export async function getSettingsMap(): Promise<SettingsShape> {
  const rows = await getStore().all("settings");
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  // Seed defaults paper over any missing key (e.g. dbs seeded pre-Stage-8).
  return {
    store: { ...SEED_SETTINGS.store, ...(map.store as object | undefined) },
    shipping_zones: (map.shipping_zones as ShippingZone[] | undefined) ?? SEED_SETTINGS.shipping_zones,
    tax: { ...SEED_SETTINGS.tax, ...(map.tax as object | undefined) },
    checkout: { ...SEED_SETTINGS.checkout, ...(map.checkout as object | undefined) },
    low_stock_threshold:
      (map.low_stock_threshold as number | undefined) ?? SEED_SETTINGS.low_stock_threshold,
    notifications: { ...SEED_SETTINGS.notifications, ...(map.notifications as object | undefined) },
    search_engine: { ...SEED_SETTINGS.search_engine, ...(map.search_engine as object | undefined) },
  };
}

/**
 * Upserts one settings row (update when the key exists, insert otherwise).
 *
 * @param key - Settings key to write.
 * @param value - New value for that key.
 */
export async function saveSetting<K extends keyof SettingsShape>(
  key: K,
  value: SettingsShape[K],
): Promise<void> {
  const store = getStore();
  const rows = await store.all("settings");
  if (rows.some((row) => row.key === key)) {
    await store.update("settings", { key }, { value });
  } else {
    await store.insert("settings", [{ key, value }]);
  }
}

/**
 * Base URL for sitemap/canonicals/llms.txt — env-driven, never hardcoded:
 * NEXT_PUBLIC_SITE_URL (trailing slashes stripped) ▸ the Vercel production
 * URL ▸ http://localhost:3000.
 */
export function siteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}
