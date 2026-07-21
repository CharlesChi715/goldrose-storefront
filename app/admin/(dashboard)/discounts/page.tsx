/**
 * ROLE OF THIS FILE
 * /admin/discounts — the cloned discounts list (§9.10): status badges
 * (Active/Scheduled/Expired, derived from dates + limits) and used counts.
 */

import { listDiscounts } from "@/lib/admin/discounts";
import { DiscountsList, type DiscountListItem } from "./DiscountsList";

export default async function DiscountsPage() {
  const rows = await listDiscounts();
  const items: DiscountListItem[] = rows.map(({ discount, status }) => ({
    id: discount.id,
    code: discount.code,
    type: discount.type,
    appliesToProducts: Boolean(discount.applies_to),
    value: discount.value,
    status,
    usedCount: discount.used_count,
    usageLimit: discount.usage_limit,
  }));
  return <DiscountsList items={items} />;
}
