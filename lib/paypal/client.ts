/**
 * ROLE OF THIS FILE
 * The PayPal Orders-v2 REST client (§10 — OQ-1 working assumption). All
 * calls run server-side with the client-credentials flow. PAYPAL_ENV picks
 * the host: sandbox is the only mode this build ever runs (§0.3 guardrail —
 * flipping to live is an owner-only activation step).
 */

import type { PricedCart } from "@/lib/checkout/pricing";

export type PayPalConfig = {
  configured: boolean;
  env: "sandbox" | "live";
  baseUrl: string;
  clientId: string;
  secret: string;
  webhookId: string;
};

export function getPayPalConfig(): PayPalConfig {
  const env = process.env.PAYPAL_ENV?.trim() === "live" ? "live" : "sandbox";
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() ?? "";
  const secret = process.env.PAYPAL_SECRET?.trim() ?? "";
  return {
    configured: Boolean(clientId && secret),
    env,
    baseUrl:
      env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
    clientId,
    secret,
    webhookId: process.env.PAYPAL_WEBHOOK_ID?.trim() ?? "",
  };
}

async function accessToken(config: PayPalConfig): Promise<string> {
  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`PayPal auth failed (${response.status})`);
  }
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function paypalFetch(
  config: PayPalConfig,
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<unknown> {
  const token = await accessToken(config);
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "PayPal-Request-Id": init.idempotencyKey } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `PayPal ${path} failed (${response.status}): ${JSON.stringify(body)?.slice(0, 500)}`,
    );
  }
  return body;
}

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Create a PayPal order from a SERVER-priced cart (§10.2). */
export async function createPayPalOrder(
  priced: PricedCart,
  options: { idempotencyKey: string },
): Promise<{ id: string }> {
  const config = getPayPalConfig();
  const itemTotal = priced.subtotal_cents;
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: priced.currency,
          value: dollars(priced.total_cents),
          breakdown: {
            item_total: { currency_code: priced.currency, value: dollars(itemTotal) },
            shipping: { currency_code: priced.currency, value: dollars(priced.shipping_cents) },
            tax_total: { currency_code: priced.currency, value: dollars(priced.tax_cents) },
            discount: { currency_code: priced.currency, value: dollars(priced.discount_cents) },
          },
        },
        items: priced.lines.map((line) => ({
          name: `${line.name}${line.option ? ` (${line.option})` : ""}`.slice(0, 127),
          quantity: String(line.quantity),
          sku: line.sku.slice(0, 127) || undefined,
          unit_amount: {
            currency_code: priced.currency,
            value: dollars(line.unit_amount_cents),
          },
        })),
      },
    ],
  };
  const result = (await paypalFetch(getPayPalConfig(), "/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify(body),
    idempotencyKey: options.idempotencyKey,
  })) as { id: string };
  void config;
  return { id: result.id };
}

/** Capture an approved PayPal order (§10.2). Returns the raw response. */
export async function capturePayPalOrder(orderId: string): Promise<unknown> {
  return paypalFetch(getPayPalConfig(), `/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: "{}",
    idempotencyKey: `capture-${orderId}`,
  });
}

/** Refund a capture, full or partial (§10.4). */
export async function refundPayPalCapture(
  captureId: string,
  amountCents: number | null,
  currency = "USD",
): Promise<unknown> {
  return paypalFetch(getPayPalConfig(), `/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    body: JSON.stringify(
      amountCents === null
        ? {}
        : { amount: { currency_code: currency, value: dollars(amountCents) } },
    ),
    idempotencyKey: `refund-${captureId}-${amountCents ?? "full"}`,
  });
}

/**
 * Verify a webhook delivery against PayPal's verify-webhook-signature API
 * (§10.5 — server-to-server check, not an HMAC).
 */
export async function verifyWebhookSignature(input: {
  headers: Headers;
  rawBody: string;
}): Promise<boolean> {
  const config = getPayPalConfig();
  if (!config.webhookId) {
    return false;
  }
  const result = (await paypalFetch(config, "/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: input.headers.get("paypal-auth-algo"),
      cert_url: input.headers.get("paypal-cert-url"),
      transmission_id: input.headers.get("paypal-transmission-id"),
      transmission_sig: input.headers.get("paypal-transmission-sig"),
      transmission_time: input.headers.get("paypal-transmission-time"),
      webhook_id: config.webhookId,
      webhook_event: JSON.parse(input.rawBody),
    }),
  })) as { verification_status?: string };
  return result.verification_status === "SUCCESS";
}
