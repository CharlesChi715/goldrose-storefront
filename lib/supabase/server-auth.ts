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
