/**
 * ROLE OF THIS FILE
 * Server-side discount management for /admin/discounts (§9.10): list with
 * Shopify-style derived status badges, create/edit, delete. Validation math
 * lives in lib/checkout/discounts.ts (shared with checkout).
 */

import { randomUUID } from "crypto";
import { discountStatus } from "@/lib/checkout/discounts";
import { getStore } from "@/lib/supabase/store.ts";
import type { DiscountRow, DiscountType } from "@/lib/supabase/types.ts";

export type DiscountListRow = {
  discount: DiscountRow;
  status: "active" | "scheduled" | "expired";
};

/** All discounts, newest first, each with its derived status badge (active / scheduled / expired). */
export async function listDiscounts(): Promise<DiscountListRow[]> {
  const discounts = await getStore().all("discounts");
  return discounts
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((discount) => ({ discount, status: discountStatus(discount) }));
}

/**
 * One discount by id, or null when it doesn't exist.
 *
 * @param id - Discount row id.
 */
export async function getDiscount(id: string): Promise<DiscountRow | null> {
  return (await getStore().all("discounts")).find((row) => row.id === id) ?? null;
}

export type SaveDiscountInput = {
  id: string | null;
  code: string;
  type: DiscountType;
  value: number;
  appliesToProductIds: string[] | null; // null = entire order
  minPurchaseCents: number | null;
  usageLimit: number | null;
  oncePerCustomer: boolean;
  startsAt: string;
  endsAt: string | null;
};

/**
 * Creates or updates a discount (input.id null = create). Throws when the
 * code is already used by another discount (case-insensitive); edits keep
 * the existing used_count and created_at.
 *
 * @param input - Form values; id decides create vs update.
 * @returns The saved discount's id.
 */
export async function saveDiscount(input: SaveDiscountInput): Promise<string> {
  const store = getStore();
  const discounts = await store.all("discounts");
  const clash = discounts.find(
    (row) =>
      row.code.toLowerCase() === input.code.toLowerCase() && row.id !== input.id,
  );
  if (clash) {
    throw new Error(`The code "${input.code}" is already in use.`);
  }

  const existing = input.id ? discounts.find((row) => row.id === input.id) : null;
  const row: DiscountRow = {
    id: existing?.id ?? randomUUID(),
    code: input.code,
    type: input.type,
    value: input.value,
    applies_to: input.appliesToProductIds ? { product_ids: input.appliesToProductIds } : null,
    min_purchase_cents: input.minPurchaseCents,
    usage_limit: input.usageLimit,
    once_per_customer: input.oncePerCustomer,
    used_count: existing?.used_count ?? 0,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };
  if (existing) {
    await store.update("discounts", { id: row.id }, row);
  } else {
    await store.insert("discounts", [row]);
  }
  return row.id;
}

/**
 * Deletes the given discount rows.
 *
 * @param ids - Discount ids to remove.
 */
export async function deleteDiscounts(ids: string[]): Promise<void> {
  for (const id of ids) {
    await getStore().remove("discounts", { id });
  }
}
