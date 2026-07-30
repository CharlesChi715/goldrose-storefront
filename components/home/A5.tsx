/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-5 · "Shop by Occasion" of the VELORIA homepage frame (Figma node
 * 138:61, [0,3204 430×558]): ornamented title, occasion filter chips (each →
 * /shop), an auto-sliding horizontal rail of recipient cards (each → /shop),
 * carousel dots, and the "Just Because" note card. All coordinates, colors
 * and type values are verbatim from the Figma REST data; rail items past
 * x=430 are intentionally clipped by the module frame.
 */

import Link from "next/link";
import { OccasionRail } from "@/components/home/OccasionRail";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC } from "@/lib/fonts";

export function A5() {
  return (
    // 138:61 — module frame; clips the over-wide chip + card rails.
    <div
      style={{
        ...abs(0, 3204, 430, 558),
        background: "#FFF6EC",
        overflow: "hidden",
      }}
    >
      {/* 424:150 · header ornament (rose + lines) */}
      <img
        src="/veloria/home/424-150.svg"
        alt=""
        width={142}
        height={34}
        style={{ ...abs(144, 0, 142, 34), display: "block" }}
      />

      {/* 162:83 · title */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 31, 382),
          fontSize: 30,
          lineHeight: "36px",
          color: "#3B2F2F",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Shop by Occasion
      </div>

      {/* 162:84 · intro */}
      <div
        className={notoSC.className}
        style={{
          ...abs(52, 67, 326),
          fontSize: 10,
          lineHeight: "15px",
          color: "#3B2F2F",
          fontWeight: 400,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Find a GoldRose for every meaningful moment.
      </div>

      {/*
        417:261 · occasion filter chips. Per-occasion filtering does not exist
        yet, so every chip lands on the full shop; the design's selected state
        (425:150) stays purely visual.
      */}
      {/* 425:150 · Valentine's Day (selected) */}
      <Link
        href="/shop"
        style={{
          ...abs(12, 91, 118, 30),
          display: "block",
          background: "#FFF9F0",
          boxShadow: "inset 0 0 0 1px #C77D2B",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <img
          src="/veloria/home/425-151.svg"
          alt=""
          style={{ ...abs(14.75, 6, 16.5, 18), display: "block" }}
        />
        <div
          className={notoSC.className}
          style={{
            ...abs(37.25, 9.5, 64),
            fontSize: 9,
            lineHeight: "10.8px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Valentine&apos;s Day
        </div>
      </Link>
      {/* 162:103 · Mother's Day */}
      <Link
        href="/shop"
        style={{
          ...abs(135, 91, 86, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          className={notoSC.className}
          style={{
            ...abs(15.5, 9.5, 55),
            fontSize: 9,
            lineHeight: "10.8px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Mother&apos;s Day
        </div>
      </Link>
      {/* 162:105 · Birthday */}
      <Link
        href="/shop"
        style={{
          ...abs(226, 91, 70, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          className={notoSC.className}
          style={{
            ...abs(16.5, 9.5, 37),
            fontSize: 9,
            lineHeight: "10.8px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Birthday
        </div>
      </Link>
      {/* 162:107 · Wedding */}
      <Link
        href="/shop"
        style={{
          ...abs(301, 91, 70, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 9.5, 38),
            fontSize: 9,
            lineHeight: "10.8px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Wedding
        </div>
      </Link>
      {/* 162:109 · Graduation (clipped at the module's right edge) */}
      <Link
        href="/shop"
        style={{
          ...abs(376, 91, 82, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          className={notoSC.className}
          style={{
            ...abs(17, 9.5, 48),
            fontSize: 9,
            lineHeight: "10.8px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Graduation
        </div>
      </Link>
      {/* 162:111 · Anniversary (fully off-canvas in the rail) */}
      <div
        style={{
          ...abs(463, 91, 86, 30),
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          className={notoSC.className}
          style={{
            ...abs(18, 9.5, 50),
            fontSize: 9,
            lineHeight: "10.8px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Anniversary
        </div>
      </div>
      {/* 425:155 · more-occasions arrow (off-canvas) */}
      <img
        src="/veloria/home/425-155.svg"
        alt=""
        width={12}
        height={18}
        style={{ ...abs(554, 97, 12, 18), display: "block" }}
      />

      {/* 162:95 · Occasion Card · Valentine's Day (off-canvas rail item) */}
      <Link
        href="/shop"
        style={{
          ...abs(464, 135, 210, 360),
          display: "block",
          background: "#FFFFFF",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* 162:96 · image well */}
        <div
          style={{
            ...abs(0, 0, 210, 235),
            background: "#F3C6D1",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <img
            src="/veloria/home/162-97.png"
            alt="Valentine's Day gold-dipped rose gift"
            width={210}
            height={235}
            style={{ ...abs(0, 0, 210, 235), display: "block" }}
          />
        </div>
        {/* 162:98 · label */}
        <div
          className={playfair.className}
          style={{
            ...abs(12, 244, 186),
            fontSize: 22,
            lineHeight: "21px",
            color: "#3B2F2F",
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Valentine's Day\nGifts"}
        </div>
        {/* 162:99 · copy */}
        <div
          className={notoSC.className}
          style={{
            ...abs(12, 299, 186),
            fontSize: 10.5,
            lineHeight: "14px",
            color: "#3B2F2F",
            fontWeight: 400,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Say it with a timeless rose.
        </div>
        {/* 189:149 · CTA (rendered strip) */}
        <img
          src="/veloria/home/189-149.svg"
          alt="SHOP VALENTINE'S GIFTS →"
          width={186}
          height={16}
          style={{
            ...abs(12, 336, 186, 16),
            display: "block",
            objectFit: "none",
            objectPosition: "center center",
          }}
        />
      </Link>

      <OccasionRail />

      {/* 429:149 · carousel dots */}
      <div style={{ ...abs(145, 424, 135, 10), overflow: "hidden" }}>
        <div
          style={{
            ...abs(0, 0.5, 9, 9),
            background: "#B27A38",
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            ...abs(22, 1, 8, 8),
            background: "#E5D1B2",
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            ...abs(43, 1, 8, 8),
            background: "#E5D1B2",
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            ...abs(64, 1, 8, 8),
            background: "#E5D1B2",
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            ...abs(85, 1, 8, 8),
            background: "#E5D1B2",
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            ...abs(106, 1, 8, 8),
            background: "#E5D1B2",
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            ...abs(127, 1, 8, 8),
            background: "#E5D1B2",
            borderRadius: 9999,
          }}
        />
      </div>

      {/* 436:345 · Just Because · Recipient note card */}
      <Link
        href="/shop"
        style={{
          ...abs(20, 471, 394, 67),
          display: "block",
          background: "#FFFBF6",
          boxShadow: "inset 0 0 0 1px #E5C9A8",
          borderRadius: 11,
          overflow: "hidden",
        }}
      >
        {/* 436:350 · gift icon */}
        <img
          src="/veloria/home/436-350.svg"
          alt=""
          width={32}
          height={32}
          style={{ ...abs(20, 16, 32, 32), display: "block" }}
        />
        {/* 436:347 · title */}
        <div
          className={playfair.className}
          style={{
            ...abs(71, 16, 250),
            fontSize: 15,
            lineHeight: "18px",
            color: "#3B2F2F",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          Just Because
        </div>
        {/* 436:348 · copy */}
        <div
          className={notoSC.className}
          style={{
            ...abs(71, 36, 280),
            fontSize: 9,
            lineHeight: "14px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Because meaningful moments don&apos;t need a reason.
        </div>
        {/* 436:349 · chevron (glyph strip) */}
        <img
          src="/veloria/home/192-154.svg"
          alt="›"
          width={12}
          height={43}
          style={{
            ...abs(370, 6, 12, 43),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
      </Link>
    </div>
  );
}
