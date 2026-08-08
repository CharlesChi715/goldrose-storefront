/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-6 "Shop by Recipient and Reviews" (Figma node 2380:523) of the
 * simplified homepage frame: recipient filter chips, three recipient gift
 * cards, and the "Real Gifts, Real Moments" review strip with carousel dots
 * and the "Read Customer Stories" button. All coordinates/colors are verbatim
 * Figma REST data, homepage-frame absolute.
 *
 * 2026-08-04 sync: the band moved 3762 → 2344 and lost three things at
 * source — the "Clients" and "Employees" chips, and the full-width "Just
 * Because" note card. The "more recipients" arrow node survives but is now an
 * empty clipped frame (no vector child), so it draws nothing and is not
 * rebuilt here.
 */

import Link from "next/link";
import { RecipientRail } from "@/components/home/RecipientRail";
import { ReviewsRail } from "@/components/home/ReviewsRail";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";
import type { RailTiming } from "@/lib/home-content/rail-timing";
import type { HomeText } from "@/lib/home-content/registry";

/* Recipient filter chips (static, not clickable). "Wife" is the selected
   state: orange stroke + orange label; the rest share the neutral pair. */
const CHIPS = [
  {
    x: 12,
    w: 46,
    stroke: "#C76E29",
    labelX: 25.5,
    labelW: 19,
    color: "#BD5C1A",
  },
  {
    x: 63,
    w: 58,
    stroke: "#E5D6C2",
    labelX: 72,
    labelW: 40,
    color: "#3B2E2E",
  },
  {
    x: 126,
    w: 42,
    stroke: "#E5D6C2",
    labelX: 136,
    labelW: 22,
    color: "#3B2E2E",
  },
  {
    x: 173,
    w: 52,
    stroke: "#E5D6C2",
    labelX: 183.5,
    labelW: 31,
    color: "#3B2E2E",
  },
  {
    x: 230,
    w: 54,
    stroke: "#E5D6C2",
    labelX: 240,
    labelW: 34,
    color: "#3B2E2E",
  },
] as const;

export function A6({
  c,
  timing,
}: {
  c: HomeText["recipient"];
  timing: RailTiming;
}) {
  const chips = [c.chip_1, c.chip_2, c.chip_3, c.chip_4, c.chip_5];
  return (
    <>
      {/* Module background (138:62) */}
      <div style={{ ...abs(0, 2344, 430, 789), background: "#FFF6EC" }} />

      {/* Header ornament · rose and lines (431:265) */}
      <img
        src="/eldreve/home/424-150.svg"
        alt=""
        width={142}
        height={34}
        style={{ ...abs(144, 2344, 142, 34), display: "block" }}
      />

      {/* Title + intro (163:82, 163:83) */}
      <div
        data-field="recipient.title"
        className={playfair.className}
        style={{
          ...abs(24, 2375, 382),
          fontSize: 30,
          lineHeight: "36px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {c.title}
      </div>
      <div
        data-field="recipient.intro"
        className={goudy.className}
        style={{
          ...abs(52, 2411, 326),
          fontSize: 10,
          lineHeight: "15px",
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {c.intro}
      </div>

      {/* Recipient filter chips (163:105…191:152) — static */}
      {CHIPS.map((chip, i) => (
        <div
          key={chip.x}
          style={{
            ...abs(chip.x, 2435, chip.w, 30),
            background: "#FFF6EC",
            borderRadius: 999,
            boxShadow: `inset 0 0 0 1px ${chip.stroke}`,
          }}
        >
          <div
            data-field={`recipient.chip_${i + 1}`}
            className={notoSC.className}
            style={{
              ...abs(chip.labelX - chip.x, 9.5, chip.labelW),
              fontSize: 9,
              lineHeight: "10.8px",
              fontWeight: 400,
              color: chip.color,
              whiteSpace: "nowrap",
            }}
          >
            {chips[i]}
          </div>
        </div>
      ))}

      {/* 2380:620 "Arrow · More Recipients" is an empty clipped frame in this
          revision — the design stripped its vector child, so it draws nothing.
          Not rebuilt; the rail's dots already signal there is more to see. */}

      {/* 2380:526 / 2380:540 / 2380:554 · recipient cards — a swipeable rail
          since 2026-08-04 (H-22), on the same shared Carousel as A-5's
          structurally identical rail. */}
      <RecipientRail c={c} timing={timing} />

      {/* 2380:601 · dots 4 and 5 — the design draws five for three cards, so
          these two stay inert; RecipientRail wires the first three. */}
      <div
        style={{
          ...abs(231, 2758.5, 7, 7),
          background: "#E0CCB2",
          borderRadius: 9999,
        }}
      />
      <div
        style={{
          ...abs(249, 2758.5, 7, 7),
          background: "#E0CCB2",
          borderRadius: 9999,
        }}
      />

      {/* The full-width "Just Because" note card (192:150) was deleted at
          source in this revision — the reviews strip now follows the dots. */}

      {/* Reviews ornament + heading + subtitle (2380:607, 2380:576, 2380:614) */}
      <img
        src="/eldreve/home/436-337.svg"
        alt=""
        width={58.149}
        height={13.923}
        style={{ ...abs(187.926, 2795, 58.149, 13.923), display: "block" }}
      />
      <div
        data-field="recipient.reviews_title"
        className={playfair.className}
        style={{
          ...abs(26, 2816, 382),
          fontSize: 21,
          lineHeight: "27px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {c.reviews_title}
      </div>
      <div
        data-field="recipient.reviews_intro"
        className={goudy.className}
        style={{
          ...abs(50, 2843, 330),
          fontSize: 9,
          lineHeight: "13px",
          color: "#3B2E2E",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {c.reviews_intro}
      </div>

      <ReviewsRail c={c} timing={timing} />

      {/* 442:165 · the design's fourth review dot — there is no fourth review,
          so it stays static art rather than pointing at a missing slide. */}
      <div
        style={{
          ...abs(240, 3086.5, 7, 7),
          background: "#E0CCB2",
          borderRadius: 9999,
        }}
      />

      {/* Button · Read Customer Stories (163:111) — live since 07-30; target
          from the Figma prototype link on 1523:1992 (ON_CLICK → 1573:106 /story) */}
      <Link
        data-field="recipient.reviews_cta_href"
        href={c.reviews_cta_href}
        aria-label="Read customer stories"
        style={{
          ...abs(91, 3031, 246, 33),
          background: "#2E1C12",
          borderRadius: 7,
          display: "block",
        }}
      >
        <div
          data-field="recipient.reviews_cta_label"
          className={goudy.className}
          style={{
            ...abs(27, 6, 169),
            fontSize: 14,
            lineHeight: "20.83px",
            letterSpacing: 1.5,
            color: "#FFF6EC",
            whiteSpace: "nowrap",
          }}
        >
          {c.reviews_cta_label}
        </div>
        <img
          src="/eldreve/home/I163-111_145-55.svg"
          alt="→"
          width={11}
          height={13}
          style={{
            ...abs(208, 10, 11, 13),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
      </Link>
    </>
  );
}
