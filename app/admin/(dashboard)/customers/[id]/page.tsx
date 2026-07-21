/**
 * ROLE OF THIS FILE
 * /admin/customers/[id] — the customer profile (§9.7): last order card,
 * orders list, Timeline (customer_events), Notes, Tags, default address.
 */

import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/admin/orders";
import { CustomerDetailView } from "./CustomerDetailView";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  if (!detail) {
    notFound();
  }
  return (
    <CustomerDetailView
      customer={detail.customer}
      orders={detail.orders.map((order) => ({
        id: order.id,
        name: order.name,
        placedAt: order.placed_at,
        totalCents: order.total_cents,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
      }))}
      events={detail.events}
      totalSpentCents={detail.totalSpentCents}
    />
  );
}
