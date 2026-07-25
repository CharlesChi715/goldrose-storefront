/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-5 · "Shop by Occasion" of the VELORIA homepage frame (Figma node
 * 138:61, [0,3204 430×558]): ornamented title, static occasion filter chips,
 * a clipped horizontal rail of occasion/recipient cards (each → /shop),
 * carousel dots, and the "Just Because" note card. All coordinates, colors
 * and type values are verbatim from the Figma REST data; rail items past
 * x=430 are intentionally clipped by the module frame.
 */

import Link from "next/link";
import { abs } from "@/components/veloria";
import { playfair, notoSC, goudy } from "@/lib/fonts";

export function A5() {
  return (
    // 138:61 — module frame; clips the over-wide chip + card rails.
    <div style={{ ...abs(0, 3204, 430, 558), background: "#FFF6EC", overflow: "hidden" }}>
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

      {/* 417:261 · occasion filter chips (static, non-clickable) */}
      {/* 425:150 · Valentine's Day (selected) */}
      <div
        style={{
          ...abs(12, 91, 118, 30),
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
      </div>
      {/* 162:103 · Mother's Day */}
      <div
        style={{
          ...abs(135, 91, 86, 30),
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
      </div>
      {/* 162:105 · Birthday */}
      <div
        style={{
          ...abs(226, 91, 70, 30),
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
      </div>
      {/* 162:107 · Wedding */}
      <div
        style={{
          ...abs(301, 91, 70, 30),
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
      </div>
      {/* 162:109 · Graduation (clipped at the module's right edge) */}
      <div
        style={{
          ...abs(376, 91, 82, 30),
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
      </div>
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
          style={{ ...abs(12, 336, 186, 16), display: "block", objectFit: "none", objectPosition: "center center" }}
        />
      </Link>

      {/* 436:319 · recipient card rail */}
      {/* 436:277 · Recipient Card · Gifts for Wife */}
      <Link
        href="/shop"
        style={{
          ...abs(15, 142, 176, 257),
          display: "block",
          background: "#FFFBF6",
          boxShadow: "inset 0 0 0 1px #E5D1B8",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* 436:278 · image well; 436:279 is a shared bleed crop (negative offsets verbatim) */}
        <div
          style={{
            ...abs(0, 0, 176, 156),
            background: "#F3C6D1",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <img
            src="/veloria/home/436-279.png"
            alt="Gold-dipped rose gift"
            style={{ ...abs(-25.4, -210.82, 546.1, 911.9), display: "block", maxWidth: "none" }}
          />
        </div>
        {/* 436:281 · title */}
        <div
          className={playfair.className}
          style={{
            ...abs(12, 159, 152),
            fontSize: 16,
            lineHeight: "21px",
            color: "#3B2F2F",
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Valentine's Day\nGifts"}
        </div>
        {/* 436:282 · copy (Goudy is single-weight; design's 500 not applied) */}
        <div
          className={goudy.className}
          style={{
            ...abs(27, 206, 122),
            fontSize: 8,
            lineHeight: "12px",
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          For the one who means everything.
        </div>
        {/* 436:283 · card ornament */}
        <img
          src="/veloria/home/436-283.svg"
          alt=""
          style={{ ...abs(61.233, 223, 53.534, 12.818), display: "block" }}
        />
        {/* 436:290 · CTA (rendered strip) */}
        <img
          src="/veloria/home/191-154.svg"
          alt="SHOP WIFE GIFTS →"
          width={152}
          height={13}
          style={{ ...abs(12, 240.82, 152, 13), display: "block", objectFit: "none", objectPosition: "center center" }}
        />
      </Link>

      {/* 436:291 · Recipient Card · Thoughtful Gifts She'll Love */}
      <Link
        href="/shop"
        style={{
          ...abs(201, 142, 176, 257),
          display: "block",
          background: "#FFFBF6",
          boxShadow: "inset 0 0 0 1px #E5D1B8",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* 436:292 · image well; 436:293 same bleed crop, shifted */}
        <div
          style={{
            ...abs(0, 0, 176, 156),
            background: "#F3C6D1",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <img
            src="/veloria/home/436-293.png"
            alt="Gold-dipped rose gift"
            style={{ ...abs(-241.3, -210.82, 546.1, 911.9), display: "block", maxWidth: "none" }}
          />
        </div>
        {/* 436:295 · title */}
        <div
          className={playfair.className}
          style={{
            ...abs(12, 161, 152),
            fontSize: 16,
            lineHeight: "21px",
            color: "#3B2F2F",
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Valentine's Day\nGifts"}
        </div>
        {/* 436:296 · copy */}
        <div
          className={goudy.className}
          style={{
            ...abs(12, 208, 152),
            fontSize: 8,
            lineHeight: "12px",
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Romantic gifts to make her feel cherished.
        </div>
        {/* 436:297 · card ornament */}
        <img
          src="/veloria/home/436-283.svg"
          alt=""
          style={{ ...abs(61.233, 225, 53.534, 12.818), display: "block" }}
        />
        {/* 436:304 · CTA (rendered strip) */}
        <img
          src="/veloria/home/191-154.svg"
          alt="SHOP WIFE GIFTS →"
          width={152}
          height={13}
          style={{ ...abs(12, 242.82, 152, 13), display: "block", objectFit: "none", objectPosition: "center center" }}
        />
      </Link>

      {/* 436:305 · Recipient Card · Anniversary Gifts for Wife (mostly clipped) */}
      <Link
        href="/shop"
        style={{
          ...abs(387, 142, 176, 257),
          display: "block",
          background: "#FFFBF6",
          boxShadow: "inset 0 0 0 1px #E5D1B8",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* 436:306 · image well; 436:307 same bleed crop, shifted */}
        <div
          style={{
            ...abs(0, 0, 176, 156),
            background: "#F3C6D1",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <img
            src="/veloria/home/436-307.png"
            alt="Gold-dipped rose gift"
            style={{ ...abs(-457.2, -210.82, 546.1, 911.9), display: "block", maxWidth: "none" }}
          />
        </div>
        {/* 436:308 · title */}
        <div
          className={playfair.className}
          style={{
            ...abs(12, 166, 152),
            fontSize: 16,
            lineHeight: "18px",
            color: "#3B2F2F",
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Anniversary Gifts\nfor Wife"}
        </div>
        {/* 436:309 · copy */}
        <div
          className={notoSC.className}
          style={{
            ...abs(14, 207, 148),
            fontSize: 9,
            lineHeight: "12px",
            color: "#3B2F2F",
            fontWeight: 400,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Celebrate your love with a timeless gift.
        </div>
        {/* 436:311 · card ornament */}
        <img
          src="/veloria/home/436-283.svg"
          alt=""
          style={{ ...abs(61.233, 236, 53.534, 12.818), display: "block" }}
        />
        {/* 436:310 · CTA (rendered strip) */}
        <img
          src="/veloria/home/191-154.svg"
          alt="SHOP WIFE GIFTS →"
          width={152}
          height={13}
          style={{ ...abs(12, 261, 152, 13), display: "block", objectFit: "none", objectPosition: "center center" }}
        />
      </Link>

      {/* 429:149 · carousel dots */}
      <div style={{ ...abs(145, 424, 135, 10), overflow: "hidden" }}>
        <div style={{ ...abs(0, 0.5, 9, 9), background: "#B27A38", borderRadius: 9999 }} />
        <div style={{ ...abs(22, 1, 8, 8), background: "#E5D1B2", borderRadius: 9999 }} />
        <div style={{ ...abs(43, 1, 8, 8), background: "#E5D1B2", borderRadius: 9999 }} />
        <div style={{ ...abs(64, 1, 8, 8), background: "#E5D1B2", borderRadius: 9999 }} />
        <div style={{ ...abs(85, 1, 8, 8), background: "#E5D1B2", borderRadius: 9999 }} />
        <div style={{ ...abs(106, 1, 8, 8), background: "#E5D1B2", borderRadius: 9999 }} />
        <div style={{ ...abs(127, 1, 8, 8), background: "#E5D1B2", borderRadius: 9999 }} />
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
          style={{ ...abs(370, 6, 12, 43), display: "block", objectFit: "none", objectPosition: "left center" }}
        />
      </Link>
    </div>
  );
}
