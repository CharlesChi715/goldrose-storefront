/**
 * ROLE OF THIS FILE
 * POST /api/reviews — the /account/orders/review form's submit. Server-side
 * insert (service credentials; the anon key has no write policy on
 * product_reviews), zod-validated, always stored as `pending` for
 * content-neutral moderation.
 *
 * Sign-in policy (owner decision 2026-08-06): reviews are registered-only in
 * hosted mode. Local mode has no customer sign-in, so it accepts anonymous
 * rows there — that keeps dev and e2e usable.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createReview } from "@/lib/reviews/db.ts";
import { getCatalogProduct } from "@/lib/supabase/catalog.ts";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { currentAuthUserId } from "@/lib/supabase/server-auth.ts";

const requestSchema = z.object({
  productHandle: z.string().trim().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(2).max(800),
  orderId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Please pick a star rating and write a few words." },
      { status: 400 },
    );
  }

  const userId = await currentAuthUserId();
  if (getSupabaseEnv().hosted && !userId) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to publish a review." },
      { status: 401 },
    );
  }

  const product = await getCatalogProduct(parsed.productHandle);
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "This product is no longer available." },
      { status: 404 },
    );
  }

  try {
    await createReview({
      productId: product.id,
      rating: parsed.rating,
      body: parsed.body,
      orderId: parsed.orderId ?? null,
      userId,
      // OTP sign-in carries no display name; the UI renders the null as
      // "ELDREVE Customer" (option-c decision 2026-08-06).
      authorName: null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && /already reviewed|unique/i.test(error.message)
        ? "This order has already reviewed this product."
        : "Could not save your review — please try again.";
    console.error("[reviews]", error);
    return NextResponse.json({ ok: false, error: message }, { status: 409 });
  }
}
