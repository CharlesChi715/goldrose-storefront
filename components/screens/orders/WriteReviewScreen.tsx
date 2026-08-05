"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/orders/review — pixel-exact implementation of the Ready-for-dev
 * frame "/account/orders/review · mobile · iPhone 15 Pro Max" (2439:370,
 * section me二·级), imported 2026-08-05. Geometry, colors, fonts and copy are
 * verbatim from the Figma REST data; the frame is 430×932.
 *
 * Closes AI-029 together with DeliveredScreen: reached from that page's
 * WRITE A REVIEW button (the frame's own prototype edge, 2439:369 → 2439:370).
 *
 * A client component because the design specifies interaction the frame draws
 * only one state for: the three experience chips and the five stars are "tap
 * to choose", and the copy box shows a live "0 / 800" counter. The counter and
 * the choices are therefore real and local. The two *selected* treatments are
 * ours, not the design team's — an ink stroke on the chosen chip, and dimming
 * for stars past the chosen one. Both are flagged for a design ruling; the
 * frame ships no selected art for either control.
 *
 * PUBLISH REVIEW is deliberately inert: there is no reviews backend and no
 * frame for a submitted state, so the button must not fake an outcome. Filed
 * for a decision rather than wired to a guess.
 *
 * Data: the product card is the design's own mock order (the /account/orders/
 * details and delivered precedent) — no per-order backend feeds this page.
 *
 * AI-TAG(AI-030): AGENT-DECISION — the chip and star selected states are ours;
 * the frame ships none. See /agent-delivery/sessions/figma-sync-orders-08-05-feat-figma-sync.md.
 * AI-TAG(AI-031): OWNER-DECISION — PUBLISH REVIEW is inert until there is a
 * reviews backend. Same session file.
 */

import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { BrandWordmark } from "@/components/screens/account-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/eldreve/screens";
const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const WHITE = "#FFFFFF";
const MAX_CHARS = 800;

/** 2453:367…380 — the three "how did your gift feel?" pills, frame order. */
const EXPERIENCES = [
  {
    key: "below",
    x: 16,
    icon: "2453-368",
    iconX: 26.5,
    label: "Below expectations",
    labelX: 50.5,
    labelW: 82,
  },
  {
    key: "expected",
    x: 151,
    icon: "2453-373",
    iconX: 177,
    label: "As expected",
    labelX: 201,
    labelW: 51,
  },
  {
    key: "exceeded",
    x: 286,
    icon: "2453-378",
    iconX: 317.5,
    label: "Exceeded",
    labelX: 341.5,
    labelW: 40,
  },
] as const;

/** 2452:379…399 — the five stars with their frame-order labels. */
const STARS = [
  { x: 32, label: "Poor", labelX: 43, labelW: 20 },
  { x: 113, label: "Fair", labelX: 126, labelW: 16 },
  { x: 194, label: "Good", labelX: 203.5, labelW: 23 },
  { x: 275, label: "Great", labelX: 284.5, labelW: 23 },
  { x: 356, label: "Excellent", labelX: 358, labelW: 38 },
];

/** One of the two media tiles: card, icon and its two-line copy. */
function MediaTile({
  x,
  icon,
  iconX,
  title,
  titleW,
  copyX,
  subtitle,
  subtitleW,
}: {
  x: number;
  icon: string;
  iconX: number;
  title: string;
  titleW: number;
  copyX: number;
  subtitle: string;
  subtitleW: number;
}) {
  return (
    <>
      <div
        style={{
          ...abs(x, 417, 194, 86),
          background: WHITE,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 14,
        }}
      />
      <img
        src={`${A}/${icon}.svg`}
        alt=""
        width={34}
        height={34}
        style={{ ...abs(iconX, 443, 34, 34), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(copyX, 437, titleW),
          ...txt(13, 28, INK),
          fontWeight: 500,
        }}
      >
        {title}
      </div>
      <div style={{ ...abs(copyX, 467, subtitleW), ...txt(9, 16, INK) }}>
        {subtitle}
      </div>
    </>
  );
}

