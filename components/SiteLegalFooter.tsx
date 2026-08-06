/**
 * ROLE OF THIS FILE
 * The always-visible legal identity line: brand, registered entity, and a
 * link to the full Contact & Legal Notice. The web convention Apple and
 * every other store follow — small grey type, bottom of the page.
 *
 * WHY IT LIVES OUTSIDE THE FIGMA CANVAS. Every public page is a pixel-exact
 * import rendered inside <ScaleFrame> at a fixed height, so a line added
 * *inside* one would overflow the frame and be overwritten by the next
 * design sync. This renders as a sibling AFTER the ScaleFrame instead: it is
 * ordinary document flow at real CSS pixels, touches no imported band, and
 * survives every sync. When the design team draws a footer of their own,
 * delete this and the call sites.
 *
 * WHY IT EXISTS AT ALL (2026-08-06). TikTok's Business API application was
 * rejected with "your company name doesn't match your email domain or
 * company website information" — a reviewer opened eldreve.com, could not
 * find the applying entity anywhere, and refused. Platform reviewers and
 * crawlers do not open hamburger menus; the name has to be on the page.
 *
 * The bottom padding clears the fixed BottomNav (59px) and, on shop and
 * product pages, the ConciergeChat bar that floats above it.
 *
 * AI-TAG(AI-034): AGENT-DECISION — this footer is the agent's own, not the
 * design team's; they may want to draw one instead. See
 * /agent-delivery/sessions/company-legal-info-08-06-worktree-feat-company-legal-info.md.
 */

import Link from "next/link";
import { getSettingsMap } from "@/lib/admin/settings";

/**
 * The site-wide legal identity strip. Reads the `store` setting directly, so
 * a page only has to render it. Never throws: with no database it falls back
 * to the brand name alone rather than breaking a page that would otherwise
 * render from fixed design values.
 *
 * @returns The footer strip.
 */
export async function SiteLegalFooter() {
  let brand = "ELDREVE";
  let legalName = "";
  try {
    const { store } = await getSettingsMap();
    brand = store.name || brand;
    legalName = store.legal_name.trim();
  } catch {
    // Fixed design still renders with no DB.
  }

  return (
    <footer
      style={{
        background: "#FFF6EC",
        color: "#3B2F2F",
        padding: "22px 24px 96px",
        textAlign: "center",
        fontSize: 11,
        lineHeight: "18px",
        letterSpacing: 0.2,
      }}
    >
      <div style={{ opacity: 0.62 }}>
        © {new Date().getFullYear()} {brand}
        {legalName ? ` · ${legalName}` : ""}
      </div>
      <Link
        href="/policies/contact-legal"
        style={{
          display: "inline-block",
          marginTop: 6,
          color: "#3B2F2F",
          opacity: 0.62,
          textDecoration: "underline",
        }}
      >
        Contact &amp; Legal Notice
      </Link>
    </footer>
  );
}
