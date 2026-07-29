/**
 * ROLE OF THIS FILE
 * The /checkout/success "thank you" page. The order details arrive in the
 * URL query string (?order=...&total=...), because the mock flow redirects
 * here after completing. Everything from a URL is untrusted user input, so
 * each param is validated before display.
 *
 * The presentation is the imported "C-2 · Order Confirmed" Figma frame
 * (OrderConfirmedScreen); this file stays the validation + metadata layer.
 */

import type { Metadata } from "next";
import { ScaleFrame } from "@/components/chrome";
import { notoSC } from "@/lib/fonts";
import { OrderConfirmedScreen } from "@/components/screens/OrderConfirmedScreen";
import { formatMoney } from "@/lib/money";
import { isPaymentMethodId, getPaymentMethod } from "@/lib/checkout/methods";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

// In Next.js 15+ `searchParams` is a Promise, so the page function is async
// and awaits it — that's why this stays a Server Component.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    order?: string;
    method?: string;
    total?: string;
    mock?: string;
  }>;
}) {
  const params = await searchParams;
  const isMock = params.mock === "1";
  // Unknown/absent method (e.g. the skip-payment flow's "none") stays null so
  // the screen names no method at all rather than a phantom one.
  const methodLabel =
    params.method && isPaymentMethodId(params.method)
      ? getPaymentMethod(params.method).label
      : null;
  const totalCents = Number(params.total);
  const hasTotal = Number.isFinite(totalCents) && totalCents > 0;

  return (
    // The redesigned C-2 frame (1541:362, 07-29) is 430×1188 and dropped its
    // glyph tab bar entirely, so this route opts out of BottomNav.
    <ScaleFrame height={1188} background="#FFFBF6" fontClass={notoSC.className} nav={false}>
      <OrderConfirmedScreen
        orderName={params.order ?? ""}
        total={hasTotal ? formatMoney(totalCents) : null}
        method={methodLabel}
        mock={isMock}
      />
    </ScaleFrame>
  );
}
