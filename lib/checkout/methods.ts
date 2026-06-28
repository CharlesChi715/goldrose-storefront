import type { PaymentMethodId, PaymentMethodKind } from "@/lib/checkout/types";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  kind: PaymentMethodKind;
  /** Short line shown under the button / in the receipt. */
  tagline: string;
  /** Brand background + text colors for the button. */
  background: string;
  color: string;
  /** What the real provider would be in live mode. */
  liveProvider: string;
};

/**
 * Registry of the checkout types in priority order: Shop Pay, Credit Card,
 * PayPal. All three are powered by one Shopify checkout in live mode — Shop Pay
 * and PayPal are Shopify's accelerated wallet buttons, and the card form maps
 * to Shopify's standard hosted card fields. Shop Pay is intentionally first
 * because it only exists on Shopify.
 */
export const paymentMethods: PaymentMethod[] = [
  {
    id: "shop_pay",
    label: "Shop Pay",
    kind: "express",
    tagline: "One-tap checkout with saved Shop Pay details.",
    background: "#5a31f4",
    color: "#ffffff",
    liveProvider: "Shopify · Shop Pay accelerated checkout",
  },
  {
    id: "card",
    label: "Credit Card",
    kind: "card",
    tagline: "Visa, Mastercard, American Express, and Discover.",
    background: "linear-gradient(to bottom, #f3d77c, #b8922e)",
    color: "#211706",
    liveProvider: "Shopify Payments · hosted card fields",
  },
  {
    id: "paypal",
    label: "PayPal",
    kind: "express",
    tagline: "Pay with your PayPal balance or linked account.",
    background: "#ffc439",
    color: "#0c2e5c",
    liveProvider: "Shopify · PayPal accelerated checkout",
  },
];

const methodsById = new Map(paymentMethods.map((method) => [method.id, method]));

export function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return typeof value === "string" && methodsById.has(value as PaymentMethodId);
}

export function getPaymentMethod(id: PaymentMethodId): PaymentMethod {
  const method = methodsById.get(id);
  if (!method) {
    throw new Error(`Unknown payment method: ${id}`);
  }
  return method;
}
