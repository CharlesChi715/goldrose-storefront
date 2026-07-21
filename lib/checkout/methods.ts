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

export const expressMethods = paymentMethods.filter((method) => method.kind === "express");

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
