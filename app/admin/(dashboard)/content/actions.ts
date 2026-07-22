"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for Content → Slots (§9.8): save a slot's text or reset it
 * to the original (§7.9), then revalidate the storefront so the change (or
 * the restored PNG, §11) is what buyers see.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidateStorefront } from "@/lib/admin/products";
import { resetContent, saveContentText } from "@/lib/content";

export async function saveSlotAction(key: string, text: string): Promise<void> {
  await requireAdmin();
  await saveContentText(
    z.string().min(1).max(120).parse(key),
    z.string().max(2000).parse(text),
  );
  revalidateStorefront();
}

export async function resetSlotAction(key: string): Promise<void> {
  await requireAdmin();
  await resetContent(z.string().min(1).max(120).parse(key));
  revalidateStorefront();
}
