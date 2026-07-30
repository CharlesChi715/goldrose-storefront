/**
 * ROLE OF THIS FILE
 * Pure shipping-zone logic (§10.3), shared by the server pricer and the
 * checkout page's client-side display: which zone serves a country, and
 * what shipping costs at a given subtotal. No I/O.
 */

export type ShippingZone = {
  id: string;
  name: string;
  /** ISO country codes; "*" = everywhere else (Rest of world). */
  countries: string[];
  rate_cents: number;
  free_over_cents: number | null;
  /** Marked true until the owner supplies real rates (OQ-2). */
  placeholder?: boolean;
};

/**
 * The zone serving a country: an explicit match wins, then "Rest of world".
 *
 * @param zones - All active shipping zones.
 * @param country - ISO alpha-2 ship-to country code.
 * @returns The matching zone, or null when nothing serves this country.
 */
export function zoneForCountry(
  zones: ShippingZone[],
  country: string,
): ShippingZone | null {
  return (
    zones.find((zone) => zone.countries.includes(country)) ??
    zones.find((zone) => zone.countries.includes("*")) ??
    null
  );
}

/**
 * Shipping cost in cents for a zone at a given merchandise subtotal: the
 * zone's flat rate, or 0 once the subtotal reaches its free-over threshold.
 *
 * @param zone - The zone serving the ship-to country.
 * @param subtotalCents - Discounted merchandise subtotal in cents.
 * @returns Amount in cents plus a `free` flag for display.
 */
export function computeShipping(
  zone: ShippingZone,
  subtotalCents: number,
): { amount: number; free: boolean } {
  const free =
    zone.free_over_cents !== null && subtotalCents >= zone.free_over_cents;
  return { amount: free ? 0 : zone.rate_cents, free };
}