export function WriteReviewScreen() {
  const [experience, setExperience] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");

  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2460:372/373 Brand Navigation */}
      <BackButton
        fallback="/account/orders/delivered"
        src={`${A}/2460-384.png`}
        style={abs(0, 28, 40, 43)}
      />
      <BrandWordmark x={149} y={24} w={140} h={51} />

      {/* 2452:367…369 title band — the frame's rule sits on its bottom edge */}
      <div
        className={playfair.className}
        style={{
          ...abs(142.5, 75, 145),
          ...txt(22, 40, INK),
          fontWeight: 500,
          letterSpacing: -0.2,
        }}
      >
        Write a Review
      </div>
      <div style={{ ...abs(0, 120, 430, 1), background: SAND }} />

      {/* 2453:366…380 experience chips */}
      <div
        className={playfair.className}
        style={{
          ...abs(16, 163, 179),
          ...txt(18, 40, INK),
          fontWeight: 500,
          letterSpacing: -0.2,
        }}
      >
        How did your gift feel?
      </div>
      {EXPERIENCES.map((e) => {
        const on = experience === e.key;
        return (
          <button
            key={e.key}
            type="button"
            aria-pressed={on}
            onClick={() => setExperience(on ? null : e.key)}
            style={{
              ...abs(e.x, 213, 127, 46),
              background: WHITE,
              // Selected treatment is ours — see the file header.
              boxShadow: `inset 0 0 0 ${on ? 1.4 : 1}px ${on ? INK : SAND}`,
              borderRadius: 999,
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          />
        );
      })}
      {EXPERIENCES.map((e) => (
        <img
          key={`${e.key}-icon`}
          src={`${A}/${e.icon}.svg`}
          alt=""
          width={18}
          height={18}
          style={{
            ...abs(e.iconX, 227, 18, 18),
            display: "block",
            pointerEvents: "none",
          }}
        />
      ))}
      {EXPERIENCES.map((e) => (
        <div
          key={`${e.key}-label`}
          style={{
            ...abs(e.labelX, 228, e.labelW),
            ...txt(9, 16, INK),
            pointerEvents: "none",
          }}
        >
          {e.label}
        </div>
      ))}

      {/* 2451:366…372 review copy box — a real field with the live counter */}
      <div
        style={{
          ...abs(16, 257, 398, 148),
          background: WHITE,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 14,
        }}
      />
      <textarea
        value={body}
        onChange={(ev) => setBody(ev.target.value.slice(0, MAX_CHARS))}
        maxLength={MAX_CHARS}
        placeholder="What was your experience with the packaging, quality, and delivery?"
        className={notoSC.className}
        style={{
          ...abs(32, 273, 350, 96),
          ...txt(12, 20, INK),
          whiteSpace: "pre-wrap",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          padding: 0,
        }}
      />
      <div style={{ ...abs(32, 377, 350), ...txt(10, 16, INK, "right") }}>
        {body.length} / {MAX_CHARS}
      </div>

      {/* 2451:373…386 media tiles */}
      <MediaTile
        x={16}
        icon="2451-374"
        iconX={30}
        title="Add photo / video"
        titleW={104}
        copyX={74}
        subtitle="Images or video supported"
        subtitleW={112}
      />
      <MediaTile
        x={220}
        icon="2451-381"
        iconX={234}
        title="Take a photo"
        titleW={76}
        copyX={278}
        subtitle="Photograph your gift"
        subtitleW={87}
      />

      {/* 2452:369…375 the product being reviewed */}
      <div
        style={{
          ...abs(16, 515, 398, 110),
          background: WHITE,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 14,
        }}
      />
      <img
        src={`${A}/2452-370.png`}
        alt=""
        width={90}
        height={88}
        style={{
          ...abs(28, 526, 90, 88),
          borderRadius: 10,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        className={playfair.className}
        style={{ ...abs(132, 537, 175), ...txt(17, 28, INK), fontWeight: 500 }}
      >
        24K Gold-Dipped Rose
      </div>
      <div style={{ ...abs(132, 568, 90), ...txt(11, 16, GOLD) }}>
        Classic Collection
      </div>
      <div style={{ ...abs(132, 587, 268), ...txt(9, 16, INK) }}>
        Order #VL20250821&nbsp; • &nbsp;Delivered May 21, 2024
      </div>

      {/* 2452:376…399 star rating */}
      <div
        className={playfair.className}
        style={{
          ...abs(16, 645, 101),
          ...txt(18, 40, INK),
          fontWeight: 500,
          letterSpacing: -0.2,
        }}
      >
        Rate this gift
      </div>
      <div style={{ ...abs(16, 691, 146), ...txt(10, 16, INK) }}>
        Tap a star to choose your rating
      </div>
      {STARS.map((s, i) => (
        <button
          key={s.label}
          type="button"
          aria-label={`${i + 1} star — ${s.label}`}
          aria-pressed={rating === i + 1}
          onClick={() => setRating(rating === i + 1 ? null : i + 1)}
          style={{
            ...abs(s.x, 713, 42, 42),
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            // Dimming past the chosen star is ours — see the file header.
            opacity: rating === null || i < rating ? 1 : 0.3,
          }}
        >
          <img
            src={`${A}/2452-380.svg`}
            alt=""
            width={42}
            height={42}
            style={{ display: "block" }}
          />
        </button>
      ))}
      {STARS.map((s) => (
        <div
          key={`${s.label}-label`}
          style={{
            ...abs(s.labelX, 759, s.labelW),
            ...txt(9, 16, INK),
            pointerEvents: "none",
          }}
        >
          {s.label}
        </div>
      ))}

      {/* 2452:400/401 publish — inert until there is a reviews backend */}
      <div
        style={{
          ...abs(16, 831, 398, 54),
          background: INK,
          boxShadow: `inset 0 0 0 1.3px ${GOLD}`,
          borderRadius: 14,
        }}
      />
      <div
        style={{
          ...abs(16, 850, 398),
          ...txt(14, 16, GOLD, "center"),
          fontWeight: 500,
          letterSpacing: 1.12,
        }}
      >
        PUBLISH REVIEW
      </div>
    </ScaleFrame>
  );
}
