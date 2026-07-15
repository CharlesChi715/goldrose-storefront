"use client";

/**
 * ROLE OF THIS FILE
 * The browser-side helper that starts an express (PayPal / Shop Pay)
 * checkout. Both the cart drawer and the /checkout page call this one
 * function instead of duplicating the fetch-and-redirect dance.
 */

import type { CheckoutLineInput, PaymentMethodId } from "@/lib/checkout/types";
import { buildCartPermalink, isLiveCheckout } from "@/lib/shopify/permalink";

type Navigator = { push: (url: string) => void };

/**
 * Start an express (Shop Pay / PayPal) checkout from anywhere in the client.
 *
 * POSTs the cart to the unified checkout route and then routes the shopper to
 * wherever the result says: an external Shopify hosted checkout in live mode,
 * or the internal mock success page in mock mode (clearing the cart first).
 * Returns an error message on failure, or null when it has navigated away.
 */
export async function startExpressCheckout({
  method,
  lines,
  router,
  clearCart,
}: {
  method: PaymentMethodId;
  lines: CheckoutLineInput[];
  router: Navigator;
  clearCart: () => void;
}): Promise<string | null> {
  if (lines.length === 0) {
    return "Add a product before checking out.";
  }

  // Live mode: hand the cart off to Shopify's hosted checkout (PayPal lives
  // there). No local API call — Shopify becomes the order + payment system.
  if (isLiveCheckout()) {
    const permalink = buildCartPermalink(lines);
    if (permalink) {
      window.location.assign(permalink);
      return null;
    }
    return "Checkout is not available right now. Please try again later.";
  }

  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, lines }),
    });

    const result = await response.json();

    if (!response.ok || result.ok === false) {
      return result.error ?? "Checkout could not be started.";
    }

    // Live wallets hand off to Shopify's hosted page — keep the cart.
    if (typeof result.redirectUrl === "string" && /^https?:\/\//.test(result.redirectUrl)) {
      window.location.assign(result.redirectUrl);
      return null;
    }

    clearCart();
    const order = result.order;
    const target =
      typeof result.redirectUrl === "string"
        ? result.redirectUrl
        : `/checkout/success?order=${encodeURIComponent(order.number)}&method=${order.method}&total=${order.total}&mock=${result.mode === "mock" ? "1" : "0"}`;
    router.push(target);
    return null;
  } catch {
    return "Something went wrong starting checkout. Please try again.";
  }
}
