/**
 * ROLE OF THIS FILE
 * /admin/discounts/new — blank discount form (§9.10).
 */

import { listProducts } from "@/lib/admin/products";
import { DiscountForm, type DiscountFormInitial } from "../DiscountForm";

function localDatetimeNow(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default async function NewDiscountPage() {
  const products = await listProducts();
  const initial: DiscountFormInitial = {
    id: null,
    code: "",
    category: "order",
    valueType: "percentage",
    value: "10",
    productIds: [],
    minPurchase: "",
    usageLimit: "",
    oncePerCustomer: false,
    startsAt: localDatetimeNow(),
    endsAt: "",
  };
  return (
    <DiscountForm
      initial={initial}
      products={products.map((row) => ({ id: row.product.id, title: row.product.title }))}
    />
  );
}
