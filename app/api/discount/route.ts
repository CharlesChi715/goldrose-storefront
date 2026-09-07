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
import { checkRequest, LIMITS, refusalHeaders } from "@/lib/rate-limit.ts";
import { logEvent } from "@/lib/observe.ts";

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
  // A discount code is a secret worth guessing, and this route says whether a
  // guess was right. Limiting it is what turns brute force from minutes into
  // years.
  const gate = checkRequest(request.headers, "discount", LIMITS.discount);
  if (!gate.allowed) {
    logEvent("warn", "ratelimit.refused", { route: "discount" });
    return NextResponse.json(
      { ok: false, error: "Too many code attempts — please wait a moment." },
      { status: 429, headers: refusalHeaders(gate) },
    );
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
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
