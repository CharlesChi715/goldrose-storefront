/**
 * ROLE OF THIS FILE
 * The quiet coming-soon scaffold for a page whose frame is not Ready-for-dev
 * yet — a deliberately plain cream page (brand top nav, centred Playfair
 * title, one-line note, back link) rather than an invented design. Added
 * 2026-08-02 with the POLICIES-LEGAL hub (1523:1136), when it stood behind
 * all seven /policies/* routes.
 *
 * **Only /blog still uses it.** On 2026-08-18 the design team's six policy
 * documents were marked Ready-for-dev and imported, so those routes now
 * render the real frames through PolicyDocumentScreen; /policies/contact-legal
 * had already been built out on 2026-08-06. What is left is /blog, whose
 * BLOG-JOURNAL-PAGE frame (1593:115) is still un-marked while being linked
 * from the Ready-for-dev homepage footer — hence the overridable back link,
 * which /blog is the only caller to use.
 *
 * Keep the component rather than inlining it into /blog: it is the house
 * answer to "a frame links here but the design is not ready", and the next
 * scaffolded target (/craft, /story) will want exactly this page.
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
