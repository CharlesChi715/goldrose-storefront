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
 * ⚠️ MOCKED DATA: both cards are still the design's placeholders rather than
 * catalogue products (OQ-3) — but their titles, prices, captions, photos and
 * shared destination are now owner-editable in Content → Home page, so the copy
 * comes from `c` and only the GEOMETRY is still hard-coded here.
 *
 * AI-TAG(AI-027): AGENT-DECISION — this reverses the 07-26 "one card × four"
 * rail now that the frame carries two real cards and no dots. See
 * /agent-delivery/sessions/figma-sync-homepage-08-04-feat-figma-sync.md.
 */

import { abs } from "@/lib/figma-layout";
import { Carousel } from "@/components/home/Carousel";
import type { RailTiming } from "@/lib/home-content/rail-timing";
import { playfair, notoSC } from "@/lib/fonts";
import { HomePhoto } from "@/components/home/HomePhoto";
import type { HomeText } from "@/lib/home-content/registry";

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
 * All that differs between the two cards once the box is uniform and the copy
 * comes from the registry: how wide the price node is, and whether it is
 * centred in it. The content block's internal rhythm (12/57/75/108) is shared.
 */
type Card = {
  priceW: number;
  /** Card 1's price node is CENTER-aligned in its 45px box; card 2's is LEFT. */
  priceCentered: boolean;
};

const CARDS: readonly Card[] = [
  { priceW: 45, priceCentered: true },
  { priceW: 53, priceCentered: false },
];

/** The editable strings of one card, picked out of the `featured` section. */
type CardCopy = {
  title: string;
  price: string;
  note: string;
  photo: string;
  alt: string;
};

/**
 * Split the flat `featured` fields into one object per card. The registry keeps
 * them flat (`card_1_title`, `card_2_title` …) because a slot key is one string;
 * the rail wants them grouped.
 *
 * @param c - The resolved `featured` section copy.
 * @returns Card copy in slide order.
 */
function copyOf(c: HomeText["featured"]): readonly CardCopy[] {
  return [
    {
      title: c.card_1_title,
      price: c.card_1_price,
      note: c.card_1_note,
      photo: c.card_1_photo,
      alt: c.card_1_photo_alt,
    },
    {
      title: c.card_2_title,
      price: c.card_2_price,
      note: c.card_2_note,
      photo: c.card_2_photo,
      alt: c.card_2_photo_alt,
    },
  ];
}

/**
 * One best-seller card's content block, drawn below its photo window. `n` is
 * the 1-based slide number: the element names carry it so each card stays
 * unique in the DOM. Built at runtime, so the static naming test skips them,
 * exactly as it does for Carousel's own `name`-derived names.
 */
function Content({ card, copy, n }: { card: Card; copy: CardCopy; n: number }) {
  return (
    <div
      style={{
        ...abs(0, PHOTO_H, CARD_W, CONTENT_H),
        overflow: "hidden",
      }}
    >
      <div
        data-field={`featured.card_${n}_title`}
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
        {copy.title}
      </div>
      <div
        data-field={`featured.card_${n}_price`}
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
        {copy.price}
      </div>
      <div
        data-field={`featured.card_${n}_note`}
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
        {copy.note}
      </div>
      {/* 2380:412 / 2380:421 cta — Figma-rendered strip */}
      <img
        data-el={`HOME-FEATURED-PRODUCT-CTA-${n}`}
        data-field="featured.card_cta_label"
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
 * @param c - The resolved `featured` section copy, supplying both cards' text,
 *   photos and their shared destination.
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function BestSellersRail({
  c,
  timing,
}: {
  c: HomeText["featured"];
  timing: RailTiming;
}) {
  const copies = copyOf(c);
  return (
    <Carousel
      // 18 → 430: the window ends at the canvas edge, so the next card peeks
      // exactly as far as the design shows it.
      window={{ left: 18, top: 220, width: 412, height: CARD_H }}
      count={CARDS.length}
      cellWidth={CARD_W}
      step={PITCH}
      autoplayMs={timing.autoplayMs}
      slideMs={timing.slideMs}
      dots={[]}
      activeColor="#D4AF37"
      idleColor="#E5D9C9"
      href={c.rail_href}
      hrefField="featured.rail_href"
      label="best seller"
      name="HOME-FEATURED"
      renderSlide={(i) => {
        const card = CARDS[i];
        const copy = copies[i];
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
              {/* Both photos sit in a bleed box measured for THAT exact file —
                  card 1's 1px/7px overhang, and card 2's LED_* scale-up around
                  its transparent padding. Neither means anything for a photo
                  somebody uploads, so HomePhoto keeps the measurements for the
                  design's own picture and falls back to a plain cover fill of
                  the 250×240 window once a card is given a different one. */}
              <HomePhoto
                section="featured"
                field={`card_${i + 1}_photo`}
                value={copy.photo}
                alt={copy.alt}
                box={{ w: CARD_W, h: PHOTO_H }}
                design={
                  i === 0
                    ? {
                        x: -1,
                        y: -7,
                        w: 252,
                        h: 271,
                        objectFit: "cover",
                        borderRadius: 22,
                      }
                    : { x: 0, y: LED_TOP, w: LED_W, h: LED_H }
                }
                dataEl={`HOME-FEATURED-PRODUCT-IMG-${i + 1}`}
                className="gr-photo"
              />
            </div>
            <Content card={card} copy={copy} n={i + 1} />
          </div>
        );
      }}
    />
  );
}
