/**
 * ROLE OF THIS FILE
 * The development stand-in for Shopify: builds a cart object with the same
 * shape a real `cartCreate` call would return, priced from the local catalog.
 * Lets checkout be developed and demoed with zero risk — no store, payment,
 * order, tax, or inventory action ever happens.
 */

import { formatMoney, products } from "@/lib/products";
import type {
  ShopifyCart,
  ShopifyCartCreateResult,
  ShopifyCartLine,
  ShopifyCartLineInput,
} from "@/lib/shopify/types";

/** Reverse lookup: which local product owns this Shopify variant id? */
function findProductByVariant(variantId: string) {
  return products.find((product) => product.shopifyVariantId === variantId);
}

/** Build one fake cart line, priced from the local catalog. */
function mockLine(input: ShopifyCartLineInput, index: number): ShopifyCartLine {
  const product = findProductByVariant(input.merchandiseId);
  const option =
    input.attributes?.find((attribute) => attribute.key === "Gift option")?.value ??
    "Standard";

  if (!product) {
    throw new Error(
      `Unknown mock Shopify variant: ${input.merchandiseId}. Update lib/products.ts with the Shopify variant ID you want to test.`,
    );
  }

  const linePrice = product.price * input.quantity;

  return {
    id: `gid://shopify/CartLine/mock-${index + 1}`,
    quantity: input.quantity,
    merchandiseId: input.merchandiseId,
    title: product.name,
    selectedOptions: option,
    lineTotal: {
      amount: (linePrice / 100).toFixed(2),
      currencyCode: "USD",
    },
  };
}

/** Build the whole fake cart: map the lines, sum the subtotal, attach warnings. */
export function createMockShopifyCart(lines: ShopifyCartLineInput[]): ShopifyCartCreateResult {
  const cartLines = lines.map(mockLine);
  const subtotalCents = cartLines.reduce((sum, line) => {
    const cents = Math.round(Number(line.lineTotal.amount) * 100);
    return sum + cents;
  }, 0);

  const cart: ShopifyCart = {
    id: "gid://shopify/Cart/mock-goldrose-cart",
    checkoutUrl: "https://goldrose.example/mock-checkout",
    totalQuantity: cartLines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalAmount: {
      amount: (subtotalCents / 100).toFixed(2),
      currencyCode: "USD",
    },
    lines: cartLines,
  };

  return {
    cart,
    mode: "mock",
    warnings: [
      "Mock Shopify cart created locally. No Shopify store, payment, tax, order, or inventory action happened.",
      `Mock subtotal is ${formatMoney(subtotalCents)} before shipping and tax.`,
    ],
  };
}
