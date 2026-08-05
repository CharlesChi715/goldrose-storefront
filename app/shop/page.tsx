/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The /shop page — a pixel-exact implementation of the "shop" frame (node
 * 24:396, 430×1822, 2026-07-25 redesign palette) from the ELDREVE Figma
 * file. Every coordinate, size, color, and font value comes verbatim from
 * the Figma REST API. Photo assets in /public/eldreve(/home) are exact 2x
 * node renders. Product cards keep the live-catalog wiring (name, price,
 * compare-at, link → /products/[slug]); star rows and hearts are static
 * design art (ratings/wishlist are out of scope this release, IxD README).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ConciergeChat } from "@/components/ConciergeChat";
import {
  ForwardIcon,
  PromoBar,
  ScaleFrame,
  ShopHeader,
} from "@/components/chrome";
import {
  ShopInteractive,
  type CardData,
  type SlotSpec,
} from "@/components/shop/ShopInteractive";
import { abs, txt } from "@/lib/figma-layout";
import { fileUrl } from "@/lib/files-url";
import { tenor } from "@/lib/fonts";
import { getPromoSlogan } from "@/lib/content";
import { formatMoney } from "@/lib/money";
import { getCatalog } from "@/lib/supabase/catalog.ts";

// DB-backed data (card links, promo slogan) refreshes without a redeploy (§8).
export const revalidate = 300;

/**
 * Pages 2-5 are the same eight placeholder products in a different order, so
 * they are kept out of search results until real paging exists; page 1 stays
 * the canonical /shop listing.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const requested = Number(params.page);
  const paged =
    Number.isInteger(requested) && requested > 1 && requested <= PAGE_COUNT;
  // Search results (?q=, from /search) are user-specific slices of the same
  // eight cards — keep them out of the index like pages 2-5.
  const noindex = paged || Boolean(params.q?.trim());
  return {
    title: paged ? `Shop · page ${requested}` : "Shop",
    description: "Shop the ELDREVE 24K gold dipped rose collection.",
    alternates: { canonical: "/shop" },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// Redesign palette (2026-07-25 frame edit); the card/chip shades moved into
// components/shop/ShopInteractive with the grid.
const INK = "#3B2F2F";
const INK_SOFT = "#4A403B";

/* ---------- Product cards (Figma frame order, left/right per row) ---------- */

// Left cards are 203 wide, right cards 204 (verbatim frame widths); `img` is
// the 2x render of that card's own Product Visual node, `stars` the row's
// star-glyph render (185px left / 186px right).
const CARDS: SlotSpec[] = [
  { x: 8, y: 408.5, w: 203, img: "58-61", stars: "58-64", starsW: 185 },
  { x: 219, y: 408.5, w: 204, img: "58-91", stars: "58-94", starsW: 186 },
  { x: 8, y: 716.5, w: 203, img: "58-103", stars: "58-64", starsW: 185 },
  { x: 219, y: 716.5, w: 204, img: "58-113", stars: "58-94", starsW: 186 },
  { x: 8, y: 1024.5, w: 203, img: "58-125", stars: "58-64", starsW: 185 },
  { x: 219, y: 1024.5, w: 204, img: "58-135", stars: "58-94", starsW: 186 },
  { x: 8, y: 1332.5, w: 203, img: "58-148", stars: "58-64", starsW: 185 },
  { x: 219, y: 1332.5, w: 204, img: "58-158", stars: "58-94", starsW: 186 },
];

/**
 * Pagination is placeholder depth: the design draws five pages, and there is
 * only one page of real products (OQ-3). Every page therefore shows the SAME
 * eight cards, rotated into different grid slots so the pages are visibly
 * distinct — page 1 keeps the design's exact order.
 */
const PAGE_COUNT = 5;
const ROTATE_PER_PAGE = 3;

