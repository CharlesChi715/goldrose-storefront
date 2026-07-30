/**
 * ROLE OF THIS FILE
 * /admin/discounts/[id] — edit an existing discount (§9.10).
 */

import { notFound } from "next/navigation";
import { getDiscount } from "@/lib/admin/discounts";
import { listProducts } from "@/lib/admin/products";
import { DiscountForm, type DiscountFormInitial } from "../DiscountForm";

function toLocalDatetime(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [discount, products] = await Promise.all([
    getDiscount(id),
    listProducts(),
  ]);
  if (!discount) {
    notFound();
  }

  const initial: DiscountFormInitial = {
    id: discount.id,
    code: discount.code,
    category:
      discount.type === "free_shipping"
        ? "shipping"
        : discount.applies_to
          ? "products"
          : "order",
    valueType: discount.type === "fixed_amount" ? "fixed_amount" : "percentage",
    value:
      discount.type === "fixed_amount"
        ? (discount.value / 100).toFixed(2)
        : String(discount.value),
    productIds: discount.applies_to?.product_ids ?? [],
    minPurchase:
      discount.min_purchase_cents !== null
        ? (discount.min_purchase_cents / 100).toFixed(2)
        : "",
    usageLimit:
      discount.usage_limit !== null ? String(discount.usage_limit) : "",
    oncePerCustomer: discount.once_per_customer,
    startsAt: toLocalDatetime(discount.starts_at),
    endsAt: toLocalDatetime(discount.ends_at),
  };

  return (
    <DiscountForm
      initial={initial}
      products={products.map((row) => ({
        id: row.product.id,
        title: row.product.title,
      }))}
    />
  );
}
