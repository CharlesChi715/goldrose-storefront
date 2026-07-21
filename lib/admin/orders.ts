/**
 * ROLE OF THIS FILE
 * Server-side order + customer operations behind the admin Orders section
 * (§9.4, §9.7): list/detail reads, the fulfill flow (tracking + shipping
 * email), refunds (provider API when real, recorded locally for mock),
 * cancellation with optional refund/restock, archive, timeline comments,
 * notes and tags. Orders are NEVER deleted (§7.1).
 */

import { randomUUID } from "crypto";
import { sendShippingConfirmationEmail } from "@/lib/email";
import { getPayPalConfig, refundPayPalCapture } from "@/lib/paypal/client";
import { getStore } from "@/lib/supabase/store.ts";
import type {
  CustomerRow,
  OrderEventRow,
  OrderLineRow,
  OrderRow,
  PageViewRow,
} from "@/lib/supabase/types.ts";

export type OrderListRow = {
  order: OrderRow;
  customerLabel: string;
  itemCount: number;
};

export type ConversionSummary = {
  sessionCount: number;
  firstSource: string;
  lastSource: string;
  pageViews: number;
};

export type OrderDetail = {
  order: OrderRow;
  lines: OrderLineRow[];
  events: OrderEventRow[];
  customer: (CustomerRow & { ordersCount: number }) | null;
  conversion: ConversionSummary | null;
  sellerProtection: string | null;
};

function customerLabel(order: OrderRow, customers: CustomerRow[]): string {
  const customer = customers.find((row) => row.id === order.customer_id);
  if (customer && (customer.first_name || customer.last_name)) {
    return `${customer.first_name} ${customer.last_name}`.trim();
  }
  return order.email ?? order.shipping_address?.name ?? "—";
}

export async function listOrders(): Promise<OrderListRow[]> {
  const store = getStore();
  const [orders, lines, customers] = await Promise.all([
    store.all("orders"),
    store.all("order_lines"),
    store.all("customers"),
  ]);
  return orders
    .sort((a, b) => b.number - a.number)
    .map((order) => ({
      order,
      customerLabel: customerLabel(order, customers),
      itemCount: lines
        .filter((line) => line.order_id === order.id)
        .reduce((sum, line) => sum + line.quantity, 0),
    }));
}

function sourceLabel(view: PageViewRow | undefined): string {
  if (!view) {
    return "—";
  }
  const utmSource = view.utm?.utm_source;
  if (utmSource) {
    return utmSource;
  }
  if (view.referrer) {
    try {
      return new URL(view.referrer).hostname;
    } catch {
      return view.referrer;
    }
  }
  return "Direct";
}

