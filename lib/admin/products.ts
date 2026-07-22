/**
 * ROLE OF THIS FILE
 * Server-side product/variant/inventory read+write helpers behind the admin
 * screens (§9.5, §9.6). All writes flow through here from zod-validated
 * server actions; storefront paths are revalidated after every mutation so
 * owner edits appear immediately (§8).
 */

import "server-only";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/supabase/store.ts";
import type {
  InventoryMovementRow,
  InventoryReason,
  ProductImageRow,
  ProductRow,
  ProductStatus,
  ProductVariantRow,
} from "@/lib/supabase/types.ts";

export type ProductListRow = {
  product: ProductRow;
  thumbnailPath: string | null;
  variantCount: number;
  totalOnHand: number;
  tracked: boolean;
};

export type ProductDetail = {
  product: ProductRow;
  images: ProductImageRow[];
  variants: ProductVariantRow[];
};

export type VariantInventoryRow = {
  variant: ProductVariantRow;
  productTitle: string;
  productId: string;
  committed: number;
  available: number;
  unavailable: number;
};

/** Storefront caches to refresh after any catalog mutation (§8). */
export function revalidateStorefront(): void {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products/[slug]", "page");
  // The discovery layer regenerates with the catalog (§8.1).
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
}

export async function listProducts(): Promise<ProductListRow[]> {
  const store = getStore();
  const [products, variants, images] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("product_images"),
  ]);
  return products
    .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
    .map((product) => {
      const own = variants.filter((variant) => variant.product_id === product.id);
      const thumb = images
        .filter((image) => image.product_id === product.id)
        .sort((a, b) => a.position - b.position)[0];
      return {
        product,
        thumbnailPath: thumb?.path ?? null,
        variantCount: own.length,
        totalOnHand: own.reduce((sum, variant) => sum + variant.inventory_on_hand, 0),
        tracked: own.some((variant) => variant.track_quantity),
      };
    });
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const store = getStore();
  const [products, variants, images] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("product_images"),
  ]);
  const product = products.find((row) => row.id === id);
  if (!product) {
    return null;
  }
  return {
    product,
    images: images
      .filter((image) => image.product_id === id)
      .sort((a, b) => a.position - b.position),
    variants: variants
      .filter((variant) => variant.product_id === id)
      .sort((a, b) => a.position - b.position),
  };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "product"
  );
}

