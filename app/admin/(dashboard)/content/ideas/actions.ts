"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for Content → Ideas: delete a handled idea.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getStore } from "@/lib/supabase/store.ts";

export async function deleteIdeaAction(id: string): Promise<void> {
  await requireAdmin();
  await getStore().remove("feedback", { id: z.string().min(1).max(64).parse(id) });
}
