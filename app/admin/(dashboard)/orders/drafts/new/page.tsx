/**
 * ROLE OF THIS FILE
 * /admin/orders/drafts/new (§9.4): pick variants, quantity, customer email,
 * discount code and note, then save the draft.
 */

import { getStore } from "@/lib/supabase/store.ts";
import { DraftForm, type DraftVariantOption } from "./DraftForm";

export default async function NewDraftPage() {
  const store = getStore();
  const [products, variants] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
  ]);
  const options: DraftVariantOption[] = variants
    .map((variant) => {
      const product = products.find((row) => row.id === variant.product_id);
      return {
        variantId: variant.id,
        label: `${product?.title ?? variant.product_id}${
          variant.option_values.length ? ` — ${variant.option_values.join(" / ")}` : ""
        } ($${(variant.price_cents / 100).toFixed(2)})`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  return <DraftForm variants={options} />;
}
