/**
 * ROLE OF THIS FILE
 * Server-side cart pricing (§8 "checkout re-pricing"): every checkout —
 * mock, PayPal create, capture verification — re-prices the cart FROM THE
 * DATABASE by variant id. The browser never supplies a price, so tampered
 * client data can't change what a customer is charged. Shipping comes from
 * the zone matching the ship-to country (§10.3); tax from settings (0 while
 * testing).
 */

import { getStore } from "../supabase/store.ts";
import { COUNTRIES } from "./countries.ts";
import { applyDiscountCode } from "./discounts.ts";
import { computeShipping, zoneForCountry, type ShippingZone } from "./zones.ts";

export type { ShippingZone } from "./zones.ts";
export { zoneForCountry } from "./zones.ts";

export type CartLineInput = { variantId: string; quantity: number };

export type PricedLine = {
  variant_id: string;
  product_id: string;
  sku: string;
  name: string;
  option: string;
  quantity: number;
  unit_amount_cents: number;
  line_total_cents: number;
  charge_tax: boolean;
};

export type PricedCart = {
  lines: PricedLine[];
  country: string;
  zone: ShippingZone;
  subtotal_cents: number;
  discount_code: string | null;
  discount_cents: number;
  shipping_cents: number;
  shipping_free: boolean;
  tax_cents: number;
  total_cents: number;
  currency: "USD";
};

const MAX_QUANTITY = 20;

export async function getShippingZones(): Promise<ShippingZone[]> {
  const settings = await getStore().all("settings");
  const zones = settings.find((row) => row.key === "shipping_zones")?.value;
  return Array.isArray(zones) ? (zones as ShippingZone[]) : [];
}

/** Countries the store ships to (drives the checkout selector). */
export function servedCountries(zones: ShippingZone[]): Array<{ code: string; name: string }> {
  const hasRestOfWorld = zones.some((zone) => zone.countries.includes("*"));
  if (hasRestOfWorld) {
    return COUNTRIES;
  }
  const codes = new Set(zones.flatMap((zone) => zone.countries));
  return COUNTRIES.filter((country) => codes.has(country.code));
}

export async function getTaxRatePercent(): Promise<number> {
  const settings = await getStore().all("settings");
  const tax = settings.find((row) => row.key === "tax")?.value as
    | { rate_percent?: number }
    | undefined;
  const rate = tax?.rate_percent ?? 0;
  return Number.isFinite(rate) && rate >= 0 ? rate : 0;
}

/**
 * Price a cart end to end. Throws on unknown variants, empty carts, or a
 * ship-to country no active zone serves (capture re-verifies this, §10.3).
 */
export async function priceCart(input: {
  lines: CartLineInput[];
  country: string;
  discountCode?: string | null;
  email?: string | null;
}): Promise<PricedCart> {
  const store = getStore();
  const [variants, products, zones, taxRate] = await Promise.all([
    store.all("product_variants"),
    store.all("products"),
    getShippingZones(),
    getTaxRatePercent(),
  ]);

  if (input.lines.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const zone = zoneForCountry(zones, input.country);
  if (!zone) {
    throw new Error(`We don't ship to ${input.country}.`);
  }

  const lines: PricedLine[] = input.lines.map((line) => {
    const variant = variants.find((row) => row.id === line.variantId);
    const product = variant
      ? products.find((row) => row.id === variant.product_id)
      : undefined;
    if (!variant || !product || product.status !== "active") {
      throw new Error("An item in your cart is no longer available.");
    }
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.floor(line.quantity)));
    return {
      variant_id: variant.id,
      product_id: product.id,
      sku: variant.sku,
      name: product.title,
      option: variant.option_values.join(" / "),
      quantity,
      unit_amount_cents: variant.price_cents,
      line_total_cents: variant.price_cents * quantity,
      charge_tax: product.charge_tax,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.line_total_cents, 0);

  // Discount code (§7.8) — validated server-side, never trusted from the client.
  let discountCents = 0;
  let discountCode: string | null = null;
  let discountFreeShipping = false;
  if (input.discountCode?.trim()) {
    const applied = await applyDiscountCode({
      code: input.discountCode,
      lines,
      subtotalCents: subtotal,
      email: input.email ?? null,
    });
    discountCents = Math.min(applied.discount_cents, subtotal);
    discountCode = applied.discount.code;
    discountFreeShipping = applied.free_shipping;
  }

  // Shipping thresholds apply to the discounted merchandise total.
  const discountedSubtotal = subtotal - discountCents;
  const shippingBase = computeShipping(zone, discountedSubtotal);
  const shippingFree = discountFreeShipping || shippingBase.free;
  const shipping = shippingFree ? 0 : shippingBase.amount;

  const taxable = lines
    .filter((line) => line.charge_tax)
    .reduce((sum, line) => sum + line.line_total_cents, 0);
  const tax = Math.round((Math.max(0, taxable - discountCents) * taxRate) / 100);

  return {
    lines,
    country: input.country,
    zone,
    subtotal_cents: subtotal,
    discount_code: discountCode,
    discount_cents: discountCents,
    shipping_cents: shipping,
    shipping_free: shippingFree,
    tax_cents: tax,
    total_cents: discountedSubtotal + shipping + tax,
    currency: "USD",
  };
}
