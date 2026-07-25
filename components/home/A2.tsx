/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-2 · "Featured Rose Gifts" (Figma node 138:58) of the redesigned
 * GoldRose homepage: section heading + ornament, "Best Sellers" row, two
 * product cards, and carousel dots. Coordinates/colors/fonts are verbatim
 * from the Figma REST API data; product cards and "View all" link to /shop.
 */

import Link from "next/link";
import { abs } from "@/components/veloria";
import { playfair, notoSC } from "@/lib/fonts";

export function A2() {
  return (
    // 138:58 module frame — children positioned relative to (0, 843)
    <div
      data-el="HOME-FEATURED-SECTION"
      style={{ ...abs(0, 843, 430, 641), background: "#FFF6EC", overflow: "hidden" }}
    >
      {/* 157:57 ornament — Figma-rendered glyph strip (✿ hits fallback fonts) */}
      <img
        data-el="HOME-FEATURED-ORNAMENT"
        src="/veloria/home/157-57.svg"
        alt="—   ✿   —"
        width={140}
        height={22}
        style={{ ...abs(145, 24, 140, 22), display: "block", objectFit: "none", objectPosition: "center center" }}
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
          style={{ display: "block", objectFit: "none", objectPosition: "right center" }}
        />
      </Link>

      {/* 376:176 product card · Personalized Gold-Dipped Rose */}
      <Link
        data-el="HOME-FEATURED-PRODUCT-CARD-1"
        href="/shop"
        style={{
          ...abs(18, 220, 250, 366),
          display: "block",
          background: "#FFF6EC",
          borderRadius: 10,
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          overflow: "hidden",
        }}
      >
        {/* 376:177 image placeholder — the photo (frame 157:76) overlays it */}
        <div style={{ ...abs(0, 0, 250, 240), background: "#F3C6D1" }} />
        {/* 376:178 content */}
        <div style={{ ...abs(0, 240, 250, 126), overflow: "hidden" }}>
          <div
            data-el="HOME-FEATURED-PRODUCT-TITLE-1"
            className={playfair.className}
            style={{ ...abs(12, 12, 160), fontSize: 18, lineHeight: "22px", fontWeight: 500, color: "#3B2F2F" }}
          >
            Personalized Gold-Dipped Rose
          </div>
          <div
            data-el="HOME-FEATURED-PRODUCT-PRICE-1"
            className={notoSC.className}
            style={{
              ...abs(12, 57, 45),
              fontSize: 14,
              lineHeight: "16.8px",
              fontWeight: 500,
              color: "#3B2F2F",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            $79.00
          </div>
          <div
            data-el="HOME-FEATURED-PRODUCT-NOTE-1"
            className={notoSC.className}
            style={{ ...abs(12, 75, 160), fontSize: 11, lineHeight: "16px", fontWeight: 400, color: "#D4AF37" }}
          >
            Personalization available
          </div>
          {/* 376:182 cta — Figma-rendered strip */}
          <img
            data-el="HOME-FEATURED-PRODUCT-CTA-1"
            src="/veloria/home/376-182.svg"
            alt="View Product →"
            width={86}
            height={13}
            style={{ ...abs(12, 108, 86, 13), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        </div>
      </Link>

      {/* 157:76 photo frame over card 1's image area (rounded top corners) */}
      <Link
        data-el="HOME-FEATURED-PRODUCT-IMG-1"
        href="/shop"
        style={{
          ...abs(18, 220, 250, 240),
          display: "block",
          borderRadius: "15px 15px 0 0",
          overflow: "hidden",
        }}
      >
        {/* 373:174 bleeds 1px left / 7px above its clipping frame (design
            values); maxWidth none so preflight can't squash 252px to 250px */}
        <img
          src="/veloria/home/373-174.png"
          alt="Personalized gold-dipped rose"
          width={252}
          height={271}
          style={{
            ...abs(-1, -7, 252, 271),
            display: "block",
            objectFit: "cover",
            borderRadius: 22,
            maxWidth: "none",
          }}
        />
      </Link>

      {/* 377:190 carousel dots — siblings with no wrapper, so indexed
          individually rather than sharing one group name. */}
      <div data-el="HOME-FEATURED-DOT-1" style={{ ...abs(185, 619, 9, 9), background: "#D4AF37", borderRadius: 9999 }} />
      <div data-el="HOME-FEATURED-DOT-2" style={{ ...abs(204, 619, 7, 7), background: "#E5D9C9", borderRadius: 9999 }} />
      <div data-el="HOME-FEATURED-DOT-3" style={{ ...abs(221, 619, 7, 7), background: "#E5D9C9", borderRadius: 9999 }} />
      <div data-el="HOME-FEATURED-DOT-4" style={{ ...abs(238, 619, 7, 7), background: "#E5D9C9", borderRadius: 9999 }} />

      {/* 376:183 product card · Enchanted Rose with LED Light */}
      <Link
        data-el="HOME-FEATURED-PRODUCT-CARD-2"
        href="/shop"
        style={{
          ...abs(285, 237, 184, 349),
          display: "block",
          background: "#FFF6EC",
          borderRadius: 10,
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          overflow: "hidden",
        }}
      >
        {/* 376:184 product image (STRETCH — exact box, no objectFit) */}
        <img
          data-el="HOME-FEATURED-PRODUCT-IMG-2"
          src="/veloria/home/376-184.png"
          alt="Enchanted rose with LED light"
          width={184}
          height={222}
          style={{ ...abs(0, 0, 184, 222), display: "block" }}
        />
        {/* 376:185 content — runs past the card bottom in the design; the
            card's overflow hidden clips it */}
        <div style={{ ...abs(0, 222, 184, 160), overflow: "hidden" }}>
          <div
            data-el="HOME-FEATURED-PRODUCT-TITLE-2"
            className={playfair.className}
            style={{ ...abs(12, 12, 160), fontSize: 18, lineHeight: "22px", fontWeight: 500, color: "#3B2F2F" }}
          >
            Enchanted Rose with LED Light
          </div>
          <div
            data-el="HOME-FEATURED-PRODUCT-PRICE-2"
            className={notoSC.className}
            style={{
              ...abs(12, 57, 53),
              fontSize: 14,
              lineHeight: "16.8px",
              fontWeight: 500,
              color: "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            $119.00
          </div>
          <div
            data-el="HOME-FEATURED-PRODUCT-NOTE-2"
            className={notoSC.className}
            style={{ ...abs(12, 75, 160), fontSize: 11, lineHeight: "16px", fontWeight: 400, color: "#D4AF37" }}
          >
            Gift-ready packaging
          </div>
          {/* 376:189 cta — same rendered strip as card 1 */}
          <img
            data-el="HOME-FEATURED-PRODUCT-CTA-2"
            src="/veloria/home/376-182.svg"
            alt="View Product →"
            width={86}
            height={13}
            style={{ ...abs(12, 108, 86, 13), display: "block", objectFit: "none", objectPosition: "left center" }}
          />
        </div>
      </Link>
    </div>
  );
}
