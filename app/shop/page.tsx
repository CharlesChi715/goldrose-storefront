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
import { getPromoSlogan } from "@/lib/content";
import { formatMoney } from "@/lib/money";
import { getCatalog } from "@/lib/supabase/catalog.ts";

// DB-backed data (card links, promo slogan) refreshes without a redeploy (§8).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop the GoldRose 24K gold dipped rose collection.",
  alternates: { canonical: "/shop" },
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

type CardData = { shortName: string; price: string; compareAt: string | null } | null;

function ProductCard({
  card,
  href,
  data,
}: {
  card: (typeof CARDS)[number];
  href: string;
  /** Live catalog values for the designated text boxes; null = design text. */
  data: CardData;
}) {
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
        data-live-text
        style={{
          ...abs(19.5, 257.5, 165),
          ...txt(25, 32, "#152C27", "center"),
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {data?.shortName ?? "Artisan"}
      </div>
      <div
        className={notoSC.className}
        data-live-text
        style={{ ...abs(42.5, 293.5), ...txt(16, 19.2, "#073A31"), fontWeight: 700 }}
      >
        {data?.price ?? "$159.00"}
      </div>
      {data === null || data.compareAt !== null ? (
        <div
          className={notoSC.className}
          data-live-text
          style={{ ...abs(110.5, 294.5), ...txt(14, 16.8, "#918A83"), textDecoration: "line-through" }}
        >
          {data?.compareAt ?? "$189.00"}
        </div>
      ) : null}
    </Link>
  );
}

/* ---------- Page ---------- */

export default async function ShopPage() {
  // Card links + promo slogan come from the DB; a dead DB degrades gracefully.
  let handles: string[] = [];
  let cardData: Array<{ handle: string; shortName: string; price: string; compareAt: string | null }> = [];
  let promo = { text: "", isDefault: true };
  try {
    // Card order = active products by position (§8); cards cycle the catalog.
    const catalog = await getCatalog();
    handles = catalog.map((product) => product.handle);
    cardData = catalog.map((product) => ({
      handle: product.handle,
      shortName: product.short_name || product.title,
      price: formatMoney(product.variants[0]?.price_cents ?? 0),
      compareAt:
        product.variants[0]?.compare_at_price_cents != null
          ? formatMoney(product.variants[0].compare_at_price_cents)
          : null,
    }));
    promo = await getPromoSlogan();
  } catch {
    // fixed design still renders
  }

  return (
    <>
      <ScaleFrame height={1938} background="#FFFFFF" fontClass={tenor.className} navGap={1}>
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
      <PromoBar slogan={promo.text} isDefault={promo.isDefault} />

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
        <ProductCard
          key={i}
          card={card}
          href={handles.length ? `/products/${handles[i % handles.length]}` : "/shop"}
          data={cardData.length ? cardData[i % cardData.length] : null}
        />
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
      <ConciergeChat navClearance={60} mascotOnTop />
    </>
  );
}
