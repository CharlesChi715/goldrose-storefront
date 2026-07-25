/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The /shop page — a pixel-exact implementation of the "shop" frame (node
 * 24:396, 430×1822, 2026-07-25 redesign palette) from the VELORIA Figma
 * file. Every coordinate, size, color, and font value comes verbatim from
 * the Figma REST API. Photo assets in /public/veloria(/home) are exact 2x
 * node renders. Product cards keep the live-catalog wiring (name, price,
 * compare-at, link → /products/[slug]); star rows and hearts are static
 * design art (ratings/wishlist are out of scope this release, IxD README).
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
  ListviewIcon,
  PromoBar,
  ScaleFrame,
  ShopHeader,
} from "@/components/veloria";
import { inter, notoSC, tenor } from "@/lib/fonts";
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

// Redesign palette (2026-07-25 frame edit)
const INK = "#3B2F2F";
const INK_SOFT = "#4A403B";
const MUTED = "#B8A69A";
const SAND = "#E5D9C9";

/* ---------- Product cards (Figma frame order, left/right per row) ---------- */

// Left cards are 203 wide, right cards 204 (verbatim frame widths); `img` is
// the 2x render of that card's own Product Visual node, `stars` the row's
// star-glyph render (185px left / 186px right).
const CARDS = [
  { x: 8, y: 408.5, w: 203, img: "58-61", stars: "58-64", starsW: 185 },
  { x: 219, y: 408.5, w: 204, img: "58-91", stars: "58-94", starsW: 186 },
  { x: 8, y: 716.5, w: 203, img: "58-103", stars: "58-64", starsW: 185 },
  { x: 219, y: 716.5, w: 204, img: "58-113", stars: "58-94", starsW: 186 },
  { x: 8, y: 1024.5, w: 203, img: "58-125", stars: "58-64", starsW: 185 },
  { x: 219, y: 1024.5, w: 204, img: "58-135", stars: "58-94", starsW: 186 },
  { x: 8, y: 1332.5, w: 203, img: "58-148", stars: "58-64", starsW: 185 },
  { x: 219, y: 1332.5, w: 204, img: "58-158", stars: "58-94", starsW: 186 },
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
  const heartX = card.w === 203 ? 154 : 155; // 收藏 art: 162/374 in frame coords
  return (
    <Link
      href={href}
      style={{
        ...abs(card.x, card.y, card.w, 297),
        display: "block",
        background: "#FFFBF6",
        boxShadow: `inset 0 0 0 1px ${SAND}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <img
        src={`/veloria/home/${card.img}.png`}
        alt="Artisan 24K gold-dipped eternal rose"
        width={card.w}
        height={204}
        style={{ ...abs(0, 0, card.w, 204), display: "block" }}
      />
      <div
        className={inter.className}
        data-live-text
        style={{
          ...abs(9, 214, card.w - 18),
          ...txt(16, 16, INK),
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {data?.shortName ?? "Double Rose Gift Set"}
      </div>
      <img
        src={`/veloria/home/${card.stars}.svg`}
        alt="Five star rating"
        width={card.starsW}
        height={11}
        style={{ ...abs(9, 234, card.starsW, 11), display: "block" }}
      />
      {/* Price pair. The frame gives each price its own fixed box (48 / 51
          wide) because the mock text is the short "$219"; real prices carry
          cents and overflow that, so the two flow in one row that ends short
          of the heart — same origin as the design, no overlap. */}
      <div
        className={notoSC.className}
        data-live-text
        style={{
          ...abs(9, 249, heartX - 13, 43),
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflow: "hidden",
        }}
      >
        <span style={{ ...txt(20, 24, INK), fontWeight: 700, flexShrink: 0 }}>
          {data?.price ?? "$219"}
        </span>
        {data === null || data.compareAt !== null ? (
          <span
            style={{
              ...txt(14, 16.8, MUTED),
              textDecoration: "line-through",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data?.compareAt ?? "$189.00"}
          </span>
        ) : null}
      </div>
      <img
        src="/veloria/home/58-86.png"
        alt=""
        width={40}
        height={43}
        style={{ ...abs(heartX, 249, 40, 43), display: "block" }}
      />
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
      <ScaleFrame height={1822} background="#FFF6EC" fontClass={tenor.className}>
      {/* Hero carousel render (badge, Shop Now pill and dots baked in);
          bleeds 7px past both canvas edges — the canvas clips it, as Figma
          does. */}
      <img
        src="/veloria/home/31-14.png"
        alt="Featured collection"
        width={444}
        height={202}
        fetchPriority="high"
        style={{ ...abs(-7, 94, 444, 202), display: "block", maxWidth: "none" }}
      />

      <ShopHeader />
      <PromoBar slogan={promo.text} isDefault={promo.isDefault} variant="brown" />

      {/* Filter bar. The +1.5px on the two tight-line-height Tenor labels is
          the Chrome-vs-Figma baseline correction verified on the homepage. */}
      <div style={{ ...abs(0, 325.359, 127.78), ...txt(14, 14.84, INK, "center"), textTransform: "uppercase" }}>
        120 Apparel
      </div>
      <div
        style={{ ...abs(217, 308, 91.136, 43.105), background: "rgba(229,217,201,0.10)", borderRadius: 33 }}
      />
      <div style={{ ...abs(236, 325.844, 36.33), ...txt(13, 13.78, INK_SOFT, "center") }}>New</div>
      <span style={abs(275.961, 323, 21, 20)}>
        <DownIcon color={INK} />
      </span>
      <div
        style={{ ...abs(317, 309, 45.099, 43.105), background: "rgba(229,217,201,0.10)", borderRadius: "50%" }}
      />
      <span style={abs(327.022, 318.579, 26, 24)}>
        <ListviewIcon color={INK} />
      </span>
      <div
        style={{ ...abs(374.531, 308.254, 45.099, 43.105), background: "rgba(229,217,201,0.10)", borderRadius: "50%" }}
      />
      <span style={abs(384, 320, 26, 24)}>
        <FilterIcon color="#D4AF37" />
      </span>

      {/* Active filter chips — strokes are OUTSIDE-aligned in Figma, so the
          1px ring is a child div sitting 1px outside the chip box. */}
      {[
        { x: 17, w: 95, label: "Women", labelX: 10, labelW: 53, closeX: 69 },
        { x: 119, w: 116, label: "All apparel", labelX: 10, labelW: 74, closeX: 90 },
      ].map((chip) => (
        <div key={chip.label} style={abs(chip.x, 359, chip.w, 32)}>
          <div style={{ ...abs(-1, -1, chip.w + 2, 34), border: `1px solid ${SAND}`, borderRadius: 31 }} />
          <div
            style={{ ...abs(chip.labelX, 8, chip.labelW), ...txt(14, 16, INK, "center"), letterSpacing: 0.14 }}
          >
            {chip.label}
          </div>
          <span style={abs(chip.closeX, 8, 16, 16)}>
            <CloseIcon color={INK_SOFT} />
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
        { x: 110, label: "1", active: true },
        { x: 154, label: "2", active: false },
        { x: 198, label: "3", active: false },
        { x: 242, label: "4", active: false },
        { x: 286, label: "5", active: false },
      ].map((p) => (
        <div
          key={p.label}
          style={{ ...abs(p.x, 1656.5, 32, 32), background: p.active ? INK : "rgba(184,166,154,0.10)" }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 4.76,
              width: "100%",
              textAlign: "center",
              ...txt(16, 24, p.active ? "#FFF6EC" : INK_SOFT),
            }}
          >
            {p.label}
          </div>
        </div>
      ))}
      <span style={abs(327.052, 1660.59, 24, 24)}>
        <ForwardIcon color={INK} />
      </span>
      </ScaleFrame>

      {/* Chatbox (mascot + bar) floats fixed above the nav; opens the
          placeholder chat panel on click. */}
      <ConciergeChat navClearance={60} mascotOnTop variant="brown" />
    </>
  );
}
