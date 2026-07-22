/**
 * ROLE OF THIS FILE
 * /admin/content/ideas — visitor ideas/feedback submitted from the
 * storefront's concierge panel (owner request 2026-07-23).
 */

import { getStore } from "@/lib/supabase/store.ts";
import { IdeasList, type IdeaItem } from "./IdeasList";

export default async function IdeasPage() {
  const rows = await getStore().all("feedback");
  const items: IdeaItem[] = rows
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      path: row.path,
      createdAt: row.created_at,
    }));
  return <IdeasList items={items} />;
}