/* ---------- Page ---------- */

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.page);
  const page =
    Number.isInteger(requested) && requested >= 1 && requested <= PAGE_COUNT
      ? requested
      : 1;
  const query = (params.q ?? "").trim().toLowerCase();
  // Card links + promo slogan come from the DB; a dead DB degrades gracefully.
  let cardData: CardData[] = [];
  let promo = { text: "", isDefault: true };
  try {
    // Card order = active products by position (§8); cards cycle the catalog.
    const catalog = await getCatalog();
    // /search hands off here as ?q= — a plain title/short-name match. When
    // nothing matches, the full catalog renders (the design has no empty
    // state for the grid; noted in docs/ixd/README.md).
    const matches = query
      ? catalog.filter((product) =>
          `${product.title} ${product.short_name ?? ""}`
            .toLowerCase()
            .includes(query),
        )
      : catalog;
    cardData = (matches.length ? matches : catalog).map((product) => ({
      handle: product.handle,
      shortName: product.short_name || product.title,
      price: formatMoney(product.variants[0]?.price_cents ?? 0),
      priceCents: product.variants[0]?.price_cents ?? 0,
      compareAt:
        product.variants[0]?.compare_at_price_cents != null
          ? formatMoney(product.variants[0].compare_at_price_cents)
          : null,
      // Resolved server-side (local path or Supabase storage URL) so the card
      // photo travels with the product when the grid is sorted.
      image: product.images[0] ? fileUrl(product.images[0].path) : null,
    }));
    promo = await getPromoSlogan();
  } catch {
    // fixed design still renders
  }

  return (
    <>
      <ScaleFrame
        height={1822}
        background="#FFF6EC"
        fontClass={tenor.className}
      >
        {/* Hero carousel render, 07-29 art (1523:1626 — badge, Shop Now pill
          and dots baked into the frame render); bleeds 7px past both canvas
          edges — the canvas clips it, as Figma does. */}
        <img
          src="/eldreve/screens/1523-1626.png"
          alt="Featured collection"
          width={444}
          height={202}
          fetchPriority="high"
          style={{
            ...abs(-7, 94, 444, 202),
            display: "block",
            maxWidth: "none",
          }}
        />

        <ShopHeader />
        <PromoBar
          slogan={promo.text}
          isDefault={promo.isDefault}
          variant="brown"
        />

        {/* Count / sort / filter row, active chips, grid, and the 07-27 sort
          dropdown + filter drawer overlays — client component so sorting and
          the overlays can hold state (components/shop/ShopInteractive). */}
        <ShopInteractive
          slots={CARDS}
          data={cardData}
          page={page}
          rotatePerPage={ROTATE_PER_PAGE}
        />

        {/* Pagination — page 1 keeps the bare /shop URL so the canonical page
          has no query string. */}
        {[110, 154, 198, 242, 286].map((x, i) => {
          const n = i + 1;
          const active = n === page;
          return (
            <Link
              key={n}
              href={n === 1 ? "/shop" : `/shop?page=${n}`}
              aria-label={`Page ${n}`}
              aria-current={active ? "page" : undefined}
              style={{
                ...abs(x, 1656.5, 32, 32),
                display: "block",
                background: active ? INK : "rgba(184,166,154,0.10)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 4.76,
                  width: "100%",
                  textAlign: "center",
                  ...txt(16, 24, active ? "#FFF6EC" : INK_SOFT),
                }}
              >
                {n}
              </div>
            </Link>
          );
        })}
        {/* Next page; inert on the last one, exactly as the design draws it. */}
        {page < PAGE_COUNT ? (
          <Link
            href={`/shop?page=${page + 1}`}
            aria-label="Next page"
            style={{ ...abs(327.052, 1660.59, 24, 24), display: "block" }}
          >
            <ForwardIcon color={INK} />
          </Link>
        ) : (
          <span style={abs(327.052, 1660.59, 24, 24)}>
            <ForwardIcon color={INK} />
          </span>
        )}
      </ScaleFrame>

      {/* Chatbox (mascot + bar) floats fixed above the nav; opens the
          placeholder chat panel on click. */}
      <ConciergeChat navClearance={60} mascotOnTop variant="brown" />
    </>
  );
}
