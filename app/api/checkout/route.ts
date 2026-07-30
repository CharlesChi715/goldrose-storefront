/**
 * ROLE OF THIS FILE
 * The MOCK checkout endpoint — the no-payment-keys dev mode (§10.4). Full
 * click-through: server re-prices the cart from the database, validates the
 * card format locally (never stored), then records a real order row with
 * source='mock' — stock decrement, customer, timeline, emails and all — with
 * no money moving anywhere. Disabled the moment PayPal keys exist: real
 * checkouts go through /api/paypal/* instead (§10.2).
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { validateCard } from "@/lib/checkout/card";
import { skipPaymentEnabled } from "@/lib/checkout/mode";
import { priceCart } from "@/lib/checkout/pricing";
import { createOrder } from "@/lib/orders/db";
import { getPayPalConfig } from "@/lib/paypal/client";
import { currentAuthUserId } from "@/lib/supabase/server-auth.ts";
import { getStore } from "@/lib/supabase/store.ts";
import type { Address } from "@/lib/supabase/types.ts";

const requestSchema = z.object({
  // "none" = the CHECKOUT_SKIP_PAYMENT flow: order placed with no payment step.
  method: z.enum(["card", "paypal", "none"]),
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
  shipping: z
    .object({
      name: z.string().trim().max(120),
      address1: z.string().trim().max(200),
      address2: z.string().trim().max(200).optional(),
      city: z.string().trim().max(120),
      state: z.string().trim().max(120),
      postalCode: z.string().trim().max(20),
    })
    .optional(),
  card: z
    .object({
      number: z.string().max(30),
      expiry: z.string().max(10),
      cvc: z.string().max(5),
      name: z.string().max(120),
    })
    .optional(),
});

export async function POST(request: Request) {
  // Mock checkout exists only while no real provider is configured (§10.4) —
  // or while the testing-phase skip-payment flag is deliberately on.
  const skipPayment = skipPaymentEnabled();
  if (getPayPalConfig().configured && !skipPayment) {
    return NextResponse.json(
      { ok: false, error: "Mock checkout is disabled — PayPal is configured." },
      { status: 400 },
    );
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // The no-payment method is unreachable unless the flag explicitly enables it.
  if (parsed.method === "none" && !skipPayment) {
    return NextResponse.json(
      { ok: false, error: "Payment is required." },
      { status: 400 },
    );
  }

  try {
    // Server-side re-pricing: the request carries no prices at all (§8).
    const priced = await priceCart({
      lines: parsed.lines,
      country: parsed.country.toUpperCase(),
      discountCode: parsed.discountCode ?? null,
      email: parsed.email ?? null,
    });

    const fieldErrors: Record<string, string> = {};
    if (parsed.method === "card") {
      if (!parsed.email) {
        fieldErrors.email = "Enter a valid email address.";
      }
      if (!parsed.shipping?.name?.trim()) {
        fieldErrors.name = "Enter the recipient name.";
      }
      if (!parsed.shipping?.address1?.trim()) {
        fieldErrors.address1 = "Enter a street address.";
      }
      if (!parsed.card) {
        fieldErrors.cardNumber = "Enter your card details.";
      } else {
        const card = validateCard(parsed.card);
        Object.assign(fieldErrors, card.fieldErrors);
      }
      if (Object.keys(fieldErrors).length > 0) {
        return NextResponse.json(
          { ok: false, error: "Please fix the highlighted fields.", fieldErrors },
          { status: 400 },
        );
      }
    }

    const shippingAddress: Address | null = parsed.shipping
      ? {
          name: parsed.shipping.name,
          address1: parsed.shipping.address1,
          address2: parsed.shipping.address2,
          city: parsed.shipping.city,
          state: parsed.shipping.state,
          postal_code: parsed.shipping.postalCode,
          country: priced.country,
        }
      : null;

    // Log the checkout row (→ abandoned list if it never completes, §7.6).
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

    const order = await createOrder({
      priced,
      source: "mock",
      payment_provider: "mock",
      financial_status: "paid",
      email: parsed.email ?? null,
      shipping_address: shippingAddress,
      note: parsed.note ?? null,
      visitor_id: parsed.visitorId ?? null,
      checkout_id: checkoutId,
      auth_user_id: await currentAuthUserId(),
    });

    const params = new URLSearchParams({
      order: order.name,
      method: parsed.method,
      total: String(order.total_cents),
      mock: "1",
    });
    return NextResponse.json({
      ok: true,
      mode: "mock",
      order: { number: order.name, total: order.total_cents },
      redirectUrl: `/checkout/success?${params.toString()}`,
      warnings: [
        "Mock checkout completed locally. No money moved — the order is recorded with a test badge.",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process checkout.",
      },
      { status: 400 },
    );
  }
}
