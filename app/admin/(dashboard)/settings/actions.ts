"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for /admin/settings (§9.11). requireAdmin() + zod per
 * settings group; policy texts write site_content (§7.9).
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { saveSetting } from "@/lib/admin/settings";
import { revalidateStorefront } from "@/lib/admin/products";
import { saveContentText } from "@/lib/content";

const storeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  contact_email: z.string().trim().email().max(254),
  order_number_prefix: z.string().trim().max(10),
});

const zonesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      name: z.string().trim().min(1).max(120),
      countries: z.array(z.string().trim().min(1).max(2).or(z.literal("*"))).min(1).max(250),
      rate_cents: z.number().int().min(0).max(100_000_000),
      free_over_cents: z.number().int().min(0).max(100_000_000).nullable(),
      placeholder: z.boolean().optional(),
    }),
  )
  .min(1)
  .max(20);

const taxSchema = z.object({
  rate_percent: z.number().min(0).max(50),
  note: z.string().max(500),
});

const checkoutSchema = z.object({ discount_field_enabled: z.boolean() });

const notificationsSchema = z.object({
  order_confirmation: z.boolean(),
  shipping_confirmation: z.boolean(),
  new_order_alert: z.boolean(),
});

const searchSchema = z.object({
  home_title: z.string().trim().min(1).max(120),
  home_description: z.string().trim().max(320),
  social_image: z.string().trim().max(500),
  allow_ai_crawlers: z.boolean(),
});

export async function saveStoreSettingsAction(payload: unknown): Promise<void> {
  await requireAdmin();
  await saveSetting("store", storeSchema.parse(payload));
  revalidateStorefront();
}

export async function saveShippingZonesAction(payload: unknown): Promise<void> {
  await requireAdmin();
  await saveSetting("shipping_zones", zonesSchema.parse(payload));
}

export async function saveTaxAction(payload: unknown): Promise<void> {
  await requireAdmin();
  await saveSetting("tax", taxSchema.parse(payload));
}

export async function saveCheckoutSettingsAction(payload: unknown): Promise<void> {
  await requireAdmin();
  await saveSetting("checkout", checkoutSchema.parse(payload));
}

export async function saveNotificationsAction(payload: unknown): Promise<void> {
  await requireAdmin();
  await saveSetting("notifications", notificationsSchema.parse(payload));
}

export async function saveLowStockAction(threshold: number): Promise<void> {
  await requireAdmin();
  await saveSetting("low_stock_threshold", z.number().int().min(0).max(100000).parse(threshold));
}

export async function saveSearchEngineAction(payload: unknown): Promise<void> {
  await requireAdmin();
  await saveSetting("search_engine", searchSchema.parse(payload));
  revalidateStorefront(); // home metadata + JSON-LD read these (§8.1)
}

const POLICY_LABELS: Record<string, string> = {
  "policy.refund": "Refund policy",
  "policy.privacy": "Privacy policy",
  "policy.terms": "Terms of service",
};

export async function savePolicyAction(key: string, text: string): Promise<void> {
  await requireAdmin();
  const parsedKey = z.enum(["policy.refund", "policy.privacy", "policy.terms"]).parse(key);
  await saveContentText(parsedKey, z.string().max(50_000).parse(text), {
    label: POLICY_LABELS[parsedKey],
    help: "",
  });
}
