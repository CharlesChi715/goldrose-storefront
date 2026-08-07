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
import { clampAxis, clampZoom } from "@/lib/images/spotlight.ts";
import {
  HANDLE_MAX_LENGTH,
  HANDLE_PATTERN,
  productHandle,
} from "@/lib/admin/product-handle.ts";
import type {
  InventoryMovementRow,
  InventoryReason,
  ProductImageRow,
  ProductRow,
  ProductStatus,
  ProductVariantRow,
} from "@/lib/supabase/types.ts";

/**
 * A card-area axis the database will accept, preserving "never framed".
 * The card columns are nullable because null is meaningful — the storefront
 * reads it as "inherit the spotlight point" — so unlike the spotlight's own
 * axes a missing value must stay missing rather than becoming 50.
 */
function clampCardAxis(value: number | null | undefined): number | null {
  return value == null ? null : clampAxis(value);
}

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

/**
 * All products for the list screen, in storefront position order, each with
 * its first image path, variant count, summed on-hand stock, and whether
 * any variant tracks quantity.
 */
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
      const own = variants.filter(
        (variant) => variant.product_id === product.id,
      );
      const thumb = images
        .filter((image) => image.product_id === product.id)
        .sort((a, b) => a.position - b.position)[0];
      return {
        product,
        thumbnailPath: thumb?.path ?? null,
        variantCount: own.length,
        totalOnHand: own.reduce(
          (sum, variant) => sum + variant.inventory_on_hand,
          0,
        ),
        tracked: own.some((variant) => variant.track_quantity),
      };
    });
}

/**
 * One product with its images and variants, both in position order.
 *
 * @param id - Product id; unknown ids return null.
 */
export async function getProductDetail(
  id: string,
): Promise<ProductDetail | null> {
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

/**
 * Throws when another product already uses `handle` as its handle or id.
 * The handle rule (docs/ixd/naming/product-handles.md §3) forbids
 * auto-disambiguation (`-2`): a collision means the title must be revised
 * or a deliberate manual handle set.
 *
 * @param products - All product rows to check against.
 * @param handle - Candidate handle (also used as the id on create).
 * @param ignoreId - Product whose own handle/id shouldn't count as a clash (editing).
 */
function assertHandleAvailable(
  products: ProductRow[],
  handle: string,
  ignoreId?: string,
): void {
  const clash = products.some(
    (product) =>
      (product.handle === handle || product.id === handle) &&
      product.id !== ignoreId,
  );
  if (clash) {
    throw new Error(
      `Handle "${handle}" is already used by another product — revise the title or set a manual handle.`,
    );
  }
}

export type SaveProductInput = {
  id: string | null; // null = create
  title: string;
  short_name: string;
  description: string;
  status: ProductStatus;
  vendor: string;
  product_type: string;
  tags: string[];
  best_for: string;
  badge: string;
  details: string[];
  position: number | null; // null = append (create) or keep (update)
  handle: string | null; // null = derive from title (create only)
  charge_tax: boolean;
  requires_shipping: boolean;
  country_of_origin: string | null;
  hs_code: string | null;
  seo_title: string | null;
  seo_description: string | null;
  weight_oz: number | null;
  option_names: string[];
  /**
   * Order is the contract (position comes from the index). The rest is the
   * admin's framing choice: `focal_*` is the spotlight the PDP viewer shows
   * and `card_*` the shop card's own area, both in CSS object-position
   * percentages plus a zoom over the cover-fit scale (migration 0009).
   * Omitting the spotlight means the centre crop every box did before 0008;
   * omitting the card area means it follows the spotlight point, as the card
   * did before 0009.
   */
  images: Array<{
    path: string;
    alt: string;
    focal_x?: number;
    focal_y?: number;
    focal_zoom?: number;
    card_focal_x?: number | null;
    card_focal_y?: number | null;
    card_zoom?: number | null;
    framed?: boolean;
  }>;
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
 * the log stays complete (§7.3: stock is never edited silently). Variants
 * missing from the input are deleted; image rows are fully replaced; the
 * storefront is revalidated afterwards.
 *
 * @param input - Full form payload; id null = create.
 * @param actor - Admin name recorded on inventory movements.
 * @returns The saved product's id (= the handle derived from the title on
 *   create, docs/ixd/naming/product-handles.md). Throws when a non-blank SKU
 *   is already taken (SKU rules, Database.md), when a handle cannot be
 *   derived or collides, or when a non-draft product's handle would change.
 */
export async function saveProduct(
  input: SaveProductInput,
  actor: string,
): Promise<string> {
  const store = getStore();
  const now = new Date().toISOString();
  const isCreate = input.id === null;
  const products = await store.all("products");
  const existing = isCreate
    ? null
    : (products.find((row) => row.id === input.id) ?? null);
  if (!isCreate && !existing) {
    throw new Error(`Unknown product: ${input.id}`);
  }

  // Handle rule (docs/ixd/naming/product-handles.md): derived once from the
  // title at creation, manual handles must pass the same validation, and a
  // non-draft product's handle is frozen until product_redirects exists (§5).
  const manualHandle = input.handle?.trim() || null;
  if (
    manualHandle &&
    (manualHandle.length > HANDLE_MAX_LENGTH ||
      !HANDLE_PATTERN.test(manualHandle))
  ) {
    throw new Error(
      `Handle "${manualHandle}" is invalid — lowercase words separated by single hyphens.`,
    );
  }
  const handle = existing
    ? (manualHandle ?? existing.handle)
    : (manualHandle ?? productHandle(input.title));
  if (existing && handle !== existing.handle) {
    if (existing.status !== "draft") {
      throw new Error(
        `Handle "${existing.handle}" is frozen: the product is ${existing.status} and product_redirects does not exist yet.`,
      );
    }
    assertHandleAvailable(products, handle, existing.id);
  }
  if (!existing) {
    assertHandleAvailable(products, handle);
  }

  const id = existing?.id ?? handle;

  // SKU rules (docs/Database.md): non-blank SKUs are unique storewide. The
  // 0003 partial index enforces this on Postgres; this check covers the
  // local file adapter and turns the violation into a readable error.
  const incomingSkus = input.variants
    .map((variant) => variant.sku)
    .filter((sku) => sku !== "");
  const duplicateSku = incomingSkus.find(
    (sku, index) => incomingSkus.indexOf(sku) !== index,
  );
  if (duplicateSku) {
    throw new Error(`SKU "${duplicateSku}" is used twice on this product.`);
  }
  if (incomingSkus.length > 0) {
    const taken = (await store.all("product_variants")).find(
      (variant) =>
        variant.product_id !== id && incomingSkus.includes(variant.sku),
    );
    if (taken) {
      throw new Error(`SKU "${taken.sku}" is already used by another product.`);
    }
  }
  const maxPosition = products.reduce(
    (max, row) => Math.max(max, row.position),
    0,
  );

  const row: ProductRow = {
    id,
    handle,
    title: input.title,
    // Blank short_name still falls back to a trimmed title so shop cards and
    // the PDP never render an empty name (they read short_name first).
    short_name: input.short_name.trim() || input.title.slice(0, 40),
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
    best_for: input.best_for,
    badge: input.badge,
    details: input.details,
    option_names: input.option_names,
    status: input.status,
    position: input.position ?? existing?.position ?? maxPosition + 1,
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
        focal_x: clampAxis(image.focal_x),
        focal_y: clampAxis(image.focal_y),
        focal_zoom: clampZoom(image.focal_zoom),
        card_focal_x: clampCardAxis(image.card_focal_x),
        card_focal_y: clampCardAxis(image.card_focal_y),
        card_zoom: image.card_zoom == null ? null : clampZoom(image.card_zoom),
        framed: image.framed === true,
      })),
    );
  }

  revalidateStorefront();
  return id;
}

