"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /account (owner request 2026-07-23). It picks one of two
 * screens: signed out renders the pixel-exact VELORIA sign-in frame
 * (ShoppingLogin, 74:53), signed in renders the hand-built account view below
 * — the design ships no signed-in frame, so that half stays bespoke.
 *
 * Sign-in is an emailed one-time code, the only method the 07-25 design
 * offers; the owner confirmed "no passkey" for the storefront, so the passkey
 * and OAuth buttons that used to live here are gone. The underlying helpers
 * (`lib/supabase/browser-auth`, /auth/callback) are untouched and still serve
 * the admin, so restoring either method is a UI change only.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";
import { formatMoney } from "@/lib/money";
import { carrierLabel } from "@/lib/shipping/carriers";
import { BottomNav } from "@/components/veloria";
import { ShoppingLogin } from "@/components/login/ShoppingLogin";
import { accountOverviewAction } from "./actions";
import type { AccountOrder, AccountOverview } from "@/lib/account/data.ts";

const brandName = "GoldRose";

type Phase = "unavailable" | "loading" | "signedOut" | "signedIn";

const FINANCIAL_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};

/**
 * Delivery-status pill for an order in the "Your orders" list (Level 1
 * tracking, owner request 2026-07-25): cancelled → fulfilled ("Shipped via
 * UPS" when the carrier is known) → still preparing. Live carrier scans stay
 * behind the "Track" link-out for now.
 */
function deliveryStatus(order: AccountOrder): { label: string; className: string } {
  if (order.cancelled) {
    return { label: "Cancelled", className: "border-[#cbbfa6] bg-[#f1eadb] text-[#7c6e50]" };
  }
  if (order.fulfillment_status === "fulfilled") {
    const carrier = carrierLabel(order.tracking_carrier);
    return {
      label: carrier ? `Shipped via ${carrier}` : "Shipped",
      className: "border-[#b5cc8e] bg-[#eff5e3] text-[#4d6b1e]",
    };
  }
  return {
    label: "Preparing your order",
    className: "border-[#d7c28a] bg-[#fdf6e4] text-[#8a6a22]",
  };
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7826]">{children}</p>
  );
}

export function AccountClient() {
  const supabase = useMemo(() => supabaseBrowserAuthClient(), []);
  const [phase, setPhase] = useState<Phase>(supabase ? "loading" : "unavailable");
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function loadAccount(): Promise<void> {
    const data = await accountOverviewAction();
    if (!data) {
      setPhase("signedOut");
      return;
    }
    setOverview(data);
    setPhase("signedIn");
  }

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let cancelled = false;
    // Coming back from a failed OAuth round trip (/auth/callback appends
    // ?auth_error=1) — surface it once and clean the URL.
    const hadAuthError = new URLSearchParams(window.location.search).get("auth_error");
    if (hadAuthError) {
      window.history.replaceState(null, "", "/account");
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) {
        return;
      }
      if (hadAuthError) {
        setError("Sign-in didn't complete. Please try again.");
      }
      if (!user) {
        setPhase("signedOut");
        return;
      }
      loadAccount();
    });
    // The sign-in screen verifies the emailed code itself, so the session can
    // appear without this component doing anything — watch for it.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) {
        return;
      }
      if (event === "SIGNED_IN" && session?.user) {
        loadAccount();
      } else if (event === "SIGNED_OUT") {
        setOverview(null);
        setPhase("signedOut");
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    if (!supabase) {
      return;
    }
    setBusy("signOut");
    await supabase.auth.signOut();
    setOverview(null);
    setBusy(null);
    setPhase("signedOut");
  }

  // Signed out (and local mode, which has no auth server) is the design's own
  // screen; it brings its own bottom nav via ScaleFrame.
  if (phase === "signedOut" || phase === "unavailable") {
    return <ShoppingLogin />;
  }

  return (
    <main className="min-h-screen bg-[#f4ede1] pb-32 text-[#211a0e]">
      <header className="border-b border-[#c9a24b]/25 bg-[#fbf6ec]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-serif text-2xl uppercase tracking-[0.22em] text-[#211a0e]">
            {brandName}
            <span className="text-[#b8922e]">.</span>
          </Link>
          <Link
            href="/shop"
            className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a22] hover:text-[#9a7826]"
          >
            ← Continue shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-4xl font-medium leading-tight">My account</h1>

        {error ? (
          <p className="mt-4 rounded-[3px] border border-[#c65a4a] bg-[#fdf1ef] px-4 py-3 text-sm text-[#8a2f22]">
            {error}
          </p>
        ) : null}

        {phase === "loading" ? (
          <p className="mt-7 text-sm text-[#7c6e50]">Checking your session…</p>
        ) : null}

        {phase === "signedIn" && overview ? (
          <div className="mt-7 grid gap-6">
            <div className="rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-8 shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <SectionLabel>Signed in</SectionLabel>
                  <p className="mt-2 font-serif text-2xl">Hi, {overview.displayName}</p>
                  <p className="mt-1 text-sm text-[#5c4f38]">{overview.email}</p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy !== null}
                  className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a22] underline-offset-4 hover:text-[#9a7826] hover:underline disabled:opacity-60"
                >
                  {busy === "signOut" ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>

            <div className="rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-8 shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
              <SectionLabel>Your orders</SectionLabel>
              {overview.orders.length === 0 ? (
                <p className="mt-3 text-sm leading-7 text-[#5c4f38]">
                  No orders yet —{" "}
                  <Link href="/shop" className="text-[#8a6a22] underline underline-offset-4 hover:text-[#9a7826]">
                    find them a gold rose
                  </Link>
                  .
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-[#e7d9b8]">
                  {overview.orders.map((order) => {
                    const status = deliveryStatus(order);
                    return (
                      <li key={order.name} className="py-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-bold">{order.name}</p>
                          <p className="text-sm font-bold">{formatMoney(order.total_cents)}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-[#7c6e50]">
                          {formatDate(order.placed_at)} ·{" "}
                          {FINANCIAL_LABEL[order.financial_status] ?? order.financial_status}
                        </p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 font-bold uppercase tracking-[0.08em] ${status.className}`}
                          >
                            {status.label}
                          </span>
                          {order.tracking_number ? (
                            order.tracking_url ? (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#8a6a22] underline underline-offset-4 hover:text-[#9a7826]"
                              >
                                Track {order.tracking_number}
                              </a>
                            ) : (
                              <span className="text-[#7c6e50]">
                                Tracking {order.tracking_number}
                              </span>
                            )
                          ) : null}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

          </div>
        ) : null}
      </div>
      <BottomNav active="Account" />
    </main>
  );
}
