/**
 * ROLE OF THIS FILE
 * /blog — scaffold for the un-ready Figma frame 1593:115 (BLOG-JOURNAL-PAGE).
 * The homepage footer (2380:855, Ready-for-dev) links here, so the route has
 * to resolve; the frame itself is NOT marked Ready-for-dev, so no design is
 * invented. This page was once built for real (2026-07-31) and reverted for
 * the same reason — see docs/ixd/README.md.
 *
 * AI-TAG(AI-026): PLACEHOLDER — /blog is a coming-soon scaffold until
 * BLOG-JOURNAL-PAGE (1593:115) is marked Ready-for-dev. See
 * /agent-delivery/sessions/figma-sync-homepage-08-04-feat-figma-sync.md.
 */

import type { Metadata } from "next";
import { PolicyComingSoon } from "@/components/screens/PolicyComingSoon";

export const metadata: Metadata = {
  title: "Journal — GoldRose",
  robots: { index: false },
};

export default function BlogComingSoonPage() {
  return <PolicyComingSoon title="Journal" backHref="/" backLabel="Home" />;
}
