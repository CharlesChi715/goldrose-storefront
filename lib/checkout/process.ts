/**
 * ROLE OF THIS FILE
 * The server-side checkout engine behind POST /api/checkout. It re-prices the
 * cart from the catalog (never trusting browser prices), validates the form,
 * and builds the order. In live mode express wallets get a real Shopify
 * checkout URL; in mock (development) mode everything is simulated locally
 * with no payment, order, or inventory side effects anywhere.
 *
 * Note: the normal LIVE path doesn't come through here at all — the browser
 * goes straight to Shopify via a cart permalink (lib/shopify/permalink.ts).
 * This engine is the mock/dev flow plus a live fallback.
 */

import { shippingPolicy } from "@/lib/business";
import { products } from "@/lib/products";
import { validateCard } from "@/lib/checkout/card";
import { getPaymentMethod } from "@/lib/checkout/methods";
import { createShopifyCart } from "@/lib/shopify/client";
import { getShopifyConfig } from "@/lib/shopify/config";
import type {
  CheckoutError,
  CheckoutLineInput,
  CheckoutRequest,
  CheckoutResult,
  Order,
  OrderLine,
  ShippingAddress,
} from "@/lib/checkout/types";

const MAX_QUANTITY = 20;

/** Catalog lookup by our internal product id. */
function findProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

/**
 * Resolve client line items against the server-side catalog. Quantity and gift
 * option come from the request; identity and unit price are looked up locally,
 * so a tampered cart can never set its own price. An unknown product id throws.
 */
function resolveOrderLines(lines: CheckoutLineInput[]): OrderLine[] {
  return lines.map((line) => {
    const product = findProduct(line.productId);
    if (!product) {
      throw new Error(`Unknown product: ${line.productId}`);
    }

    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.floor(line.quantity)));
    return {
      productId: product.id,
      sku: product.sku,
      shopifyVariantId: product.shopifyVariantId,
      name: product.name,
      shortName: product.shortName,
      option: line.option || "Standard",
      quantity,
      unitAmount: product.price,
      lineTotal: product.price * quantity,
    };
  });
}

/** Mocked shipping rule from lib/business.ts: free over the threshold. */
function computeShipping(subtotal: number) {
  const free = subtotal >= shippingPolicy.freeShippingThreshold;
  return { amount: free ? 0 : shippingPolicy.standardShippingPrice, free };
}

/**
 * Build a short human-friendly order number like "AUR-3F9K-A2B7" from a hash
 * of the cart contents plus a per-request nonce (a one-time value) so two
 * identical carts still get different numbers.
 */
function buildOrderNumber(seed: string, nonce: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `AUR-${hash.toString(36).toUpperCase().slice(0, 4)}-${nonce.toUpperCase().slice(-4)}`;
}

/** Loose email shape check — "something@something.something" is good enough here. */
function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** Check the required address fields are filled in; returns one message per missing field. */
function validateShipping(shipping: ShippingAddress | undefined): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!shipping) {
    errors.shipping = "Enter a shipping address.";
    return errors;
  }

  const required: Array<[keyof ShippingAddress, string]> = [
    ["name", "Enter the recipient name."],
    ["address1", "Enter a street address."],
    ["city", "Enter a city."],
    ["state", "Enter a state."],
    ["postalCode", "Enter a ZIP code."],
    ["country", "Enter a country."],
  ];
  for (const [field, message] of required) {
    if (!String(shipping[field] ?? "").trim()) {
      errors[field] = message;
    }
  }
  return errors;
}

/**
 * Process one checkout request end to end: resolve + re-price the cart,
 * validate whatever the method requires, and return either a completed mock
 * order or (live express) a real Shopify checkout URL to redirect to.
 *
 * Mock mode is the development default and creates NO payment, order,
 * customer, tax, or inventory side effect anywhere. `nonce` is supplied by
 * the caller (the route handler) so this function stays deterministic and
 * easy to test.
 */
export async function processCheckout(
  request: CheckoutRequest,
  nonce: string,
): Promise<CheckoutResult | CheckoutError> {
  const method = getPaymentMethod(request.method);

  let orderLines: OrderLine[];
  try {
    orderLines = resolveOrderLines(request.lines);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not resolve cart items.",
    };
  }

  if (orderLines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const subtotal = orderLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = computeShipping(subtotal);
  const tax = 0; // Mock: real sales tax is computed by the payment provider.
  const total = subtotal + shipping.amount + tax;
  const seed = orderLines.map((line) => `${line.productId}:${line.quantity}:${line.option}`).join("|");

  const baseOrder: Order = {
    number: buildOrderNumber(seed, nonce),
    method: method.id,
    methodLabel: method.label,
    email: request.contact?.email?.trim() || null,
    lines: orderLines,
    subtotal,
    shipping: shipping.amount,
    shippingFree: shipping.free,
    tax,
    total,
  };

  const config = getShopifyConfig();

  // Card: collect and validate everything on-page (format only — no PAN kept).
  if (method.kind === "card") {
    // Live mode: a raw card must never reach this server — it belongs on
    // Shopify's PCI-compliant hosted fields. Refuse to handle the PAN here.
    if (config.mode === "live") {
      return {
        ok: false,
        error: "Card payments are completed on Shopify's secure checkout in live mode.",
      };
    }

    const fieldErrors: Record<string, string> = {};

    if (!request.contact?.email || !isValidEmail(request.contact.email)) {
      fieldErrors.email = "Enter a valid email address.";
    }
    Object.assign(fieldErrors, validateShipping(request.shipping));

    if (!request.card) {
      fieldErrors.cardNumber = "Enter your card details.";
    } else {
      const card = validateCard(request.card);
      Object.assign(fieldErrors, card.fieldErrors);
      if (card.valid) {
        baseOrder.cardBrand = card.brand;
        baseOrder.cardLast4 = card.last4;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }

    return {
      ok: true,
      mode: config.mode,
      order: baseOrder,
      warnings: [
        "Mock card payment authorized locally. No money moved, no order or customer was created, and the card number was discarded after format validation.",
      ],
    };
  }

  // Express wallets (Shop Pay, PayPal): hand off to a hosted checkout.
  if (config.mode === "live") {
    try {
      const cart = await createShopifyCart({
        lines: orderLines.map((line) => ({
          merchandiseId: line.shopifyVariantId,
          quantity: line.quantity,
          attributes: [
            { key: "Gift option", value: line.option },
            { key: "Local SKU", value: line.sku },
            { key: "Express method", value: method.label },
          ],
        })),
        buyerIdentity: { countryCode: "US", email: baseOrder.email ?? undefined },
      });

      return {
        ok: true,
        mode: "live",
        order: baseOrder,
        redirectUrl: cart.cart.checkoutUrl,
        warnings: cart.warnings,
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : `Could not start ${method.label} checkout.`,
      };
    }
  }

  // Mock express: simulate the wallet redirect to the internal success page.
  const params = new URLSearchParams({
    order: baseOrder.number,
    method: method.id,
    total: String(total),
    mock: "1",
  });

  return {
    ok: true,
    mode: "mock",
    order: baseOrder,
    redirectUrl: `/checkout/success?${params.toString()}`,
    warnings: [
      `Mock ${method.label} checkout created locally. No wallet, payment, or Shopify order was contacted.`,
    ],
  };
}
