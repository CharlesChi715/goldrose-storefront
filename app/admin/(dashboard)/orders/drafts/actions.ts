"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for draft orders (§9.4): create a draft, mark it as paid.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createDraftOrder, markDraftPaid } from "@/lib/admin/drafts";

const createSchema = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1).max(120),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(50),
  email: z.string().trim().email().max(254).nullable(),
  note: z.string().trim().max(2000).nullable(),
  discountCode: z.string().trim().max(64).nullable(),
});

export type DraftResult =
  { ok: true; id: string } | { ok: false; error: string };

export async function createDraftAction(
  payload: unknown,
): Promise<DraftResult> {
  const session = await requireAdmin();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  try {
    const order = await createDraftOrder({
      ...parsed.data,
      actor: session.email,
    });
    return { ok: true, id: order.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function markDraftPaidAction(id: string): Promise<DraftResult> {
  const session = await requireAdmin();
  try {
    await markDraftPaid(z.string().min(1).parse(id), session.email);
    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Action failed",
    };
  }
}
