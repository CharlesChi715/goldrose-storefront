/**
 * ROLE OF THIS FILE
 * Draft orders (§9.4 clone-lite) + abandoned checkouts (§7.6). A draft is
 * an order row with source='draft' and financial_status='pending' — no
 * stock touched, no emails. "Mark as paid" converts it: stock decrements
 * with 'order' movements, discount usage counts, emails go out. Abandoned =
 * checkouts still open after 1 hour.
 */

import { randomUUID } from "crypto";
import { incrementDiscountUsage } from "../checkout/discounts.ts";
import { priceCart, type PricedCart } from "../checkout/pricing.ts";
import { sendOrderPlacedEmails } from "../email.ts";
import { createOrder } from "../orders/db.ts";
import { getStore } from "../supabase/store.ts";
import type { CheckoutRow, OrderRow } from "../supabase/types.ts";

/**
 * Price a draft: normal DB pricing, but drafts carry no shipping charge.
 *
 * @param lines - Variant + quantity pairs to price.
 * @param discountCode - Optional code to apply.
 * @param email - Customer email, used by once-per-customer discount checks.
 */
async function priceDraft(
  lines: Array<{ variantId: string; quantity: number }>,
  discountCode: string | null,
  email: string | null,
): Promise<PricedCart> {
  const priced = await priceCart({ lines, country: "US", discountCode, email });
  return {
    ...priced,
    shipping_cents: 0,
    shipping_free: false,
    total_cents: priced.subtotal_cents - priced.discount_cents + priced.tax_cents,
  };
}

/**
 * Creates a draft: an order row with source='draft' and a pending financial
 * status — no stock touched, no emails (both happen at markDraftPaid).
 *
 * @param input - Lines, optional email/note/discount code, and the acting admin.
 * @returns The created order row.
 */
export async function createDraftOrder(input: {
  lines: Array<{ variantId: string; quantity: number }>;
  email: string | null;
  note: string | null;
  discountCode: string | null;
  actor: string;
}): Promise<OrderRow> {
  const priced = await priceDraft(input.lines, input.discountCode, input.email);
  return createOrder({
    priced,
    source: "draft",
    payment_provider: "mock",
    financial_status: "pending",
    email: input.email,
    note: input.note,
    actor: input.actor,
    decrementStock: false,
  });
}

/**
 * Shopify's "Mark as paid": the draft becomes a real order (§9.4) — status
 * flips to paid, stock decrements with 'order' movements, discount usage
 * counts, and the order emails go out. Throws unless the order is a
 * pending draft.
 *
 * @param id - Draft order id.
 * @param actor - Admin name recorded on the movements and timeline event.
 */
export async function markDraftPaid(id: string, actor: string): Promise<void> {
  const store = getStore();
  const order = (await store.all("orders")).find((row) => row.id === id);
  if (!order || order.source !== "draft" || order.financial_status !== "pending") {
    throw new Error("Only pending draft orders can be marked as paid.");
  }
  const lines = (await store.all("order_lines")).filter((line) => line.order_id === id);

  await store.update("orders", { id }, { financial_status: "paid" });
  for (const line of lines) {
    if (line.variant_id) {
      await store.adjustInventory({
        variantId: line.variant_id,
        delta: -line.quantity,
        reason: "order",
        note: `Order ${order.name}`,
        createdBy: actor,
      });
    }
  }
  await store.insert("order_events", [
    {
      id: randomUUID(),
      order_id: id,
      kind: "system",
      message: "Draft marked as paid",
      created_by: actor,
      created_at: new Date().toISOString(),
    },
  ]);
  if (order.discount_code) {
    await incrementDiscountUsage(order.discount_code);
  }
  const updated = (await store.all("orders")).find((row) => row.id === id);
  if (updated) {
    await sendOrderPlacedEmails(updated, lines);
  }
}

export type AbandonedCheckout = {
  checkout: CheckoutRow;
  itemsLabel: string;
  itemCount: number;
  ageHours: number;
};

const ABANDONED_AFTER_MS = 60 * 60 * 1000; // 1 hour (§7.6)

/**
 * Open checkouts older than 1 hour, newest first, each with a readable
 * items label (e.g. "2 × Gold Rose"), total item count, and age in hours
 * (1 decimal).
 *
 * @param now - Reference time; defaults to the current time.
 */
export async function listAbandonedCheckouts(
  now = new Date(),
): Promise<AbandonedCheckout[]> {
  const store = getStore();
  const [checkouts, variants, products] = await Promise.all([
    store.all("checkouts"),
    store.all("product_variants"),
    store.all("products"),
  ]);
  return checkouts
    .filter(
      (checkout) =>
        checkout.status === "open" &&
        now.getTime() - new Date(checkout.created_at).getTime() >= ABANDONED_AFTER_MS,
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((checkout) => {
      const labels = checkout.cart.lines.map((line) => {
        const variant = variants.find((row) => row.id === line.variant_id);
        const product = variant
          ? products.find((row) => row.id === variant.product_id)
          : undefined;
        return `${line.quantity} × ${product?.title ?? "Unavailable product"}`;
      });
      return {
        checkout,
        itemsLabel: labels.join(", "),
        itemCount: checkout.cart.lines.reduce((sum, line) => sum + line.quantity, 0),
        ageHours:
          Math.round(
            ((now.getTime() - new Date(checkout.created_at).getTime()) / (60 * 60 * 1000)) * 10,
          ) / 10,
      };
    });
}
