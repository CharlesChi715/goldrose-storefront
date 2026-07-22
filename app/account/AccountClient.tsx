"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /account (owner request 2026-07-23). Sign-in happens here
 * because both flows are browser ceremonies: Google/Apple OAuth redirects
 * out and back through /auth/callback, passkeys run WebAuthn against
 * Supabase's beta API. Once the session cookie exists, the server action
 * returns the account view (orders by verified email). Without Supabase
 * env vars (local file mode / e2e) the page shows a "not available yet"
 * card instead — sign-in needs the hosted backend.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowserAuthClient, useWebAuthnSupported } from "@/lib/supabase/browser-auth";
import { formatMoney } from "@/lib/money";
import { accountOverviewAction } from "./actions";
import type { AccountOverview } from "@/lib/account/data.ts";

const brandName = "GoldRose";

type Phase = "unavailable" | "loading" | "signedOut" | "signedIn";

type PasskeyItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

const FINANCIAL_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Shared warm-gold button used by every sign-in option. */
function OptionButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[3px] border border-[#d7c28a] bg-[#fffaf2] text-sm font-bold tracking-[0.04em] text-[#211a0e] shadow-sm transition hover:border-[#9a7826] hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7826]">{children}</p>
  );
}

export function AccountClient() {
  const supabase = useMemo(() => supabaseBrowserAuthClient(), []);
  const passkeySupported = useWebAuthnSupported();
  const [phase, setPhase] = useState<Phase>(supabase ? "loading" : "unavailable");
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
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
    if (supabase) {
      const { data: list } = await supabase.auth.passkey.list();
      setPasskeys(list ?? []);
    }
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function oauthSignIn(provider: "google" | "apple") {
    if (!supabase) {
      return;
    }
    setBusy(provider);
    setError(null);
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` },
    });
  }

  async function passkeySignIn() {
    if (!supabase) {
      return;
    }
    setBusy("passkey");
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPasskey();
    if (signInError || !data?.session) {
      setError("Passkey sign-in didn't complete. Try again, or use Google or Apple.");
      setBusy(null);
      return;
    }
    await loadAccount();
    setBusy(null);
  }

  async function addPasskey() {
    if (!supabase) {
      return;
    }
    setBusy("addPasskey");
    setError(null);
    const { error: registerError } = await supabase.auth.registerPasskey();
    if (registerError) {
      setError("Couldn't add a passkey on this device.");
    } else {
      const { data: list } = await supabase.auth.passkey.list();
      setPasskeys(list ?? []);
    }
    setBusy(null);
  }

  async function removePasskey(passkeyId: string) {
    if (!supabase) {
      return;
    }
    setBusy(`remove:${passkeyId}`);
    const { error: deleteError } = await supabase.auth.passkey.delete({ passkeyId });
    if (deleteError) {
      setError("Couldn't remove that passkey.");
    } else {
      setPasskeys((current) => current.filter((key) => key.id !== passkeyId));
    }
    setBusy(null);
  }

  async function signOut() {
    if (!supabase) {
      return;
    }
    setBusy("signOut");
    await supabase.auth.signOut();
    setOverview(null);
    setPasskeys([]);
    setBusy(null);
    setPhase("signedOut");
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

        {phase === "unavailable" ? (
          <div className="mt-7 rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-8 shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
            <p className="text-sm leading-7 text-[#5c4f38]">
              Customer sign-in isn&apos;t switched on in this environment yet. You can still
              browse the shop and check out as a guest.
            </p>
          </div>
        ) : null}

        {phase === "loading" ? (
          <p className="mt-7 text-sm text-[#7c6e50]">Checking your session…</p>
        ) : null}

        {phase === "signedOut" ? (
          <div className="mt-7 rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-8 shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
            <SectionLabel>Sign in</SectionLabel>
            <p className="mt-2 text-sm leading-7 text-[#5c4f38]">
              Use the account you check out with to see your orders in one place.
            </p>
            <div className="mt-5 grid gap-3">
              <OptionButton onClick={() => oauthSignIn("google")} disabled={busy !== null}>
                {busy === "google" ? "Opening Google…" : "Continue with Google"}
              </OptionButton>
              <OptionButton onClick={() => oauthSignIn("apple")} disabled={busy !== null}>
                {busy === "apple" ? "Opening Apple…" : "Continue with Apple"}
              </OptionButton>
              {passkeySupported ? (
                <>
                  <div className="my-1 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-[#a99a78]">
                    <span className="h-px flex-1 bg-[#d7c28a]" />
                    or
                    <span className="h-px flex-1 bg-[#d7c28a]" />
                  </div>
                  <OptionButton onClick={passkeySignIn} disabled={busy !== null}>
                    {busy === "passkey" ? "Waiting for your device…" : "Sign in with a passkey"}
                  </OptionButton>
                </>
              ) : null}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#7c6e50]">
              First time here? Continuing with Google or Apple creates your account —
              you can add a passkey afterwards for one-tap sign-in.
            </p>
          </div>
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
                  {overview.orders.map((order) => (
                    <li key={order.name} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                      <div>
                        <p className="text-sm font-bold">{order.name}</p>
                        <p className="text-xs text-[#7c6e50]">
                          {formatDate(order.placed_at)} · {FINANCIAL_LABEL[order.financial_status] ?? order.financial_status}
                          {order.fulfillment_status === "fulfilled" ? " · Shipped" : ""}
                          {order.tracking_number ? (
                            <>
                              {" · "}
                              {order.tracking_url ? (
                                <a
                                  href={order.tracking_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline underline-offset-4"
                                >
                                  Track {order.tracking_number}
                                </a>
                              ) : (
                                `Tracking ${order.tracking_number}`
                              )}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <p className="text-sm font-bold">{formatMoney(order.total_cents)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {passkeySupported ? (
              <div className="rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-8 shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
                <SectionLabel>Passkeys</SectionLabel>
                <p className="mt-2 text-sm leading-7 text-[#5c4f38]">
                  Sign in with Face ID, Touch ID, or your device PIN — no password, nothing to
                  remember.
                </p>
                {passkeys.length > 0 ? (
                  <ul className="mt-4 divide-y divide-[#e7d9b8]">
                    {passkeys.map((key) => (
                      <li key={key.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                        <div>
                          <p className="text-sm font-bold">{key.friendly_name || "Passkey"}</p>
                          <p className="text-xs text-[#7c6e50]">Added {formatDate(key.created_at)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePasskey(key.id)}
                          disabled={busy !== null}
                          className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a22] underline-offset-4 hover:text-[#9a7826] hover:underline disabled:opacity-60"
                        >
                          {busy === `remove:${key.id}` ? "Removing…" : "Remove"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-5">
                  <OptionButton onClick={addPasskey} disabled={busy !== null}>
                    {busy === "addPasskey" ? "Follow your device's prompts…" : "Add a passkey on this device"}
                  </OptionButton>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
