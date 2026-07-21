/**
 * ROLE OF THIS FILE
 * CSV export for the products list (§9.5). Guarded like every admin
 * surface: no session → 404 (the admin's existence isn't leaked).
 */

import { getAdminSession } from "@/lib/admin/auth";
import { getStore } from "@/lib/supabase/store.ts";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const store = getStore();
  const [products, variants] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
  ]);

  const header = [
    "Handle",
    "Title",
    "Status",
    "Type",
    "Vendor",
    "Tags",
    "Option values",
    "SKU",
    "Price",
    "Compare-at price",
    "On hand",
  ];
  const rows = [header.join(",")];
  for (const product of products.sort((a, b) => a.position - b.position)) {
    const own = variants
      .filter((variant) => variant.product_id === product.id)
      .sort((a, b) => a.position - b.position);
    for (const variant of own) {
      rows.push(
        [
          product.handle,
          product.title,
          product.status,
          product.product_type,
          product.vendor,
          product.tags.join(";"),
          variant.option_values.join(" / "),
          variant.sku,
          (variant.price_cents / 100).toFixed(2),
          variant.compare_at_price_cents != null
            ? (variant.compare_at_price_cents / 100).toFixed(2)
            : "",
          String(variant.inventory_on_hand),
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }

  return new Response(rows.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
