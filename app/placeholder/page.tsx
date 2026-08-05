/**
 * ROLE OF THIS FILE
 * /placeholder — the stand-in destination for homepage carousel cards whose
 * real target is not decided yet (H-03 hero, H-19 occasion rail, and the other
 * card rails). The IxD table wants each card to open "the corresponding
 * product detail page"; that mapping waits on real product content (OQ-3), so
 * until then every carousel card lands here instead of nowhere.
 *
 * When the targets are decided, point the cards at them and delete this route.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/chrome";
import { inter } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Placeholder — ELDREVE",
  robots: { index: false },
};

export default function PlaceholderPage() {
  return (
    <main
      className={inter.className}
      style={{ minHeight: "100vh", background: "#FFF6EC", color: "#3B2F2F" }}
    >
      <div
        style={{ maxWidth: 430, margin: "0 auto", padding: "64px 24px 140px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/placeholder.png"
          alt="Placeholder"
          style={{
            width: "100%",
            maxWidth: 260,
            display: "block",
            borderRadius: 12,
          }}
        />
        <h1
          style={{
            marginTop: 28,
            fontSize: 24,
            fontWeight: 700,
            lineHeight: "30px",
          }}
        >
          Placeholder page
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            lineHeight: "21px",
            color: "#7c6e50",
          }}
        >
          This is where a carousel card will take you once its real destination
          is decided. Nothing here is final.
        </p>
        <Link
          href="/shop"
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
          BROWSE THE SHOP ›
        </Link>
      </div>
      <BottomNav active="Home" />
    </main>
  );
}
