/**
 * ROLE OF THIS FILE
 * The one cookie-bound Supabase auth client for server code — the current
 * @supabase/ssr getAll/setAll pattern (§15: use it exactly; older get/set
 * silently breaks session refresh). Shared by admin auth (lib/admin/auth)
 * and the customer account layer (lib/account) so the pattern lives in
 * exactly one place. setAll throws inside a Server Component render; that's
 * expected and safe to swallow — middleware / server actions own the
 * cookie refresh.
 */

import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";

/**
 * Create the cookie-bound Supabase auth client for server code, wired to the
 * Next.js cookie store via the @supabase/ssr getAll/setAll pattern. Cookie
 * writes that fail inside a Server Component render are swallowed on purpose
 * — middleware / server actions own the session refresh.
 *
 * @returns A Supabase server client bound to this request's cookies.
 */
export async function supabaseServerAuthClient() {
  const env = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component render — middleware owns the refresh.
        }
      },
    },
  });
}

/**
 * Read the signed-in customer's auth user id from the request cookies, for
 * stamping onto an order at checkout. Never throws: a signed-out buyer, a
 * local (non-hosted) run, or a broken auth call all return null so guest
 * checkout keeps working.
 *
 * @returns The Supabase auth user id, or null when there is no usable session.
 */
export async function currentAuthUserId(): Promise<string | null> {
  if (!getSupabaseEnv().hosted) {
    return null;
  }
  try {
    const supabase = await supabaseServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    // Checkout must never fail because auth is unavailable.
    return null;
  }
}
