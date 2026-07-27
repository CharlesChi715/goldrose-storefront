/**
 * ROLE OF THIS FILE
 * Landing for the emailed sign-in link (owner request 2026-07-27): the
 * Supabase email templates link here with a ?token_hash=, which is verified
 * server-side into a session cookie, then the visitor continues to /account
 * (or the relative `next` path the template asked for). This is Supabase's
 * recommended server-side flow — unlike the OAuth ?code= exchange next door
 * in /auth/callback, a token_hash needs no browser-stored secret, so the
 * link also works when it is opened on a different device than the one that
 * requested it.
 */

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { supabaseServerAuthClient } from "@/lib/supabase/server-auth.ts";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Open-redirect guard: relative paths only.
  let next = searchParams.get("next") ?? "/account";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/account";
  }

  if (tokenHash && type && getSupabaseEnv().hosted) {
    const supabase = await supabaseServerAuthClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
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
