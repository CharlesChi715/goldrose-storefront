import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Forum attachments (owner request 2026-07-22): up to 5 files ×
      // 5 MB per post — the 1 MB default would reject them.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
