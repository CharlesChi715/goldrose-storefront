import { getShopifyConfig, assertShopifyConfigured } from "@/lib/shopify/config";
import { createMockShopifyCart } from "@/lib/shopify/mock";
import type {
  ShopifyCart,
  ShopifyCartCreateResult,
  ShopifyCheckoutRequest,
} from "@/lib/shopify/types";

const cartCreateMutation = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  product {
                    title
                  }
                }
              }
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              attributes {
                key
                value
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type ShopifyGraphqlCartCreateResponse = {
  data?: {
    cartCreate?: {
      cart?: {
        id: string;
        checkoutUrl: string;
        totalQuantity: number;
        cost: {
          subtotalAmount: {
            amount: string;
            currencyCode: string;
          };
        };
        lines: {
          edges: Array<{
            node: {
              id: string;
              quantity: number;
              merchandise: {
                id: string;
                product?: {
                  title: string;
                };
              };
              cost: {
                totalAmount: {
                  amount: string;
                  currencyCode: string;
                };
              };
              attributes: Array<{
                key: string;
                value: string;
              }>;
            };
          }>;
        };
      };
      userErrors: Array<{
        field?: string[];
        message: string;
      }>;
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

type ShopifyGraphqlCart = NonNullable<
  NonNullable<NonNullable<ShopifyGraphqlCartCreateResponse["data"]>["cartCreate"]>["cart"]
>;

function normalizeLiveCart(cart: ShopifyGraphqlCart): ShopifyCart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotalAmount: cart.cost.subtotalAmount,
    lines: cart.lines.edges.map(({ node }) => ({
      id: node.id,
      quantity: node.quantity,
      merchandiseId: node.merchandise.id,
      title: node.merchandise.product?.title ?? "Product",
      selectedOptions:
        node.attributes.find((attribute) => attribute.key === "Gift option")?.value ?? "Standard",
      lineTotal: node.cost.totalAmount,
    })),
  };
}

async function createLiveShopifyCart(
  request: ShopifyCheckoutRequest,
): Promise<ShopifyCartCreateResult> {
  const config = getShopifyConfig();
  assertShopifyConfigured(config);

  const response = await fetch(
    `https://${config.storeDomain}/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken,
      },
      body: JSON.stringify({
        query: cartCreateMutation,
        variables: {
          input: {
            lines: request.lines,
            buyerIdentity: request.buyerIdentity,
            attributes: [
              {
                key: "source",
                value: "aurea-nextjs-storefront",
              },
            ],
          },
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify Storefront API returned ${response.status}.`);
  }

  const json = (await response.json()) as ShopifyGraphqlCartCreateResponse;
  const userErrors = json.data?.cartCreate?.userErrors ?? [];
  const graphQLErrors = json.errors ?? [];
  const cart = json.data?.cartCreate?.cart;

  if (graphQLErrors.length > 0 || userErrors.length > 0 || !cart) {
    const messages = [
      ...graphQLErrors.map((error) => error.message),
      ...userErrors.map((error) => error.message),
    ];
    throw new Error(messages.join("; ") || "Shopify cartCreate failed.");
  }

  return {
    cart: normalizeLiveCart(cart),
    mode: "live",
    warnings: [],
  };
}

export async function createShopifyCart(
  request: ShopifyCheckoutRequest,
): Promise<ShopifyCartCreateResult> {
  const config = getShopifyConfig();

  if (config.mode === "mock") {
    const result = createMockShopifyCart(request.lines);
    return {
      ...result,
      cart: {
        ...result.cart,
        checkoutUrl: config.mockCheckoutUrl,
      },
    };
  }

  return createLiveShopifyCart(request);
}
