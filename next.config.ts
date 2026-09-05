import type { NextConfig } from "next";

// Response headers every route sends. This is the low-risk baseline a shop
// that takes payments is expected to have. A Content-Security-Policy is
// deliberately NOT here yet: PayPal's SDK, Supabase and the inline JSON-LD on
// the product pages each need their own allowance, and a wrong CSP breaks
// checkout silently — it gets its own change, tested against a live checkout.
const securityHeaders = [
  // The admin previews the storefront inside same-origin <iframe>s (Content →
  // Home), so SAMEORIGIN rather than DENY: strangers may not frame us; we may.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Browsers must trust the declared Content-Type and never sniff a response
  // into a script or stylesheet.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only our origin when a visitor leaves for another site — today's
  // browser default, made explicit so every browser behaves the same.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing on the site uses these; switching them off closes that door for
  // any third-party script too. `payment` and `publickey-credentials-get` are
  // deliberately NOT restricted — PayPal and passkeys need them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // `X-Powered-By: Next.js` tells every visitor the framework and nothing else
  // of use.
  poweredByHeader: false,
  // The advisor route reads docs/advisor/app-info.md at request time. Tracing
  // only follows imports, so a plain file read would work locally and 404 on
  // Vercel — name the file here and it ships inside the function bundle.
  outputFileTracingIncludes: {
    "/api/advisor": ["./docs/advisor/app-info.md"],
  },
  experimental: {
    serverActions: {
      // Forum attachments (owner request 2026-07-22): up to 5 files ×
      // 5 MB per post — the 1 MB default would reject them.
      bodySizeLimit: "30mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Static design/nav/product images (Figma exports; replaced rarely and
        // only by hand). Default is max-age=0 → every repeat view revalidates;
        // cache 7 days and serve stale for 30 while revalidating instead.
        source: "/:dir(eldreve|home|products|top-nav)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
