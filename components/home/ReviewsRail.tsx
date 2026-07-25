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

import {
  Carousel,
  RAIL_AUTOPLAY_MS,
  RAIL_SLIDE_MS,
} from "@/components/home/Carousel";
import { abs } from "@/components/veloria";
import { playfair, notoSC } from "@/lib/fonts";

/* Review cards 1–3 (nodes 163:99, 193:150, 193:155) — identical structure, so
   only the photo, its crop and the quote differ. The design lays them out on a
   134px pitch (x = 22 / 156 / 290) at y=4384, i.e. a horizontal rail, so they
   are drawn by the shared Carousel and these values are CELL coordinates
   (each card's own x/y subtracted). photoBox is the photo's rect relative to
   the clipping image frame. */
type Review = {
  photo: string;
  photoBox: readonly [number, number, number, number];
  photoAlt: string;
  quote: string;
  quoteX: number;
};

const REVIEWS: readonly Review[] = [
  {
    photo: "/veloria/home/163-101.png",
    photoBox: [0, -55, 132, 170],
    photoAlt: "Customer photo of a gold rose gift",
    quote: "“The most beautiful gift I’ve ever received.”",
    quoteX: 8,
  },
  {
    photo: "/veloria/home/193-152.png",
    photoBox: [0, 0, 122, 69],
    photoAlt: "Customer photo of a gold rose gift",
    quote: "“My wife was speechless on our anniversary.”",
    quoteX: 8,
  },
  {
    photo: "/veloria/home/193-157.png",
    photoBox: [0, 0, 122, 69],
    photoAlt: "Customer photo of a gold rose gift",
    quote: "“Elegant and meaningful for our client.”",
    quoteX: 9,
  },
];

/* Review pagination dots (442:161), canvas-absolute and verbatim: the design
   draws the active dot at 8px and the rest at 7px. It draws FOUR dots for
   three review cards, so only the first three are wired to a slide; the fourth
   stays the inert ellipse the import drew (rendered by A-6). */
const REVIEW_DOTS = [
  { x: 184, y: 4522, size: 8 },
  { x: 203, y: 4522.5, size: 7 },
  { x: 221, y: 4522.5, size: 7 },
];

function ReviewCard({ photo, photoBox, photoAlt, quote, quoteX }: Review) {
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
        <img
          src={photo}
          alt={photoAlt}
          width={photoBox[2]}
          height={photoBox[3]}
          style={{
            ...abs(photoBox[0], photoBox[1], photoBox[2], photoBox[3]),
            display: "block",
            objectFit: "cover",
          }}
        />
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(quoteX, 72, 106),
          fontSize: 8.5,
          lineHeight: "10px",
          fontWeight: 500,
          color: "#3B2F2F",
        }}
      >
        {quote}
      </div>
      <img
        src="/veloria/home/163-103.svg"
        alt="★★★★★"
        width={106}
        height={11}
        style={{
          ...abs(8, 95, 106, 11),
          display: "block",
          objectFit: "none",
          objectPosition: "left center",
        }}
      />
      <img
        src="/veloria/home/442-149.svg"
        alt=""
        width={12}
        height={12}
        style={{ ...abs(8, 109, 12, 12), display: "block" }}
      />
      <div
        className={notoSC.className}
        style={{
          ...abs(23, 109, 57),
          fontSize: 7,
          lineHeight: "10px",
          fontWeight: 400,
          color: "#3B2E2E",
          whiteSpace: "nowrap",
        }}
      >
        Verified Purchase
      </div>
    </div>
  );
}

/**
 * The review card rail plus the three dots that are wired to a slide.
 *
 * @returns A slow, one-card-at-a-time carousel clipped to the canvas edge.
 */
export function ReviewsRail() {
  return (
    /* Review rail (163:99, 193:150, 193:155) + its dots (442:161) — the
       three cards auto-slide one at a time, slowly, right-to-left. Cell =
       one card (122), pitch = the 134px gap between card origins, and the
       window runs from the first card to x=430 so the rail clips at the
       canvas edge exactly as the Figma frame does. */
    <Carousel
      window={{ left: 22, top: 4384, width: 408, height: 124 }}
      count={REVIEWS.length}
      cellWidth={122}
      step={134}
      autoplayMs={RAIL_AUTOPLAY_MS}
      slideMs={RAIL_SLIDE_MS}
      dots={REVIEW_DOTS}
      activeColor="#C46E29"
      idleColor="#E0CCB2"
      href="/shop"
      label="review"
      renderSlide={(i) => <ReviewCard {...REVIEWS[i]} />}
    />
  );
}
