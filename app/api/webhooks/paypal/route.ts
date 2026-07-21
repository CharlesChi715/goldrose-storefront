/**
 * ROLE OF THIS FILE
 * POST /api/webhooks/paypal (§10.5). Sits OUTSIDE the auth middleware —
 * signature verification against PayPal's verify-webhook-signature API is
 * its auth: unverifiable deliveries get 401, verified events are handled
 * idempotently, and the response is a fast 200.
 *
 * Setup (activation checklist): PayPal Developer Dashboard → app → add
 * webhook https://<prod-domain>/api/webhooks/paypal, subscribe to
 * PAYMENT.CAPTURE.COMPLETED + PAYMENT.CAPTURE.REFUNDED, copy the webhook id
 * into PAYPAL_WEBHOOK_ID.
 */

import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal/client";
import { handlePayPalEvent, type PayPalWebhookEvent } from "@/lib/paypal/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let verified = false;
  try {
    verified = await verifyWebhookSignature({ headers: request.headers, rawBody });
  } catch {
    verified = false;
  }
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const outcome = await handlePayPalEvent(event);
    return NextResponse.json({ outcome });
  } catch (error) {
    console.error("[webhooks/paypal]", error);
    // 500 → PayPal retries the delivery; the handler is idempotent.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
