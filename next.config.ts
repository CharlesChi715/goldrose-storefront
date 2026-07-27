import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        source: "/:dir(veloria|home|products|top-nav)/:path*",
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
