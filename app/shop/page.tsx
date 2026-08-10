/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The /shop page — a pixel-exact implementation of the "shop" frame (node
 * 24:396, 430×1822, 2026-07-25 redesign palette) from the ELDREVE Figma
 * file. Every coordinate, size, color, and font value comes verbatim from
 * the Figma REST API. Photo assets in /public/eldreve(/home) are exact 2x
 * node renders. Product cards keep the live-catalog wiring (name, price,
 * compare-at, link → /products/[slug]); the star row is static design art
 * (ratings are out of scope this release, IxD README).
 *
 * The grid renders ONE card per real catalog product and nothing else
 * (owner, 2026-08-06). It used to cycle the catalog to fill all eight of the
 * frame's slots, so a single product was drawn eight times across five
 * identical "pages". The frame's numbers are now the grid's CAPACITY rather
 * than its content: the canvas height, the row count and the pager are all
 * derived from how many products exist, and a full eight-card page rebuilds
 * the frame's 1822 exactly (see CANVAS below).
 *
 * The card's wishlist heart was removed on the owner's instruction
 * (2026-08-05), which also settles the IxD README's open question 3 the same
 * way it was already answered there ("no"): the frame draws a heart, but
 * wishlist is not in this release, and a heart that does nothing invites the
 * tap. The freed width went to the price row. The header heart on the product
 * page is a different control and stays — it is wired to a real device-local
 * wishlist (components/WishlistButton.tsx).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ConciergeChat } from "@/components/ConciergeChat";
import { SiteLegalFooter } from "@/components/SiteLegalFooter";
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
import {
  facetSubject,
  matchesFacets,
  parseFacetParam,
  type FacetSubject,
} from "@/lib/catalog/facets.ts";
import { searchDocs, toSearchDoc } from "@/lib/catalog/search.ts";
import { abs, txt } from "@/lib/figma-layout";
import { fileUrl } from "@/lib/files-url";
import { cardAreaOf } from "@/lib/images/spotlight";
import { tenor } from "@/lib/fonts";
import { getPromoSlogan } from "@/lib/content";
import { formatMoney } from "@/lib/money";
import { getCatalog } from "@/lib/supabase/catalog.ts";

// DB-backed data (card links, promo slogan) refreshes without a redeploy (§8).
export const revalidate = 300;

/**
 * Pages past the first are real slices of the catalog now, but they are still
 * kept out of the index: page 1 is the canonical /shop listing, and search
 * results (?q=, handed over from /search) are per-visitor slices that should
 * never be indexed at all.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; f?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const requested = Number(params.page);
  // Out-of-range pages fall back to page 1 in the body; noindexing anything
  // past the first page covers both without a second catalog read here.
  const paged = Number.isInteger(requested) && requested > 1;
  // A facet selection is one shopper's slice of the same products, so it is
  // noindexed for the reason ?q= is: /shop is the one page that should rank,
  // and every combination of eleven chips would otherwise be its own URL
  // competing with it.
  const noindex = paged || Boolean(params.q?.trim()) || Boolean(params.f);
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
// star-glyph render (185px left / 186px right). Slots are capacity: the grid
// fills as many as there are products and leaves the rest undrawn.
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

/** The frame's grid holds eight cards — four rows of two. */
const PAGE_SIZE = CARDS.length;
const COLUMNS = 2;

/* ---------- Canvas geometry, read back off the frame ---------- */

/**
 * CANVAS — the frame is 1822 tall with four full card rows and a pager. Every
 * number below is recovered from the slot table above so a shorter grid keeps
 * the design's own spacing instead of leaving a void where the missing rows
 * were: first row top 408.5, row pitch 308 (716.5 − 408.5), card height 297,
 * 27 from the last row down to the pager (1656.5 − 1629.5), pager 32 tall,
 * then 133.5 of tail (1822 − 1688.5). Four rows plus a pager therefore
 * reproduces 1822 to the pixel; anything less simply ends sooner — but never
 * higher than DRAWER_FLOOR, which the overlays need under them.
 */
const GRID_TOP = CARDS[0].y;
const ROW_PITCH = CARDS[COLUMNS].y - CARDS[0].y;
const CARD_H = 297;
const PAGER_GAP = 27;
const PAGER_H = 32;
const TAIL = 133.5;
/** Height reserved for the line that replaces the grid when nothing matches. */
const EMPTY_H = 60;

