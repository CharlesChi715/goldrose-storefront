/**
 * ROLE OF THIS FILE
 * Order creation (§7.4, §10.1) — the one path every completed checkout goes
 * through: mock checkout, PayPal capture, draft "Mark as paid", and the
 * webhook's repair flow. Writes the order + snapshot lines, decrements
 * stock with visible 'order' movements, auto-creates/links the customer,
 * records timeline events, completes the checkouts row, and sends emails.
 * Idempotent by provider_order_id — a redelivered webhook or double capture
 * can never duplicate an order (§10.5).
 */

import { randomUUID } from "crypto";
import { sendOrderPlacedEmails } from "../email.ts";
import { getStore } from "../supabase/store.ts";
import type {
  Address,
  CustomerRow,
  FinancialStatus,
  OrderLineRow,
  OrderRow,
  OrderSource,
} from "../supabase/types.ts";
import type { PricedCart } from "../checkout/pricing.ts";

export type CreateOrderInput = {
  priced: PricedCart;
  source: OrderSource;
  payment_provider: string; // 'mock' | 'paypal' | …
  provider_order_id?: string | null;
  provider_capture_id?: string | null;
  financial_status?: FinancialStatus;
  email?: string | null;
  phone?: string | null;
  shipping_address?: Address | null;
  billing_address?: Address | null;
  /** Buyer's gift message / checkout note → the order's Notes card (§7.4). */
  note?: string | null;
  visitor_id?: string | null;
  checkout_id?: string | null;
  raw?: unknown;
  actor?: string;
};

async function upsertCustomer(input: CreateOrderInput, orderName: string): Promise<string | null> {
  const email = input.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }
  const store = getStore();
  const now = new Date().toISOString();
  const customers = await store.all("customers");
  const existing = customers.find((row) => row.email.toLowerCase() === email);

  const shippingName = input.shipping_address?.name ?? "";
  const [firstName, ...rest] = shippingName.split(/\s+/).filter(Boolean);

  if (existing) {
    await store.update(
      "customers",
      { id: existing.id },
      {
        phone: input.phone ?? existing.phone,
        default_address: input.shipping_address ?? existing.default_address,
      },
    );
    await store.insert("customer_events", [
      {
        id: randomUUID(),
        customer_id: existing.id,
        kind: "system",
        message: `Placed order ${orderName}`,
        created_by: null,
        created_at: now,
      },
    ]);
    return existing.id;
  }

  const customer: CustomerRow = {
    id: randomUUID(),
    email,
    first_name: firstName ?? "",
    last_name: rest.join(" "),
    phone: input.phone ?? null,
    default_address: input.shipping_address ?? null,
    note: "",
    tags: [],
    created_at: now,
  };
  await store.insert("customers", [customer]);
  await store.insert("customer_events", [
    {
      id: randomUUID(),
      customer_id: customer.id,
      kind: "system",
      message: "Customer created",
      created_by: null,
      created_at: now,
    },
    {
      id: randomUUID(),
      customer_id: customer.id,
      kind: "system",
      message: `Placed order ${orderName}`,
      created_by: null,
      created_at: now,
    },
  ]);
  return customer.id;
}

async function orderNumberPrefix(): Promise<string> {
  const settings = await getStore().all("settings");
  const store = settings.find((row) => row.key === "store")?.value as
    | { order_number_prefix?: string }
    | undefined;
  return store?.order_number_prefix ?? "#";
}

/** Create an order from a server-priced cart. Returns the existing order
 * when provider_order_id already landed (idempotency). */
export async function createOrder(input: CreateOrderInput): Promise<OrderRow> {
  const store = getStore();
  const now = new Date().toISOString();

  if (input.provider_order_id) {
    const orders = await store.all("orders");
    const existing = orders.find(
      (order) => order.provider_order_id === input.provider_order_id,
    );
    if (existing) {
      return existing;
    }
  }

  const number = await store.nextOrderNumber();
  const name = `${await orderNumberPrefix()}${number}`;
  const customerId = await upsertCustomer(input, name);

  const order: OrderRow = {
    id: randomUUID(),
    number,
    name,
    source: input.source,
    customer_id: customerId,
    payment_provider: input.payment_provider,
    provider_order_id: input.provider_order_id ?? null,
    provider_capture_id: input.provider_capture_id ?? null,
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone ?? null,
    shipping_address: input.shipping_address ?? null,
    billing_address: input.billing_address ?? null,
    subtotal_cents: input.priced.subtotal_cents,
    discount_code: input.priced.discount_code,
    discount_cents: input.priced.discount_cents,
    shipping_cents: input.priced.shipping_cents,
    shipping_free: input.priced.shipping_free,
    tax_cents: input.priced.tax_cents,
    total_cents: input.priced.total_cents,
    currency: input.priced.currency,
    financial_status: input.financial_status ?? "paid",
    refunded_cents: 0,
    fulfillment_status: "unfulfilled",
    tracking_number: null,
    tracking_url: null,
    shipped_at: null,
    cancelled_at: null,
    cancel_reason: null,
    visitor_id: input.visitor_id ?? null,
    note: input.note?.trim() ?? "",
    tags: [],
    archived_at: null,
    placed_at: now,
    raw: input.raw ?? null,
  };

  const lines: OrderLineRow[] = input.priced.lines.map((line) => ({
    id: randomUUID(),
    order_id: order.id,
    variant_id: line.variant_id,
    product_id: line.product_id,
    sku: line.sku,
    name: line.name,
    option: line.option,
    quantity: line.quantity,
    unit_amount_cents: line.unit_amount_cents,
    line_total_cents: line.line_total_cents,
  }));

  await store.insert("orders", [order]);
  await store.insert("order_lines", lines);

  // Sales auto-decrement stock with a visible movement (§7.3 decision).
  for (const line of lines) {
    if (line.variant_id) {
      await store.adjustInventory({
        variantId: line.variant_id,
        delta: -line.quantity,
        reason: "order",
        note: `Order ${order.name}`,
        createdBy: input.actor ?? null,
      });
    }
  }

  // Timeline (§7.5).
  const events = [
    {
      id: randomUUID(),
      order_id: order.id,
      kind: "system" as const,
      message: `Order placed (${order.source})`,
      created_by: input.actor ?? null,
      created_at: now,
    },
  ];
  if (order.financial_status === "paid") {
    events.push({
      id: randomUUID(),
      order_id: order.id,
      kind: "system",
      message: `Payment of $${(order.total_cents / 100).toFixed(2)} captured via ${order.payment_provider}`,
      created_by: null,
      created_at: now,
    });
  }
  await store.insert("order_events", events);

  // Close the abandoned-checkout row (§7.6).
  if (input.checkout_id) {
    await store.update(
      "checkouts",
      { id: input.checkout_id },
      { status: "completed", completed_at: now },
    );
  } else if (input.provider_order_id) {
    await store.update(
      "checkouts",
      { provider_order_id: input.provider_order_id },
      { status: "completed", completed_at: now },
    );
  }

  await sendOrderPlacedEmails(order, lines);
  return order;
}