/** Sessions-before-purchase + first/last traffic source (§9.4, from §7.12). */
async function conversionFor(visitorId: string | null): Promise<ConversionSummary | null> {
  if (!visitorId) {
    return null;
  }
  const views = (await getStore().all("page_views"))
    .filter((view) => view.visitor_id === visitorId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (views.length === 0) {
    return null;
  }
  const sessions = new Set(views.map((view) => view.session_id));
  return {
    sessionCount: sessions.size,
    firstSource: sourceLabel(views[0]),
    lastSource: sourceLabel(views[views.length - 1]),
    pageViews: views.length,
  };
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const store = getStore();
  const [orders, lines, events, customers] = await Promise.all([
    store.all("orders"),
    store.all("order_lines"),
    store.all("order_events"),
    store.all("customers"),
  ]);
  const order = orders.find((row) => row.id === id);
  if (!order) {
    return null;
  }
  const customer = customers.find((row) => row.id === order.customer_id) ?? null;
  const raw = order.raw as
    | { purchase_units?: Array<{ payments?: { captures?: Array<{ seller_protection?: { status?: string } }> } }> }
    | null;
  return {
    order,
    lines: lines.filter((line) => line.order_id === id),
    events: events
      .filter((event) => event.order_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    customer: customer
      ? {
          ...customer,
          ordersCount: orders.filter((row) => row.customer_id === customer.id).length,
        }
      : null,
    conversion: await conversionFor(order.visitor_id),
    sellerProtection:
      raw?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_protection?.status ?? null,
  };
}

async function addSystemEvent(orderId: string, message: string, actor: string | null) {
  await getStore().insert("order_events", [
    {
      id: randomUUID(),
      order_id: orderId,
      kind: "system",
      message,
      created_by: actor,
      created_at: new Date().toISOString(),
    },
  ]);
}

async function mustGetOrder(id: string): Promise<OrderRow> {
  const order = (await getStore().all("orders")).find((row) => row.id === id);
  if (!order) {
    throw new Error("Unknown order");
  }
  return order;
}

/** "Fulfill items" (§9.4): single fulfillment, tracking, shipping email. */
export async function fulfillOrder(input: {
  id: string;
  trackingNumber: string;
  trackingUrl: string;
  actor: string;
}): Promise<void> {
  const store = getStore();
  const order = await mustGetOrder(input.id);
  if (order.fulfillment_status === "fulfilled" || order.cancelled_at) {
    throw new Error("Order can't be fulfilled");
  }
  const now = new Date().toISOString();
  await store.update(
    "orders",
    { id: input.id },
    {
      fulfillment_status: "fulfilled",
      tracking_number: input.trackingNumber || null,
      tracking_url: input.trackingUrl || null,
      shipped_at: now,
    },
  );
  await addSystemEvent(
    input.id,
    input.trackingNumber
      ? `Order fulfilled — tracking ${input.trackingNumber}`
      : "Order fulfilled",
    input.actor,
  );
  const updated = await mustGetOrder(input.id);
  const lines = (await store.all("order_lines")).filter((line) => line.order_id === input.id);
  await sendShippingConfirmationEmail(updated, lines);
}

async function restockLines(orderId: string, orderName: string, actor: string) {
  const lines = (await getStore().all("order_lines")).filter(
    (line) => line.order_id === orderId,
  );
  for (const line of lines) {
    if (line.variant_id) {
      await getStore().adjustInventory({
        variantId: line.variant_id,
        delta: line.quantity,
        reason: "return_restock",
        note: `Refund/cancel of order ${orderName}`,
        createdBy: actor,
      });
    }
  }
}

/**
 * Refund (§9.4): custom amount + optional restock. Real PayPal orders hit
 * the provider refund API via provider_capture_id; mock orders record the
 * refund locally only. The §10.5 webhook independently confirms status.
 */
export async function refundOrder(input: {
  id: string;
  amountCents: number;
  restock: boolean;
  actor: string;
}): Promise<void> {
  const store = getStore();
  const order = await mustGetOrder(input.id);
  const remaining = order.total_cents - order.refunded_cents;
  if (input.amountCents <= 0 || input.amountCents > remaining) {
    throw new Error("Refund amount must be between $0.01 and the remaining total.");
  }
  if (order.financial_status === "pending" || order.financial_status === "refunded") {
    throw new Error("Order can't be refunded");
  }

  if (order.payment_provider === "paypal" && order.provider_capture_id) {
    if (!getPayPalConfig().configured) {
      throw new Error("PayPal is not configured — cannot refund a real payment.");
    }
    await refundPayPalCapture(order.provider_capture_id, input.amountCents, order.currency);
  }

  const refunded = order.refunded_cents + input.amountCents;
  await store.update(
    "orders",
    { id: input.id },
    {
      refunded_cents: refunded,
      financial_status: refunded >= order.total_cents ? "refunded" : "partially_refunded",
    },
  );
  if (input.restock) {
    await restockLines(order.id, order.name, input.actor);
  }
  await addSystemEvent(
    input.id,
    `Refunded $${(input.amountCents / 100).toFixed(2)}${input.restock ? " and restocked items" : ""}`,
    input.actor,
  );
}

/** Cancel (§9.4): unfulfilled only; optional full refund of the remainder + restock. */
export async function cancelOrder(input: {
  id: string;
  reason: string;
  refund: boolean;
  restock: boolean;
  actor: string;
}): Promise<void> {
  const store = getStore();
  const order = await mustGetOrder(input.id);
  if (order.fulfillment_status === "fulfilled" || order.cancelled_at) {
    throw new Error("Only unfulfilled, uncancelled orders can be cancelled.");
  }
  const now = new Date().toISOString();

  if (input.refund && order.total_cents > order.refunded_cents && order.financial_status !== "pending") {
    const remaining = order.total_cents - order.refunded_cents;
    if (order.payment_provider === "paypal" && order.provider_capture_id) {
      if (!getPayPalConfig().configured) {
        throw new Error("PayPal is not configured — cannot refund a real payment.");
      }
      await refundPayPalCapture(order.provider_capture_id, remaining, order.currency);
    }
    await store.update(
      "orders",
      { id: input.id },
      { refunded_cents: order.total_cents, financial_status: "refunded" },
    );
  }
  await store.update(
    "orders",
    { id: input.id },
    { cancelled_at: now, cancel_reason: input.reason || null },
  );
  if (input.restock) {
    await restockLines(order.id, order.name, input.actor);
  }
  await addSystemEvent(
    input.id,
    `Order cancelled${input.reason ? ` — ${input.reason}` : ""}${input.refund ? ", payment refunded" : ""}${input.restock ? ", items restocked" : ""}`,
    input.actor,
  );
}

export async function setOrdersArchived(ids: string[], archived: boolean): Promise<void> {
  const store = getStore();
  const now = new Date().toISOString();
  for (const id of ids) {
    await store.update("orders", { id }, { archived_at: archived ? now : null });
  }
}

export async function addOrderComment(id: string, message: string, actor: string): Promise<void> {
  await getStore().insert("order_events", [
    {
      id: randomUUID(),
      order_id: id,
      kind: "comment",
      message,
      created_by: actor,
      created_at: new Date().toISOString(),
    },
  ]);
}

export async function saveOrderNote(id: string, note: string): Promise<void> {
  await getStore().update("orders", { id }, { note });
}

export async function saveOrderTags(id: string, tags: string[]): Promise<void> {
  await getStore().update("orders", { id }, { tags });
}

/* ---------- Customers (§9.7) ---------- */

export type CustomerListRow = {
  customer: CustomerRow;
  ordersCount: number;
  totalSpentCents: number;
  location: string;
};

export async function listCustomers(): Promise<CustomerListRow[]> {
  const store = getStore();
  const [customers, orders] = await Promise.all([
    store.all("customers"),
    store.all("orders"),
  ]);
  return customers
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((customer) => {
      const own = orders.filter((order) => order.customer_id === customer.id);
      const address = customer.default_address;
      return {
        customer,
        ordersCount: own.length,
        // Derived, never stored (§7.7); refunds excluded from spend.
        totalSpentCents: own.reduce(
          (sum, order) => sum + order.total_cents - order.refunded_cents,
          0,
        ),
        location: [address?.city, address?.country].filter(Boolean).join(", "),
      };
    });
}

export type CustomerDetail = {
  customer: CustomerRow;
  orders: OrderRow[];
  events: Array<{ id: string; kind: string; message: string; created_by: string | null; created_at: string }>;
  totalSpentCents: number;
};

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const store = getStore();
  const [customers, orders, events] = await Promise.all([
    store.all("customers"),
    store.all("orders"),
    store.all("customer_events"),
  ]);
  const customer = customers.find((row) => row.id === id);
  if (!customer) {
    return null;
  }
  const own = orders
    .filter((order) => order.customer_id === id)
    .sort((a, b) => b.number - a.number);
  return {
    customer,
    orders: own,
    events: events
      .filter((event) => event.customer_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    totalSpentCents: own.reduce(
      (sum, order) => sum + order.total_cents - order.refunded_cents,
      0,
    ),
  };
}

export async function addCustomerComment(
  id: string,
  message: string,
  actor: string,
): Promise<void> {
  await getStore().insert("customer_events", [
    {
      id: randomUUID(),
      customer_id: id,
      kind: "comment",
      message,
      created_by: actor,
      created_at: new Date().toISOString(),
    },
  ]);
}

export async function saveCustomerNote(id: string, note: string): Promise<void> {
  await getStore().update("customers", { id }, { note });
}

export async function saveCustomerTags(id: string, tags: string[]): Promise<void> {
  await getStore().update("customers", { id }, { tags });
}
