/**
 * ROLE OF THIS FILE
 * /admin/products/[id] — the Shopify-style edit form (§9.5), loaded from
 * the data layer and mapped into the client form's shape (cents → dollars).
 */

import { notFound } from "next/navigation";
import { fileUrl } from "@/lib/admin/files";
import { getProductDetail } from "@/lib/admin/products";
import { ProductForm, type ProductFormInitial } from "../ProductForm";

function centsToDollars(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProductDetail(id);
  if (!detail) {
    notFound();
  }

  const initial: ProductFormInitial = {
    id: detail.product.id,
    title: detail.product.title,
    shortName: detail.product.short_name,
    description: detail.product.description,
    status: detail.product.status,
    vendor: detail.product.vendor,
    productType: detail.product.product_type,
    tags: detail.product.tags,
    bestFor: detail.product.best_for,
    badge: detail.product.badge,
    details: detail.product.details,
    position: String(detail.product.position),
    handle: detail.product.handle,
    chargeTax: detail.product.charge_tax,
    requiresShipping: detail.product.requires_shipping,
    origin: detail.product.country_of_origin ?? "",
    hs: detail.product.hs_code ?? "",
    seoTitle: detail.product.seo_title ?? "",
    seoDescription: detail.product.seo_description ?? "",
    weightOz:
      detail.variants[0]?.weight_oz != null
        ? String(detail.variants[0].weight_oz)
        : "",
    optionNames: detail.product.option_names,
    images: detail.images.map((image) => ({
      path: image.path,
      url: fileUrl(image.path),
      alt: image.alt,
    })),
    variants: detail.variants.map((variant) => ({
      id: variant.id,
      option_values: variant.option_values,
      sku: variant.sku,
      barcode: variant.barcode,
      price: centsToDollars(variant.price_cents),
      compareAt: centsToDollars(variant.compare_at_price_cents),
      cost: centsToDollars(variant.cost_cents),
      trackQty: variant.track_quantity,
      quantity: String(variant.inventory_on_hand),
      continueSelling: variant.continue_selling_when_oos,
    })),
  };

  return <ProductForm initial={initial} />;
}
