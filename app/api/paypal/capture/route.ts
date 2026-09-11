/**
 * ROLE OF THIS FILE
 * POST /api/paypal/capture (§10.2): capture the approved PayPal order, then
 * write the real order — lines, stock 'order' movements, customer, timeline,
 * checkout completion, emails — from the SERVER-priced checkout row, not
 * from anything the browser sent. Idempotent by provider_order_id; the
 * §10.5 webhook independently repairs the record if the buyer's browser
 * dies between approval and this response.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCart } from "@/lib/checkout/pricing";
import { createOrder } from "@/lib/orders/db";
import { capturePayPalOrder, getPayPalConfig } from "@/lib/paypal/client";
import {
  mapCaptureResponse,
  type PayPalCaptureResponse,
} from "@/lib/paypal/mapping";
import { currentAuthUserId } from "@/lib/supabase/server-auth.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { alert } from "@/lib/observe.ts";

const requestSchema = z.object({ orderID: z.string().min(1).max(64) });

// DELIBERATELY NOT RATE LIMITED. Every other public write route has a limiter
// (lib/rate-limit.ts); this one must not. By the time a request reaches here
// PayPal may already hold the shopper's money, and a refusal would leave a
// payment with no order against it — the one failure this shop cannot absorb.
// The route is idempotent by provider_order_id and PayPal itself throttles
// upstream, which is the protection it gets instead.

export async function POST(request: Request) {
  if (!getPayPalConfig().configured) {
    return NextResponse.json(
      { error: "PayPal is not configured." },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const response = (await capturePayPalOrder(
      parsed.orderID,
    )) as PayPalCaptureResponse;
    const mapped = mapCaptureResponse(response);
    if (!mapped.completed) {
      return NextResponse.json(
        {
          error: `Payment not completed (status: ${mapped.captureStatus ?? "unknown"}).`,
        },
        { status: 400 },
      );
    }

    // Recover the server-priced cart from the checkout row (§10.2).
    const checkouts = await getStore().all("checkouts");
    const checkout = checkouts.find(
      (row) => row.provider_order_id === parsed.orderID,
    );
    if (!checkout) {
      // Money has been captured and there is no cart to build an order from.
      // This is the worst state the shop can reach, and it is invisible to
      // everyone except the buyer, who has paid and received nothing.
      await alert(
        "paypal.capture.orphaned",
        "A PayPal payment was captured but its checkout row is missing — the buyer has paid and no order exists. Refund or fulfil by hand.",
        { providerOrderId: parsed.orderID },
      );
      return NextResponse.json({ error: "Unknown checkout." }, { status: 400 });
    }

    // §10.3: verify the ship-to country is in a served zone; PayPal's
    // shipping address wins over the pre-checkout selection when it differs.
    const country = mapped.shipToCountry ?? checkout.cart.country ?? "US";
    const priced = await priceCart({
      lines: checkout.cart.lines.map((line) => ({
        variantId: line.variant_id,
        quantity: line.quantity,
      })),
      country,
      discountCode: checkout.discount_code,
      email: mapped.email ?? checkout.email,
    });

    if (
      mapped.amountCents !== null &&
      mapped.amountCents !== priced.total_cents
    ) {
      // Amount drift (e.g. price edited mid-checkout) — keep the record, flag
      // it. The order is still written, because refusing here would strand a
      // captured payment; but somebody has been charged a different number
      // from the one the shop now computes, and that needs a human.
      await alert(
        "paypal.capture.amount-mismatch",
        "A payment was captured for a different amount than the shop now prices the cart at. The order was recorded; check it by hand.",
        {
          capturedCents: mapped.amountCents,
          pricedCents: priced.total_cents,
          providerOrderId: parsed.orderID,
        },
      );
    }

    const order = await createOrder({
      priced,
      source: "site",
      payment_provider: "paypal",
      provider_order_id: mapped.providerOrderId ?? parsed.orderID,
      provider_capture_id: mapped.captureId,
      financial_status: "paid",
      email: mapped.email ?? checkout.email,
      phone: mapped.phone,
      shipping_address: mapped.shippingAddress,
      billing_address: mapped.billingAddress,
      note: checkout.cart.note ?? null,
      visitor_id: checkout.cart.visitor_id ?? null,
      checkout_id: checkout.id,
      auth_user_id: await currentAuthUserId(),
      raw: response,
    });

    // `oid` is the success page's lookup key for the buyer's own email —
    // the UUID, never the sequential order name (lib/orders/confirmation.ts).
    const params = new URLSearchParams({
      order: order.name,
      oid: order.id,
      method: "paypal",
      total: String(order.total_cents),
      mock: "0",
    });
    return NextResponse.json({
      ok: true,
      redirectUrl: `/checkout/success?${params.toString()}`,
    });
  } catch (error) {
    // Anything reaching here happened at or after the capture call, so the
    // money may or may not have moved. Always worth a human's attention.
    await alert(
      "paypal.capture.failed",
      "A PayPal capture failed. Check PayPal for a payment with no order against it.",
      { err: error, providerOrderId: parsed.orderID },
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not capture payment.",
      },
      { status: 400 },
    );
  }
}
