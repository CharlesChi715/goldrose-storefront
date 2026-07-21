/**
 * ROLE OF THIS FILE
 * /admin/orders/[id] — the cloned Shopify order detail (§9.4), card for
 * card: line items + fulfill flow, payment card, timeline; right column
 * with notes, customer, contact, addresses, tags, conversion summary.
 */

import { notFound } from "next/navigation";
import { getOrderDetail } from "@/lib/admin/orders";
import { OrderDetailView } from "./OrderDetailView";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) {
    notFound();
  }
  return (
    <OrderDetailView
      order={detail.order}
      lines={detail.lines}
      events={detail.events}
      customer={
        detail.customer
          ? {
              id: detail.customer.id,
              name: `${detail.customer.first_name} ${detail.customer.last_name}`.trim(),
              email: detail.customer.email,
              ordersCount: detail.customer.ordersCount,
            }
          : null
      }
      conversion={detail.conversion}
      sellerProtection={detail.sellerProtection}
    />
  );
}
