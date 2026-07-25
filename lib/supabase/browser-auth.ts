/**
 * ROLE OF THIS FILE
 * The browser-side Supabase auth client, for the flows that must run in the
 * browser: OAuth redirects and WebAuthn passkey ceremonies (customer
 * /account page, admin passkey login + enrollment). Passkeys are Supabase's
 * experimental beta (2026-05) and need the explicit opt-in flag below.
 * Returns null when the public env vars are absent (local file mode) —
 * callers show their "needs hosted Supabase" state instead.
 */

import { useSyncExternalStore } from "react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Create the browser-side Supabase auth client with the experimental passkey
 * flag enabled. Returns null when the public env vars are missing (local file
 * mode) so callers can show their "needs hosted Supabase" state instead.
 *
 * @returns The browser client, or null when hosted Supabase is not configured.
 */
export function supabaseBrowserAuthClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter((name): name is string => name !== null);

  // Both absent is the intentional local-file mode. Exactly one absent is a
  // deployment mistake worth naming in the browser console.
  if ((url || anonKey) && missing.length > 0) {
    console.error(
      `[supabase/auth] Missing environment variable: ${missing.join(", ")}`,
    );
  }

  if (!url || !anonKey) {
    return null;
  }
  return createBrowserClient(url, anonKey, {
    auth: { experimental: { passkey: true } },
  });
}

const noopSubscribe = () => () => {};

/**
 * Whether this browser can run WebAuthn ceremonies. False during SSR (the
 * server snapshot), so passkey UI appears only after hydration — that keeps
 * server and client markup consistent without effect-driven state.
 */
export function useWebAuthnSupported(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => "PublicKeyCredential" in window,
    () => false,
  );
}
