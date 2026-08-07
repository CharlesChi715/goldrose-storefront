/**
 * ROLE OF THIS FILE
 * The shared coming-soon scaffold behind every /policies/* route (added
 * 2026-08-02 with the POLICIES-LEGAL hub, 1523:1136). The seven policy PAGE
 * frames exist in the design file but none is marked Ready-for-dev, so the
 * hub's links land on this deliberately quiet cream page — brand top nav,
 * centred Playfair title, one-line note, back link — instead of an invented
 * design. Each route file names the frame that will replace it.
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
import { BackButton } from "@/components/BackButton";
import { notoSC, playfair } from "@/lib/fonts";

/**
 * A quiet placeholder page for a policy document that is not designed yet.
 *
 * @param title - The policy's name, verbatim from the hub entry.
 * @param backHref - Where the back link goes, and the fallback for the header
 *   arrow when there is no on-site history; defaults to the policies hub.
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
      {/* Top nav (added 2026-08-07, owner): every coming-soon page now carries
          the same back arrow + centred ELDREVE wordmark as the designed
          screens, so a scaffold never looks like a page outside the brand.
          Geometry follows the storefront top nav — 136×40 mark, arrow at
          x36 — but laid out fluidly (this page is not a 430 canvas). */}
      <header
        style={{
          position: "relative",
          maxWidth: 430,
          margin: "0 auto",
          height: 87,
        }}
      >
        <BackButton
          fallback={backHref}
          style={{
            position: "absolute",
            left: 36,
            top: 51,
            width: 24,
            height: 24,
          }}
        />
        <Link
          href="/"
          aria-label="Home"
          style={{
            position: "absolute",
            left: "50%",
            top: 43,
            width: 136,
            height: 40,
            transform: "translateX(-50%)",
            display: "block",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eldreve/brand/eldreve-136x40.png"
            alt="ELDREVE"
            width={136}
            height={40}
            style={{ display: "block", width: 136, height: 40 }}
          />
        </Link>
      </header>
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          // 53px below the 87px header keeps the title at the same y (140) it
          // sat at before the nav band was added.
          padding: "53px 24px 140px",
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
