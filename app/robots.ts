/**
 * ROLE OF THIS FILE
 * /robots.txt (§8.1): allow the storefront, block /admin, /checkout and
 * /api, and emit the GEO policy — AI crawlers (GPTBot, ClaudeBot, …) are
 * explicitly allowed by default, switchable in Settings → Search engine &
 * AI (§9.11).
 */

import type { MetadataRoute } from "next";

// The AI-crawler toggle must take effect immediately (§9.11).
export const dynamic = "force-dynamic";
import { getSettingsMap, siteBaseUrl } from "@/lib/admin/settings";

const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Bytespider",
];

const BLOCKED_PATHS = ["/admin", "/checkout", "/api"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  let allowAi = true;
  try {
    allowAi = (await getSettingsMap()).search_engine.allow_ai_crawlers;
  } catch {
    // default: allowed (GEO, §8.1)
  }

  const rules: MetadataRoute.Robots["rules"] = [
    { userAgent: "*", allow: "/", disallow: BLOCKED_PATHS },
    ...AI_CRAWLERS.map((agent) =>
      allowAi
        ? { userAgent: agent, allow: "/", disallow: BLOCKED_PATHS }
        : { userAgent: agent, disallow: "/" },
    ),
  ];

  return {
    rules,
    sitemap: `${siteBaseUrl()}/sitemap.xml`,
  };
}
