import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
