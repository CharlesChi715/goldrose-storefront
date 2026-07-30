"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for /admin/discounts (§9.10). requireAdmin() + zod.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteDiscounts, saveDiscount } from "@/lib/admin/discounts";

const saveSchema = z.object({
  id: z.string().min(1).nullable(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Codes can use letters, numbers, - and _"),
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.number().int().min(0).max(100_000_000),
  appliesToProductIds: z.array(z.string().min(1)).max(200).nullable(),
  minPurchaseCents: z.number().int().min(0).max(100_000_000).nullable(),
  usageLimit: z.number().int().min(1).max(1_000_000).nullable(),
  oncePerCustomer: z.boolean(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1).nullable(),
});

export type SaveDiscountResult =
  { ok: true; id: string } | { ok: false; error: string };

export async function saveDiscountAction(
  payload: unknown,
): Promise<SaveDiscountResult> {
  await requireAdmin();
  const parsed = saveSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  try {
    const id = await saveDiscount(parsed.data);
    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function deleteDiscountsAction(ids: string[]): Promise<void> {
  await requireAdmin();
  await deleteDiscounts(z.array(z.string().min(1)).min(1).max(200).parse(ids));
}
