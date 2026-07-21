/**
 * ROLE OF THIS FILE
 * /admin/products — the cloned Shopify products list (§9.5): tabs, search,
 * bulk actions, CSV export. Data loads server-side; interactions are client.
 */

import { fileUrl } from "@/lib/admin/files";
import { listProducts } from "@/lib/admin/products";
import { ProductsList, type ProductListItem } from "./ProductsList";

export default async function ProductsPage() {
  const rows = await listProducts();
  const items: ProductListItem[] = rows.map((row) => ({
    id: row.product.id,
    title: row.product.title,
    status: row.product.status,
    productType: row.product.product_type,
    vendor: row.product.vendor,
    thumbnailUrl: row.thumbnailPath ? fileUrl(row.thumbnailPath) : null,
    variantCount: row.variantCount,
    totalOnHand: row.totalOnHand,
    tracked: row.tracked,
    sku: "",
  }));
  return <ProductsList items={items} />;
}
