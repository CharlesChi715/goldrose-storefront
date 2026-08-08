/**
 * ROLE OF THIS FILE
 * Carrier registry for order tracking (Level 1, link-out — see
 * docs/features/order-tracking.md): maps each supported carrier id
 * to its display name and public tracking-URL template. fulfillOrder builds
 * the customer-facing link from here when the admin leaves the URL field
 * blank, so a hand-typed URL can no longer ship a dead link. UPS + USPS
 * only for now (owner, 2026-07-25); the schema stays provider-neutral
 * (orders.tracking_carrier is free text) — add a carrier by extending
 * CARRIERS.
 */

/** Carrier ids the admin can pick today. */
export type CarrierId = "ups" | "usps";

/**
 * Supported carriers, in the order the admin dropdown lists them (first =
 * default). Each entry: display label + tracking-page URL template.
 */
export const CARRIERS: Record<
  CarrierId,
  { label: string; trackingUrl: (trackingNumber: string) => string }
> = {
  ups: {
    label: "UPS",
    trackingUrl: (trackingNumber) =>
      `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`,
  },
  usps: {
    label: "USPS",
    trackingUrl: (trackingNumber) =>
      `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`,
  },
};

/**
 * True when the value is a supported carrier id ("ups" | "usps").
 *
 * @param value - Any value, e.g. a stored orders.tracking_carrier.
 */
export function isCarrierId(value: unknown): value is CarrierId {
  return typeof value === "string" && value in CARRIERS;
}

/**
 * The carrier's public tracking page for a number, or null when the carrier
 * is unknown/absent or the number is blank.
 *
 * @param carrier - Carrier id as stored on the order (free text).
 * @param trackingNumber - The carrier's tracking number.
 */
export function buildTrackingUrl(
  carrier: string | null,
  trackingNumber: string,
): string | null {
  if (!isCarrierId(carrier) || !trackingNumber.trim()) {
    return null;
  }
  return CARRIERS[carrier].trackingUrl(trackingNumber.trim());
}

/**
 * Display name for a stored carrier id ("ups" → "UPS"). Unknown non-empty
 * values come back verbatim so orders from future carriers still label;
 * null/blank → null (pre-carrier orders render without one).
 *
 * @param carrier - Carrier id as stored on the order (free text).
 */
export function carrierLabel(carrier: string | null): string | null {
  if (!carrier) {
    return null;
  }
  return isCarrierId(carrier) ? CARRIERS[carrier].label : carrier;
}
