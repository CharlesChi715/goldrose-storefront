"use client";

/**
 * ROLE OF THIS FILE
 * The last resort: an error thrown by the ROOT layout itself, which is the one
 * failure `app/error.tsx` cannot catch, because that page renders inside the
 * layout that has just failed.
 *
 * It therefore has to supply its own `<html>` and `<body>` — this is the only
 * file in the App Router that does — and it cannot import anything the root
 * layout provides, which is why the markup here is deliberately hand-rolled
 * rather than sharing `ErrorScreen`: that component pulls in a font loader and
 * the router's `Link`, and neither can be assumed alive at this point.
 *
 * In practice this should never render. It exists so that if it ever does, a
 * visitor sees a sentence rather than a blank white page.
 */

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          background: "#fffaf6",
          color: "#231f20",
          fontFamily: "Georgia, 'Times New Roman', serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            letterSpacing: "0.32em",
            color: "#c28a2e",
          }}
        >
          ELDREVE
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>
          The site is temporarily unavailable
        </h1>
        <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.6, fontSize: 15 }}>
          We are aware and looking into it. Please try again shortly.
          {error.digest ? ` Reference ${error.digest}.` : ""}
        </p>
        {/* A plain anchor, not next/link, and the lint rule is wrong here for
            once: this file renders when the ROOT layout has thrown, so the
            router is part of what may have failed. A full page load is not a
            missed optimisation, it is the recovery. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{
            marginTop: 8,
            padding: "12px 26px",
            border: "1px solid #231f20",
            color: "#231f20",
            textDecoration: "none",
            fontSize: 13,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Reload the shop
        </a>
      </body>
    </html>
  );
}
