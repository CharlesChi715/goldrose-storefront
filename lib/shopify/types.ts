/**
 * ROLE OF THIS FILE
 * The TypeScript shapes for Shopify cart data, shared by the live API client
 * and the mock cart builder so both produce identical-looking results.
 */

/** Shopify sends money as a decimal STRING ("49.99") plus a currency code. */
export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

/** One line we SEND to Shopify: which variant, how many, plus optional key/value notes. */
export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{
    key: string;
    value: string;
  }>;
};

/** One line as it comes BACK from Shopify, flattened for easy display. */
export type ShopifyCartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  title: string;
  selectedOptions: string;
  lineTotal: ShopifyMoney;
};

/** A created cart — `checkoutUrl` is where the customer goes to pay. */
export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotalAmount: ShopifyMoney;
  lines: ShopifyCartLine[];
};

/** What createShopifyCart returns: the cart plus which mode produced it. */
export type ShopifyCartCreateResult = {
  cart: ShopifyCart;
  mode: "mock" | "live";
  warnings: string[];
};

/** The input to createShopifyCart: cart lines plus optional buyer country/email. */
export type ShopifyCheckoutRequest = {
  lines: ShopifyCartLineInput[];
  buyerIdentity?: {
    countryCode?: string;
    email?: string;
  };
};
