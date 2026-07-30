/**
 * ROLE OF THIS FILE
 * POST /api/paypal/create (§10.2): re-price the cart from the DB, log the
 * checkouts row, create the PayPal order, hand its id back to the JS SDK
 * buttons. No client-supplied price is ever trusted.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { priceCart } from "@/lib/checkout/pricing";
import { createPayPalOrder, getPayPalConfig } from "@/lib/paypal/client";
import { getStore } from "@/lib/supabase/store.ts";

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

    const paypalOrder = await createPayPalOrder(priced, {
      idempotencyKey: checkoutId,
    });
    await getStore().update(
      "checkouts",
      { id: checkoutId },
      { provider_order_id: paypalOrder.id },
    );

    return NextResponse.json({ id: paypalOrder.id });
  } catch (error) {
    console.error("[paypal/create]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not start PayPal checkout.",
      },
      { status: 400 },
    );
  }
}
