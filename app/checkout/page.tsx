/**
 * ROLE OF THIS FILE
 * /checkout — server half: loads the DB catalog (safe view), shipping zones
 * and served countries, defaults the ship-to country from Vercel's geo-IP
 * header (§8), and mounts the client checkout with the PayPal client id
 * when configured (sandbox until launch) or mock mode otherwise.
 */

import { headers } from "next/headers";
import { getCatalog } from "@/lib/supabase/catalog.ts";
import { getShippingZones, servedCountries } from "@/lib/checkout/pricing";
import { getSettingsMap } from "@/lib/admin/settings";
import { CheckoutClient } from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // A dead/unwritable DB must degrade to the empty-cart screen, never a 500.
  let catalog: Awaited<ReturnType<typeof getCatalog>> = [];
  let zones: Awaited<ReturnType<typeof getShippingZones>> = [];
  let showDiscountField = true;
  try {
    const [loadedCatalog, loadedZones, settings] = await Promise.all([
      getCatalog(),
      getShippingZones(),
      getSettingsMap(),
    ]);
    catalog = loadedCatalog;
    zones = loadedZones;
    showDiscountField = settings.checkout.discount_field_enabled;
  } catch {
    // fall through with empty catalog
  }
  const countries = servedCountries(zones);

  const headerStore = await headers();
  const geo = (headerStore.get("x-vercel-ip-country") ?? "").toUpperCase();
  const defaultCountry = countries.some((country) => country.code === geo) ? geo : "US";

  const paypalClientId =
    process.env.PAYPAL_CLIENT_ID && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      : null;

  return (
    <CheckoutClient
      catalog={catalog}
      zones={zones}
      countries={countries}
      defaultCountry={defaultCountry}
      paypalClientId={paypalClientId}
      showDiscountField={showDiscountField}
    />
  );
}
