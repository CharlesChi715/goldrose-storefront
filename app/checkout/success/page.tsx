/**
 * ROLE OF THIS FILE
 * The /checkout/success "thank you" page. The order details arrive in the
 * URL query string (?order=...&total=...), because the mock flow redirects
 * here after completing. Everything from a URL is untrusted user input, so
 * each param is validated before display.
 */

import Link from "next/link";
import type { Metadata } from "next";
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
  const methodLabel =
    params.method && isPaymentMethodId(params.method)
      ? getPaymentMethod(params.method).label
      : "your selected method";
  const totalCents = Number(params.total);
  const hasTotal = Number.isFinite(totalCents) && totalCents > 0;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4ede1] px-6 py-16 text-[#211a0e]">
      <div className="w-full max-w-xl rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-10 text-center shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-[#f3d77c] to-[#b8922e] text-2xl text-[#211706]">
          ✓
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#9a7826]">GoldRose</p>
        <h1 className="font-serif text-4xl font-medium leading-tight text-[#211a0e]">
          Thank you for your order.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#5c4f38]">
          Your {methodLabel} checkout completed. A confirmation email is on
          its way, and tracking details will follow once your gift ships.
        </p>

        <dl className="mx-auto mt-7 grid max-w-sm gap-2 text-left">
          {params.order ? (
            <div className="flex items-center justify-between rounded-[3px] border border-[#d7c28a] bg-[#fffaf2] px-4 py-3 text-sm">
              <dt className="font-bold uppercase tracking-[0.12em] text-[#6b5c3f]">Order</dt>
              <dd className="font-mono text-[#211a0e]">{params.order}</dd>
            </div>
          ) : null}
          {hasTotal ? (
            <div className="flex items-center justify-between rounded-[3px] border border-[#d7c28a] bg-[#fffaf2] px-4 py-3 text-sm">
              <dt className="font-bold uppercase tracking-[0.12em] text-[#6b5c3f]">Total</dt>
              <dd className="font-serif text-lg text-[#8a6a22]">{formatMoney(totalCents)}</dd>
            </div>
          ) : null}
        </dl>

        {isMock ? (
          <p className="mt-6 rounded-[3px] border border-[#b8922e]/40 bg-[#f7ecd6] px-4 py-3 text-sm leading-6 text-[#7a5d1c]">
            This is a <strong>development test order</strong> placed in mock
            mode. No payment was taken and no money moved — the order is recorded
            in the admin with a test badge.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-[3px] bg-[#c9a24b] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition-colors hover:bg-[#9a7826]"
          >
            Continue shopping
          </Link>
          <Link
            href="/orders"
            className="inline-flex h-12 items-center justify-center rounded-[3px] border border-[#b8922e] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#8a6a22] transition hover:bg-[#f7ecd6]"
          >
            View order log →
          </Link>
        </div>
      </div>
    </main>
  );
}
