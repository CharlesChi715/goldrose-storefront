/**
 * ROLE OF THIS FILE
 * Site-content slots (§7.9): read/write the owner-editable copy that slots
 * into the fixed pixel design (promo slogan, policies …). Each slot keeps
 * its default_value for one-click "Reset to original" and the §11
 * pixel-perfection rule (default → serve the original PNG crop).
 */

import { getStore } from "@/lib/supabase/store.ts";
import type { SiteContentRow } from "@/lib/supabase/types.ts";

export type ContentSlot = {
  key: string;
  text: string;
  defaultText: string;
  isDefault: boolean;
  label: string;
  help: string;
};

function textOf(value: unknown): string {
  return typeof (value as { text?: unknown })?.text === "string"
    ? ((value as { text: string }).text ?? "")
    : "";
}

/**
 * Shape a raw site_content row into a ContentSlot, deriving isDefault by
 * comparing the current text against default_value's text.
 *
 * @param row - The site_content row to convert.
 * @returns The slot with text, defaultText, isDefault, label, and help.
 */
function toSlot(row: SiteContentRow): ContentSlot {
  const text = textOf(row.value);
  const defaultText = textOf(row.default_value);
  return {
    key: row.key,
    text,
    defaultText,
    isDefault: text === defaultText,
    label: row.label,
    help: row.help,
  };
}

/**
 * Load every site_content row and return the slots sorted by key.
 *
 * @returns All content slots, ordered alphabetically by key.
 */
export async function listContentSlots(): Promise<ContentSlot[]> {
  const rows = await getStore().all("site_content");
  return rows.sort((a, b) => a.key.localeCompare(b.key)).map(toSlot);
}

/**
 * Look up a single content slot by its key.
 *
 * @param key - The slot key, e.g. "promo.slogan".
 * @returns The slot, or null when no row has that key.
 */
export async function getContentSlot(key: string): Promise<ContentSlot | null> {
  const rows = await getStore().all("site_content");
  const row = rows.find((entry) => entry.key === key);
  return row ? toSlot(row) : null;
}

/**
 * Save a slot's text to the store (DB write); creates policy-style slots on
 * first save when no row exists yet.
 *
 * @param key - The slot key to write.
 * @param text - The new owner-edited text.
 * @param fallback - Label and help used only when the row is created fresh.
 */
export async function saveContentText(
  key: string,
  text: string,
  fallback?: { label: string; help: string },
): Promise<void> {
  const store = getStore();
  const rows = await store.all("site_content");
  const now = new Date().toISOString();
  const existing = rows.find((entry) => entry.key === key);
  if (existing) {
    await store.update(
      "site_content",
      { key },
      { value: { text }, updated_at: now },
    );
    return;
  }
  await store.insert("site_content", [
    {
      key,
      value: { text },
      default_value: { text: "" },
      label: fallback?.label ?? key,
      help: fallback?.help ?? "",
      updated_at: now,
    },
  ]);
}

/**
 * One-click "Reset to original" (§7.9): overwrite the slot's value with its
 * stored default_value (DB write). No-op when the key doesn't exist.
 *
 * @param key - The slot key to reset.
 */
export async function resetContent(key: string): Promise<void> {
  const store = getStore();
  const rows = await store.all("site_content");
  const existing = rows.find((entry) => entry.key === key);
  if (existing) {
    await store.update(
      "site_content",
      { key },
      { value: existing.default_value, updated_at: new Date().toISOString() },
    );
  }
}

/**
 * Read the promo-bar slogan slot driving the §11 PNG-vs-text rule. Never
 * throws — a missing slot or store error falls back to { text: "",
 * isDefault: true }, which serves the original PNG crop.
 *
 * @returns The slogan text and whether it still equals the default.
 */
export async function getPromoSlogan(): Promise<{
  text: string;
  isDefault: boolean;
}> {
  try {
    const slot = await getContentSlot("promo.slogan");
    if (!slot) {
      return { text: "", isDefault: true };
    }
    return { text: slot.text, isDefault: slot.isDefault };
  } catch {
    return { text: "", isDefault: true };
  }
}
