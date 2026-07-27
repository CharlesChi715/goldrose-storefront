"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /account (owner request 2026-07-23). It picks one of two
 * screens: signed out renders the pixel-exact VELORIA sign-in frame
 * (ShoppingLogin, 74:53); signed in renders the pixel-exact
 * ACCOUNT-INFO-SHOPPING-DASHBOARD (914:112, imported 2026-07-27) fed with
 * the visitor's real name and latest order.
 *
 * Sign-in is an emailed link that lands on /auth/confirm (owner request
 * 2026-07-27), with the mail's 6-digit code as in-place fallback; the owner
 * confirmed "no passkey" for the storefront, so the passkey and OAuth buttons
 * that used to live here are gone. The underlying helpers
 * (`lib/supabase/browser-auth`, /auth/callback) are untouched and still serve
 * the admin, so restoring either method is a UI change only.
 */

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";
import { formatMoney } from "@/lib/money";
import { carrierLabel } from "@/lib/shipping/carriers";
import {
  AccountDashboardScreen,
  type DashboardRecentOrder,
} from "@/components/screens/DashboardScreen";
import { ShoppingLogin } from "@/components/login/ShoppingLogin";
import { accountOverviewAction } from "./actions";
import type { AccountOrder, AccountOverview } from "@/lib/account/data.ts";

type Phase = "unavailable" | "loading" | "signedOut" | "signedIn";

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

/**
 * The dashboard's Recent Order card, from the visitor's latest real order.
 * The account data carries no line items, so the bold line is the order
 * number and the photo stays the neutral placeholder (explicit-unknown rule).
 */
function toRecentOrder(orders: AccountOrder[]): DashboardRecentOrder | null {
  const order = orders[0];
  if (!order) return null;
  return {
    title: order.name,
    line2: `Placed ${formatDate(order.placed_at)}`,
    status: deliveryStatus(order).label.toUpperCase(),
    price: formatMoney(order.total_cents),
    photoSrc: null,
  };
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
    // Coming back from a failed OAuth round trip or an expired/used sign-in
    // link (/auth/callback and /auth/confirm append ?auth_error=1) — surface
    // it once and clean the URL.
    const hadAuthError = new URLSearchParams(window.location.search).get("auth_error");
    if (hadAuthError) {
      window.history.replaceState(null, "", "/account");
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) {
        return;
      }
      if (hadAuthError) {
        setError("Sign-in didn't complete — the link may have expired or already been used. Please request a new one.");
      }
      if (!user) {
        setPhase("signedOut");
        return;
      }
      loadAccount();
    });
    // The sign-in screen verifies the emailed fallback code itself, so the
    // session can appear without this component doing anything — watch for it.
    // (The emailed link arrives here already signed in via /auth/confirm.)
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

  if (phase === "signedIn" && overview) {
    return (
      <>
        {error ? (
          <p
            role="alert"
            style={{ position: "fixed", left: 8, right: 8, top: 8, zIndex: 50, margin: 0, borderRadius: 6, border: "1px solid #c65a4a", background: "#fdf1ef", padding: "10px 14px", fontSize: 13, color: "#8a2f22" }}
          >
            {error}
          </p>
        ) : null}
        <AccountDashboardScreen
          displayName={overview.displayName}
          recentOrder={toRecentOrder(overview.orders)}
          onSignOut={busy === null ? signOut : undefined}
        />
      </>
    );
  }

  // phase === "loading" — a quiet cream holding state before either screen.
  return (
    <main
      className="min-h-screen bg-[#FFF6EC] text-[#3B2F2F]"
      style={{ display: "grid", placeItems: "center" }}
    >
      <p style={{ fontSize: 14 }}>Checking your session…</p>
    </main>
  );
}
