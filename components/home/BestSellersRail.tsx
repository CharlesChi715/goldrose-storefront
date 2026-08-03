"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The homepage "Best Sellers" rail (H-09) — Figma cards 2380:406 and 2380:415,
 * rebuilt on the shared Carousel so it auto-advances one card at a time,
 * slowly, right to left (owner, 2026-07-26).
 *
 * 2026-08-04 sync: the rail used to be ONE card repeated four times against
 * four pagination dots. Frame 2380:399 deleted those dots and gave the second
 * card real, distinct content ("Enchanted Rose with LED Light", $119.00, its
 * own photo), so the rail is now the design's two actual cards with no dots —
 * the peeking second card is the affordance, exactly as A-3 does it. At rest
 * the band is pixel-identical to the frame.
 *
 * ⚠️ MOCKED DATA: both cards' titles, prices and photos are still the design's
 * placeholders rather than catalogue products (OQ-3), and both link to /shop
 * because the product↔card mapping is undecided.
 *
 * AI-TAG(AI-027): AGENT-DECISION — this reverses the 07-26 "one card × four"
 * rail now that the frame carries two real cards and no dots. See
 * /agent-delivery/sessions/figma-sync-homepage-08-04-feat-figma-sync.md.
 */

import { abs } from "@/lib/figma-layout";
import {
  Carousel,
  RAIL_AUTOPLAY_MS,
  RAIL_SLIDE_MS,
} from "@/components/home/Carousel";
import { playfair, notoSC } from "@/lib/fonts";

/** Card 2380:406 is 250 wide; the next card starts at x=285, so the pitch is 267. */
const CARD_W = 250;
const CARD_H = 366;
const PITCH = 267;

/**
 * The two cards verbatim from the design. They differ in box size, vertical
 * offset within the rail and photo treatment, so both carry their own values;
 * the content block's internal rhythm (12/57/75/108) is shared.
 */
type Card = {
  /** Cell-relative offset — card 2 sits 17px lower than card 1. */
  top: number;
  width: number;
  height: number;
  /** Height of the photo window; the content block starts right below it. */
  photoH: number;
  contentH: number;
  title: string;
  price: string;
  priceW: number;
  /** Card 1's price node is CENTER-aligned in its 45px box; card 2's is LEFT. */
  priceCentered: boolean;
  note: string;
  alt: string;
};

const CARDS: readonly Card[] = [
  {
    top: 0,
    width: CARD_W,
    height: CARD_H,
    photoH: 240,
    contentH: 126,
    title: "Personalized Gold-Dipped Rose",
    price: "$79.00",
    priceW: 45,
    priceCentered: true,
    note: "Personalization available",
    alt: "Personalized gold-dipped rose",
  },
  {
    top: 17,
    width: 184,
    height: 349,
    photoH: 222,
    contentH: 160,
    title: "Enchanted Rose with LED Light",
    price: "$119.00",
    priceW: 53,
    priceCentered: false,
    note: "Gift-ready packaging",
    alt: "Enchanted gold rose under a glass dome with LED light",
  },
];

/**
 * One best-seller card's content block, drawn below its photo window. `n` is
 * the 1-based slide number: the element names carry it so each card stays
 * unique in the DOM. Built at runtime, so the static naming test skips them,
 * exactly as it does for Carousel's own `name`-derived names.
 */
function Content({ card, n }: { card: Card; n: number }) {
  return (
    <div
      style={{
        ...abs(0, card.photoH, card.width, card.contentH),
        overflow: "hidden",
      }}
    >
      <div
        className={playfair.className}
        data-el={`HOME-FEATURED-PRODUCT-TITLE-${n}`}
        style={{
          ...abs(12, 12, 160),
          fontSize: 18,
          lineHeight: "22px",
          fontWeight: 500,
          color: "#3B2F2F",
        }}
      >
        {card.title}
      </div>
      <div
        className={notoSC.className}
        data-el={`HOME-FEATURED-PRODUCT-PRICE-${n}`}
        style={{
          ...abs(12, 57, card.priceW),
          fontSize: 14,
          lineHeight: "16.8px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: card.priceCentered ? "center" : "left",
          whiteSpace: "nowrap",
        }}
      >
        {card.price}
      </div>
      <div
        className={notoSC.className}
        data-el={`HOME-FEATURED-PRODUCT-NOTE-${n}`}
        style={{
          ...abs(12, 75, 160),
          fontSize: 11,
          lineHeight: "16px",
          fontWeight: 400,
          color: "#D4AF37",
        }}
      >
        {card.note}
      </div>
      {/* 2380:412 / 2380:421 cta — Figma-rendered strip */}
      <img
        data-el={`HOME-FEATURED-PRODUCT-CTA-${n}`}
        src="/veloria/home/376-182.svg"
        alt="View Product →"
        width={86}
        height={13}
        style={{
          ...abs(12, 108, 86, 13),
          display: "block",
          objectFit: "none",
          objectPosition: "left center",
        }}
      />
    </div>
  );
}

/**
 * The Best Sellers card rail.
 *
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function BestSellersRail() {
  return (
    <Carousel
      // 18 → 430: the window ends at the canvas edge, so the next card peeks
      // exactly as far as the design shows it.
      window={{ left: 18, top: 220, width: 412, height: CARD_H }}
      count={CARDS.length}
      cellWidth={CARD_W}
      step={PITCH}
      autoplayMs={RAIL_AUTOPLAY_MS}
      slideMs={RAIL_SLIDE_MS}
      dots={[]}
      activeColor="#D4AF37"
      idleColor="#E5D9C9"
      href="/shop"
      label="best seller"
      name="HOME-FEATURED"
      renderSlide={(i) => {
        const card = CARDS[i];
        return (
          <div
            className="gr-card-zoom"
            style={{
              ...abs(0, card.top, card.width, card.height),
              background: "#FFF6EC",
              borderRadius: 10,
              boxShadow: "inset 0 0 0 1px #E5D9C9",
              overflow: "hidden",
            }}
          >
            {/* photo window: rounded top corners, clipping the photo */}
            <div
              style={{
                ...abs(0, 0, card.width, card.photoH),
                background: "#F3C6D1",
                borderRadius: i === 0 ? "15px 15px 0 0" : 0,
                overflow: "hidden",
              }}
            >
              {i === 0 ? (
                // 2380:414 bleeds 1px left / 7px above its clipping frame
                // (design values); maxWidth none so preflight can't squash
                // 252px to 250px.
                <img
                  className="gr-photo"
                  data-el={`HOME-FEATURED-PRODUCT-IMG-${i + 1}`}
                  src="/veloria/home/373-174.png"
                  alt={card.alt}
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
              ) : (
                // 2380:416 · STRETCH fill, so the photo fills the window exactly
                <img
                  className="gr-photo"
                  data-el={`HOME-FEATURED-PRODUCT-IMG-${i + 1}`}
                  src="/veloria/home/2380-416.png"
                  alt={card.alt}
                  width={card.width}
                  height={card.photoH}
                  style={{
                    ...abs(0, 0, card.width, card.photoH),
                    display: "block",
                  }}
                />
              )}
            </div>
            <Content card={card} n={i + 1} />
          </div>
        );
      }}
    />
  );
}
