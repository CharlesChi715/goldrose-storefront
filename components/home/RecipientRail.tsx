"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The A-6 "Shop by Recipient" card rail (Figma 2380:526 / 2380:540 /
 * 2380:554) plus the pagination dots the design draws under it (2380:601),
 * rebuilt on the shared Carousel.
 *
 * Added 2026-08-04. The import had drawn these three cards as static
 * side-by-side links with five inert ellipses beneath them, so none of H-22's
 * behaviour existed: no swipe, no dot taps, no highlight. A-5's structurally
 * identical rail (OccasionRail) had been interactive since 07-29, which left
 * two visually identical rails behaving differently on the same page — the
 * inconsistency this file removes.
 *
 * Client component because the rail hands the Carousel a `renderSlide`
 * callback, which only crosses a client boundary — keeping it here is what
 * lets A-6 itself stay a server component. Coordinates stay homepage-frame
 * absolute, exactly as A-6 drew them.
 */

import { Carousel } from "@/components/home/Carousel";
import type { RailTiming } from "@/lib/home-content/rail-timing";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";
import { HomePhoto } from "@/components/home/HomePhoto";
import type { HomeFrames } from "@/lib/home-content/frames";
import type { HomeText } from "@/lib/home-content/registry";

/** One card of the recipient rail, at CELL coordinates. */
type Card = {
  /** x offset of the one shared bleed crop (2380:528/542/556, ref 42c600f0). */
  photoX: number;
  title: { y: number; fontSize: number };
  copy: {
    font: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    fontWeight?: number;
  };
  ornamentY: number;
  ctaY: number;
};

/* The three cards' GEOMETRY, verbatim from the design — their titles, copy,
   photos and descriptions come from the registry through `c`. They carry
   different copy fonts and vertical rhythm, so all three stay distinct;
   coordinates are
   CELL-relative (each card's own 13/199/385 × 2375 origin subtracted) because
   the Carousel positions the cell itself. */
const CARDS: readonly Card[] = [
  {
    // 2380:526 · Gifts for Wife
    photoX: -25.4,
    title: { y: 166, fontSize: 20 },
    copy: {
      font: goudy.className,
      x: 27,
      y: 193,
      width: 122,
      fontSize: 13,
    },
    ornamentY: 214,
    ctaY: 235.82,
  },
  {
    // 2380:540 · Thoughtful Gifts She'll Love
    photoX: -241.3,
    title: { y: 161, fontSize: 20 },
    copy: {
      font: goudy.className,
      x: 12,
      y: 202,
      width: 152,
      fontSize: 13,
    },
    ornamentY: 219,
    ctaY: 236.82,
  },
  {
    // 2380:554 · Anniversary Gifts for Wife (the design parks this one clipped)
    photoX: -457.2,
    title: { y: 166, fontSize: 16 },
    copy: {
      font: notoSC.className,
      x: 14,
      y: 207,
      width: 148,
      fontSize: 9,
      fontWeight: 400,
    },
    ornamentY: 236,
    ctaY: 261,
  },
];

/* 2380:601 · the design draws FIVE dots for three cards, so only the first
   three are wired to a slide; A-6 renders the remaining two as inert
   ellipses. Normalized to one visible size — the current slide is signalled
   by colour, matching the hero and review rails. */
const DOTS = [
  { x: 178.5, y: 2649.5, size: 7, activeSize: 8 },
  { x: 197, y: 2649.5, size: 7, activeSize: 8 },
  { x: 215, y: 2649.5, size: 7, activeSize: 8 },
];

/**
 * The "Shop by Recipient" card rail and the three dots wired to a slide.
 *
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function RecipientRail({
  c,
  timing,
  frames,
}: {
  c: HomeText["recipient"];
  timing: RailTiming;
  frames?: HomeFrames;
}) {
  const titles = [c.card_1_title, c.card_2_title, c.card_3_title];
  const copies = [c.card_1_copy, c.card_2_copy, c.card_3_copy];
  const photos = [c.card_1_photo, c.card_2_photo, c.card_3_photo];
  const alts = [c.card_1_photo_alt, c.card_2_photo_alt, c.card_3_photo_alt];
  return (
    /* The design draws three cards side by side (x=15/201/387, 176 wide on a
       186 pitch, the third clipped by the canvas edge). The window stops at
       the canvas edge (417 = 430 − 13), so the resting frame is
       pixel-identical to the import.

       ⚠️ 08-10: as in A-5, the frame slid each card's rose ornament down onto
       its CTA and dropped the CTA on cards 1 and 2. Ornament and CTA are left
       where the earlier import put them so all three cards stay legible and
       consistent.
       AI-TAG(AI-043): AGENT-DECISION — see /agent-delivery/sessions/figma-sync-home-page-08-10-claude-figma-sync-home-page-75f37e.md. */
    <Carousel
      window={{ left: 13, top: 2375, width: 417, height: 257 }}
      count={CARDS.length}
      cellWidth={176}
      step={186}
      autoplayMs={timing.autoplayMs}
      slideMs={timing.slideMs}
      dots={DOTS}
      activeColor="#C46E29"
      idleColor="#E0CCB2"
      href={c.card_href}
      hrefField="recipient.card_href"
      label="recipient"
      renderSlide={(i) => {
        const card = CARDS[i];
        return (
          // The card body — the Carousel supplies the link wrapper.
          <div
            style={{
              ...abs(0, 0, 176, 257),
              background: "#FFFBF6",
              boxShadow: "inset 0 0 0 1px #E5D1B8",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* image well; the crop bleeds (negative offsets verbatim) */}
            <div
              style={{
                ...abs(0, 0, 176, 156),
                background: "#F3C6D1",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* One 546×912 sprite seen through three different windows —
                  HomePhoto keeps that verbatim for the design's own render and
                  switches to a plain cover fill once a card is given its own
                  photo, so the three stop being slices of one picture. */}
              <HomePhoto
                section="recipient"
                field={`card_${i + 1}_photo`}
                value={photos[i]}
                alt={alts[i]}
                box={{ w: 176, h: 156 }}
                design={{
                  x: card.photoX,
                  y: -210.82,
                  w: 546.1,
                  h: 911.9,
                  objectFit: "cover",
                }}
                frames={frames}
              />
            </div>
            <div
              data-field={`recipient.card_${i + 1}_title`}
              className={playfair.className}
              style={{
                ...abs(12, card.title.y, 152),
                fontSize: card.title.fontSize,
                lineHeight: "18px",
                color: "#3B2F2F",
                fontWeight: 500,
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {titles[i]}
            </div>
            {/* Wraps: at 13px the frame breaks each copy over two lines. */}
            <div
              data-field={`recipient.card_${i + 1}_copy`}
              className={card.copy.font}
              style={{
                ...abs(card.copy.x, card.copy.y, card.copy.width),
                fontSize: card.copy.fontSize,
                lineHeight: "12px",
                color: "#3B2F2F",
                fontWeight: card.copy.fontWeight,
                textAlign: "center",
              }}
            >
              {copies[i]}
            </div>
            <img
              src="/eldreve/home/436-283.svg"
              alt=""
              width={53.534}
              height={12.818}
              style={{
                ...abs(61.233, card.ornamentY, 53.534, 12.818),
                display: "block",
              }}
            />
            <img
              data-field="recipient.card_cta_label"
              src="/eldreve/home/191-154.svg"
              alt="SHOP WIFE GIFTS →"
              width={152}
              height={13}
              style={{
                ...abs(12, card.ctaY, 152, 13),
                display: "block",
                objectFit: "none",
                objectPosition: "center center",
              }}
            />
          </div>
        );
      }}
    />
  );
}
