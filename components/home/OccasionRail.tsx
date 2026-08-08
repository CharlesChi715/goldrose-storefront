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

import { Carousel } from "@/components/home/Carousel";
import type { RailTiming } from "@/lib/home-content/rail-timing";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";
import { HomePhoto } from "@/components/home/HomePhoto";
import type { HomeText } from "@/lib/home-content/registry";

/**
 * One card of the 436:319 recipient rail, at cell coordinates.
 *
 * GEOMETRY ONLY. The titles, copy, photos and descriptions come from the
 * registry through `c` — they used to be repeated here as well, which meant two
 * copies of every default with nothing keeping them in step.
 */
type RecipientCard = {
  /** 436:279/293/307 — one shared bleed crop, shifted per card. */
  photo: { x: number };
  title: { y: number; lineHeight: string };
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

/**
 * 436:319 · the three recipient cards, verbatim from the design — they carry
 * genuinely different photos, titles, copy and vertical rhythm, so all three
 * stay distinct. Coordinates are CELL-relative (each card's own 15/201/387 ×
 * 142 origin subtracted): the Carousel positions the cell itself.
 */
const RECIPIENT_CARDS: RecipientCard[] = [
  {
    // 436:277 · Gifts for Wife
    photo: { x: -25.4 },
    title: { y: 159, lineHeight: "21px" },
    // 436:282 · copy (Goudy is single-weight; design's 500 not applied)
    copy: { font: goudy.className, x: 27, y: 206, width: 122, fontSize: 8 },
    ornamentY: 223,
    ctaY: 240.82,
  },
  {
    // 436:291 · Thoughtful Gifts She'll Love
    photo: { x: -241.3 },
    title: { y: 161, lineHeight: "21px" },
    // 436:296 · copy (Goudy, single-weight)
    copy: { font: goudy.className, x: 12, y: 208, width: 152, fontSize: 8 },
    ornamentY: 225,
    ctaY: 242.82,
  },
  {
    // 436:305 · Anniversary Gifts for Wife (the design parks this one clipped)
    photo: { x: -457.2 },
    title: { y: 166, lineHeight: "18px" },
    // 436:309 · copy
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

/* 2380:486 · three of the design's seven dots, normalized to one visible
   size — the current slide is signalled by colour, as on every other rail.
   Coordinates are band-relative, matching the rest of A-5. */
const DOTS = [
  { x: 145.5, y: 425, size: 8 },
  { x: 167, y: 425, size: 8 },
  { x: 188, y: 425, size: 8 },
];

/**
 * The "Shop by Occasion" recipient-card rail.
 *
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function OccasionRail({
  c,
  timing,
}: {
  c: HomeText["occasion"];
  timing: RailTiming;
}) {
  const titles = [c.card_1_title, c.card_2_title, c.card_3_title];
  const copies = [c.card_1_copy, c.card_2_copy, c.card_3_copy];
  const photos = [c.card_1_photo, c.card_2_photo, c.card_3_photo];
  const alts = [c.card_1_photo_alt, c.card_2_photo_alt, c.card_3_photo_alt];
  return (
    /*
      436:319 · recipient card rail — the design draws three cards side by
      side (x=15/201/387, 176 wide on a 186 pitch, the third clipped by the
      module's right edge). They now ride one Carousel that advances a single
      card at a time, slowly, right-to-left. The window stops at the canvas
      edge (415 = 430 − 15), so the resting frame is pixel-identical to the
      import.

      Since 2026-08-04 the rail also drives the first three of the seven dots
      the design draws beneath it (2380:486); A-5 renders the other four as
      inert ellipses, the same split the review rail uses.
    */
    <Carousel
      window={{ left: 15, top: 142, width: 415, height: 257 }}
      count={RECIPIENT_CARDS.length}
      cellWidth={176}
      step={186}
      autoplayMs={timing.autoplayMs}
      slideMs={timing.slideMs}
      dots={DOTS}
      activeColor="#B27A38"
      idleColor="#E5D1B2"
      href={c.card_href}
      hrefField="occasion.card_href"
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
              {/* All three cards are windows onto ONE 546×912 sprite, offset
                  per card — HomePhoto keeps that verbatim for the design's own
                  render and switches to a plain cover fill once replaced. */}
              <HomePhoto
                section="occasion"
                field={`card_${i + 1}_photo`}
                value={photos[i]}
                alt={alts[i]}
                box={{ w: 176, h: 156 }}
                design={{ x: card.photo.x, y: -210.82, w: 546.1, h: 911.9 }}
              />
            </div>
            {/* 436:281/295/308 · title */}
            <div
              data-field={`occasion.card_${i + 1}_title`}
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
              {titles[i]}
            </div>
            {/* 436:282/296/309 · copy */}
            <div
              data-field={`occasion.card_${i + 1}_copy`}
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
              {copies[i]}
            </div>
            {/* 436:283/297/311 · card ornament */}
            <img
              src="/eldreve/home/436-283.svg"
              alt=""
              style={{
                ...abs(61.233, card.ornamentY, 53.534, 12.818),
                display: "block",
              }}
            />
            {/* 436:290/304/310 · CTA (rendered strip) */}
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
