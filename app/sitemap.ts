/**
 * ROLE OF THIS FILE
 * /sitemap.xml (§8.1): home, /shop, and every ACTIVE product page, read
 * from the database — a new product becomes discoverable with no redeploy.
 */

import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/admin/settings";
import { getCatalog } from "@/lib/supabase/catalog.ts";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "weekly", priority: 0.9 },
  ];
  try {
    const catalog = await getCatalog();
    for (const product of catalog) {
      entries.push({
        url: `${base}/products/${product.handle}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // DB down → the static pages still list.
  }
  return entries;
}
