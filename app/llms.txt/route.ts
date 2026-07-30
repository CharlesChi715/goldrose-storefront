/**
 * ROLE OF THIS FILE
 * /llms.txt (§8.1 GEO): an auto-generated markdown summary of the store for
 * AI assistants — name, what it sells, active products with prices and
 * links, ship-to countries — regenerated from the database like the
 * sitemap. Part of the machine-readable layer that compensates for the
 * PNG-pixel storefront.
 */

import { getSettingsMap, siteBaseUrl } from "@/lib/admin/settings";
import { getShippingZones, servedCountries } from "@/lib/checkout/pricing";
import { getCatalog } from "@/lib/supabase/catalog.ts";

export const revalidate = 3600;

export async function GET() {
  const base = siteBaseUrl();
  let body: string;
  try {
    const [catalog, settings, zones] = await Promise.all([
      getCatalog(),
      getSettingsMap(),
      getShippingZones(),
    ]);
    const countries = servedCountries(zones);
    const products = catalog
      .map((product) => {
        const price = ((product.variants[0]?.price_cents ?? 0) / 100).toFixed(
          2,
        );
        const stock = product.variants.some((variant) => variant.in_stock)
          ? "in stock"
          : "out of stock";
        return `- [${product.title}](${base}/products/${product.handle}) — $${price} USD (${stock}). ${product.description}`;
      })
      .join("\n");

    body = `# ${settings.store.name}

> ${settings.search_engine.home_description}

${settings.store.name} sells real roses preserved in 24K gold — keepsake gifts for anniversaries, Valentine's Day, Mother's Day, and milestone moments. All prices are in USD. Checkout is on-site; PayPal is accepted.

## Products

${products}

## Shopping

- Shop all products: ${base}/shop
- Ships to: ${countries.map((country) => country.name).join(", ")}
- Contact: ${settings.store.contact_email}
`;
  } catch {
    body = `# GoldRose\n\nGift-ready 24K gold dipped rose keepsakes.\n\n- Shop: ${base}/shop\n`;
  }

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
