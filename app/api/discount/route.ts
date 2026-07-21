/**
 * ROLE OF THIS FILE
 * POST /api/discount — pre-checkout validation for the discount-code field
 * (§8): re-prices the cart with the code server-side and returns the
 * discounted totals for display. The payment routes re-validate again at
 * pay time; this endpoint only improves UX.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCart } from "@/lib/checkout/pricing";
import { DiscountError } from "@/lib/checkout/discounts";

const requestSchema = z.object({
  code: z.string().trim().min(1).max(64),
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
  email: z.string().trim().max(254).optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    const priced = await priceCart({
      lines: parsed.lines,
      country: parsed.country.toUpperCase(),
      discountCode: parsed.code,
      email: parsed.email ?? null,
    });
    return NextResponse.json({
      ok: true,
      code: priced.discount_code,
      discountCents: priced.discount_cents,
      shippingCents: priced.shipping_cents,
      shippingFree: priced.shipping_free,
      totalCents: priced.total_cents,
    });
  } catch (error) {
    const message =
      error instanceof DiscountError
        ? error.message
        : "Enter a valid discount code.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
