/**
 * ROLE OF THIS FILE
 * Server-side order + customer operations behind the admin Orders section
 * (§9.4, §9.7): list/detail reads, the fulfill flow (tracking + shipping
 * email), refunds (provider API when real, recorded locally for mock),
 * cancellation with optional refund/restock, archive, timeline comments,
 * notes and tags. Orders are NEVER deleted (§7.1).
 */

import { randomUUID } from "crypto";
import { accountOf } from "./channels.ts";
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
  /** Posting account that brought the buyer (utm_content on the first view) — commission basis. */
  account: string | null;
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

/** Display name for an order's customer: customer name ▸ order email ▸ shipping name ▸ "—". */
function customerLabel(order: OrderRow, customer: CustomerRow | undefined): string {
  if (customer && (customer.first_name || customer.last_name)) {
    return `${customer.first_name} ${customer.last_name}`.trim();
  }
  return order.email ?? order.shipping_address?.name ?? "—";
}

/**
 * All orders for the list screen, newest first (by order number), each with
 * a customer display label and its total item count.
 */
export async function listOrders(): Promise<OrderListRow[]> {
  const store = getStore();
  const [orders, lines, customers] = await Promise.all([
    store.all("orders"),
    store.all("order_lines"),
    store.all("customers"),
  ]);
  const customerById = new Map(customers.map((row) => [row.id, row]));
  const itemCountByOrder = new Map<string, number>();
  for (const line of lines) {
    itemCountByOrder.set(
      line.order_id,
      (itemCountByOrder.get(line.order_id) ?? 0) + line.quantity,
    );
  }
  return orders
    .sort((a, b) => b.number - a.number)
    .map((order) => ({
      order,
      customerLabel: customerLabel(
        order,
        order.customer_id ? customerById.get(order.customer_id) : undefined,
      ),
      itemCount: itemCountByOrder.get(order.id) ?? 0,
    }));
}

/** Traffic-source label for a page view: utm_source ▸ referrer hostname ▸ "Direct" ("—" with no view). */
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

/**
 * Sessions-before-purchase + first/last traffic source (§9.4, from §7.12).
 *
 * @param visitorId - The order's visitor id; null (or no recorded views) returns null.
 */
async function conversionFor(visitorId: string | null): Promise<ConversionSummary | null> {
  if (!visitorId) {
    return null;
  }
  const views = (await getStore().where("page_views", { visitor_id: visitorId })).sort(
    (a, b) => a.created_at.localeCompare(b.created_at),
  );
  if (views.length === 0) {
    return null;
  }
  const sessions = new Set(views.map((view) => view.session_id));
  return {
    sessionCount: sessions.size,
    firstSource: sourceLabel(views[0]),
    lastSource: sourceLabel(views[views.length - 1]),
    account: accountOf(views[0]),
    pageViews: views.length,
  };
}

/**
 * Full order detail: lines, timeline events (newest first), the customer
 * with their lifetime order count, the conversion summary, and the PayPal
 * seller-protection status dug out of the raw capture payload.
 *
 * @param id - Order id; unknown ids return null.
 */
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

/** Appends a "system" event to the order's timeline. */
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

/** The order by id; throws "Unknown order" when it doesn't exist. */
async function mustGetOrder(id: string): Promise<OrderRow> {
  const order = (await getStore().all("orders")).find((row) => row.id === id);
  if (!order) {
    throw new Error("Unknown order");
  }
  return order;
}

/**
 * "Fulfill items" (§9.4): single fulfillment, tracking, shipping email.
 * Marks the whole order fulfilled, logs a timeline event, then sends the
 * shipping confirmation. Throws when already fulfilled or cancelled.
 *
 * @param input - Order id, optional tracking number/URL, and the acting admin.
 */
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

/** Returns every line's quantity to stock as 'return_restock' movements (refund/cancel flows). */
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
 * Throws when the amount is out of range or the order can't be refunded.
 *
 * @param input - Order id, refund amount in cents, restock flag, and the acting admin.
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

/**
 * Cancel (§9.4): unfulfilled only; optional full refund of the remainder +
 * restock. Real PayPal payments refund through the provider API; a timeline
 * event records what was done. Throws when fulfilled or already cancelled.
 *
 * @param input - Order id, optional reason, refund/restock flags, and the acting admin.
 */
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

/**
 * Archives or unarchives orders by stamping/clearing archived_at.
 *
 * @param ids - Order ids to update.
 * @param archived - True to archive, false to unarchive.
 */
export async function setOrdersArchived(ids: string[], archived: boolean): Promise<void> {
  const store = getStore();
  const now = new Date().toISOString();
  for (const id of ids) {
    await store.update("orders", { id }, { archived_at: archived ? now : null });
  }
}

/**
 * Adds an admin comment to the order's timeline.
 *
 * @param id - Order id.
 * @param message - Comment text.
 * @param actor - Admin name shown on the event.
 */
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

/**
 * Overwrites the order's admin note.
 *
 * @param id - Order id.
 * @param note - New note text.
 */
export async function saveOrderNote(id: string, note: string): Promise<void> {
  await getStore().update("orders", { id }, { note });
}

/**
 * Replaces the order's tag list.
 *
 * @param id - Order id.
 * @param tags - Full new tag list.
 */
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

/**
 * All customers, newest first, each with order count, lifetime spend
 * (derived on the fly, refunds excluded — §7.7), and a "City, Country"
 * label from the default address.
 */
export async function listCustomers(): Promise<CustomerListRow[]> {
  const store = getStore();
  const [customers, orders] = await Promise.all([
    store.all("customers"),
    store.all("orders"),
  ]);
  const ordersByCustomer = new Map<string, OrderRow[]>();
  for (const order of orders) {
    if (order.customer_id) {
      const list = ordersByCustomer.get(order.customer_id) ?? [];
      list.push(order);
      ordersByCustomer.set(order.customer_id, list);
    }
  }
  return customers
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((customer) => {
      const own = ordersByCustomer.get(customer.id) ?? [];
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

/**
 * One customer with their orders (newest first), timeline events, and
 * derived lifetime spend (refunds excluded).
 *
 * @param id - Customer id; unknown ids return null.
 */
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

/**
 * Adds an admin comment to the customer's timeline.
 *
 * @param id - Customer id.
 * @param message - Comment text.
 * @param actor - Admin name shown on the event.
 */
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

/**
 * Overwrites the customer's admin note.
 *
 * @param id - Customer id.
 * @param note - New note text.
 */
export async function saveCustomerNote(id: string, note: string): Promise<void> {
  await getStore().update("customers", { id }, { note });
}

/**
 * Replaces the customer's tag list.
 *
 * @param id - Customer id.
 * @param tags - Full new tag list.
 */
export async function saveCustomerTags(id: string, tags: string[]): Promise<void> {
  await getStore().update("customers", { id }, { tags });
}
