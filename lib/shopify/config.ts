export type ShopifyMode = "mock" | "live";

export type ShopifyConfig = {
  mode: ShopifyMode;
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
  mockCheckoutUrl: string;
};

function normalizeStoreDomain(value: string) {
  return value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

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

export function assertShopifyConfigured(config: ShopifyConfig) {
  if (config.mode !== "live") {
    return;
  }

  if (!config.storeDomain || !config.storefrontAccessToken) {
    throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN are required.");
  }
}
