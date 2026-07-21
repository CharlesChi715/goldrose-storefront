"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for customer profiles (§9.7): timeline comments, notes,
 * tags. requireAdmin() + zod everywhere.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  addCustomerComment,
  saveCustomerNote,
  saveCustomerTags,
} from "@/lib/admin/orders";

const id = z.string().min(1).max(64);

export async function addCustomerCommentAction(customerId: string, message: string): Promise<void> {
  const session = await requireAdmin();
  await addCustomerComment(
    id.parse(customerId),
    z.string().trim().min(1).max(2000).parse(message),
    session.email,
  );
}

export async function saveCustomerNoteAction(customerId: string, note: string): Promise<void> {
  await requireAdmin();
  await saveCustomerNote(id.parse(customerId), z.string().max(2000).parse(note));
}

export async function saveCustomerTagsAction(customerId: string, tags: string[]): Promise<void> {
  await requireAdmin();
  await saveCustomerTags(
    id.parse(customerId),
    z.array(z.string().trim().min(1).max(120)).max(50).parse(tags),
  );
}
