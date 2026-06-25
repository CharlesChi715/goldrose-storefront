import { NextResponse } from "next/server";
import { createShopifyCart } from "@/lib/shopify/client";
import type { ShopifyCartLineInput, ShopifyCheckoutRequest } from "@/lib/shopify/types";

const maxLineQuantity = 20;

function isAttribute(value: unknown): value is { key: string; value: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeAttribute = value as { key?: unknown; value?: unknown };

  return typeof maybeAttribute.key === "string" && typeof maybeAttribute.value === "string";
}

function sanitizeLine(line: unknown): ShopifyCartLineInput | null {
  if (!line || typeof line !== "object") {
    return null;
  }

  const maybeLine = line as Partial<ShopifyCartLineInput>;
  const merchandiseId = maybeLine.merchandiseId?.trim();
  const quantity = maybeLine.quantity;

  if (
    typeof maybeLine.merchandiseId !== "string" ||
    !merchandiseId ||
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > maxLineQuantity
  ) {
    return null;
  }

  return {
    merchandiseId,
    quantity,
    attributes: Array.isArray(maybeLine.attributes)
      ? maybeLine.attributes.filter(isAttribute).map((attribute) => ({
          key: attribute.key.trim().slice(0, 120),
          value: attribute.value.trim().slice(0, 255),
        }))
      : undefined,
  };
}

function sanitizeCheckoutRequest(value: unknown): ShopifyCheckoutRequest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeRequest = value as Partial<ShopifyCheckoutRequest>;

  if (!Array.isArray(maybeRequest.lines) || maybeRequest.lines.length === 0) {
    return null;
  }

  const maybeLines = maybeRequest.lines.map(sanitizeLine);

  if (maybeLines.some((line) => line === null)) {
    return null;
  }

  const lines = maybeLines.filter((line): line is ShopifyCartLineInput => line !== null);

  return {
    lines,
    buyerIdentity: {
      countryCode:
        typeof maybeRequest.buyerIdentity?.countryCode === "string"
          ? maybeRequest.buyerIdentity.countryCode.trim().slice(0, 2).toUpperCase()
          : "US",
      email:
        typeof maybeRequest.buyerIdentity?.email === "string"
          ? maybeRequest.buyerIdentity.email.trim().slice(0, 254)
          : undefined,
    },
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const checkoutRequest = sanitizeCheckoutRequest(body);

  if (!checkoutRequest) {
    return NextResponse.json(
      {
        error: `Invalid Shopify cart request. Send 1 or more lines with quantity 1-${maxLineQuantity}.`,
      },
      { status: 400 },
    );
  }

  try {
    const result = await createShopifyCart(checkoutRequest);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create Shopify cart.",
      },
      { status: 500 },
    );
  }
}
