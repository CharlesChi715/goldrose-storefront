/**
 * ROLE OF THIS FILE
 * /admin/orders/abandoned (§7.6, §9.4): checkouts still open after 1 hour —
 * email if known, items, total, age. Read-only; recovery emails are V2.
 */

import { listAbandonedCheckouts } from "@/lib/admin/drafts";
import { AbandonedList, type AbandonedItem } from "./AbandonedList";

export default async function AbandonedCheckoutsPage() {
  const rows = await listAbandonedCheckouts();
  const items: AbandonedItem[] = rows.map(({ checkout, itemsLabel, ageHours }) => ({
    id: checkout.id,
    createdAt: checkout.created_at,
    email: checkout.email,
    itemsLabel,
    totalCents: checkout.total_cents,
    ageHours,
  }));
  return <AbandonedList items={items} />;
}
