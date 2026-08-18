"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for /admin/settings (§9.11). requireAdmin() + zod per
 * settings group; policy texts write site_content (§7.9).
 */

import { z } from "zod";
import { saveAdvisorKey } from "@/lib/advisor/keys";
import { requireAdmin } from "@/lib/admin/auth";
import { saveSetting } from "@/lib/admin/settings";
import { revalidateStorefront } from "@/lib/admin/products";
import { saveContentText } from "@/lib/content";

// The legal-identity fields allow "" on purpose: the registered entity is
// owner data that arrives after launch prep starts, and a half-filled form
// must still save. The storefront hides the notice until they are complete.
const storeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  legal_name: z.string().trim().max(200),
  registration_number: z.string().trim().max(80),
  address_lines: z.array(z.string().trim().max(200)).max(8),
  contact_email: z.string().trim().email().max(254),
  order_number_prefix: z.string().trim().max(10),
});

const zonesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      name: z.string().trim().min(1).max(120),
      countries: z
        .array(z.string().trim().min(1).max(2).or(z.literal("*")))
        .min(1)
        .max(250),
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

// No format check beyond a length floor: the prefix Anthropic uses today is
// not ours to depend on, and a mistyped key already surfaces as the advisor's
// "key refused" message. Validating a shape we do not own would turn their
// rename into our outage.
const advisorKeySchema = z.object({ key: z.string().trim().min(20).max(200) });

/**
 * Why this returns a reason instead of throwing.
 *
 * Next.js redacts anything thrown from a server action in production — the
 * browser gets a digest, not the message — so a thrown zod error reaches the
 * boss as HTTP 500 with no explanation. A mistyped key is an expected outcome,
 * not a server fault, so it comes back as a value the form can translate.
 * Genuine faults (Vault unreachable, RPC failure) still throw and still 500.
 */
export type SaveAdvisorKeyResult =
  { ok: true } | { ok: false; reason: "tooShort" | "notConfigured" };

/**
 * Save (or overwrite) the signed-in admin's own Anthropic API key, so each
 * boss funds their own advisor usage (docs/advisor/BLUEPRINT-agent-advisor.md).
 *
 * The key comes from the form; the user id comes from the session and never
 * from the client — advisor_key_save() would happily write against any uuid
 * it is handed.
 *
 * @param payload - `{ key: string }` as typed in Settings.
 * @returns ok, or the reason the form should explain.
 */
export async function saveAdvisorKeyAction(
  payload: unknown,
): Promise<SaveAdvisorKeyResult> {
  const session = await requireAdmin();
  const parsed = advisorKeySchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, reason: "tooShort" };
  }
  const stored = await saveAdvisorKey(session.userId, parsed.data.key);
  return stored ? { ok: true } : { ok: false, reason: "notConfigured" };
}

export async function saveCheckoutSettingsAction(
  payload: unknown,
): Promise<void> {
  await requireAdmin();
  await saveSetting("checkout", checkoutSchema.parse(payload));
}

export async function saveNotificationsAction(payload: unknown): Promise<void> {
  await requireAdmin();
  await saveSetting("notifications", notificationsSchema.parse(payload));
}

export async function saveLowStockAction(threshold: number): Promise<void> {
  await requireAdmin();
  await saveSetting(
    "low_stock_threshold",
    z.number().int().min(0).max(100000).parse(threshold),
  );
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

export async function savePolicyAction(
  key: string,
  text: string,
): Promise<void> {
  await requireAdmin();
  const parsedKey = z
    .enum(["policy.refund", "policy.privacy", "policy.terms"])
    .parse(key);
  await saveContentText(parsedKey, z.string().max(50_000).parse(text), {
    label: POLICY_LABELS[parsedKey],
    help: "",
  });
}
