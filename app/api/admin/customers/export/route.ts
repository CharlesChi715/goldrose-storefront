/**
 * ROLE OF THIS FILE
 * CSV export for the customers list (§9.7 — Rev 4.1 parity item).
 */

import { getAdminSession } from "@/lib/admin/auth";
import { listCustomers } from "@/lib/admin/orders";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await listCustomers();
  const csv = ["Name,Email,Phone,Location,Orders,Amount spent,Tags,Created"];
  for (const { customer, ordersCount, totalSpentCents, location } of rows) {
    csv.push(
      [
        `${customer.first_name} ${customer.last_name}`.trim(),
        customer.email,
        customer.phone ?? "",
        location,
        String(ordersCount),
        (totalSpentCents / 100).toFixed(2),
        customer.tags.join(";"),
        customer.created_at,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return new Response(csv.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
