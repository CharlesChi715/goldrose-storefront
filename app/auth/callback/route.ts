/**
 * ROLE OF THIS FILE
 * OAuth landing for customer sign-in (owner request 2026-07-23): Google /
 * Apple redirect back here with a PKCE ?code=, which is exchanged for a
 * session cookie, then the visitor continues to /account (or the relative
 * `next` path the sign-in button asked for). Route handlers may write
 * cookies, so no middleware is needed and the storefront stays static.
 */

import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { supabaseServerAuthClient } from "@/lib/supabase/server-auth.ts";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Open-redirect guard: relative paths only.
  let next = searchParams.get("next") ?? "/account";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/account";
  }

  if (code && getSupabaseEnv().hosted) {
    const supabase = await supabaseServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Behind Vercel's proxy the request origin is the internal host —
      // x-forwarded-host is the address the visitor actually sees.
      const forwardedHost = request.headers.get("x-forwarded-host");
      if (process.env.NODE_ENV === "development" || !forwardedHost) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/account?auth_error=1`);
}
