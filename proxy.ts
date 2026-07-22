/**
 * ROLE OF THIS FILE
 * Auth proxy (Next 16 name for middleware, §9.2). Matcher covers ONLY
 * /admin and /api/admin —
 * storefront routes stay static, and the payment webhook + beacon routes
 * stay open (signature verification is their auth).
 *
 * Hosted Supabase: refreshes the session cookie on every admin request
 * (@supabase/ssr getAll/setAll pattern) and bounces logged-out visitors to
 * /admin/login. Local mode: cookie-presence redirect only — the signed
 * cookie is actually VERIFIED by requireAdmin() in the admin layout and in
 * every server action (the edge runtime has no fs access for the secret).
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login";
const SESSION_COOKIE = "admin_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login screen itself is the one unauthenticated admin page.
  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const hosted = Boolean(url && anonKey);

  if (!hosted) {
    // Testing-phase open access: no Supabase and no ADMIN_DEV_PASSWORD →
    // no login required (see lib/admin/auth.ts isOpenAccess).
    if (!process.env.ADMIN_DEV_PASSWORD?.trim()) {
      return NextResponse.next();
    }
    if (!request.cookies.get(SESSION_COOKIE)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PATH;
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ADMIN_OPEN_ACCESS=1 (testing-phase override, see lib/admin/auth.ts):
  // keep the admin open on hosted Supabase; remove the env var at launch.
  const openAccess = ["1", "true"].includes(
    (process.env.ADMIN_OPEN_ACCESS ?? "").trim().toLowerCase(),
  );

  if (!user && !openAccess) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    const redirect = NextResponse.redirect(loginUrl);
    // Keep any refreshed auth cookies on the redirect.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
