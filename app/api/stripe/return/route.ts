// GET /api/stripe/return: Stripe's success_url. Retrieve the session, and
// when it is paid write the real order — lines, stock movements, customer,
// timeline, checkout completion, emails — from the SERVER-priced checkout
// row, then redirect to /checkout/success. Idempotent by provider_order_id
// (the session id); the Stripe webhook independently repairs the record if
// the buyer's browser dies between paying and this redirect.
//
// DELIBERATELY NOT RATE LIMITED, like /api/paypal/capture: by the time a
// request reaches here Stripe may already hold the shopper's money, and a
// refusal would leave a payment with no order against it.

import { NextResponse } from "next/server";
import { priceCart } from "@/lib/checkout/pricing";
import { createOrderIfAbsent } from "@/lib/orders/db";
import {
  getStripeCheckoutSession,
  getStripeConfig,
  refundStripeCharge,
} from "@/lib/stripe/client";
import {
  mapStripeSession,
  type StripeCheckoutSession,
} from "@/lib/stripe/mapping";
import { currentAuthUserId } from "@/lib/supabase/server-auth.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { alert } from "@/lib/observe.ts";

const SESSION_ID_SHAPE = /^cs_[A-Za-z0-9_]{1,120}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (path: string) => NextResponse.redirect(new URL(path, url), 303);

  if (!getStripeConfig().configured) {
    return back("/checkout?step=payment&payerror=failed");
  }
  const sessionId = url.searchParams.get("session_id") ?? "";
  if (!SESSION_ID_SHAPE.test(sessionId)) {
    return back("/checkout?step=payment");
  }

  try {
    const session = (await getStripeCheckoutSession(
      sessionId,
    )) as StripeCheckoutSession;
    const mapped = mapStripeSession(session);
    if (!mapped.paid) {
      // The buyer backed out (cancel_url is the normal exit) or the payment
      // never completed — nothing has been charged.
      return back("/checkout?step=payment");
    }

    const checkouts = await getStore().all("checkouts");
    const checkout = checkouts.find(
      (row) =>
        row.provider_order_id === sessionId ||
        (mapped.checkoutId !== null && row.id === mapped.checkoutId),
    );
    if (!checkout) {
      // Money captured, no cart to build an order from — the buyer has paid
      // and must not be shown an error; the owner repairs by hand.
      await alert(
        "stripe.return.orphaned",
        "A Stripe payment was completed but its checkout row is missing — the buyer has paid and no order exists. Refund or fulfil by hand from the Stripe dashboard.",
        { sessionId },
      );
      const params = new URLSearchParams({
        method: "card",
        ...(mapped.amountCents !== null
          ? { total: String(mapped.amountCents) }
          : {}),
        mock: "0",
      });
      return back(`/checkout/success?${params.toString()}`);
    }

    // Re-price with the country Stripe collected the address for; the
    // session's allowed_countries kept it inside the priced zone.
    const priced = await priceCart({
      lines: checkout.cart.lines.map((line) => ({
        variantId: line.variant_id,
        quantity: line.quantity,
      })),
      country: mapped.shipToCountry ?? checkout.cart.country ?? "US",
      discountCode: checkout.discount_code,
      email: mapped.email ?? checkout.email,
    });

    if (
      mapped.amountCents !== null &&
      mapped.amountCents !== priced.total_cents
    ) {
      // Hard stop: money moved for the wrong amount (a price edit landed
      // between session creation and payment). Give it back and record
      // nothing as paid — a paid order for the wrong amount is silent data
      // loss. The rejected status keeps the webhook repair path out.
      const refundTarget = mapped.chargeId ?? mapped.paymentIntentId;
      if (refundTarget) {
        await refundStripeCharge(refundTarget, null);
      }
      await getStore().update(
        "checkouts",
        { id: checkout.id },
        { status: "rejected", completed_at: new Date().toISOString() },
      );
      await alert(
        "stripe.return.amount-mismatch",
        "A Stripe payment was captured for a different amount than the shop now prices the cart at. The payment was refunded in full and no order was recorded.",
        {
          capturedCents: mapped.amountCents,
          pricedCents: priced.total_cents,
          sessionId,
        },
      );
      return back("/checkout?step=payment&payerror=drift");
    }

    const { order, created } = await createOrderIfAbsent({
      priced,
      source: "site",
      payment_provider: "stripe",
      provider_order_id: mapped.sessionId ?? sessionId,
      provider_capture_id: mapped.chargeId ?? mapped.paymentIntentId,
      financial_status: "paid",
      payment_method_kind: "card",
      card_brand: mapped.cardBrand,
      card_last4: mapped.cardLast4,
      email: mapped.email ?? checkout.email,
      phone: mapped.phone,
      shipping_address: mapped.shippingAddress,
      billing_address: mapped.billingAddress,
      note: checkout.cart.note ?? null,
      visitor_id: checkout.cart.visitor_id ?? null,
      checkout_id: checkout.id,
      auth_user_id: await currentAuthUserId(),
      raw: session,
    });

    // The webhook can beat this route to the insert, and its event payload has
    // no card brand or last four. This response does — it retrieved the
    // session with the charge expanded — so fill in what the winner could not.
    if (!created && mapped.cardBrand && !order.card_brand) {
      await getStore().update(
        "orders",
        { id: order.id },
        {
          payment_method_kind: "card",
          card_brand: mapped.cardBrand,
          card_last4: mapped.cardLast4,
          ...(mapped.chargeId ? { provider_capture_id: mapped.chargeId } : {}),
        },
      );
    }

    // `oid` is the success page's lookup key for the buyer's own email —
    // the UUID, never the sequential order name (lib/orders/confirmation.ts).
    const params = new URLSearchParams({
      order: order.name,
      oid: order.id,
      method: "card",
      total: String(order.total_cents),
      mock: "0",
    });
    return back(`/checkout/success?${params.toString()}`);
  } catch (error) {
    // Anything reaching here happened at or after Stripe confirmed payment,
    // so the money may have moved. Always worth a human's attention.
    await alert(
      "stripe.return.failed",
      "A Stripe return-leg failed after payment. Check Stripe for a payment with no order against it — the webhook will retry the repair.",
      { err: error, sessionId },
    );
    return back("/checkout?step=payment&payerror=failed");
  }
}