/** A unique product id/handle derived from the title. */
export async function uniqueHandle(title: string, ignoreId?: string): Promise<string> {
  const products = await getStore().all("products");
  const base = slugify(title);
  let candidate = base;
  let counter = 2;
  while (
    products.some(
      (product) =>
        (product.handle === candidate || product.id === candidate) &&
        product.id !== ignoreId,
    )
  ) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export type SaveProductInput = {
  id: string | null; // null = create
  title: string;
  description: string;
  status: ProductStatus;
  vendor: string;
  product_type: string;
  tags: string[];
  handle: string | null; // null = derive from title (create only)
  charge_tax: boolean;
  requires_shipping: boolean;
  country_of_origin: string | null;
  hs_code: string | null;
  seo_title: string | null;
  seo_description: string | null;
  weight_oz: number | null;
  option_names: string[];
  images: Array<{ path: string; alt: string }>;
  variants: Array<{
    id: string | null; // null = new variant
    option_values: string[];
    sku: string;
    barcode: string;
    price_cents: number;
    compare_at_price_cents: number | null;
    cost_cents: number | null;
    track_quantity: boolean;
    inventory_on_hand: number;
    continue_selling_when_oos: boolean;
  }>;
};

/**
 * Create or update a product with its variants and image rows. Variant
 * inventory changes made through the form become "correction" movements so
 * the log stays complete (§7.3: stock is never edited silently).
 */
export async function saveProduct(
  input: SaveProductInput,
  actor: string,
): Promise<string> {
  const store = getStore();
  const now = new Date().toISOString();
  const isCreate = input.id === null;
  const products = await store.all("products");
  const existing = isCreate ? null : (products.find((row) => row.id === input.id) ?? null);
  if (!isCreate && !existing) {
    throw new Error(`Unknown product: ${input.id}`);
  }

  const id = existing?.id ?? (await uniqueHandle(input.title));
  const handle = existing
    ? (input.handle?.trim() || existing.handle)
    : (input.handle?.trim() || id);

  const maxPosition = products.reduce((max, row) => Math.max(max, row.position), 0);

  const row: ProductRow = {
    id,
    handle,
    title: input.title,
    short_name: existing?.short_name ?? input.title.slice(0, 40),
    description: input.description,
    vendor: input.vendor,
    product_type: input.product_type,
    tags: input.tags,
    charge_tax: input.charge_tax,
    requires_shipping: input.requires_shipping,
    country_of_origin: input.country_of_origin,
    hs_code: input.hs_code,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    best_for: existing?.best_for ?? "",
    badge: existing?.badge ?? "",
    details: existing?.details ?? [],
    option_names: input.option_names,
    status: input.status,
    position: existing?.position ?? maxPosition + 1,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  if (existing) {
    await store.update("products", { id }, row);
  } else {
    await store.insert("products", [row]);
  }

  // --- variants: upsert incoming, delete missing ---
  const currentVariants = (await store.all("product_variants")).filter(
    (variant) => variant.product_id === id,
  );
  const keptIds = new Set<string>();
  let position = 0;
  for (const incoming of input.variants) {
    const current = incoming.id
      ? currentVariants.find((variant) => variant.id === incoming.id)
      : undefined;
    const variantId = current?.id ?? randomUUID();
    keptIds.add(variantId);
    const next: ProductVariantRow = {
      id: variantId,
      product_id: id,
      position,
      option_values: incoming.option_values,
      sku: incoming.sku,
      barcode: incoming.barcode,
      price_cents: incoming.price_cents,
      compare_at_price_cents: incoming.compare_at_price_cents,
      cost_cents: incoming.cost_cents,
      track_quantity: incoming.track_quantity,
      // On-hand changes go through adjustInventory below, not a raw write.
      inventory_on_hand: current?.inventory_on_hand ?? 0,
      continue_selling_when_oos: incoming.continue_selling_when_oos,
      weight_oz: input.weight_oz,
    };
    if (current) {
      await store.update("product_variants", { id: variantId }, next);
      if (current.inventory_on_hand !== incoming.inventory_on_hand) {
        await store.adjustInventory({
          variantId,
          delta: incoming.inventory_on_hand - current.inventory_on_hand,
          reason: "correction",
          note: "Edited on product form",
          createdBy: actor,
        });
      }
    } else {
      await store.insert("product_variants", [next]);
      if (incoming.inventory_on_hand !== 0) {
        await store.adjustInventory({
          variantId,
          delta: incoming.inventory_on_hand,
          reason: "received",
          note: "Initial quantity",
          createdBy: actor,
        });
      }
    }
    position += 1;
  }
  for (const variant of currentVariants) {
    if (!keptIds.has(variant.id)) {
      await store.remove("product_variants", { id: variant.id });
    }
  }

  // --- images: replace rows (files themselves live in storage) ---
  await store.remove("product_images", { product_id: id });
  if (input.images.length > 0) {
    await store.insert(
      "product_images",
      input.images.map((image, index) => ({
        id: randomUUID(),
        product_id: id,
        path: image.path,
        alt: image.alt,
        position: index,
      })),
    );
  }

  revalidateStorefront();
  return id;
}

/** Shopify's Duplicate action: full copy (variants + media) as a new draft. */
export async function duplicateProduct(id: string, copySuffix: string): Promise<string> {
  const detail = await getProductDetail(id);
  if (!detail) {
    throw new Error(`Unknown product: ${id}`);
  }
  const store = getStore();
  const now = new Date().toISOString();
  const title = `${copySuffix} ${detail.product.title}`.trim();
  const newId = await uniqueHandle(title);
  const products = await store.all("products");
  const maxPosition = products.reduce((max, row) => Math.max(max, row.position), 0);

  await store.insert("products", [
    {
      ...detail.product,
      id: newId,
      handle: newId,
      title,
      status: "draft",
      position: maxPosition + 1,
      created_at: now,
      updated_at: now,
    },
  ]);
  if (detail.variants.length > 0) {
    await store.insert(
      "product_variants",
      detail.variants.map((variant) => ({
        ...variant,
        id: randomUUID(),
        product_id: newId,
        inventory_on_hand: 0,
      })),
    );
  }
  if (detail.images.length > 0) {
    await store.insert(
      "product_images",
      detail.images.map((image) => ({ ...image, id: randomUUID(), product_id: newId })),
    );
  }
  return newId;
}

export async function setProductStatus(ids: string[], status: ProductStatus): Promise<void> {
  const store = getStore();
  const now = new Date().toISOString();
  for (const id of ids) {
    await store.update("products", { id }, { status, updated_at: now });
  }
  revalidateStorefront();
}

/**
 * Shopify's red-confirm Delete: really deletes. Order history is safe —
 * order lines snapshot name/sku and null their variant FK (§7.1).
 */
export async function deleteProducts(ids: string[]): Promise<void> {
  const store = getStore();
  for (const id of ids) {
    const variants = (await store.all("product_variants")).filter(
      (variant) => variant.product_id === id,
    );
    for (const variant of variants) {
      await store.update(
        "order_lines",
        { variant_id: variant.id },
        { variant_id: null },
      );
      await store.remove("inventory_movements", { variant_id: variant.id });
      await store.remove("product_variants", { id: variant.id });
    }
    await store.remove("product_images", { product_id: id });
    await store.remove("products", { id });
  }
  revalidateStorefront();
}

/**
 * The §7.2 inventory math, derived in one place: Committed = paid-but-
 * unfulfilled order lines; Available = on hand − committed; Unavailable = 0
 * (no holds in V1).
 */
export async function listVariantInventory(): Promise<VariantInventoryRow[]> {
  const store = getStore();
  const [products, variants, orders, orderLines] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("orders"),
    store.all("order_lines"),
  ]);

  const committedByVariant = new Map<string, number>();
  const committedOrders = new Set(
    orders
      .filter(
        (order) =>
          (order.financial_status === "paid" ||
            order.financial_status === "partially_refunded") &&
          order.fulfillment_status === "unfulfilled" &&
          !order.cancelled_at,
      )
      .map((order) => order.id),
  );
  for (const line of orderLines) {
    if (line.variant_id && committedOrders.has(line.order_id)) {
      committedByVariant.set(
        line.variant_id,
        (committedByVariant.get(line.variant_id) ?? 0) + line.quantity,
      );
    }
  }

  const titleById = new Map(products.map((product) => [product.id, product.title]));
  return variants
    .map((variant) => {
      const committed = committedByVariant.get(variant.id) ?? 0;
      return {
        variant,
        productId: variant.product_id,
        productTitle: titleById.get(variant.product_id) ?? variant.product_id,
        committed,
        available: variant.inventory_on_hand - committed,
        unavailable: 0,
      };
    })
    .sort(
      (a, b) =>
        a.productTitle.localeCompare(b.productTitle) || a.variant.position - b.variant.position,
    );
}

export async function adjustVariantInventory(input: {
  variantId: string;
  delta: number;
  reason: InventoryReason;
  note: string | null;
  actor: string;
}): Promise<void> {
  await getStore().adjustInventory({
    variantId: input.variantId,
    delta: input.delta,
    reason: input.reason,
    note: input.note,
    createdBy: input.actor,
  });
  revalidateStorefront();
}

export async function variantMovements(variantId: string): Promise<InventoryMovementRow[]> {
  const movements = await getStore().all("inventory_movements");
  return movements
    .filter((movement) => movement.variant_id === variantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
