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

// `/preview` is the admin's own section previews (§9.8.1). It already 404s for
// anyone who is not signed in and carries noindex, so this is not what protects
// it — it is here so crawlers do not spend budget on a URL space that can only
// ever answer 404, for the same reason /admin is listed.
const BLOCKED_PATHS = ["/admin", "/checkout", "/api", "/preview"];

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
