import type { PricedCart } from "../checkout/pricing.ts";

export type StripeConfig = {
  configured: boolean;
  secretKey: string;
  webhookSecret: string;
};

/**
 * Read Stripe settings from env vars. `configured` is true only when the
 * secret key is present; the webhook secret is carried separately because
 * webhook verification fails closed without it.
 *
 * @returns The resolved config; never throws on missing vars.
 */
export function getStripeConfig(): StripeConfig {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return {
    configured: Boolean(secretKey),
    secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  };
}

/**
 * Authenticated form-encoded fetch against the Stripe REST API: sends the
 * request with the secret key (plus Idempotency-Key when given) and throws
 * with status + truncated body on any non-OK response.
 *
 * @param config - Resolved Stripe config.
 * @param path - API path starting with "/" (appended to api.stripe.com).
 * @param init - Method, optional form pairs, optional idempotencyKey.
 * @returns The parsed JSON response body (null when the body isn't JSON).
 */
async function stripeFetch(
  config: StripeConfig,
  path: string,
  init: {
    method: "GET" | "POST";
    form?: Array<[string, string]>;
    idempotencyKey?: string;
  },
): Promise<unknown> {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      ...(init.form
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
      ...(init.idempotencyKey
        ? { "Idempotency-Key": init.idempotencyKey }
        : {}),
    },
    ...(init.form ? { body: new URLSearchParams(init.form).toString() } : {}),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Stripe ${path} failed (${response.status}): ${JSON.stringify(body)?.slice(0, 500)}`,
    );
  }
  return body;
}

/**
 * The address countries a Checkout Session may accept: the priced zone's
 * own country list, so the address Stripe collects can never belong to a
 * zone whose shipping rate differs from the one already charged. The
 * catch-all "Rest of world" zone ("*") narrows to the country the cart was
 * priced for — widening it would let the amount and the address disagree.
 *
 * @param priced - The server-priced cart carrying its zone.
 * @returns ISO-2 country codes for shipping_address_collection.
 */
export function allowedShipToCountries(priced: PricedCart): string[] {
  const explicit = priced.zone.countries.filter((code) => code !== "*");
  return explicit.length > 0 ? explicit : [priced.country];
}

/**
 * Create a Stripe Checkout Session from a SERVER-priced cart: per-line
 * items, the zone's shipping as a fixed shipping option, tax as its own
 * line when charged, and the discount as a single-use coupon — so the
 * session's amount_total always equals priced.total_cents. Card only;
 * Stripe hosts the payment page and collects the shipping address
 * (restricted to the priced zone's countries).
 *
 * @param priced - The server-priced cart (all amounts in cents).
 * @param options - checkoutId keys idempotency and metadata; origin builds
 *   the success/cancel URLs; email prefills the Stripe page when known.
 * @returns The session id and the hosted payment page URL to redirect to.
 */
export async function createStripeCheckoutSession(
  priced: PricedCart,
  options: { checkoutId: string; origin: string; email?: string | null },
): Promise<{ id: string; url: string }> {
  const config = getStripeConfig();
  const currency = priced.currency.toLowerCase();
  const form: Array<[string, string]> = [
    ["mode", "payment"],
    ["payment_method_types[0]", "card"],
    ["client_reference_id", options.checkoutId],
    ["metadata[checkout_id]", options.checkoutId],
    [
      "success_url",
      `${options.origin}/api/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
    ],
    ["cancel_url", `${options.origin}/checkout?step=payment`],
  ];

  priced.lines.forEach((line, index) => {
    form.push(
      [`line_items[${index}][quantity]`, String(line.quantity)],
      [`line_items[${index}][price_data][currency]`, currency],
      [
        `line_items[${index}][price_data][unit_amount]`,
        String(line.unit_amount_cents),
      ],
      [
        `line_items[${index}][price_data][product_data][name]`,
        `${line.name}${line.option ? ` (${line.option})` : ""}`.slice(0, 127),
      ],
    );
  });
  if (priced.tax_cents > 0) {
    const index = priced.lines.length;
    form.push(
      [`line_items[${index}][quantity]`, "1"],
      [`line_items[${index}][price_data][currency]`, currency],
      [
        `line_items[${index}][price_data][unit_amount]`,
        String(priced.tax_cents),
      ],
      [`line_items[${index}][price_data][product_data][name]`, "Tax"],
    );
  }

  form.push(
    ["shipping_options[0][shipping_rate_data][type]", "fixed_amount"],
    [
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]",
      String(priced.shipping_cents),
    ],
    [
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]",
      currency,
    ],
    [
      "shipping_options[0][shipping_rate_data][display_name]",
      priced.shipping_cents === 0 ? "Free shipping" : priced.zone.name,
    ],
  );

  allowedShipToCountries(priced).forEach((code, index) => {
    form.push([
      `shipping_address_collection[allowed_countries][${index}]`,
      code,
    ]);
  });

  if (priced.discount_cents > 0) {
    // Checkout has no raw amount-off field: the discount rides as a
    // single-use coupon created per session (idempotent by checkout id).
    const coupon = (await stripeFetch(config, "/v1/coupons", {
      method: "POST",
      form: [
        ["amount_off", String(priced.discount_cents)],
        ["currency", currency],
        ["duration", "once"],
        ["name", `Code ${priced.discount_code ?? "discount"}`.slice(0, 40)],
      ],
      idempotencyKey: `coupon-${options.checkoutId}`,
    })) as { id: string };
    form.push(["discounts[0][coupon]", coupon.id]);
  }

  if (options.email) {
    form.push(["customer_email", options.email]);
  }

  const session = (await stripeFetch(config, "/v1/checkout/sessions", {
    method: "POST",
    form,
    idempotencyKey: options.checkoutId,
  })) as { id?: string; url?: string };
  if (!session.id || !session.url) {
    throw new Error("Stripe returned a session without an id or URL.");
  }
  return { id: session.id, url: session.url };
}

/**
 * Retrieve a Checkout Session with its payment intent and latest charge
 * expanded — the return leg reads payment status, addresses, and the card
 * brand/last4 from this one call.
 *
 * @param sessionId - The cs_… id from the success URL.
 * @returns The raw session (mapped later by lib/stripe/mapping.ts).
 */
export async function getStripeCheckoutSession(
  sessionId: string,
): Promise<unknown> {
  const query = new URLSearchParams([
    ["expand[]", "payment_intent.latest_charge"],
  ]);
  return stripeFetch(
    getStripeConfig(),
    `/v1/checkout/sessions/${sessionId}?${query.toString()}`,
    { method: "GET" },
  );
}

/**
 * Refund a payment, full or partial. Accepts either the charge id (ch_/py_,
 * what the return leg stores) or the payment-intent id (pi_, what a
 * webhook repair stores). Idempotency-keyed per capture + amount; throws
 * on API failure.
 *
 * @param captureId - The provider capture id stored on the order.
 * @param amountCents - Amount in cents for a partial refund, or null for a
 *   full refund of the remaining amount.
 * @returns The raw refund response.
 */
export async function refundStripeCharge(
  captureId: string,
  amountCents: number | null,
): Promise<unknown> {
  const form: Array<[string, string]> = [
    [captureId.startsWith("pi_") ? "payment_intent" : "charge", captureId],
  ];
  if (amountCents !== null) {
    form.push(["amount", String(amountCents)]);
  }
  return stripeFetch(getStripeConfig(), "/v1/refunds", {
    method: "POST",
    form,
    idempotencyKey: `refund-${captureId}-${amountCents ?? "full"}`,
  });
}
