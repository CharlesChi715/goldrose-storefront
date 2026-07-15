/**
 * ROLE OF THIS FILE
 * Reads the server-side Shopify settings from environment variables (values
 * set in .env.local locally, or the Vercel dashboard in production) and
 * decides whether the Storefront-API path runs in "mock" or "live" mode.
 * Keeping env access here means the rest of the code never touches
 * process.env directly.
 */

export type ShopifyMode = "mock" | "live";

export type ShopifyConfig = {
  mode: ShopifyMode;
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
  mockCheckoutUrl: string;
};

/** Accept "https://x.myshopify.com/" or "x.myshopify.com" and return the bare domain. */
function normalizeStoreDomain(value: string) {
  return value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/** Assemble the config from env vars. Mode defaults to "mock" unless SHOPIFY_MODE=live. */
export function getShopifyConfig(): ShopifyConfig {
  const storeDomain = normalizeStoreDomain(process.env.SHOPIFY_STORE_DOMAIN ?? "");
  const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() ?? "";
  const explicitMode = process.env.SHOPIFY_MODE?.trim();
  const mode: ShopifyMode = explicitMode === "live" ? "live" : "mock";

  return {
    mode,
    storeDomain,
    storefrontAccessToken,
    apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-04",
    mockCheckoutUrl: process.env.SHOPIFY_MOCK_CHECKOUT_URL ?? "https://aurea.example/mock-checkout",
  };
}

/** Fail fast with a clear message if live mode is on but credentials are missing. */
export function assertShopifyConfigured(config: ShopifyConfig) {
  if (config.mode !== "live") {
    return;
  }

  if (!config.storeDomain || !config.storefrontAccessToken) {
    throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN are required.");
  }
}
