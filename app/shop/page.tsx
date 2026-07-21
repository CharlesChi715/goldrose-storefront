/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The /shop page — a pixel-exact implementation of "Frame 26" (node 24:644,
 * inner canvas node 24:396, 430×1938) from the VELORIA Figma file. Every
 * coordinate, size, color, and font value comes verbatim from the Figma REST
 * API. Photo assets in /public/veloria are exact 2x node renders. Product
 * cards link to /products/[slug]; the bottom nav (shared) is viewport-fixed.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ConciergeChat } from "@/components/ConciergeChat";
import {
  abs,
  txt,
  CloseIcon,
  DownIcon,
  FilterIcon,
  ForwardIcon,
  HeartIcon,
  ListviewIcon,
  PromoBar,
  ScaleFrame,
  VHeader,
} from "@/components/veloria";
import { cormorant, notoSC, tenor } from "@/lib/fonts";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop the AUREÀ 24K gold dipped rose collection.",
};

const INK = "#1B362B";
const GREY = "#555555";

/* ---------- Product cards (Figma frame order, left/right per row) ---------- */

const CARDS = [
  { x: 5, y: 414, img: "card-1" },
  { x: 221, y: 414, img: "card-2" },
  { x: 5, y: 746, img: "card-3" },
  { x: 221, y: 746, img: "card-4" },
  { x: 5, y: 1078, img: "card-5" },
  { x: 221, y: 1078, img: "card-6" },
  { x: 5, y: 1410, img: "card-7" },
  { x: 221, y: 1410, img: "card-8" },
];

function ProductCard({ card, href }: { card: (typeof CARDS)[number]; href: string }) {
  return (
    <Link
      href={href}
      style={{
        ...abs(card.x, card.y, 204, 315),
        display: "block",
        background: "#FFFFFF",
        boxShadow: "inset 0 0 0 1px #FDF2E4",
        borderRadius: 15,
      }}
    >
      <div style={{ ...abs(0, 0.5, 204, 255), background: "#FDF2E4", borderRadius: 15 }} />
      <img
        src={`/veloria/${card.img}.png`}
        alt="Artisan 24K gold-dipped eternal rose"
        width={204}
        height={214}
        style={{ ...abs(0, 0.5, 204, 214), display: "block" }}
      />
      <span style={abs(168.5, 10.5, 25, 26)}>
        <HeartIcon />
      </span>
      <div
        className={cormorant.className}
        style={{ ...abs(19.5, 257.5, 165), ...txt(25, 32, "#152C27", "center"), fontWeight: 600 }}
      >
        Artisan
      </div>
      <div
        className={notoSC.className}
        style={{ ...abs(42.5, 293.5), ...txt(16, 19.2, "#073A31"), fontWeight: 700 }}
      >
        $159.00
      </div>
      <div
        className={notoSC.className}
        style={{ ...abs(110.5, 294.5), ...txt(14, 16.8, "#918A83"), textDecoration: "line-through" }}
      >
        $189.00
      </div>
    </Link>
  );
}

/* ---------- Page ---------- */

export default function ShopPage() {
  return (
    <>
      <ScaleFrame height={1938} background="#FFFFFF" fontClass={tenor.className}>
      {/* Hero carousel render (dots baked in); bleeds 7px past both canvas
          edges in the design — the canvas clips it, exactly as Figma does. */}
      <img
        src="/veloria/shop-hero.png"
        alt="Featured collection"
        width={444}
        height={202}
        style={{ ...abs(-7, 94, 444, 202), display: "block", maxWidth: "none" }}
      />

      <VHeader backHref="/" right="search" />
      <PromoBar />

      {/* Filter bar. The +1.5px on the two tight-line-height Tenor labels is
          the Chrome-vs-Figma baseline correction verified on the homepage. */}
      <div style={{ ...abs(0, 325.359, 127.78), ...txt(14, 14.84, INK, "center"), textTransform: "uppercase" }}>
        4500 Apparel
      </div>
      <div
        style={{ ...abs(217, 308, 91.136, 43.105), background: "rgba(196,196,196,0.10)", borderRadius: 33 }}
      />
      <div style={{ ...abs(236, 325.844, 36.33), ...txt(13, 13.78, GREY, "center") }}>New</div>
      <span style={abs(275.961, 323, 21, 20)}>
        <DownIcon />
      </span>
      <div
        style={{ ...abs(317, 309, 45.099, 43.105), background: "rgba(196,196,196,0.10)", borderRadius: "50%" }}
      />
      <span style={abs(327.022, 318.579, 26, 24)}>
        <ListviewIcon />
      </span>
      <div
        style={{ ...abs(374.531, 308.254, 45.099, 43.105), background: "rgba(196,196,196,0.10)", borderRadius: "50%" }}
      />
      <span style={abs(384, 320, 26, 24)}>
        <FilterIcon />
      </span>

      {/* Active filter chips — strokes are OUTSIDE-aligned in Figma, so the
          1px ring is a child div sitting 1px outside the chip box. */}
      {[
        { x: 17, w: 95, label: "Women", labelX: 10, labelW: 53, closeX: 69 },
        { x: 119, w: 116, label: "All apparel", labelX: 10, labelW: 74, closeX: 90 },
      ].map((chip) => (
        <div key={chip.label} style={abs(chip.x, 359, chip.w, 32)}>
          <div style={{ ...abs(-1, -1, chip.w + 2, 34), border: "1px solid #DEDEDE", borderRadius: 31 }} />
          <div
            style={{ ...abs(chip.labelX, 8, chip.labelW), ...txt(14, 16, INK, "center"), letterSpacing: 0.14 }}
          >
            {chip.label}
          </div>
          <span style={abs(chip.closeX, 8, 16, 16)}>
            <CloseIcon />
          </span>
        </div>
      ))}

      {/* Product grid — each card routes to its product detail page. */}
      {CARDS.map((card, i) => (
        <ProductCard key={i} card={card} href={`/products/${products[i % products.length].handle}`} />
      ))}

      {/* Pagination */}
      {[
        { x: 101, label: "1", active: true },
        { x: 145, label: "2", active: false },
        { x: 189, label: "3", active: false },
        { x: 233, label: "4", active: false },
        { x: 277, label: "5", active: false },
      ].map((p) => (
        <div
          key={p.label}
          style={{ ...abs(p.x, 1763, 32, 32), background: p.active ? INK : "rgba(136,136,136,0.10)" }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 4.76,
              width: "100%",
              textAlign: "center",
              ...txt(16, 24, p.active ? "#FCFCFC" : GREY),
            }}
          >
            {p.label}
          </div>
        </div>
      ))}
      <span style={abs(318.052, 1767.09, 24, 24)}>
        <ForwardIcon />
      </span>
      </ScaleFrame>

      {/* Chatbox (mascot + bar) floats fixed above the nav; opens the
          placeholder chat panel on click. */}
      <ConciergeChat mascotOnTop />
    </>
  );
}
