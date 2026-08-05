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

import {
  Carousel,
  RAIL_AUTOPLAY_MS,
  RAIL_SLIDE_MS,
} from "@/components/home/Carousel";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";

/** One card of the recipient rail, at CELL coordinates. */
type Card = {
  /** x offset of the one shared bleed crop (2380:528/542/556, ref 42c600f0). */
  photoX: number;
  title: { y: number; text: string };
  copy: {
    font: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    fontWeight?: number;
    text: string;
  };
  ornamentY: number;
  ctaY: number;
};

/* The three cards verbatim from the design. They carry different titles, copy
   fonts and vertical rhythm, so all three stay distinct; coordinates are
   CELL-relative (each card's own 15/201/387 × 2479 origin subtracted) because
   the Carousel positions the cell itself. */
const CARDS: readonly Card[] = [
  {
    // 2380:526 · Gifts for Wife
    photoX: -25.4,
    title: { y: 166, text: "Gifts for Wife" },
    copy: {
      font: goudy.className,
      x: 27,
      y: 193,
      width: 122,
      fontSize: 8,
      text: "For the one who means everything.",
    },
    ornamentY: 214,
    ctaY: 235.82,
  },
  {
    // 2380:540 · Thoughtful Gifts She'll Love
    photoX: -241.3,
    title: { y: 161, text: "Thoughtful Gifts\nShe’ll Love" },
    copy: {
      font: goudy.className,
      x: 12,
      y: 202,
      width: 152,
      fontSize: 8,
      text: "Romantic gifts to make her feel cherished.",
    },
    ornamentY: 219,
    ctaY: 236.82,
  },
  {
    // 2380:554 · Anniversary Gifts for Wife (the design parks this one clipped)
    photoX: -457.2,
    title: { y: 166, text: "Anniversary Gifts\nfor Wife" },
    copy: {
      font: notoSC.className,
      x: 14,
      y: 207,
      width: 148,
      fontSize: 9,
      fontWeight: 400,
      text: "Celebrate your love with a timeless gift.",
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
  { x: 176.5, y: 2758.5, size: 7 },
  { x: 195, y: 2758.5, size: 7 },
  { x: 213, y: 2758.5, size: 7 },
];

/**
 * The "Shop by Recipient" card rail and the three dots wired to a slide.
 *
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function RecipientRail() {
  return (
    /* The design draws three cards side by side (x=15/201/387, 176 wide on a
       186 pitch, the third clipped by the canvas edge). The window stops at
       415 = 430 − 15, so the resting frame is pixel-identical to the import. */
    <Carousel
      window={{ left: 15, top: 2479, width: 415, height: 257 }}
      count={CARDS.length}
      cellWidth={176}
      step={186}
      autoplayMs={RAIL_AUTOPLAY_MS}
      slideMs={RAIL_SLIDE_MS}
      dots={DOTS}
      activeColor="#C46E29"
      idleColor="#E0CCB2"
      href="/shop"
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
              <img
                src="/eldreve/home/163-86.png"
                alt="Gold-dipped rose gift"
                width={546.1}
                height={911.9}
                style={{
                  ...abs(card.photoX, -210.82, 546.1, 911.9),
                  display: "block",
                  objectFit: "cover",
                  maxWidth: "none",
                }}
              />
            </div>
            <div
              className={playfair.className}
              style={{
                ...abs(12, card.title.y, 152),
                fontSize: 16,
                lineHeight: "18px",
                color: "#3B2F2F",
                fontWeight: 500,
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {card.title.text}
            </div>
            <div
              className={card.copy.font}
              style={{
                ...abs(card.copy.x, card.copy.y, card.copy.width),
                fontSize: card.copy.fontSize,
                lineHeight: "12px",
                color: "#3B2F2F",
                fontWeight: card.copy.fontWeight,
                textAlign: "center",
                whiteSpace:
                  card.copy.font === notoSC.className ? undefined : "nowrap",
              }}
            >
              {card.copy.text}
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
