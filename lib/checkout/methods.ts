/**
 * ROLE OF THIS FILE
 * The registry of checkout methods: PayPal (express) and card. UI code maps
 * over these instead of hard-coding buttons. With PayPal configured, the
 * real JS-SDK buttons replace the mock express button; the local card form
 * exists only in mock mode (§10.4).
 */

import type { PaymentMethodId, PaymentMethodKind } from "@/lib/checkout/types";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  kind: PaymentMethodKind;
  background: string;
  color: string;
};

/** Every checkout method the UI can render, in display order. */
export const paymentMethods: PaymentMethod[] = [
  {
    id: "paypal",
    label: "PayPal",
    kind: "express",
    background: "#ffc439",
    color: "#0c2e5c",
  },
  {
    id: "card",
    label: "Credit Card",
    kind: "card",
    background: "linear-gradient(to bottom, #f3d77c, #b8922e)",
    color: "#211706",
  },
];

/** Just the express-kind methods (the top-of-checkout buttons, i.e. PayPal). */
export const expressMethods = paymentMethods.filter(
  (method) => method.kind === "express",
);

const methodsById = new Map(
  paymentMethods.map((method) => [method.id, method]),
);

/**
 * Type guard for untrusted input (e.g. a request body field): true only for
 * a string matching a registered payment method id.
 *
 * @param value - Unknown value to check.
 */
export function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return typeof value === "string" && methodsById.has(value as PaymentMethodId);
}

/**
 * Look up a payment method by id; throws if the id isn't registered.
 *
 * @param id - A payment method id ("paypal" or "card").
 * @returns The method's registry entry (label, kind, button colors).
 */
export function getPaymentMethod(id: PaymentMethodId): PaymentMethod {
  const method = methodsById.get(id);
  if (!method) {
    throw new Error(`Unknown payment method: ${id}`);
  }
  return method;
}
