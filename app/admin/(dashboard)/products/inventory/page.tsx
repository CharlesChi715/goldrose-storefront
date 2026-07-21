/**
 * ROLE OF THIS FILE
 * /admin/products/inventory — the cloned Shopify inventory screen (§9.6):
 * one row per variant with the four derived columns (Unavailable ·
 * Committed · Available · On hand), inline adjustment with Shopify's
 * reason list, and per-variant adjustment history. Single location — no
 * location picker (adapt).
 */

import { listVariantInventory } from "@/lib/admin/products";
import { InventoryTable, type InventoryItem } from "./InventoryTable";

export default async function InventoryPage() {
  const rows = await listVariantInventory();
  const items: InventoryItem[] = rows.map((row) => ({
    variantId: row.variant.id,
    productTitle: row.productTitle,
    optionLabel: row.variant.option_values.join(" / "),
    sku: row.variant.sku,
    tracked: row.variant.track_quantity,
    unavailable: row.unavailable,
    committed: row.committed,
    available: row.available,
    onHand: row.variant.inventory_on_hand,
  }));
  return <InventoryTable items={items} />;
}
