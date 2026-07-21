/**
 * ROLE OF THIS FILE
 * The server-side Shopify Storefront API client. Its one job: turn our cart
 * into a Shopify cart via the `cartCreate` GraphQL mutation and hand back a
 * checkout URL. In mock mode it swaps in the local fake cart instead.
 *
 * This is the token-based alternative to the cart-permalink live path — kept
 * because it is the natural next step (per-cart checkout URLs, buyer email
 * prefill) once the Storefront API token is configured.
 */

import { getShopifyConfig, assertShopifyConfigured } from "@/lib/shopify/config";
import { createMockShopifyCart } from "@/lib/shopify/mock";
import type {
  ShopifyCart,
  ShopifyCartCreateResult,
  ShopifyCheckoutRequest,
} from "@/lib/shopify/types";

// GraphQL: unlike REST, one request describes exactly which fields we want
// back. This mutation creates a cart and asks for its id, checkout URL,
// totals, and lines in a single round trip.
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

// The raw JSON shape Shopify answers with — deeply nested because GraphQL
// mirrors the query above. Everything is optional (`?`) because errors can
// leave any level missing.
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

// `NonNullable<...>` strips `undefined`/`null` from a type — this digs the
// cart type out of the response type once all the optional levels are known
// to exist.
type ShopifyGraphqlCart = NonNullable<
  NonNullable<NonNullable<ShopifyGraphqlCartCreateResponse["data"]>["cartCreate"]>["cart"]
>;

/** Flatten Shopify's nested GraphQL cart into our simple ShopifyCart shape. */
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

/**
 * Call the real Storefront API: POST the mutation with the store's public
 * token, then check all three places an error can hide (HTTP status, GraphQL
 * `errors`, and cartCreate `userErrors`) before trusting the cart.
 */
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
                value: "goldrose-nextjs-storefront",
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

/**
 * The public entry point: create a cart in whichever mode the env says —
 * a local fake cart in mock mode, a real Shopify cart in live mode.
 */
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
