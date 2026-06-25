export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{
    key: string;
    value: string;
  }>;
};

export type ShopifyCartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  title: string;
  selectedOptions: string;
  lineTotal: ShopifyMoney;
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotalAmount: ShopifyMoney;
  lines: ShopifyCartLine[];
};

export type ShopifyCartCreateResult = {
  cart: ShopifyCart;
  mode: "mock" | "live";
  warnings: string[];
};

export type ShopifyCheckoutRequest = {
  lines: ShopifyCartLineInput[];
  buyerIdentity?: {
    countryCode?: string;
    email?: string;
  };
};
