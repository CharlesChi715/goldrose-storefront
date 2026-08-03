/**
 * ROLE OF THIS FILE
 * The shared coming-soon scaffold behind every /policies/* route (added
 * 2026-08-02 with the POLICIES-LEGAL hub, 1523:1136). The seven policy PAGE
 * frames exist in the design file but none is marked Ready-for-dev, so the
 * hub's links land on this deliberately quiet cream page — centred Playfair
 * title, one-line note, back link — instead of an invented design. Each
 * route file names the frame that will replace it.
 *
 * Since 2026-08-04 it also backs /blog, whose BLOG-JOURNAL-PAGE frame
 * (1593:115) is likewise un-marked but is linked from the Ready-for-dev
 * homepage footer — hence the overridable back link.
 *
 * AI-TAG(AI-012): PLACEHOLDER — seven /policies/* routes are coming-soon
 * scaffolds until their frames are Ready-for-dev. See
 * /agent-delivery/sessions/figma-sync-08-02-feat-figma-sync.md.
 */

import Link from "next/link";
import { notoSC, playfair } from "@/lib/fonts";

/**
 * A quiet placeholder page for a policy document that is not designed yet.
 *
 * @param title - The policy's name, verbatim from the hub entry.
 * @param backHref - Where the back link goes; defaults to the policies hub.
 * @param backLabel - The back link's text; defaults to "Policies & Legal".
 * @returns The centred coming-soon page.
 */
export function PolicyComingSoon({
  title,
  backHref = "/account/policies-legal",
  backLabel = "Policies & Legal",
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main
      className={notoSC.className}
      style={{ minHeight: "100vh", background: "#FFF6EC", color: "#3B2F2F" }}
    >
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          padding: "140px 24px 140px",
          textAlign: "center",
        }}
      >
        <h1
          className={playfair.className}
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 500,
            lineHeight: "34px",
          }}
        >
          {title}
        </h1>
        <p style={{ marginTop: 16, fontSize: 13, lineHeight: "21px" }}>
          This page is coming soon.
        </p>
        <Link
          href={backHref}
          style={{
            display: "inline-block",
            marginTop: 28,
            fontSize: 12.5,
            fontWeight: 500,
            color: "#3B2F2F",
            textDecoration: "none",
          }}
        >
          ‹&nbsp;&nbsp;{backLabel}
        </Link>
      </div>
    </main>
  );
}
