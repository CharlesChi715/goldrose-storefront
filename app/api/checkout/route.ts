import { NextResponse } from "next/server";
import { isPaymentMethodId } from "@/lib/checkout/methods";
import { processCheckout } from "@/lib/checkout/mock";
import { saveOrder } from "@/lib/orders/store";
import type {
  CardInput,
  CheckoutContact,
  CheckoutLineInput,
  CheckoutRequest,
  ShippingAddress,
} from "@/lib/checkout/types";

const MAX_QUANTITY = 20;

function str(value: unknown, max = 255): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

function sanitizeLines(value: unknown): CheckoutLineInput[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const lines: CheckoutLineInput[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const maybe = entry as Partial<CheckoutLineInput>;
    const productId = str(maybe.productId, 120);
    const option = str(maybe.option, 120) ?? "Standard";
    const quantity = maybe.quantity;

    if (
      !productId ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > MAX_QUANTITY
    ) {
      return null;
    }
    lines.push({ productId, option, quantity });
  }
  return lines;
}

function sanitizeContact(value: unknown): CheckoutContact | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const email = str((value as { email?: unknown }).email, 254);
  return email ? { email } : undefined;
}

function sanitizeShipping(value: unknown): ShippingAddress | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const maybe = value as Partial<ShippingAddress>;
  return {
    name: str(maybe.name, 120) ?? "",
    address1: str(maybe.address1, 200) ?? "",
    address2: str(maybe.address2, 200),
    city: str(maybe.city, 120) ?? "",
    state: str(maybe.state, 120) ?? "",
    postalCode: str(maybe.postalCode, 20) ?? "",
    country: str(maybe.country, 60) ?? "US",
  };
}

function sanitizeCard(value: unknown): CardInput | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const maybe = value as Partial<CardInput>;
  return {
    number: str(maybe.number, 30) ?? "",
    expiry: str(maybe.expiry, 10) ?? "",
    cvc: str(maybe.cvc, 5) ?? "",
    name: str(maybe.name, 120) ?? "",
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  if (!isPaymentMethodId(payload.method)) {
    return NextResponse.json(
      { ok: false, error: "Choose Shop Pay, Credit Card, or PayPal." },
      { status: 400 },
    );
  }

  const lines = sanitizeLines(payload.lines);
  if (!lines) {
    return NextResponse.json(
      { ok: false, error: `Send 1 or more cart lines with quantity 1-${MAX_QUANTITY}.` },
      { status: 400 },
    );
  }

  const checkoutRequest: CheckoutRequest = {
    method: payload.method,
    lines,
    contact: sanitizeContact(payload.contact),
    shipping: sanitizeShipping(payload.shipping),
    card: sanitizeCard(payload.card),
  };

  // Request-time nonce keeps the order number unique without baking a
  // non-deterministic call into the order-building helpers themselves.
  const nonce = Date.now().toString(36);

  try {
    const result = await processCheckout(checkoutRequest, nonce);

    // Capture completed mock orders so the demo can show the order landing in
    // the order log (/orders). A "mock" result is a finished demo order: card
    // payments complete in place and mock express returns an internal success
    // URL. Live express results redirect to Shopify's hosted checkout where the
    // order is not placed yet, so they are deliberately not captured here.
    if (result.ok && result.mode === "mock") {
      try {
        await saveOrder({
          ...result.order,
          mode: result.mode,
          placedAt: new Date().toISOString(),
        });
      } catch {
        // Never fail a successful checkout just because the demo log write
        // failed (e.g. read-only filesystem). The order still completes.
      }
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process checkout.",
      },
      { status: 500 },
    );
  }
}
