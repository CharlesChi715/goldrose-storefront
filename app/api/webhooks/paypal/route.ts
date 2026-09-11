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
import {
  handlePayPalEvent,
  type PayPalWebhookEvent,
} from "@/lib/paypal/webhook";
import { alert, logEvent } from "@/lib/observe.ts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let verified = false;
  try {
    verified = await verifyWebhookSignature({
      headers: request.headers,
      rawBody,
    });
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
    // The webhook is the safety net under the browser-driven capture: when it
    // reports "repaired", the net just caught something. Logged at warn so a
    // run of repairs is visible without an email per event.
    logEvent(
      outcome === "repaired" ? "warn" : "info",
      "paypal.webhook.handled",
      {
        outcome,
        eventType: event.event_type,
      },
    );
    return NextResponse.json({ outcome });
  } catch (error) {
    // This is the LAST line of defence for an order PayPal has already taken
    // money for. PayPal will retry, and the handler is idempotent, so one
    // failure is survivable — but a persistent one means orders are being
    // lost, and nobody would otherwise find out.
    await alert(
      "paypal.webhook.failed",
      "A verified PayPal webhook could not be handled. PayPal will retry; if these continue, orders are being lost.",
      { err: error, eventType: event.event_type },
    );
    // 500 → PayPal retries the delivery; the handler is idempotent.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