/**
 * DRAWER_FLOOR — the canvas may shorten to fit its grid, but it may never end
 * above the open filter drawer, because the drawer is drawn INSIDE the canvas
 * and the canvas clips (ScaleFrame's stage is overflow:hidden, as a Figma
 * frame is). Deriving the height from the rows alone had a hole in it: an
 * empty result set ended the canvas at 602 and cut the drawer off mid-"Price",
 * taking Availability, Reset and "Show N Results" with it — so the one
 * selection that empties the shop was also the one a shopper could not undo.
 * The number is the drawer's own bottom edge (abs(16, 356, 398, 472) in
 * components/shop/ShopInteractive) plus the 28 its drop shadow needs below it
 * (0 8px 20px), so the panel ends on the canvas rather than against its edge.
 * The sort dropdown sits at 357 and is 190 tall, well inside this.
 */
const DRAWER_FLOOR = 356 + 472 + 28;

/**
 * The frame draws five page buttons, 32 wide on a 44 pitch, running x=110 to
 * x=286 — centred on the 430 canvas. Fewer pages keep the pitch and re-centre
 * (each button dropped shifts the row half a pitch inward); more pages window
 * five buttons around the current one rather than overflowing the canvas.
 */
const PAGER_MAX = 5;
const PAGER_PITCH = 44;
const PAGER_X0 = 110;
/** The next-page chevron sits 41.052 right of the last button, 4.09 lower. */
const ARROW_DX = 41.052;
const ARROW_DY = 4.09;

/** The page buttons to draw, and where, for the current page. */
function pagerButtons(page: number, pageCount: number) {
  const shown = Math.min(PAGER_MAX, pageCount);
  const first = Math.min(
    Math.max(1, page - Math.floor(shown / 2)),
    pageCount - shown + 1,
  );
  const x0 = PAGER_X0 + ((PAGER_MAX - shown) * PAGER_PITCH) / 2;
  return Array.from({ length: shown }, (_, i) => ({
    n: first + i,
    x: x0 + i * PAGER_PITCH,
  }));
}

