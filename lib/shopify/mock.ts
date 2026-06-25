import { formatMoney, products } from "@/lib/products";
import type {
  ShopifyCart,
  ShopifyCartCreateResult,
  ShopifyCartLine,
  ShopifyCartLineInput,
} from "@/lib/shopify/types";

function findProductByVariant(variantId: string) {
  return products.find((product) => product.shopifyVariantId === variantId);
}

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

export function createMockShopifyCart(lines: ShopifyCartLineInput[]): ShopifyCartCreateResult {
  const cartLines = lines.map(mockLine);
  const subtotalCents = cartLines.reduce((sum, line) => {
    const cents = Math.round(Number(line.lineTotal.amount) * 100);
    return sum + cents;
  }, 0);

  const cart: ShopifyCart = {
    id: "gid://shopify/Cart/mock-aurea-cart",
    checkoutUrl: "https://aurea.example/mock-checkout",
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
