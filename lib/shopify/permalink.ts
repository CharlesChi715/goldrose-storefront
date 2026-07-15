"use client";

/**
 * ROLE OF THIS FILE
 * The LIVE checkout path. A "cart permalink" is a plain Shopify URL that
 * pre-fills a cart and drops the buyer straight into Shopify's hosted
 * checkout — no API token or server call needed, which is why this was the
 * fastest safe way to take real payments.
 */

import { products } from "@/lib/products";

// Accepts anything with productId + quantity (our CartLine fits this shape).
type LineLike = { productId: string; quantity: number };

/**
 * Public Shopify store domain, used in the BROWSER to build cart permalinks.
 * When this is set, the storefront is in "live checkout" mode: clicking a
 * checkout / express button hands the cart off to Shopify's hosted checkout
 * (where PayPal is enabled) instead of the local mock flow.
 *
 * Must be a NEXT_PUBLIC_ var so it is inlined into the client bundle. Leave it
 * unset for local mock testing; set it (e.g. goldrose-9372.myshopify.com) for
 * the live PayPal test and in production.
 */
const PUBLIC_STORE_DOMAIN = (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

export function isLiveCheckout(): boolean {
  return PUBLIC_STORE_DOMAIN.length > 0;
}

/** Pull the trailing numeric id out of a Shopify variant GID. */
function numericVariantId(gid: string): string {
  const match = gid.match(/(\d+)\s*$/);
  return match ? match[1] : "";
}

/**
 * Build a Shopify cart permalink for the given cart lines:
 * https://{domain}/cart/{variantId}:{qty},{variantId}:{qty}
 *
 * Landing on this URL adds the items to Shopify's cart and sends the buyer
 * straight to the hosted checkout. Returns null if not configured or no cart
 * line resolves to a real variant id (e.g. a product still on a mock id).
 */
export function buildCartPermalink(lines: LineLike[]): string | null {
  if (!PUBLIC_STORE_DOMAIN || lines.length === 0) {
    return null;
  }

  const pairs: string[] = [];
  for (const line of lines) {
    const product = products.find((entry) => entry.id === line.productId);
    if (!product) {
      continue;
    }
    const id = numericVariantId(product.shopifyVariantId);
    if (!id) {
      continue;
    }
    pairs.push(`${id}:${Math.max(1, Math.floor(line.quantity))}`);
  }

  if (pairs.length === 0) {
    return null;
  }
  return `https://${PUBLIC_STORE_DOMAIN}/cart/${pairs.join(",")}`;
}
