"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The A-6 "Real Gifts, Real Moments" review rail (Figma 163:99, 193:150,
 * 193:155) plus its pagination dots (442:161), rebuilt on the shared Carousel
 * so the three cards auto-slide one at a time, slowly, right to left.
 *
 * Client component because the rail hands the Carousel a `renderSlide`
 * callback, which only crosses a client boundary — keeping it here is what lets
 * A-6 itself stay a server component. Coordinates stay homepage-frame absolute,
 * exactly as A-6 drew them.
 */

import { Carousel } from "@/components/home/Carousel";
import type { RailTiming } from "@/lib/home-content/rail-timing";
import { abs } from "@/lib/figma-layout";
import { playfair } from "@/lib/fonts";
import { HomePhoto } from "@/components/home/HomePhoto";
import type { HomeFrames } from "@/lib/home-content/frames";
import type { HomeText } from "@/lib/home-content/registry";

/* Review cards 1–3 (nodes 163:99, 193:150, 193:155) — identical structure, so
   only the photo, its crop and the quote differ. The design lays them out on a
   134px pitch (x = 22 / 156 / 290) at y=2873, i.e. a horizontal rail, so they
   are drawn by the shared Carousel and these values are CELL coordinates
   (each card's own x/y subtracted). photoBox is the photo's rect relative to
   the clipping image frame.

   Quote, photo and alt now come from the registry through `c`; what stays here
   is the per-card GEOMETRY, which is traced from Figma and is not owner data —
   note card 1's photo is a 132×170 render pulled up 55px behind the 122×69
   opening, while cards 2 and 3 fill theirs exactly. */
type Review = {
  photoBox: readonly [number, number, number, number];
  quoteX: number;
  /** The star strip, which the 08-10 pass moved into the deleted badge row. */
  starsX: number;
  starsY: number;
};

const REVIEWS: readonly Review[] = [
  { photoBox: [0, -55, 132, 170], quoteX: 8, starsX: 6, starsY: 109 },
  { photoBox: [0, 0, 122, 69], quoteX: 8, starsX: 8, starsY: 111 },
  { photoBox: [0, 0, 122, 69], quoteX: 9, starsX: 8, starsY: 110 },
];

/** The editable strings of one review card, picked out of the `recipient` section. */
type ReviewCopy = { photo: string; photoAlt: string; quote: string };

/**
 * Split the flat `recipient` review fields into one object per card.
 *
 * @param c - The resolved `recipient` section copy.
 * @returns Review copy in slide order.
 */
function copyOf(c: HomeText["recipient"]): readonly ReviewCopy[] {
  return [
    {
      photo: c.review_1_photo,
      photoAlt: c.review_1_photo_alt,
      quote: c.review_1_quote,
    },
    {
      photo: c.review_2_photo,
      photoAlt: c.review_2_photo_alt,
      quote: c.review_2_quote,
    },
    {
      photo: c.review_3_photo,
      photoAlt: c.review_3_photo_alt,
      quote: c.review_3_quote,
    },
  ];
}

/* Review pagination dots (442:161), normalized to the same visible size. The
   design draws FOUR dots for three review cards, so only the first three are
   wired to a slide; the fourth stays the inert ellipse rendered by A-6. */
const REVIEW_DOTS = [
  { x: 185.5, y: 2967.5, size: 7, activeSize: 8 },
  { x: 204, y: 2967.5, size: 7, activeSize: 8 },
  { x: 222, y: 2967.5, size: 7, activeSize: 8 },
];

function ReviewCard({
  photoBox,
  quoteX,
  starsX,
  starsY,
  copy,
  n,
  frames,
}: Review & {
  copy: ReviewCopy;
  n: number;
  frames?: HomeFrames;
}) {
  return (
    <div
      style={{
        ...abs(0, 0, 122, 124),
        background: "#FFFBF6",
        borderRadius: 10,
        boxShadow: "inset 0 0 0 1px #E5D1B8",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...abs(0, 0, 122, 69),
          background: "#F3C6D1",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* The OPENING is 122×69 for all three; card 1's photo is a 132×170
            bleed pulled up 55px behind it. HomePhoto keeps that traced
            geometry for the design's own file and cover-fills the opening,
            framed where the owner says, for anybody else's. */}
        <HomePhoto
          section="recipient"
          field={`review_${n}_photo`}
          value={copy.photo}
          alt={copy.photoAlt}
          box={{ w: 122, h: 69 }}
          design={{
            x: photoBox[0],
            y: photoBox[1],
            w: photoBox[2],
            h: photoBox[3],
            objectFit: "cover",
          }}
          frames={frames}
        />
      </div>
      <div
        data-field={`recipient.review_${n}_quote`}
        className={playfair.className}
        style={{
          ...abs(quoteX, 72, 106),
          fontSize: 13,
          lineHeight: "12px",
          fontWeight: 500,
          color: "#3B2F2F",
        }}
      >
        {copy.quote}
      </div>
      <img
        data-field="recipient.reviews_stars"
        src="/eldreve/home/163-103.svg"
        alt="★★★★★"
        width={106}
        height={11}
        style={{
          ...abs(starsX, starsY, 106, 11),
          display: "block",
          objectFit: "none",
          objectPosition: "left center",
        }}
      />
      {/* The badge glyph (442:149) and its "Verified Purchase" label used to
          close each card. Both are deleted at source on 08-10 and the stars
          took their place.
          AI-TAG(AI-045): OWNER-DECISION — this deletion, the four certificate
          numbers and the brand-story paragraph remove substance rather than
          decoration. See /agent-delivery/sessions/figma-sync-home-page-08-10-claude-figma-sync-home-page-75f37e.md. */}
    </div>
  );
}

/**
 * The review card rail plus the three dots that are wired to a slide.
 *
 * @param c - The resolved `recipient` section copy, supplying all three quotes,
 *   their photos, the shared trust label and the cards' destination.
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function ReviewsRail({
  c,
  timing,
  frames,
}: {
  c: HomeText["recipient"];
  timing: RailTiming;
  frames?: HomeFrames;
}) {
  const copies = copyOf(c);
  return (
    /* Review rail (163:99, 193:150, 193:155) + its dots (442:161) — the
       three cards auto-slide one at a time, slowly, right-to-left. Cell =
       one card (122), pitch = the 134px gap between card origins, and the
       window runs from the first card to x=430 so the rail clips at the
       canvas edge exactly as the Figma frame does. */
    <Carousel
      window={{ left: 21, top: 2766, width: 409, height: 124 }}
      count={REVIEWS.length}
      cellWidth={122}
      step={134}
      autoplayMs={timing.autoplayMs}
      slideMs={timing.slideMs}
      dots={REVIEW_DOTS}
      activeColor="#C46E29"
      idleColor="#E0CCB2"
      href={c.reviews_href}
      hrefField="recipient.reviews_href"
      label="review"
      renderSlide={(i) => (
        <ReviewCard
          {...REVIEWS[i]}
          copy={copies[i]}
          n={i + 1}
          frames={frames}
        />
      )}
    />
  );
}
