/**
 * ROLE OF THIS FILE
 * CSV export for the orders list (§9.4). Session-guarded: no session → 404.
 */

import { getAdminSession } from "@/lib/admin/auth";
import { listOrders } from "@/lib/admin/orders";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await listOrders();
  const header = [
    "Order",
    "Date",
    "Customer",
    "Email",
    "Total",
    "Refunded",
    "Payment status",
    "Fulfillment status",
    "Items",
    "Source",
    "Tracking",
  ];
  const csv = [header.join(",")];
  for (const { order, customerLabel, itemCount } of rows) {
    csv.push(
      [
        order.name,
        order.placed_at,
        customerLabel,
        order.email ?? "",
        (order.total_cents / 100).toFixed(2),
        (order.refunded_cents / 100).toFixed(2),
        order.cancelled_at ? "cancelled" : order.financial_status,
        order.fulfillment_status,
        String(itemCount),
        order.source,
        order.tracking_number ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return new Response(csv.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
