"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for the Orders section (§9.4): fulfill, refund, cancel,
 * archive, timeline comments, notes, tags. requireAdmin() + zod at every
 * entry point.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  addOrderComment,
  cancelOrder,
  fulfillOrder,
  refundOrder,
  saveOrderNote,
  saveOrderTags,
  setOrdersArchived,
} from "@/lib/admin/orders";

export type ActionResult = { ok: true } | { ok: false; error: string };

function failed(error: unknown): ActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Action failed",
  };
}

const id = z.string().min(1).max(64);

export async function fulfillOrderAction(payload: {
  id: string;
  carrier: "ups" | "usps" | null;
  trackingNumber: string;
  trackingUrl: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await fulfillOrder({
      id: id.parse(payload.id),
      carrier: z.enum(["ups", "usps"]).nullable().parse(payload.carrier),
      trackingNumber: z.string().trim().max(120).parse(payload.trackingNumber),
      trackingUrl: z.string().trim().max(500).parse(payload.trackingUrl),
      actor: session.email,
    });
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}

export async function refundOrderAction(payload: {
  id: string;
  amountCents: number;
  restock: boolean;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await refundOrder({
      id: id.parse(payload.id),
      amountCents: z
        .number()
        .int()
        .min(1)
        .max(100_000_000)
        .parse(payload.amountCents),
      restock: z.boolean().parse(payload.restock),
      actor: session.email,
    });
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}

export async function cancelOrderAction(payload: {
  id: string;
  reason: string;
  refund: boolean;
  restock: boolean;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await cancelOrder({
      id: id.parse(payload.id),
      reason: z.string().trim().max(255).parse(payload.reason),
      refund: z.boolean().parse(payload.refund),
      restock: z.boolean().parse(payload.restock),
      actor: session.email,
    });
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}

export async function archiveOrdersAction(
  ids: string[],
  archived: boolean,
): Promise<void> {
  await requireAdmin();
  await setOrdersArchived(z.array(id).min(1).max(200).parse(ids), archived);
}

export async function addOrderCommentAction(
  orderId: string,
  message: string,
): Promise<void> {
  const session = await requireAdmin();
  const text = z.string().trim().min(1).max(2000).parse(message);
  await addOrderComment(id.parse(orderId), text, session.email);
}

export async function saveOrderNoteAction(
  orderId: string,
  note: string,
): Promise<void> {
  await requireAdmin();
  await saveOrderNote(id.parse(orderId), z.string().max(2000).parse(note));
}

export async function saveOrderTagsAction(
  orderId: string,
  tags: string[],
): Promise<void> {
  await requireAdmin();
  await saveOrderTags(
    id.parse(orderId),
    z.array(z.string().trim().min(1).max(120)).max(50).parse(tags),
  );
}
