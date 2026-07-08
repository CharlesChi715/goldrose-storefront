import Link from "next/link";
import type { Metadata } from "next";
import { formatMoney } from "@/lib/products";
import { listOrders } from "@/lib/orders/store";

const brandName = "AUREÀ";

// Always read the latest captured orders — never serve a cached snapshot, or a
// freshly placed demo order would not appear.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order log (demo)",
  robots: { index: false, follow: false },
};

function formatPlacedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function OrdersPage() {
  const orders = await listOrders();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <main className="min-h-screen bg-[#f4ede1] text-[#211a0e]">
      <header className="border-b border-[#c9a24b]/25 bg-[#fbf6ec]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-serif text-2xl uppercase tracking-[0.22em] text-[#211a0e]">
            {brandName}
            <span className="text-[#b8922e]">.</span>
          </Link>
          <Link href="/#shop" className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a22] hover:text-[#9a7826]">
            ← Back to store
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-medium leading-tight text-[#211a0e]">Order log</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c4f38]">
              Every order placed at checkout lands here. This is the end of the
              demo loop: a visitor clicks, pays, and the order arrives — proving
              the storefront, checkout, and order capture all talk to each other.
            </p>
          </div>
          <div className="grid gap-1 rounded-md border border-[#d9c48a] bg-[#fbf6ec] px-5 py-4 text-right shadow-[0_14px_40px_rgba(33,26,14,0.08)]">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#9a7826]">Captured</span>
            <span className="font-serif text-2xl text-[#211a0e]">{orders.length} order{orders.length === 1 ? "" : "s"}</span>
            <span className="text-sm text-[#8a6a22]">{formatMoney(revenue)} total</span>
          </div>
        </div>

        <p className="mt-5 rounded-[3px] border border-[#b8922e]/40 bg-[#f7ecd6] px-4 py-3 text-sm leading-6 text-[#7a5d1c]">
          These are <strong>mock orders</strong>. No real money moved and no card
          number was stored — only a brand and last four derived for the receipt.
          In live mode the authoritative order would live in Shopify; this log is
          the demo stand-in so the click → pay → order flow is visible end to end.
        </p>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-[#d7c28a] bg-[#fbf6ec] p-10 text-center">
            <p className="font-serif text-xl text-[#211a0e]">No orders captured yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#5c4f38]">
              Place a test order from the store and it will appear here instantly.
            </p>
            <Link
              href="/#shop"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-[3px] bg-[#c9a24b] px-6 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition-colors hover:bg-[#9a7826]"
            >
              Place a test order
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4">
            {orders.map((order) => (
              <li
                key={`${order.number}-${order.placedAt}`}
                className="rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-5 shadow-[0_14px_40px_rgba(33,26,14,0.06)] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-base font-bold text-[#211a0e]">{order.number}</p>
                    <p className="mt-0.5 text-xs text-[#7c6e50]">{formatPlacedAt(order.placedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl text-[#8a6a22]">{formatMoney(order.total)}</p>
                    <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-[#6b5c3f]">
                      {order.methodLabel}
                      {order.cardLast4 ? ` · ${order.cardBrand ?? "Card"} ····${order.cardLast4}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-1.5 border-t border-[#e3d4ab] pt-4">
                  {order.lines.map((line) => (
                    <div
                      key={`${line.productId}::${line.option}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-[#3f3a28]">
                        {line.quantity} × {line.shortName}
                        <span className="text-[#8a7a55]"> · {line.option}</span>
                      </span>
                      <span className="whitespace-nowrap font-semibold text-[#211a0e]">
                        {formatMoney(line.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e3d4ab] pt-3 text-xs text-[#7c6e50]">
                  <span>{order.email ?? "No email captured (express wallet)"}</span>
                  <span>
                    Subtotal {formatMoney(order.subtotal)} · Shipping{" "}
                    {order.shippingFree ? "Free" : formatMoney(order.shipping)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
