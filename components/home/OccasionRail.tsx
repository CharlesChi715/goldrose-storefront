"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The A-5 "Shop by Occasion" recipient-card rail (Figma 436:319), rebuilt on
 * the shared Carousel so it advances one card at a time, slowly, right to left.
 *
 * Client component because the rail hands the Carousel a `renderSlide`
 * callback, which only crosses a client boundary — keeping it here is what lets
 * A-5 itself stay a server component.
 */

import {
  Carousel,
  RAIL_AUTOPLAY_MS,
  RAIL_SLIDE_MS,
} from "@/components/home/Carousel";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";

/** One card of the 436:319 recipient rail, at cell coordinates. */
type RecipientCard = {
  /** 436:279/293/307 — one shared bleed crop, shifted per card. */
  photo: { src: string; x: number };
  title: { y: number; lineHeight: string; text: string };
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

/**
 * 436:319 · the three recipient cards, verbatim from the design — they carry
 * genuinely different photos, titles, copy and vertical rhythm, so all three
 * stay distinct. Coordinates are CELL-relative (each card's own 15/201/387 ×
 * 142 origin subtracted): the Carousel positions the cell itself.
 */
const RECIPIENT_CARDS: RecipientCard[] = [
  {
    // 436:277 · Gifts for Wife
    photo: { src: "/veloria/home/436-279.png", x: -25.4 },
    title: { y: 159, lineHeight: "21px", text: "Valentine's Day\nGifts" },
    // 436:282 · copy (Goudy is single-weight; design's 500 not applied)
    copy: {
      font: goudy.className,
      x: 27,
      y: 206,
      width: 122,
      fontSize: 8,
      text: "For the one who means everything.",
    },
    ornamentY: 223,
    ctaY: 240.82,
  },
  {
    // 436:291 · Thoughtful Gifts She'll Love
    photo: { src: "/veloria/home/436-293.png", x: -241.3 },
    title: { y: 161, lineHeight: "21px", text: "Valentine's Day\nGifts" },
    // 436:296 · copy (Goudy, single-weight)
    copy: {
      font: goudy.className,
      x: 12,
      y: 208,
      width: 152,
      fontSize: 8,
      text: "Romantic gifts to make her feel cherished.",
    },
    ornamentY: 225,
    ctaY: 242.82,
  },
  {
    // 436:305 · Anniversary Gifts for Wife (the design parks this one clipped)
    photo: { src: "/veloria/home/436-307.png", x: -457.2 },
    title: { y: 166, lineHeight: "18px", text: "Anniversary Gifts\nfor Wife" },
    // 436:309 · copy
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

/**
 * The "Shop by Occasion" recipient-card rail.
 *
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function OccasionRail() {
  return (
    /*
      436:319 · recipient card rail — the design draws three cards side by
      side (x=15/201/387, 176 wide on a 186 pitch, the third clipped by the
      module's right edge). They now ride one Carousel that advances a single
      card at a time, slowly, right-to-left. The window stops at the canvas
      edge (415 = 430 − 15), so the resting frame is pixel-identical to the
      import. The design's own dot strip for this rail (162:100) is hidden in
      Figma, hence no dots here.
    */
    <Carousel
      window={{ left: 15, top: 142, width: 415, height: 257 }}
      count={RECIPIENT_CARDS.length}
      cellWidth={176}
      step={186}
      autoplayMs={RAIL_AUTOPLAY_MS}
      slideMs={RAIL_SLIDE_MS}
      dots={[]}
      activeColor="#D4AF37"
      idleColor="#E5D9C9"
      href="/shop"
      label="occasion"
      renderSlide={(i) => {
        const card = RECIPIENT_CARDS[i];
        return (
          // 436:277/291/305 · the card body (the Carousel supplies the link).
          <div
            style={{
              ...abs(0, 0, 176, 257),
              background: "#FFFBF6",
              boxShadow: "inset 0 0 0 1px #E5D1B8",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* 436:278/292/306 · image well; the crop bleeds (negative offsets verbatim) */}
            <div
              style={{
                ...abs(0, 0, 176, 156),
                background: "#F3C6D1",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <img
                src={card.photo.src}
                alt="Gold-dipped rose gift"
                style={{
                  ...abs(card.photo.x, -210.82, 546.1, 911.9),
                  display: "block",
                  maxWidth: "none",
                }}
              />
            </div>
            {/* 436:281/295/308 · title */}
            <div
              className={playfair.className}
              style={{
                ...abs(12, card.title.y, 152),
                fontSize: 16,
                lineHeight: card.title.lineHeight,
                color: "#3B2F2F",
                fontWeight: 500,
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {card.title.text}
            </div>
            {/* 436:282/296/309 · copy */}
            <div
              className={card.copy.font}
              style={{
                ...abs(card.copy.x, card.copy.y, card.copy.width),
                fontSize: card.copy.fontSize,
                lineHeight: "12px",
                color: "#3B2F2F",
                fontWeight: card.copy.fontWeight,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {card.copy.text}
            </div>
            {/* 436:283/297/311 · card ornament */}
            <img
              src="/veloria/home/436-283.svg"
              alt=""
              style={{
                ...abs(61.233, card.ornamentY, 53.534, 12.818),
                display: "block",
              }}
            />
            {/* 436:290/304/310 · CTA (rendered strip) */}
            <img
              src="/veloria/home/191-154.svg"
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