/* ---------- Page ---------- */

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; f?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  // The filter drawer's selection travels in the URL, not in client state, so
  // one authority decides the grid, the "N GIFTS" count and the pager. Doing
  // it in the browser instead would leave the server's pager counting products
  // the grid had already dropped. Unknown slugs are ignored (facets.ts).
  const selected = parseFacetParam(params.f);

  // Card content and the promo slogan come from the DB, and each degrades on
  // its own: a dead catalog shows the empty line below rather than a grid of
  // invented products, and a dead slogan still leaves the catalog readable.
  let cardData: CardData[] = [];
  // Every search-matched product's filterable facts, BEFORE the facet filter —
  // the drawer counts its pending selection against these, so "Show 2 Results"
  // is true before the tap rather than after it.
  let subjects: FacetSubject[] = [];
  let failed = false;
  try {
    // Card order = active products by position (§8).
    const catalog = await getCatalog();
    // The header's search overlay hands off here as ?q=, and BOTH sides run
    // the one engine in lib/catalog/search.ts — the dropdown a shopper picked
    // from and the grid they land on cannot show different products. It reads
    // names, occasions, recipients and availability, so the overlay's own
    // "Search products, occasions, or recipients" is true. No matches still
    // means no cards; it used to fall back to the whole catalog because the
    // eight fixed slots had to be filled either way.
    // The engine is generic over anything shaped like a SearchDoc, so each
    // document carries its own product home rather than being matched back by
    // handle afterwards — one less place for the two lists to fall out of step.
    const indexed = catalog.map((product) => ({
      ...toSearchDoc(product),
      product,
    }));
    // Ranked best-first. The grid's default sort ("Recommended"/"New") leaves
    // the incoming order alone, so for a search, relevance IS the order; only
    // an explicit price sort overrides it.
    const matches = searchDocs(indexed, query).hits.map(
      (hit) => hit.doc.product,
    );
    subjects = matches.map(facetSubject);
    // Then the drawer's chips: OR inside a heading, AND across headings.
    const shown = matches.filter((product) =>
      matchesFacets(facetSubject(product), selected),
    );
    cardData = shown.map((product) => ({
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
      // The card is framed on its own: it is a different shape from the PDP
      // window, so the hero photo gets a second area authored against THIS
      // box. A photo never framed for the card falls back to the spotlight's
      // point at no zoom, which is what the card showed before 0009.
      card: cardAreaOf(product.images[0]),
    }));
  } catch {
    failed = true;
  }

  let promo = { text: "", isDefault: true };
  try {
    promo = await getPromoSlogan();
  } catch {
    // the frame's default slogan still renders
  }

  // Real paging: how many products there are decides how many pages exist,
  // how many rows this page draws, and therefore how tall the canvas is.
  const pageCount = Math.max(1, Math.ceil(cardData.length / PAGE_SIZE));
  const requested = Number(params.page);
  const page =
    Number.isInteger(requested) && requested >= 1 && requested <= pageCount
      ? requested
      : 1;
  const cardsOnPage = Math.max(
    0,
    Math.min(PAGE_SIZE, cardData.length - (page - 1) * PAGE_SIZE),
  );
  const rows = Math.ceil(cardsOnPage / COLUMNS);
  // One page of results needs no pager, exactly as it needs no page numbers.
  const showPager = pageCount > 1;
  const gridBottom =
    rows > 0 ? GRID_TOP + (rows - 1) * ROW_PITCH + CARD_H : GRID_TOP + EMPTY_H;
  const pagerY = gridBottom + PAGER_GAP;
  // Math.max, not a branch on "is the grid empty": the rule is about what the
  // canvas has to hold, so any future reason for a short canvas is covered too.
  // A grid of even one row already reaches 839 and is untouched by this.
  const height = Math.max(
    gridBottom + (showPager ? PAGER_GAP + PAGER_H : 0) + TAIL,
    DRAWER_FLOOR,
  );

  // Page 1 keeps the bare /shop URL so the canonical page has no query
  // string; a search carries its ?q= across pages instead of dropping it.
  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (selected.length) qs.set("f", selected.join(","));
    if (n > 1) qs.set("page", String(n));
    const search = qs.toString();
    return search ? `/shop?${search}` : "/shop";
  };

  const buttons = showPager ? pagerButtons(page, pageCount) : [];
  const arrowX = buttons.length
    ? buttons[buttons.length - 1].x + ARROW_DX
    : PAGER_X0;

  return (
    <>
      <ScaleFrame
        height={height}
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
          pageSize={PAGE_SIZE}
          query={query}
          selected={selected}
          subjects={subjects}
          emptyNote={
            failed
              ? "We couldn’t load the collection just now — please refresh."
              : query
                ? `No gifts match “${query}”.`
                : selected.length
                  ? "No gifts match these filters."
                  : "No gifts available yet."
          }
        />

        {/* Pagination — drawn only when there is more than one real page. */}
        {showPager
          ? buttons.map(({ n, x }) => {
              const active = n === page;
              return (
                <Link
                  key={n}
                  href={pageHref(n)}
                  aria-label={`Page ${n}`}
                  aria-current={active ? "page" : undefined}
                  style={{
                    ...abs(x, pagerY, 32, 32),
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
            })
          : null}
        {/* Next page; inert on the last one, exactly as the design draws it. */}
        {showPager ? (
          page < pageCount ? (
            <Link
              href={pageHref(page + 1)}
              aria-label="Next page"
              style={{
                ...abs(arrowX, pagerY + ARROW_DY, 24, 24),
                display: "block",
              }}
            >
              <ForwardIcon color={INK} />
            </Link>
          ) : (
            <span style={abs(arrowX, pagerY + ARROW_DY, 24, 24)}>
              <ForwardIcon color={INK} />
            </span>
          )
        ) : null}
      </ScaleFrame>

      {/* Outside the fixed canvas on purpose — see SiteLegalFooter. */}
      <SiteLegalFooter />

      {/* Chatbox (mascot + bar) floats fixed above the nav; opens the
          placeholder chat panel on click. */}
      <ConciergeChat navClearance={60} mascotOnTop variant="brown" />
    </>
  );
}
