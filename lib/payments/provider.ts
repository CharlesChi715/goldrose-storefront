import { getPayPalConfig, refundPayPalCapture } from "../paypal/client.ts";
import { getStripeConfig, refundStripeCharge } from "../stripe/client.ts";
import type { OrderRow } from "../supabase/types.ts";

/**
 * Refund an order's payment at its provider. Mock orders (or any order
 * without a capture id) are a no-op — the caller records the refund
 * locally. A REAL provider that is not configured, or a provider this
 * dispatch does not know, throws: recording a refund that was never sent
 * would show the customer as repaid while the money stayed.
 *
 * @param order - The order row carrying provider and capture id.
 * @param amountCents - Amount in cents for a partial refund, or null for a
 *   full refund of the capture's remaining amount.
 */
export async function refundProviderPayment(
  order: OrderRow,
  amountCents: number | null,
): Promise<void> {
  if (!order.provider_capture_id) {
    return;
  }
  switch (order.payment_provider) {
    case "mock":
      return;
    case "paypal":
      if (!getPayPalConfig().configured) {
        throw new Error(
          "PayPal is not configured — cannot refund a real payment.",
        );
      }
      await refundPayPalCapture(
        order.provider_capture_id,
        amountCents,
        order.currency,
      );
      return;
    case "stripe":
      if (!getStripeConfig().configured) {
        throw new Error(
          "Stripe is not configured — cannot refund a real payment.",
        );
      }
      await refundStripeCharge(order.provider_capture_id, amountCents);
      return;
    default:
      throw new Error(
        `Unknown payment provider "${order.payment_provider}" — refund it in the provider's own dashboard.`,
      );
  }
}
