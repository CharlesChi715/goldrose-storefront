/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-5 · "Shop by Occasion" of the simplified homepage frame (Figma
 * node 2380:454, [0,1749 430×476]): ornamented title, occasion filter chips
 * (each → /shop), an auto-sliding horizontal rail of recipient cards (each →
 * /shop), and carousel dots. All coordinates, colors and type values are
 * verbatim from the Figma REST data; rail items past x=430 are intentionally
 * clipped by the module frame.
 *
 * 2026-08-04 sync: the band swapped its 4th/5th chips (Wedding/Graduation →
 * Christmas/Anniversary), dropped the 6th chip and the "Just Because" note
 * card, and lost 82px of height. Two nodes that DO exist in the frame are
 * deliberately not built: "A5 Prompt" (2380:464) and "Button · Explore
 * Occasion Gifts" (2380:478) sit at y=511/547 inside a 476-tall clipping
 * frame, so the design itself renders neither.
 *
 * 2026-08-10 sync: the band moved 1868 → 1749, the "—   ♡   —" eyebrow the
 * 08-04 delivery had added is deleted again, and the typography pass reset the
 * title (30 → 36), the intro (10 → 13) and every chip label (9 → 13) — the
 * taller chip labels are why the chip row itself drops 11px.
 */

import Link from "next/link";
import { OccasionRail } from "@/components/home/OccasionRail";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC } from "@/lib/fonts";
import type { RailTiming } from "@/lib/home-content/rail-timing";
import type { HomeFrames } from "@/lib/home-content/frames";
import type { HomeText } from "@/lib/home-content/registry";

export function A5({
  c,
  timing,
  frames,
}: {
  c: HomeText["occasion"];
  timing: RailTiming;
  frames?: HomeFrames;
}) {
  return (
    // 138:61 — module frame; clips the over-wide chip + card rails.
    <div
      style={{
        ...abs(0, 1749, 430, 476),
        background: "#FFF6EC",
        overflow: "hidden",
      }}
    >
      {/* 2380:479 · header ornament (rose + lines) */}
      <img
        src="/eldreve/home/424-150.svg"
        alt=""
        width={142}
        height={34}
        style={{ ...abs(144, 0, 142, 34), display: "block" }}
      />

      {/* The "—   ♡   —" eyebrow (2380:455) added on 08-04 was deleted at
          source on 08-10. */}

      {/* 2380:456 · title */}
      <div
        data-field="occasion.title"
        className={playfair.className}
        style={{
          ...abs(24, 31, 382),
          fontSize: 36,
          lineHeight: "36px",
          color: "#3B2F2F",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {c.title}
      </div>

      {/* 162:84 · intro */}
      <div
        data-field="occasion.intro"
        className={notoSC.className}
        style={{
          ...abs(55, 73, 326),
          fontSize: 13,
          lineHeight: "15px",
          color: "#3B2F2F",
          fontWeight: 400,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {c.intro}
      </div>

      {/*
        417:261 · occasion filter chips. Per-occasion filtering does not exist
        yet, so every chip lands on the full shop; the design's selected state
        (425:150) stays purely visual.
      */}
      {/* 425:150 · Valentine's Day (selected) */}
      <Link
        data-field="occasion.chips_href"
        href={c.chips_href}
        style={{
          ...abs(11, 102, 118, 30),
          display: "block",
          background: "#FFF9F0",
          boxShadow: "inset 0 0 0 1px #C77D2B",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <img
          src="/eldreve/home/425-151.svg"
          alt=""
          style={{ ...abs(3, 6, 16.5, 18), display: "block" }}
        />
        <div
          data-field="occasion.chip_1"
          className={notoSC.className}
          style={{
            ...abs(23, 7, 93),
            fontSize: 13,
            lineHeight: "16px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {c.chip_1}
        </div>
      </Link>
      {/* 162:103 · Mother's Day */}
      <Link
        data-field="occasion.chips_href"
        href={c.chips_href}
        style={{
          ...abs(134, 102, 86, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          data-field="occasion.chip_2"
          className={notoSC.className}
          style={{
            ...abs(4, 7, 79),
            fontSize: 13,
            lineHeight: "16px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {c.chip_2}
        </div>
      </Link>
      {/* 162:105 · Birthday */}
      <Link
        data-field="occasion.chips_href"
        href={c.chips_href}
        style={{
          ...abs(225, 102, 70, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          data-field="occasion.chip_3"
          className={notoSC.className}
          style={{
            ...abs(9, 7, 53),
            fontSize: 13,
            lineHeight: "16px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {c.chip_3}
        </div>
      </Link>
      {/* 2380:474 · Christmas. The Figma label reads "Chritsmas" — a source
          typo, corrected here rather than shipped to customers.
          AI-TAG(AI-024): OWNER-TODO — ask the design team to fix the label on
          node 2380:474. See
          /agent-delivery/sessions/figma-sync-homepage-08-04-feat-figma-sync.md. */}
      <Link
        data-field="occasion.chips_href"
        href={c.chips_href}
        style={{
          ...abs(300, 102, 82, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          data-field="occasion.chip_4"
          className={notoSC.className}
          style={{
            ...abs(10, 7, 62),
            fontSize: 13,
            lineHeight: "16px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {c.chip_4}
        </div>
      </Link>
      {/* 2380:475 · Anniversary (clipped at the module's right edge) */}
      <Link
        data-field="occasion.chips_href"
        href={c.chips_href}
        style={{
          ...abs(387, 102, 86, 30),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          data-field="occasion.chip_5"
          className={notoSC.className}
          style={{
            ...abs(7, 7, 72),
            fontSize: 13,
            lineHeight: "16px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {c.chip_5}
        </div>
      </Link>
      {/* 425:155 · more-occasions arrow (off-canvas) */}
      <img
        src="/eldreve/home/425-155.svg"
        alt=""
        width={12}
        height={18}
        style={{ ...abs(478, 108, 12, 18), display: "block" }}
      />

      {/* 162:95 · Occasion Card · Valentine's Day (off-canvas rail item)

          Deliberately NOT given a `data-field`. It sits at x=464 inside a
          430-wide `overflow: hidden` frame, so it is clipped away entirely —
          tagging it would hand the admin's picker a sixth element for
          `chips_href` whose highlight lands off-canvas, over the neighbouring
          band. Dead content should be deleted rather than made addressable;
          that is a design-team call, so for now it is only excluded. */}
      <Link
        href={c.chips_href}
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
            src="/eldreve/home/162-97.png"
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
            fontSize: 11,
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
          src="/eldreve/home/189-149.svg"
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

      <OccasionRail c={c} timing={timing} frames={frames} />

      {/* 2380:486 · dots 4–7 — the design draws seven for three cards, so
          these four stay inert; OccasionRail wires the first three. Positioned
          individually rather than inside the design's 135×10 wrapper: that
          wrapper spans the whole strip and would sit over the wired dots,
          swallowing their clicks. */}
      {[209, 230, 251, 272].map((x) => (
        <div
          key={x}
          style={{
            ...abs(x, 430, 8, 8),
            background: "#E5D1B2",
            borderRadius: 9999,
          }}
        />
      ))}
    </div>
  );
}
