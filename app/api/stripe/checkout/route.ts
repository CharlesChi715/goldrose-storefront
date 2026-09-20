// POST /api/stripe/checkout: re-price the cart from the DB, log the
// checkouts row, create the Stripe Checkout Session, hand its hosted-page
// URL back to the client. No client-supplied price is ever trusted.

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { priceCart } from "@/lib/checkout/pricing";
import {
  createStripeCheckoutSession,
  getStripeConfig,
} from "@/lib/stripe/client";
import { getStore } from "@/lib/supabase/store.ts";
import { checkRequest, LIMITS, refusalHeaders } from "@/lib/rate-limit.ts";
import { alert, logEvent } from "@/lib/observe.ts";

const requestSchema = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1).max(120),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(50),
  country: z.string().trim().length(2),
  email: z.string().trim().email().max(254).optional(),
  note: z.string().trim().max(1000).optional(),
  discountCode: z.string().trim().max(64).optional(),
  visitorId: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  // Limited: starting a checkout is repeatable and a
  // refusal only costs the shopper a retry — no money has moved yet.
  const gate = checkRequest(
    request.headers,
    "stripe-checkout",
    LIMITS.checkoutStart,
  );
  if (!gate.allowed) {
    logEvent("warn", "ratelimit.refused", { route: "stripe/checkout" });
    return NextResponse.json(
      { error: "Too many checkout attempts — please wait a moment." },
      { status: 429, headers: refusalHeaders(gate) },
    );
  }

  if (!getStripeConfig().configured) {
    return NextResponse.json(
      { error: "Card payments are not configured." },
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
    const priced = await priceCart({
      lines: parsed.lines,
      country: parsed.country.toUpperCase(),
      discountCode: parsed.discountCode ?? null,
      email: parsed.email ?? null,
    });

    const checkoutId = randomUUID();
    await getStore().insert("checkouts", [
      {
        id: checkoutId,
        cart: {
          lines: parsed.lines.map((line) => ({
            variant_id: line.variantId,
            quantity: line.quantity,
          })),
          note: parsed.note,
          country: priced.country,
          visitor_id: parsed.visitorId,
        },
        email: parsed.email ?? null,
        discount_code: priced.discount_code,
        subtotal_cents: priced.subtotal_cents,
        total_cents: priced.total_cents,
        provider_order_id: null,
        status: "open",
        created_at: new Date().toISOString(),
        completed_at: null,
      },
    ]);

    const session = await createStripeCheckoutSession(priced, {
      checkoutId,
      origin: new URL(request.url).origin,
      email: parsed.email ?? null,
    });
    await getStore().update(
      "checkouts",
      { id: checkoutId },
      { provider_order_id: session.id },
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // A shopper who cannot start a checkout is a silently lost sale.
    await alert(
      "stripe.checkout.failed",
      "A shopper could not start Stripe card checkout.",
      { err: error },
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not start card checkout.",
      },
      { status: 400 },
    );
  }
}
