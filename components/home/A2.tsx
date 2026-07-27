/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-2 · "Featured Rose Gifts" (Figma node 138:58) of the redesigned
 * GoldRose homepage: section heading + ornament, "Best Sellers" row, two
 * product cards, and carousel dots. Coordinates/colors/fonts are verbatim
 * from the Figma REST API data; product cards and "View all" link to /shop.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC } from "@/lib/fonts";
import { BestSellersRail } from "@/components/home/BestSellersRail";

export function A2() {
  return (
    // 138:58 module frame — children positioned relative to (0, 843)
    <div
      data-el="HOME-FEATURED-SECTION"
      style={{
        ...abs(0, 843, 430, 641),
        background: "#FFF6EC",
        overflow: "hidden",
      }}
    >
      {/* 157:57 ornament — Figma-rendered glyph strip (✿ hits fallback fonts) */}
      <img
        data-el="HOME-FEATURED-ORNAMENT"
        src="/veloria/home/157-57.svg"
        alt="—   ✿   —"
        width={140}
        height={22}
        style={{
          ...abs(145, 24, 140, 22),
          display: "block",
          objectFit: "none",
          objectPosition: "center center",
        }}
      />

      {/* 157:58 section title */}
      <div
        data-el="HOME-FEATURED-TITLE"
        className={playfair.className}
        style={{
          ...abs(38, 62, 354),
          fontSize: 34,
          lineHeight: "42px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Featured Rose Gifts
      </div>

      {/* 157:59 subtitle */}
      <div
        data-el="HOME-FEATURED-SUBTITLE"
        className={notoSC.className}
        style={{
          ...abs(54, 112, 322),
          fontSize: 12,
          lineHeight: "18px",
          fontWeight: 400,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Timeless roses for meaningful moments.
      </div>

      {/* 157:60 "Best Sellers" heading */}
      <div
        data-el="HOME-FEATURED-BESTSELLER-TITLE"
        className={playfair.className}
        style={{
          ...abs(20, 176, 220),
          fontSize: 24,
          lineHeight: "30px",
          fontWeight: 500,
          color: "#3B2F2F",
          whiteSpace: "nowrap",
        }}
      >
        Best Sellers
      </div>

      {/* 157:61 "View all  →" — Figma-rendered strip, links to /shop */}
      <Link
        data-el="HOME-FEATURED-VIEW-ALL-LINK"
        href="/shop"
        style={{ ...abs(328, 184, 82, 22), display: "block" }}
      >
        <img
          src="/veloria/home/157-61.svg"
          alt="View all →"
          width={82}
          height={22}
          style={{
            display: "block",
            objectFit: "none",
            objectPosition: "right center",
          }}
        />
      </Link>

      {/* Best Sellers rail (H-09): card 376:176 + photo frame 157:76 + dots
          377:190, now a slow one-card-at-a-time carousel. The design's second
          card (376:183) is superseded by the rail's mocked copies — see
          BestSellersRail.tsx. */}
      <BestSellersRail />
    </div>
  );
}
