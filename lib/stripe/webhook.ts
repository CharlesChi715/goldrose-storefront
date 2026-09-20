import { randomUUID } from "crypto";
import { priceCart } from "../checkout/pricing.ts";
import { createOrder } from "../orders/db.ts";
import { sendOwnerAlert } from "../email.ts";
import { getStore } from "../supabase/store.ts";
import { mapStripeSession, type StripeCheckoutSession } from "./mapping.ts";

export type StripeWebhookEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: StripeCheckoutSession & {
      // charge.* events carry a Charge, dispute events a Dispute — the
      // handlers below read only these overlapping fields.
      payment_intent?: string | null;
      amount_refunded?: number;
      charge?: string | null;
      reason?: string | null;
      evidence_details?: { due_by?: number | null } | null;
    };
  };
};

export type StripeWebhookOutcome =
  | "confirmed"
  | "repaired"
  | "refund_synced"
  | "duplicate"
  | "dispute_noted"
  | "ignored";

/**
 * Insert a system-kind entry into order_events (the order's timeline in the
 * admin).
 *
 * @param orderId - The order the event belongs to.
 * @param message - Timeline text; dedupe checks also grep these markers.
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
 * Handle checkout.session.completed. Three paths, mirroring the PayPal
 * handler: an existing pending order is marked paid ("confirmed"); an
 * already-paid order is a "duplicate" redelivery; and when no order exists,
 * the order is rebuilt from the saved checkout via a fresh server re-price
 * ("repaired" — the buyer's browser died between paying on Stripe and our
 * return route). A checkout that is not `open` is never rebuilt: `rejected`
 * (amount drift, refunded) is terminal, and `completed` always has an order.
 *
 * @param event - The verified webhook event payload.
 */
async function handleSessionCompleted(
  event: StripeWebhookEvent,
): Promise<StripeWebhookOutcome> {
  const session = event.data?.object;
  if (!session?.id || session.payment_status !== "paid") {
    return "ignored";
  }
  const mapped = mapStripeSession(session);
  const store = getStore();
  const orders = await store.all("orders");
  const existing = orders.find(
    (order) => order.provider_order_id === session.id,
  );

  if (existing) {
    if (existing.financial_status === "pending") {
      await store.update(
        "orders",
        { id: existing.id },
        {
          financial_status: "paid",
          provider_capture_id:
            mapped.chargeId ??
            mapped.paymentIntentId ??
            existing.provider_capture_id,
        },
      );
      await addEvent(existing.id, "Payment confirmed by Stripe webhook");
      return "confirmed";
    }
    return "duplicate";
  }

  const checkout = (await store.all("checkouts")).find(
    (row) =>
      row.provider_order_id === session.id ||
      (mapped.checkoutId !== null && row.id === mapped.checkoutId),
  );
  if (!checkout || checkout.status !== "open") {
    return "ignored";
  }
  const priced = await priceCart({
    lines: checkout.cart.lines.map((line) => ({
      variantId: line.variant_id,
      quantity: line.quantity,
    })),
    country: mapped.shipToCountry ?? checkout.cart.country ?? "US",
    discountCode: checkout.discount_code,
    email: mapped.email ?? checkout.email,
  });
  const order = await createOrder({
    priced,
    source: "site",
    payment_provider: "stripe",
    provider_order_id: session.id,
    provider_capture_id: mapped.chargeId ?? mapped.paymentIntentId,
    financial_status: "paid",
    payment_method_kind: "card",
    card_brand: mapped.cardBrand,
    card_last4: mapped.cardLast4,
    email: mapped.email ?? checkout.email,
    phone: mapped.phone,
    shipping_address: mapped.shippingAddress,
    billing_address: mapped.billingAddress,
    note: checkout.cart.note ?? null,
    visitor_id: checkout.cart.visitor_id ?? null,
    checkout_id: checkout.id,
    raw: event,
  });
  await addEvent(
    order.id,
    "Order repaired from Stripe webhook (checkout session completed)",
  );
  return "repaired";
}

/**
 * Handle charge.refunded: sync the order's refunded_cents from the charge's
 * cumulative amount_refunded (naturally idempotent) and set
 * financial_status to refunded / partially_refunded. The order is found by
 * provider_capture_id — the charge id on return-leg orders, the payment
 * intent id on webhook-repaired ones. Redeliveries dedupe by event id.
 *
 * @param event - The verified webhook event payload.
 */
