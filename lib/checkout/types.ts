/**
 * ROLE OF THIS FILE
 * All the TypeScript shapes shared by the checkout system: what the browser
 * sends (`CheckoutRequest`), what the server answers (`CheckoutResult` or
 * `CheckoutError`), and what an order looks like. Keeping types in one file
 * with no logic means both client and server code can import them freely.
 */

/**
 * The three checkout types the storefront offers. The `|` makes a "union
 * type": a value that must be exactly one of these strings.
 */
export type PaymentMethodId = "shop_pay" | "card" | "paypal";

/** How a method is presented and where the payment data is collected. */
export type PaymentMethodKind = "express" | "card";

/** One cart line as the browser sends it — note: no price. The server looks prices up itself. */
export type CheckoutLineInput = {
  productId: string;
  option: string;
  quantity: number;
};

export type CheckoutContact = {
  email: string;
};

export type ShippingAddress = {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/**
 * Card fields are only ever used transiently to validate format and derive a
 * brand + last four for the receipt. They are NEVER persisted, logged, or
 * forwarded anywhere. In live mode the raw PAN never reaches this server at
 * all — Shopify/Stripe collect it in a hosted, PCI-compliant field and hand
 * back a token. See docs/checkout.md.
 */
export type CardInput = {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
};

/** The full body POSTed to /api/checkout. Express wallets send only method + lines. */
export type CheckoutRequest = {
  method: PaymentMethodId;
  lines: CheckoutLineInput[];
  contact?: CheckoutContact;
  shipping?: ShippingAddress;
  card?: CardInput;
};

/** A cart line after the server resolved it against the catalog (with real prices). */
export type OrderLine = {
  productId: string;
  sku: string;
  shopifyVariantId: string;
  name: string;
  shortName: string;
  option: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
};

/** A completed order: what the receipt, success page, and order log display. */
export type Order = {
  number: string;
  method: PaymentMethodId;
  methodLabel: string;
  email: string | null;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  shippingFree: boolean;
  tax: number;
  total: number;
  /** Present only for the card method, derived from the (discarded) PAN. */
  cardBrand?: string;
  cardLast4?: string;
};

/**
 * Success response. `ok: true` here and `ok: false` below form a
 * "discriminated union": checking `result.ok` tells TypeScript (and you)
 * exactly which of the two shapes you are holding.
 */
export type CheckoutResult = {
  ok: true;
  mode: "mock" | "live";
  order: Order;
  /** Set when the flow should hand off to a hosted page (express / live). */
  redirectUrl?: string;
  warnings: string[];
};

/** Failure response: a human-readable message plus optional per-field errors. */
export type CheckoutError = {
  ok: false;
  error: string;
  /** Field-level validation messages, keyed by field name. */
  fieldErrors?: Record<string, string>;
};
