"use client";

import { useEffect } from "react";

/**
 * Empties the stored cart once the confirmation page is reached. The mock
 * flow clears it client-side before navigating here, but the
 * Stripe flow arrives by cross-site redirect (Stripe page → return route →
 * here) with no checkout script in between — so the page itself clears.
 * Removing an already-removed key is a no-op, and storage access can throw
 * (private windows), so failures are swallowed.
 */
export function ClearCart() {
  useEffect(() => {
    try {
      window.localStorage.removeItem("goldrose-cart-v2");
    } catch {
      // Storage unavailable — the bag page will still show a stale cart, but
      // the order itself is safe on the server.
    }
  }, []);
  return null;
}
