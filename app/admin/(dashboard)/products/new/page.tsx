/**
 * ROLE OF THIS FILE
 * /admin/products/new — a blank Shopify-style product form (§9.5).
 */

import { ProductForm, type ProductFormInitial } from "../ProductForm";

const EMPTY: ProductFormInitial = {
  id: null,
  title: "",
  shortName: "",
  description: "",
  status: "draft",
  vendor: "",
  productType: "",
  tags: [],
  bestFor: "",
  badge: "",
  details: [],
  position: "",
  handle: "",
  chargeTax: true,
  requiresShipping: true,
  origin: "",
  hs: "",
  seoTitle: "",
  seoDescription: "",
  weightOz: "",
  optionNames: [],
  images: [],
  variants: [],
};

export default function NewProductPage() {
  return <ProductForm initial={EMPTY} />;
}
