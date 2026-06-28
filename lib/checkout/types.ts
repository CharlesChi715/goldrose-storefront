/** The three checkout types the storefront offers. */
export type PaymentMethodId = "shop_pay" | "card" | "paypal";

/** How a method is presented and where the payment data is collected. */
export type PaymentMethodKind = "express" | "card";

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

export type CheckoutRequest = {
  method: PaymentMethodId;
  lines: CheckoutLineInput[];
  contact?: CheckoutContact;
  shipping?: ShippingAddress;
  card?: CardInput;
};

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

export type CheckoutResult = {
  ok: true;
  mode: "mock" | "live";
  order: Order;
  /** Set when the flow should hand off to a hosted page (express / live). */
  redirectUrl?: string;
  warnings: string[];
};

export type CheckoutError = {
  ok: false;
  error: string;
  /** Field-level validation messages, keyed by field name. */
  fieldErrors?: Record<string, string>;
};