/**
 * Shopify's Duplicate action: full copy (variants + media) as a new draft
 * with zeroed inventory and cleared SKUs (non-blank SKUs are unique
 * storewide — SKU rules, Database.md). Throws on an unknown product, or when
 * the copy's title derives a handle that is taken or underivable (handle
 * rule: no -2 suffixes).
 *
 * @param id - Product to copy.
 * @param copySuffix - Localized "Copy of" text put before the new title.
 * @returns The new product's id.
 */
export async function duplicateProduct(
  id: string,
  copySuffix: string,
): Promise<string> {
  const detail = await getProductDetail(id);
  if (!detail) {
    throw new Error(`Unknown product: ${id}`);
  }
  const store = getStore();
  const now = new Date().toISOString();
  const title = `${copySuffix} ${detail.product.title}`.trim();
  const products = await store.all("products");
  // Handle rule: derive from the copy's title, never auto-disambiguate. When
  // the localized prefix adds no a-z0-9 characters (e.g. 副本), the copy's
  // handle collides with the original's and this throws — rename the copy's
  // title (or the original's) and duplicate again.
  const newId = productHandle(title);
  assertHandleAvailable(products, newId);
  const maxPosition = products.reduce(
    (max, row) => Math.max(max, row.position),
    0,
  );

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
      detail.images.map((image) => ({
        ...image,
        id: randomUUID(),
        product_id: newId,
      })),
    );
  }
  return newId;
}

/**
 * Bulk status change (active / draft / archived); revalidates the storefront.
 *
 * @param ids - Product ids to update.
 * @param status - New status for all of them.
 */
export async function setProductStatus(
  ids: string[],
  status: ProductStatus,
): Promise<void> {
  const store = getStore();
  const now = new Date().toISOString();
  for (const id of ids) {
    await store.update("products", { id }, { status, updated_at: now });
  }
  revalidateStorefront();
}

/**
 * Shopify's red-confirm Delete: really deletes. Order history is safe —
 * order lines snapshot name/sku and null their variant FK (§7.1). Variants,
 * inventory movements, and image rows go too; the storefront is revalidated.
 *
 * @param ids - Product ids to delete.
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

  const titleById = new Map(
    products.map((product) => [product.id, product.title]),
  );
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
        a.productTitle.localeCompare(b.productTitle) ||
        a.variant.position - b.variant.position,
    );
}

/**
 * Manual stock adjustment from the Inventory screen: writes an inventory
 * movement through the store and revalidates the storefront.
 *
 * @param input - Variant id, signed delta, reason, optional note, and the acting admin.
 */
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

/**
 * A variant's inventory movement history, newest first.
 *
 * @param variantId - Variant to look up.
 */
export async function variantMovements(
  variantId: string,
): Promise<InventoryMovementRow[]> {
  const movements = await getStore().all("inventory_movements");
  return movements
    .filter((movement) => movement.variant_id === variantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
