"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for the Products section (§9.5, §9.6). Every action starts
 * with requireAdmin() and validates its payload with zod — the trust
 * boundary between the admin browser and the data layer.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { fileUrl, uploadFile } from "@/lib/admin/files";
import {
  adjustVariantInventory,
  deleteProducts,
  duplicateProduct,
  saveProduct,
  setProductStatus,
  variantMovements,
} from "@/lib/admin/products";
import { INVENTORY_REASONS } from "@/lib/supabase/types.ts";

const money = z.number().int().min(0).max(100_000_000);

const variantSchema = z.object({
  id: z.string().nullable(),
  option_values: z.array(z.string().trim().min(1).max(120)).max(3),
  sku: z.string().trim().max(120),
  barcode: z.string().trim().max(120),
  price_cents: money,
  compare_at_price_cents: money.nullable(),
  cost_cents: money.nullable(),
  track_quantity: z.boolean(),
  inventory_on_hand: z.number().int().min(-1_000_000).max(1_000_000),
  continue_selling_when_oos: z.boolean(),
});

const saveProductSchema = z.object({
  id: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1).max(255),
  short_name: z.string().trim().max(120),
  description: z.string().max(10_000),
  status: z.enum(["active", "draft", "archived"]),
  vendor: z.string().trim().max(255),
  product_type: z.string().trim().max(255),
  tags: z.array(z.string().trim().min(1).max(120)).max(50),
  best_for: z.string().trim().max(255),
  badge: z.string().trim().max(60),
  details: z.array(z.string().trim().min(1).max(255)).max(20),
  position: z.number().int().min(0).max(100_000).nullable(),
  handle: z
    .string()
    .trim()
    // Empty = derive from the title; otherwise the canonical handle format
    // (docs/ixd/naming/product-handles.md §3).
    .regex(
      /^$|^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Handle must be lowercase words separated by single hyphens",
    )
    .max(120)
    .nullable(),
  charge_tax: z.boolean(),
  requires_shipping: z.boolean(),
  country_of_origin: z.string().trim().max(2).nullable(),
  hs_code: z.string().trim().max(20).nullable(),
  seo_title: z.string().trim().max(255).nullable(),
  seo_description: z.string().trim().max(500).nullable(),
  weight_oz: z.number().min(0).max(10_000).nullable(),
  option_names: z.array(z.string().trim().min(1).max(120)).max(3),
  images: z
    .array(
      z.object({
        path: z.string().min(1).max(500),
        alt: z.string().max(500),
        // Framing chosen in the admin's PDP-sized frame; absent on any form
        // saved before 0008, which means the centre crop.
        focal_x: z.number().int().min(0).max(100).optional(),
        focal_y: z.number().int().min(0).max(100).optional(),
      }),
    )
    .max(20),
  variants: z.array(variantSchema).min(1).max(100),
});

export type SaveProductResult =
  { ok: true; id: string } | { ok: false; error: string };

export async function saveProductAction(
  payload: unknown,
): Promise<SaveProductResult> {
  const session = await requireAdmin();
  const parsed = saveProductSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  try {
    const id = await saveProduct(parsed.data, session.email);
    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function duplicateProductAction(
  id: string,
  copySuffix: string,
): Promise<SaveProductResult> {
  await requireAdmin();
  try {
    const newId = await duplicateProduct(
      z.string().min(1).parse(id),
      z.string().max(30).parse(copySuffix),
    );
    return { ok: true, id: newId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Duplicate failed",
    };
  }
}

const idsSchema = z.array(z.string().min(1)).min(1).max(200);

export async function setProductStatusAction(
  ids: string[],
  status: "active" | "draft" | "archived",
): Promise<void> {
  await requireAdmin();
  await setProductStatus(idsSchema.parse(ids), status);
}

export async function deleteProductsAction(ids: string[]): Promise<void> {
  await requireAdmin();
  await deleteProducts(idsSchema.parse(ids));
}

export type UploadedImage = { path: string; url: string; name: string };

/** Multi-image upload (§9.5 Media). Files land in storage immediately; the
 * product form associates them on save. */
export async function uploadImagesAction(formData: FormData): Promise<{
  ok: boolean;
  images: UploadedImage[];
  error?: string;
}> {
  await requireAdmin();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    return { ok: false, images: [], error: "No files" };
  }
  try {
    const stored = await Promise.all(files.map((file) => uploadFile(file)));
    return {
      ok: true,
      images: stored.map((file) => ({
        path: file.path,
        url: fileUrl(file.path),
        name: file.name,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      images: [],
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

const adjustSchema = z.object({
  variantId: z.string().min(1),
  delta: z.number().int().min(-1_000_000).max(1_000_000),
  reason: z.enum(INVENTORY_REASONS),
  note: z.string().trim().max(500).nullable(),
});

export async function adjustInventoryAction(
  payload: unknown,
): Promise<{ ok: boolean }> {
  const session = await requireAdmin();
  const parsed = adjustSchema.parse(payload);
  if (parsed.delta !== 0) {
    await adjustVariantInventory({ ...parsed, actor: session.email });
  }
  return { ok: true };
}

export type MovementView = {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

/** Adjustment history for the §9.6 "View adjustment history" modal. */
export async function movementsAction(
  variantId: string,
): Promise<MovementView[]> {
  await requireAdmin();
  return variantMovements(z.string().min(1).parse(variantId));
}
