import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout canceled",
  robots: { index: false },
};

export default function CheckoutCancelPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4ede1] px-6 py-16 text-[#211a0e]">
      <div className="w-full max-w-xl rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-10 text-center shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#9a7826]">AUREÀ</p>
        <h1 className="font-serif text-4xl font-medium leading-tight text-[#211a0e]">
          Checkout canceled.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#5c4f38]">
          No payment was taken. Your cart is still saved — you can pick up right
          where you left off whenever you are ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="inline-flex h-12 items-center justify-center rounded-[3px] bg-[#c9a24b] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition-colors hover:bg-[#9a7826]"
          >
            Return to checkout
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-[3px] border border-[#b8922e]/60 px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#8a6a22] transition hover:bg-[#f7ecd6]"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
