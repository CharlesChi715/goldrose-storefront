/**
 * ROLE OF THIS FILE
 * PayPal webhook event handling (§10.5), separated from the HTTP route so
 * it can be fixture-tested under plain Node (§0.2). Handles
 * PAYMENT.CAPTURE.COMPLETED (confirm — or repair-create — the order) and
 * PAYMENT.CAPTURE.REFUNDED (sync refund status). Idempotent: redeliveries
 * upsert on provider_order_id and refund events dedupe by refund id.
 */

import { randomUUID } from "crypto";
import { priceCart } from "../checkout/pricing.ts";
import { createOrder } from "../orders/db.ts";
import { getStore } from "../supabase/store.ts";

export type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string; // capture id (COMPLETED) or refund id (REFUNDED)
    status?: string;
    amount?: { value?: string; currency_code?: string };
    seller_payable_breakdown?: {
      total_refunded_amount?: { value?: string };
    };
    supplementary_data?: {
      related_ids?: { order_id?: string };
    };
  };
};

export type WebhookOutcome =
  | "confirmed"
  | "repaired"
  | "refund_synced"
  | "duplicate"
  | "ignored";

/**
 * Parse a PayPal decimal amount string into cents, e.g. "49.99" → 4999.
 *
 * @param value - PayPal amount string, if present.
 * @returns Cents, or null when missing/unparseable.
 */
function centsFrom(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const parsed = Math.round(Number.parseFloat(value) * 100);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Insert a system-kind entry into order_events (the order's timeline in the
 * admin).
 *
 * @param orderId - The order the event belongs to.
 * @param message - Timeline text; refund handling also greps these for dedupe.
 */
async function addEvent(orderId: string, message: string): Promise<void> {
  await getStore().insert("order_events", [
    {
      id: randomUUID(),
      order_id: orderId,
      kind: "system",
      message,
      created_by: null,
      created_at: new Date().toISOString(),
    },
  ]);
}

/**
 * Handle PAYMENT.CAPTURE.COMPLETED. Three paths: an existing pending order is
 * marked paid ("confirmed"); an already-paid order is a "duplicate"
 * redelivery; and when no order exists, the order is rebuilt from the saved
 * checkout via a fresh server re-price ("repaired", §10.5.3 — the buyer's
 * browser died between approval and our capture response). Writes orders and
 * order_events; "ignored" when the event carries no order id or no matching
 * checkout exists.
 *
 * @param event - The verified webhook event payload.
 */
async function handleCaptureCompleted(event: PayPalWebhookEvent): Promise<WebhookOutcome> {
  const providerOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
  if (!providerOrderId) {
    return "ignored";
  }
  const store = getStore();
  const orders = await store.all("orders");
  const existing = orders.find((order) => order.provider_order_id === providerOrderId);

  if (existing) {
    if (existing.financial_status === "pending") {
      await store.update(
        "orders",
        { id: existing.id },
        { financial_status: "paid", provider_capture_id: event.resource?.id ?? existing.provider_capture_id },
      );
      await addEvent(existing.id, "Payment confirmed by PayPal webhook");
      return "confirmed";
    }
    return "duplicate";
  }

  // Repair: the buyer's browser died between approval and our capture
  // response (§10.5.3). Rebuild the order from the server-priced checkout.
  const checkout = (await store.all("checkouts")).find(
    (row) => row.provider_order_id === providerOrderId,
  );
  if (!checkout) {
    return "ignored";
  }
  const priced = await priceCart({
    lines: checkout.cart.lines.map((line) => ({
      variantId: line.variant_id,
      quantity: line.quantity,
    })),
    country: checkout.cart.country ?? "US",
    discountCode: checkout.discount_code,
    email: checkout.email,
  });
  const order = await createOrder({
    priced,
    source: "site",
    payment_provider: "paypal",
    provider_order_id: providerOrderId,
    provider_capture_id: event.resource?.id ?? null,
    financial_status: "paid",
    email: checkout.email,
    note: checkout.cart.note ?? null,
    visitor_id: checkout.cart.visitor_id ?? null,
    checkout_id: checkout.id,
    raw: event,
  });
  await addEvent(order.id, "Order repaired from PayPal webhook (capture completed)");
  return "repaired";
}

/**
 * Handle PAYMENT.CAPTURE.REFUNDED: sync the order's refunded_cents (capped at
 * the order total) and set financial_status to refunded / partially_refunded.
 * Prefers PayPal's cumulative total_refunded_amount; dedupes redeliveries by
 * refund id via the order-events timeline. Writes orders and order_events;
 * "ignored" when no matching order exists.
 *
 * @param event - The verified webhook event payload.
 */
async function handleCaptureRefunded(event: PayPalWebhookEvent): Promise<WebhookOutcome> {
  const providerOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
  if (!providerOrderId) {
    return "ignored";
  }
  const store = getStore();
  const order = (await store.all("orders")).find(
    (row) => row.provider_order_id === providerOrderId,
  );
  if (!order) {
    return "ignored";
  }

  const refundId = event.resource?.id ?? "unknown";
  const marker = `PayPal refund ${refundId}`;
  const events = await store.all("order_events");
  if (events.some((entry) => entry.order_id === order.id && entry.message.includes(marker))) {
    return "duplicate";
  }

  // total_refunded_amount is cumulative → naturally idempotent; fall back to
  // adding this event's amount (guarded by the refund-id dedupe above).
  const cumulative = centsFrom(
    event.resource?.seller_payable_breakdown?.total_refunded_amount?.value,
  );
  const eventAmount = centsFrom(event.resource?.amount?.value) ?? 0;
  const refunded = Math.min(
    order.total_cents,
    cumulative ?? order.refunded_cents + eventAmount,
  );

  await store.update(
    "orders",
    { id: order.id },
    {
      refunded_cents: refunded,
      financial_status: refunded >= order.total_cents ? "refunded" : "partially_refunded",
    },
  );
  await addEvent(
    order.id,
    `${marker} — $${(eventAmount / 100).toFixed(2)} (status synced by webhook)`,
  );
  return "refund_synced";
}

/**
 * Route an already-verified PayPal webhook event to its handler: capture
 * completed or capture refunded; anything else is "ignored". Safe to call on
 * redeliveries — both handlers are idempotent.
 *
 * @param event - Parsed webhook body (signature must be verified by the route
 *   before calling this).
 * @returns What happened: "confirmed", "repaired", "refund_synced",
 *   "duplicate", or "ignored".
 */
export async function handlePayPalEvent(event: PayPalWebhookEvent): Promise<WebhookOutcome> {
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return handleCaptureCompleted(event);
    case "PAYMENT.CAPTURE.REFUNDED":
      return handleCaptureRefunded(event);
    default:
      return "ignored";
  }
}
