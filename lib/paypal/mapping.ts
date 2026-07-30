/**
 * ROLE OF THIS FILE
 * Pure mapping from PayPal Orders-v2 payloads to our order fields (§7.4:
 * email/phone/addresses from the provider's payer + shipping data). No I/O
 * — unit-tested against recorded fixture payloads (§0.2: PayPal verified by
 * fixtures until sandbox credentials exist).
 */

import type { Address } from "../supabase/types.ts";

type PayPalName = { given_name?: string; surname?: string; full_name?: string };

type PayPalAddress = {
  address_line_1?: string;
  address_line_2?: string;
  admin_area_2?: string; // city
  admin_area_1?: string; // state/province
  postal_code?: string;
  country_code?: string;
};

export type PayPalCaptureResponse = {
  id?: string;
  status?: string;
  payer?: {
    email_address?: string;
    name?: PayPalName;
    phone?: { phone_number?: { national_number?: string } };
    address?: PayPalAddress;
  };
  purchase_units?: Array<{
    shipping?: { name?: PayPalName; address?: PayPalAddress };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { value?: string; currency_code?: string };
        seller_protection?: { status?: string };
      }>;
    };
  }>;
};

/**
 * Convert a PayPal name + address pair to our Address shape, preferring
 * full_name and otherwise joining given/surname.
 *
 * @param name - PayPal name object, if present.
 * @param address - PayPal address object; null result when absent.
 * @returns Our Address, or null when PayPal sent no address.
 */
function mapAddress(
  name: PayPalName | undefined,
  address: PayPalAddress | undefined,
): Address | null {
  if (!address) {
    return null;
  }
  return {
    name:
      name?.full_name ??
      [name?.given_name, name?.surname].filter(Boolean).join(" "),
    address1: address.address_line_1,
    address2: address.address_line_2,
    city: address.admin_area_2,
    state: address.admin_area_1,
    postal_code: address.postal_code,
    country: address.country_code,
  };
}

export type MappedCapture = {
  providerOrderId: string | null;
  captureId: string | null;
  captureStatus: string | null;
  completed: boolean;
  email: string | null;
  phone: string | null;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  amountCents: number | null;
  currency: string | null;
  sellerProtection: string | null;
  shipToCountry: string | null;
};

/**
 * Pull everything an order row needs out of a capture response: ids and
 * statuses, payer email/phone, shipping + billing addresses, and the captured
 * amount converted to cents (e.g. "49.99" → 4999). `completed` is true only
 * when both the order and its first capture are COMPLETED; every missing
 * field maps to null.
 *
 * @param response - Raw JSON from PayPal's capture endpoint.
 * @returns Flat provider-neutral fields ready for the order row.
 */
export function mapCaptureResponse(
  response: PayPalCaptureResponse,
): MappedCapture {
  const unit = response.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const shipping = mapAddress(unit?.shipping?.name, unit?.shipping?.address);
  const billing = mapAddress(response.payer?.name, response.payer?.address);
  const amountValue = capture?.amount?.value;
  const amountCents =
    amountValue !== undefined
      ? Math.round(Number.parseFloat(amountValue) * 100)
      : null;

  return {
    providerOrderId: response.id ?? null,
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    completed:
      response.status === "COMPLETED" && capture?.status === "COMPLETED",
    email: response.payer?.email_address ?? null,
    phone: response.payer?.phone?.phone_number?.national_number ?? null,
    shippingAddress: shipping,
    billingAddress: billing,
    amountCents: Number.isFinite(amountCents) ? amountCents : null,
    currency: capture?.amount?.currency_code ?? null,
    sellerProtection: capture?.seller_protection?.status ?? null,
    shipToCountry: shipping?.country ?? null,
  };
}
