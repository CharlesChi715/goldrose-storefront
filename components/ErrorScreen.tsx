/**
 * ROLE OF THIS FILE
 * The one screen behind every "something went wrong" page: 404, a thrown
 * render error, and the root-layout failure that has no layout left to render
 * inside. Three routes, one look, so a visitor who hits any of them still
 * recognises the shop.
 *
 * Deliberately plain. The storefront is a pixel-exact Figma import whose pages
 * are absolutely positioned inside a scaled 430px canvas, and none of that
 * machinery can be trusted at the moment it has just thrown — an error page
 * that depends on the layout it is reporting the failure of is an error page
 * that shows a blank screen. So this uses inline styles and the brand's own
 * colour variables, and nothing else.
 */

import Link from "next/link";
import { playfair } from "@/lib/fonts";

/** Brand ink and ground, matching the tokens in app/globals.css. */
const INK = "#231f20";
const GROUND = "#fffaf6";
const GOLD = "#c28a2e";

export function ErrorScreen({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  /** An optional extra control, e.g. a retry button. */
  action?: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: GROUND,
        color: INK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <p
        className={playfair.className}
        style={{
          margin: 0,
          fontSize: 13,
          letterSpacing: "0.32em",
          color: GOLD,
        }}
      >
        ELDREVE
      </p>
      <h1
        className={playfair.className}
        style={{ margin: 0, fontSize: 28, fontWeight: 500, maxWidth: 420 }}
      >
        {title}
      </h1>
      <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.6, fontSize: 15 }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        {action}
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 26px",
            border: `1px solid ${INK}`,
            color: INK,
            textDecoration: "none",
            fontSize: 13,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
