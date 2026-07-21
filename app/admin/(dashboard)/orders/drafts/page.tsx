/**
 * ROLE OF THIS FILE
 * /admin/orders/drafts (§9.4 clone-lite): draft orders created in the
 * admin. "Mark as paid" happens on the order's detail page.
 */

import { listOrders } from "@/lib/admin/orders";
import { DraftsList, type DraftListItem } from "./DraftsList";

export default async function DraftsPage() {
  const rows = await listOrders();
  const items: DraftListItem[] = rows
    .filter(({ order }) => order.source === "draft")
    .map(({ order, customerLabel, itemCount }) => ({
      id: order.id,
      name: order.name,
      placedAt: order.placed_at,
      customerLabel,
      totalCents: order.total_cents,
      financialStatus: order.financial_status,
      itemCount,
    }));
  return <DraftsList items={items} />;
}
