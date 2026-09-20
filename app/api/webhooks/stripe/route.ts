// POST /api/webhooks/stripe. Sits OUTSIDE the auth middleware — HMAC
// verification against the endpoint's signing secret is its auth:
// unverifiable deliveries get 401, verified events are handled
// idempotently, and the response is a fast 200.
//
// Setup (activation checklist): Stripe dashboard → Developers → Webhooks →
// add endpoint https://<prod-domain>/api/webhooks/stripe, subscribe to
// checkout.session.completed, charge.refunded, charge.dispute.created, and
// copy the signing secret into STRIPE_WEBHOOK_SECRET. Local development
// uses `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

import { NextResponse } from "next/server";
import { getStripeConfig } from "@/lib/stripe/client";
import { verifyStripeSignature } from "@/lib/stripe/verify";
import {
  handleStripeEvent,
  type StripeWebhookEvent,
} from "@/lib/stripe/webhook";
import { alert, logEvent } from "@/lib/observe.ts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const verified = verifyStripeSignature({
    rawBody,
    header: request.headers.get("stripe-signature"),
    secret: getStripeConfig().webhookSecret,
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(rawBody) as StripeWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event);
    // "repaired" means the safety net under the return leg just caught
    // something — logged at warn so a run of repairs is visible.
    logEvent(
      outcome === "repaired" ? "warn" : "info",
      "stripe.webhook.handled",
      { outcome, eventType: event.type },
    );
    return NextResponse.json({ outcome });
  } catch (error) {
    await alert(
      "stripe.webhook.failed",
      "A verified Stripe webhook could not be handled. Stripe will retry; if these continue, orders are being lost.",
      { err: error, eventType: event.type },
    );
    // 500 → Stripe retries the delivery; the handler is idempotent.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
