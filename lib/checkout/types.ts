/**
 * ROLE OF THIS FILE
 * Shared checkout types for the client side: payment method ids and the
 * card-input shape. Server-side pricing/order types live in
 * lib/checkout/pricing.ts and lib/supabase/types.ts.
 */

/** The checkout method: card (Stripe Checkout when configured, the mock form otherwise). */
export type PaymentMethodId = "card";

export type PaymentMethodKind = "card";

/**
 * Card fields are only ever used transiently in MOCK mode to validate format
 * and derive a brand + last four. They are NEVER persisted, logged, or
 * forwarded anywhere. With a real provider configured, the card UI is
 * Stripe's — no PAN ever reaches this server (§10.4).
 */
export type CardInput = {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
};
