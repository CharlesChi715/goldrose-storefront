/**
 * ROLE OF THIS FILE
 * /account/returns/request-submitted — a coming-soon scaffold, not a design
 * import. The Ready-for-dev return sheet (/orders/track?return=1, 1523:1375)
 * prototype-navigates its Confirm Return button (1523:1430) to
 * RETURNS-REQUEST-SUBMITTED-PAGE (1593:114), which is itself not marked
 * Ready-for-dev — so the link resolves here until that frame is marked and
 * imported (the newer AFTER-SALES batch names this exact route, 2030:185).
 * Replace this file with the real screen when the frame is ready.
 * AI-TAG(AI-007): PLACEHOLDER — coming-soon scaffold, no real screen behind it.
 * See /agent-delivery/sessions/figma-sync-07-31-feat-figma-sync-0731.md.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { inter } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Return request — GoldRose",
  robots: { index: false },
};

export default function ReturnRequestSubmittedPage() {
  return (
    <main
      className={inter.className}
      style={{ minHeight: "100vh", background: "#FFF6EC", color: "#3B2F2F" }}
    >
      <div
        style={{ maxWidth: 430, margin: "0 auto", padding: "64px 24px 140px" }}
      >
        <h1
          style={{
            marginTop: 28,
            fontSize: 24,
            fontWeight: 700,
            lineHeight: "30px",
          }}
        >
          Return request received
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            lineHeight: "21px",
            color: "#7c6e50",
          }}
        >
          The confirmation screen for return requests is still being designed.
          Nothing here is final, and no return has actually been filed.
        </p>
        <Link
          href="/account/returns"
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "14px 22px",
            background: "#3B2F2F",
            color: "#FFF6EC",
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          RETURNS &amp; AFTER-SALES ›
        </Link>
      </div>
    </main>
  );
}