async function handleChargeRefunded(
  event: StripeWebhookEvent,
): Promise<StripeWebhookOutcome> {
  const charge = event.data?.object;
  if (!charge?.id) {
    return "ignored";
  }
  const store = getStore();
  const order = (await store.all("orders")).find(
    (row) =>
      row.provider_capture_id === charge.id ||
      (typeof charge.payment_intent === "string" &&
        row.provider_capture_id === charge.payment_intent),
  );
  if (!order) {
    return "ignored";
  }

  const marker = `Stripe refund sync · ${event.id ?? "no-event-id"}`;
  const events = await store.all("order_events");
  if (
    events.some(
      (entry) => entry.order_id === order.id && entry.message.includes(marker),
    )
  ) {
    return "duplicate";
  }

  const refunded = Math.min(order.total_cents, charge.amount_refunded ?? 0);
  await store.update(
    "orders",
    { id: order.id },
    {
      refunded_cents: refunded,
      financial_status:
        refunded >= order.total_cents ? "refunded" : "partially_refunded",
    },
  );
  await addEvent(
    order.id,
    `${marker} — $${(refunded / 100).toFixed(2)} refunded in total (status synced by webhook)`,
  );
  return "refund_synced";
}

/**
 * Handle charge.dispute.created: tag the order `disputed`, write a timeline
 * entry carrying the dispute id, reason and response deadline, and email
 * the owner — a dispute unanswered by its due date is money lost by
 * default. Redeliveries dedupe by event id; mail failures never fail the
 * webhook.
 *
 * @param event - The verified webhook event payload.
 */
async function handleDisputeCreated(
  event: StripeWebhookEvent,
): Promise<StripeWebhookOutcome> {
  const dispute = event.data?.object;
  if (!dispute?.id) {
    return "ignored";
  }
  const store = getStore();
  const order = (await store.all("orders")).find(
    (row) =>
      (typeof dispute.charge === "string" &&
        row.provider_capture_id === dispute.charge) ||
      (typeof dispute.payment_intent === "string" &&
        row.provider_capture_id === dispute.payment_intent),
  );
  if (!order) {
    return "ignored";
  }

  const marker = `Stripe dispute ${dispute.id} · ${event.id ?? "no-event-id"}`;
  const events = await store.all("order_events");
  if (
    events.some(
      (entry) => entry.order_id === order.id && entry.message.includes(marker),
    )
  ) {
    return "duplicate";
  }

  const dueBy = dispute.evidence_details?.due_by
    ? new Date(dispute.evidence_details.due_by * 1000)
        .toISOString()
        .slice(0, 10)
    : null;
  await store.update(
    "orders",
    { id: order.id },
    { tags: Array.from(new Set([...order.tags, "disputed"])) },
  );
  await addEvent(
    order.id,
    `${marker} — ${dispute.reason ?? "no reason given"}` +
      (dueBy ? ` · respond in the Stripe dashboard by ${dueBy}` : ""),
  );
  await sendOwnerAlert(
    `Card dispute opened on order ${order.name}`,
    `A buyer disputed the charge on order ${order.name} (${dispute.reason ?? "no reason given"}).\n` +
      (dueBy
        ? `Respond in the Stripe dashboard before ${dueBy} — an unanswered dispute is lost by default.`
        : "Respond in the Stripe dashboard as soon as possible."),
  );
  return "dispute_noted";
}

/**
 * Route an already-verified Stripe webhook event to its handler; anything
 * else is "ignored". Safe to call on redeliveries — every handler is
 * idempotent.
 *
 * @param event - Parsed webhook body (signature must be verified by the
 *   route before calling this).
 * @returns What happened: "confirmed", "repaired", "refund_synced",
 *   "dispute_noted", "duplicate", or "ignored".
 */
export async function handleStripeEvent(
  event: StripeWebhookEvent,
): Promise<StripeWebhookOutcome> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return handleSessionCompleted(event);
    case "charge.refunded":
      return handleChargeRefunded(event);
    case "charge.dispute.created":
      return handleDisputeCreated(event);
    default:
      return "ignored";
  }
}
