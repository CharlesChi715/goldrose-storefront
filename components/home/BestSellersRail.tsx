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
 * the peeking second card is the affordance, exactly as A-3 does it.
 *
 * 2026-08-07: the band is NO LONGER pixel-identical to the frame. The owner
 * asked for both cards at one size, so card 2 now draws into card 1's box —
 * see the PHOTO_H/CONTENT_H note below. The home pixel baseline was rebuilt
 * to match.
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
 * Every card in the rail draws into the SAME box — card 2380:406's. These are
 * module constants rather than per-card fields precisely so that a card cannot
 * be given its own size: the `Card` shape below carries no box to override.
 *
 * The frame drew card 2 (2380:415) as a 184×349 box sitting 17px lower than
 * card 1, which reads as a rendering fault rather than a deliberate stagger,
 * so the owner asked for one uniform card size (2026-08-07). This is the one
 * place the rail deviates from the frame; a Figma re-sync must NOT restore the
 * smaller box.
 */
const PHOTO_H = 240;
const CONTENT_H = CARD_H - PHOTO_H;

/**
 * Card 2's photo needs a bleed box, for a reason that is not obvious from the
 * frame: 2380-416.png is a 368×444 canvas (184×222 CSS at 2x) whose right 21%
 * is TRANSPARENT padding Figma exported along with the node — only the left
 * 291px carry the rose. Drawn at its window's own size, that padding lets the
 * window's #F3C6D1 backing through as a pink strip down the card's right edge.
 * The frame has the same strip, just narrower, so widening the card would have
 * widened the defect.
 *
 * So the element is scaled up until its OPAQUE part alone covers the window,
 * and the window clips the overflow — the same trick card 1 uses for its
 * bleeding photo. Derived rather than hard-coded so re-exporting the asset at
 * a different size only needs these three measurements checked.
 */
const LED_CANVAS_W = 184;
const LED_CANVAS_H = 222;
/** The rose occupies the left 291 of the canvas's 368 device pixels. */
const LED_OPAQUE_FRAC = 291 / 368;
const LED_SCALE = CARD_W / (LED_CANVAS_W * LED_OPAQUE_FRAC);
/** Ceil so rounding can never leave a sub-pixel sliver of the pink backing. */
const LED_W = Math.ceil(LED_CANVAS_W * LED_SCALE);
const LED_H = Math.ceil(LED_CANVAS_H * LED_SCALE);
/** Portrait photo into a landscape window: centre the crop vertically. */
const LED_TOP = Math.round((PHOTO_H - LED_H) / 2);

/**
 * What actually differs between the two cards: their copy and their photo. The
 * content block's internal rhythm (12/57/75/108) is shared.
 */
type Card = {
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
    title: "Personalized Gold-Dipped Rose",
    price: "$79.00",
    priceW: 45,
    priceCentered: true,
    note: "Personalization available",
    alt: "Personalized gold-dipped rose",
  },
  {
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
        ...abs(0, PHOTO_H, CARD_W, CONTENT_H),
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
        src="/eldreve/home/376-182.svg"
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
              ...abs(0, 0, CARD_W, CARD_H),
              background: "#FFF6EC",
              borderRadius: 10,
              boxShadow: "inset 0 0 0 1px #E5D9C9",
              overflow: "hidden",
            }}
          >
            {/* photo window: rounded top corners, clipping the photo */}
            <div
              style={{
                ...abs(0, 0, CARD_W, PHOTO_H),
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
                  src="/eldreve/home/373-174.png"
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
                // 2380:416 · left-anchored bleed box so the opaque part of the
                // canvas covers the window — see LED_* above. Aspect is
                // preserved (both axes take LED_SCALE), so the default `fill`
                // maps the canvas 1:1 without distorting the rose. maxWidth
                // none so preflight can't squash LED_W back to the window.
                <img
                  className="gr-photo"
                  data-el={`HOME-FEATURED-PRODUCT-IMG-${i + 1}`}
                  src="/eldreve/home/2380-416.png"
                  alt={card.alt}
                  width={LED_W}
                  height={LED_H}
                  style={{
                    ...abs(0, LED_TOP, LED_W, LED_H),
                    display: "block",
                    maxWidth: "none",
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
