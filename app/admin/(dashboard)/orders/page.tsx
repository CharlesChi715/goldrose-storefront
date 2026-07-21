/**
 * ROLE OF THIS FILE
 * /admin/orders — the cloned Shopify orders list (§9.4): All/Unfulfilled/
 * Unpaid/Archived tabs, filters, bulk archive, CSV export, source badge
 * (adapt: mock/site/draft).
 */

import { listOrders } from "@/lib/admin/orders";
import { OrdersList, type OrderListItem } from "./OrdersList";

export default async function OrdersPage() {
  const rows = await listOrders();
  const items: OrderListItem[] = rows.map(({ order, customerLabel, itemCount }) => ({
    id: order.id,
    name: order.name,
    placedAt: order.placed_at,
    customerLabel,
    totalCents: order.total_cents,
    financialStatus: order.financial_status,
    fulfillmentStatus: order.fulfillment_status,
    cancelled: Boolean(order.cancelled_at),
    archived: Boolean(order.archived_at),
    source: order.source,
    itemCount,
  }));
  return <OrdersList items={items} />;
}
