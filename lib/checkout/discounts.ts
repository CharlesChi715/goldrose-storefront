/**
 * ROLE OF THIS FILE
 * Server-side discount-code validation and math (§7.8, §9.10): percentage /
 * fixed amount (whole order or specific products) and free shipping, with
 * date window, usage limit, minimum purchase, and once-per-customer checks.
 * Called by the pricer — codes are only ever honored server-side.
 */

import { getStore } from "../supabase/store.ts";
import type { DiscountRow } from "../supabase/types.ts";
import type { PricedLine } from "./pricing.ts";

export type DiscountErrorReason =
  | "unknown"
  | "not_started"
  | "expired"
  | "usage_limit"
  | "min_purchase"
  | "once_per_customer";

/**
 * Error thrown when a discount code can't apply; `reason` is machine-readable
 * for tests/branching, `message` is the buyer-safe text shown in checkout.
 */
// No TS parameter properties here — Node type stripping can't erase them,
// and this module is imported by Node-run unit tests (§0.2).
export class DiscountError extends Error {
  reason: DiscountErrorReason;

  constructor(reason: DiscountErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

/**
 * Derived list status, like Shopify's badges (§9.10): "scheduled" before the
 * start date, "expired" past the end date or usage limit, else "active".
 *
 * @param discount - The discount row to classify.
 * @param now - Reference time (defaults to the current time; injectable for tests).
 */
export function discountStatus(
  discount: DiscountRow,
  now = new Date(),
): "active" | "scheduled" | "expired" {
  if (new Date(discount.starts_at) > now) {
    return "scheduled";
  }
  if (discount.ends_at && new Date(discount.ends_at) < now) {
    return "expired";
  }
  if (discount.usage_limit !== null && discount.used_count >= discount.usage_limit) {
    return "expired";
  }
  return "active";
}

export type AppliedDiscount = {
  discount: DiscountRow;
  discount_cents: number;
  free_shipping: boolean;
};

/**
 * Validate a code against the current cart and compute its value. Reads
 * discounts (and, for once-per-customer codes, orders) from the store; throws
 * DiscountError with a buyer-safe message when the code can't apply. Code
 * matching is case-insensitive.
 *
 * @param input - Trimmed code, server-priced lines, subtotal in cents, and
 *   the buyer's email (for once-per-customer checks) if known.
 * @returns The matched discount row, its computed value in cents (0 for
 *   free-shipping codes), and a free_shipping flag.
 */
export async function applyDiscountCode(input: {
  code: string;
  lines: PricedLine[];
  subtotalCents: number;
  email?: string | null;
}): Promise<AppliedDiscount> {
  const store = getStore();
  const code = input.code.trim();
  const discounts = await store.all("discounts");
  const discount = discounts.find(
    (row) => row.code.toLowerCase() === code.toLowerCase(),
  );
  if (!discount) {
    throw new DiscountError("unknown", "Enter a valid discount code.");
  }

  const now = new Date();
  if (new Date(discount.starts_at) > now) {
    throw new DiscountError("not_started", "This code isn't active yet.");
  }
  if (discount.ends_at && new Date(discount.ends_at) < now) {
    throw new DiscountError("expired", "This code has expired.");
  }
  if (discount.usage_limit !== null && discount.used_count >= discount.usage_limit) {
    throw new DiscountError("usage_limit", "This code has been fully redeemed.");
  }
  if (
    discount.min_purchase_cents !== null &&
    input.subtotalCents < discount.min_purchase_cents
  ) {
    throw new DiscountError(
      "min_purchase",
      `This code needs a minimum purchase of $${(discount.min_purchase_cents / 100).toFixed(2)}.`,
    );
  }
  if (discount.once_per_customer && input.email) {
    const orders = await store.all("orders");
    const used = orders.some(
      (order) =>
        order.email?.toLowerCase() === input.email!.toLowerCase() &&
        order.discount_code?.toLowerCase() === discount.code.toLowerCase() &&
        !order.cancelled_at,
    );
    if (used) {
      throw new DiscountError(
        "once_per_customer",
        "This code has already been used on this email.",
      );
    }
  }

  // Eligible amount: whole order, or only the listed products.
  const productIds = discount.applies_to?.product_ids ?? null;
  const eligible = input.lines
    .filter((line) => !productIds || productIds.includes(line.product_id))
    .reduce((sum, line) => sum + line.line_total_cents, 0);

  let discountCents = 0;
  let freeShipping = false;
  if (discount.type === "percentage") {
    discountCents = Math.round((eligible * Math.min(100, Math.max(0, discount.value))) / 100);
  } else if (discount.type === "fixed_amount") {
    discountCents = Math.min(discount.value, eligible);
  } else {
    freeShipping = true;
  }

  return { discount, discount_cents: discountCents, free_shipping: freeShipping };
}

/**
 * Called when a paid order lands with this code (§9.10 used-count): bumps the
 * discount's used_count by one in the store. Silently does nothing for an
 * unknown code.
 *
 * @param code - The discount code as stored on the order (case-insensitive match).
 */
export async function incrementDiscountUsage(code: string): Promise<void> {
  const store = getStore();
  const discounts = await store.all("discounts");
  const discount = discounts.find((row) => row.code.toLowerCase() === code.toLowerCase());
  if (discount) {
    await store.update(
      "discounts",
      { id: discount.id },
      { used_count: discount.used_count + 1 },
    );
  }
}
