import type { Address } from "../supabase/types.ts";

type StripeAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type StripeShipping = {
  name?: string | null;
  address?: StripeAddress | null;
};

type StripeCharge = {
  id?: string;
  status?: string;
  amount_refunded?: number;
  payment_method_details?: {
    card?: { brand?: string | null; last4?: string | null };
  };
};

export type StripeCheckoutSession = {
  id?: string;
  object?: string;
  status?: string; // open | complete | expired
  payment_status?: string; // paid | unpaid | no_payment_required
  amount_total?: number | null;
  currency?: string | null;
  client_reference_id?: string | null;
  metadata?: { checkout_id?: string } | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    address?: StripeAddress | null;
  } | null;
  shipping_details?: StripeShipping | null;
  collected_information?: { shipping_details?: StripeShipping | null } | null;
  payment_intent?:
    | string
    | {
        id?: string;
        status?: string;
        latest_charge?: string | StripeCharge | null;
      }
    | null;
};

/**
 * Convert a Stripe name + address pair to our Address shape.
 *
 * @param name - Cardholder or recipient name, if present.
 * @param address - Stripe address object; null result when absent.
 * @returns Our Address, or null when Stripe sent no address.
 */
function mapAddress(
  name: string | null | undefined,
  address: StripeAddress | null | undefined,
): Address | null {
  if (!address) {
    return null;
  }
  return {
    name: name ?? "",
    address1: address.line1 ?? undefined,
    address2: address.line2 ?? undefined,
    city: address.city ?? undefined,
    state: address.state ?? undefined,
    postal_code: address.postal_code ?? undefined,
    country: address.country ?? undefined,
  };
}

export type MappedStripeSession = {
  sessionId: string | null;
  checkoutId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  /** True only when Stripe says the session's payment is complete. */
  paid: boolean;
  email: string | null;
  phone: string | null;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  amountCents: number | null;
  currency: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  shipToCountry: string | null;
};

/**
 * Pull everything an order row needs out of a Checkout Session: ids,
 * payment state, payer email/phone, shipping + billing addresses, the
 * charged amount (already integer cents), and the card brand/last4 when
 * the charge is expanded. The brand is uppercased ('VISA'), so the admin
 * shows one spelling. Every missing
 * field maps to null.
 *
 * @param session - Raw session JSON from Stripe (retrieve or webhook event).
 * @returns Flat provider-neutral fields ready for the order row.
 */
export function mapStripeSession(
  session: StripeCheckoutSession,
): MappedStripeSession {
  const intent =
    typeof session.payment_intent === "object" && session.payment_intent
      ? session.payment_intent
      : null;
  const charge =
    intent && typeof intent.latest_charge === "object"
      ? (intent.latest_charge as StripeCharge | null)
      : null;
  const shipping =
    session.collected_information?.shipping_details ??
    session.shipping_details ??
    null;
  const shippingAddress = mapAddress(shipping?.name, shipping?.address);
  const card = charge?.payment_method_details?.card;

  return {
    sessionId: session.id ?? null,
    checkoutId:
      session.metadata?.checkout_id ?? session.client_reference_id ?? null,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (intent?.id ?? null),
    chargeId:
      typeof intent?.latest_charge === "string"
        ? intent.latest_charge
        : (charge?.id ?? null),
    paid: session.payment_status === "paid",
    email: session.customer_details?.email ?? null,
    phone: session.customer_details?.phone ?? null,
    shippingAddress,
    billingAddress: mapAddress(
      session.customer_details?.name,
      session.customer_details?.address,
    ),
    amountCents: session.amount_total ?? null,
    currency: session.currency?.toUpperCase() ?? null,
    cardBrand: card?.brand?.toUpperCase() ?? null,
    cardLast4: card?.last4 ?? null,
    shipToCountry: shippingAddress?.country ?? null,
  };
}
