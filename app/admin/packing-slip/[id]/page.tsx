/**
 * ROLE OF THIS FILE
 * /admin/packing-slip/[id] — the print-friendly packing slip (§9.4),
 * outside the Polaris frame so it prints clean. Auth enforced directly
 * (this route group has no requireAdmin layout).
 */

import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getOrderDetail } from "@/lib/admin/orders";

export default async function PackingSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) {
    notFound();
  }
  const { order, lines } = detail;
  const address = order.shipping_address;

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "0 auto",
        padding: 32,
        color: "#111",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>GoldRose</h1>
          <p style={{ margin: "4px 0 0", color: "#555" }}>Packing slip</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{order.name}</p>
          <p style={{ margin: "4px 0 0", color: "#555" }}>
            {new Date(order.placed_at).toLocaleDateString()}
          </p>
        </div>
      </header>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, textTransform: "uppercase", color: "#555" }}>Ship to</h2>
        {address ? (
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            {[
              address.name,
              address.address1,
              address.address2,
              [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
              address.country,
            ]
              .filter(Boolean)
              .map((line, index) => (
                <span key={index}>
                  {line}
                  <br />
                </span>
              ))}
          </p>
        ) : (
          <p style={{ margin: 0, color: "#555" }}>No shipping address</p>
        )}
      </section>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "6px 0" }}>
              Item
            </th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "6px 0" }}>
              Quantity
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                {line.name}
                {line.option ? ` — ${line.option}` : ""}
                {line.sku ? (
                  <span style={{ color: "#777" }}> ({line.sku})</span>
                ) : null}
              </td>
              <td
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  textAlign: "right",
                }}
              >
                {line.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.note ? (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 14, textTransform: "uppercase", color: "#555" }}>Gift message</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{order.note}</p>
        </section>
      ) : null}

      <p style={{ marginTop: 32, color: "#777", fontSize: 13 }}>
        Thank you for your order! · goldrose-storefront.vercel.app
      </p>
    </main>
  );
}
