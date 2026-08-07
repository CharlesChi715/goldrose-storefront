"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The interactive middle of /shop: the count/sort/filter control row, the
 * active-filter chips, the product grid, and the two overlays the 2026-07-27
 * frames added — SHOP-SORT-OPEN-DROPDOWN (914:115, panel 921:252) and
 * SHOP-FILTER-OPEN-DRAWER (914:116, panel 923:252). Geometry, colors and
 * fonts are verbatim from the Figma REST data.
 *
 * What is real and what is cosmetic:
 * - The GRID is real: one card per catalog product, never more. The frame's
 *   eight slots are capacity, not content — an eight-card page fills them
 *   all, and a one-product catalog draws exactly one card (owner,
 *   2026-08-06). The product count above the grid counts the same list.
 * - Sorting is REAL: the four dropdown rows reorder the live catalog data
 *   inside the design's fixed grid slots. "New" is the default catalog order
 *   (the state the frame draws); "Recommended" keeps that order under its
 *   own name until merchandising rules exist; the two price rows sort by
 *   price_cents. The sort applies to the whole catalog before the page is
 *   sliced, so it holds across pages rather than within one.
 * - The filter drawer is REAL since 2026-08-07. Collections/Occasion/Recipient
 *   match `products.best_for` (migration 0009); Price and Availability are
 * - Either overlay closes on a click anywhere outside it, or on Escape. The
 *   in-canvas backdrop below only reaches the 430-wide stage; a click in the
 *   page margins beside it, or on the bottom nav under it, is caught by the
 *   document listener instead (the stage is transformed, so a fixed-position
 *   backdrop would be contained and clipped by it rather than covering the
 *   viewport).
 *   computed from the catalog's own price and stock. Chips multi-select except
 *   under Price, which takes one band at a time and swaps (owner, 2026-08-07).
 *   The vocabulary — slugs, wording, what each derived chip means, and how
 *   many may be lit — comes from lib/catalog/facets.ts, never from this file.
 * - The selection lives in the URL (`?f=jewel,anniversary`), not in state
 *   here: the server owns the grid, the count and the pager, so the three
 *   cannot disagree, and a filtered shop is a link a shopper can send.
 *   `Show N Results` counts a PENDING selection against `subjects` before the
 *   navigation happens; Reset clears the pending chips rather than restoring
 *   the frame's drawn selection, which was art rather than a default.
 * - The active-filter chip row is real too, one chip per applied facet with a
 *   working ×. It replaces the two fixed label chips the frames drew ("Ruby
 *   Red", "Gift Sets" — themselves a patch over the template's "Women"/"All
 *   apparel"): those were a picture of a filtered shop, and an unfiltered shop
 *   now correctly shows none. The row keeps the frame's origin, height, radius
 *   and type but flows, because the number of chips is no longer two.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CloseIcon,
  DownIcon,
  FilterIcon,
  ListviewIcon,
} from "@/components/chrome";
import {
  facetLabel,
  matchesFacets,
  toggleFacet,
  type FacetSubject,
} from "@/lib/catalog/facets.ts";
import { abs, txt } from "@/lib/figma-layout";
import { spotlightStyle, type SpotlightArea } from "@/lib/images/spotlight";
import { inter, notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const INK_SOFT = "#4A403B";
const MUTED = "#B8A69A";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const CARD_BG = "#FFFBF6";

/** One grid slot's fixed geometry plus the design art it shows. */
export type SlotSpec = {
  x: number;
  y: number;
  w: number;
  img: string;
  stars: string;
  starsW: number;
};

/** Live catalog values for one card's designated text boxes. */
export type CardData = {
  handle: string;
  shortName: string;
  price: string;
  priceCents: number;
  compareAt: string | null;
  /** The product's own catalog photo; null falls back to the slot's frame art. */
  image: string | null;
  /**
   * The area the owner framed against THIS card's photo box — point and zoom
   * (migration 0009). A hero never framed for the card resolves to the PDP
   * spotlight's point at no zoom, the pre-0009 crop.
   */
  card: SpotlightArea;
};

/** Grid cross-fade on sort change — same 150ms ease as PageFade's tab fade. */
const FADE_MS = 150;

const wantsMotion = () =>
  !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type SortKey = "recommended" | "new" | "high" | "low";

// 921:252 dropdown rows, top to bottom.
const SORT_ROWS: Array<{ key: SortKey; label: string }> = [
  { key: "recommended", label: "Recommended" },
  { key: "new", label: "New" },
  { key: "high", label: "Price: High to Low" },
  { key: "low", label: "Price: Low to High" },
];

/**
 * 923:252 filter drawer — GEOMETRY ONLY. Each chip's box is the frame's, and
 * each `slug` names the facet it stands for; the wording and the meaning both
 * live in lib/catalog/facets.ts so a re-worded chip never has to be edited
 * twice. The frame also drew five chips pre-selected — that was a picture of
 * a filtered shop, not a default, and it is deliberately not reproduced: an
 * unfiltered /shop starts with nothing ticked.
 */
const FILTER_ROWS: Array<{
  title: string;
  y: number;
  chips: Array<{ slug: string; x: number; w: number }>;
}> = [
  {
    title: "Collections",
    y: 368,
    chips: [
      { slug: "jewel", x: 32, w: 126 },
      { slug: "classic", x: 166, w: 112 },
      { slug: "sparkle", x: 286, w: 112 },
    ],
  },
  {
    title: "Occasion",
    y: 438,
    chips: [
      { slug: "anniversary", x: 32, w: 100 },
      { slug: "birthday", x: 140, w: 76 },
      { slug: "wedding", x: 224, w: 80 },
      { slug: "valentines", x: 312, w: 86 },
    ],
  },
  {
    title: "Recipient",
    y: 508,
    chips: [
      { slug: "wife", x: 32, w: 60 },
      { slug: "girlfriend", x: 100, w: 92 },
      { slug: "mother", x: 200, w: 74 },
      { slug: "friends", x: 282, w: 70 },
    ],
  },
  {
    title: "Price",
    y: 578,
    chips: [
      { slug: "under-100", x: 32, w: 88 },
      { slug: "100-199", x: 128, w: 92 },
      { slug: "200-299", x: 228, w: 96 },
      { slug: "300-plus", x: 332, w: 66 },
    ],
  },
  {
    title: "Availability",
    y: 648,
    chips: [
      { slug: "in-stock", x: 32, w: 82 },
      { slug: "ready-to-ship", x: 122, w: 112 },
      { slug: "pre-order", x: 242, w: 90 },
    ],
  },
];

function ProductCard({
  slot,
  href,
  data,
}: {
  slot: SlotSpec;
  href: string;
  data: CardData;
}) {
  return (
    <Link
      href={href}
      className="gr-card-zoom"
      style={{
        ...abs(slot.x, slot.y, slot.w, 297),
        display: "block",
        background: CARD_BG,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* The product's own photo, so sorting moves the picture with the name
          and price; products without one keep the slot's frame art. Real
          catalog photos are not the frame's 203×204, so they cover-crop. */}
      <img
        className="gr-photo"
        src={data.image ?? `/eldreve/home/${slot.img}.png`}
        alt={data.shortName}
        width={slot.w}
        height={204}
        style={{
          ...abs(0, 0, slot.w, 204),
          display: "block",
          // The card's own framing. A zoomed photo overflows this box by
          // design; the Link wrapping it already sets overflow: hidden.
          ...spotlightStyle(data.card),
        }}
      />
      <div
        className={inter.className}
        data-live-text
        style={{
          ...abs(9, 214, slot.w - 18),
          ...txt(16, 16, INK),
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {data.shortName}
      </div>
      <img
        src={`/eldreve/home/${slot.stars}.svg`}
        alt="Five star rating"
        width={slot.starsW}
        height={11}
        style={{ ...abs(9, 234, slot.starsW, 11), display: "block" }}
      />
      {/* Price pair — one flowing row so live prices with cents never overlap
          the compare-at (same reasoning as the server page before). Since the
          wishlist heart went (owner, 2026-08-05) the row gets the card's full
          inset width instead of stopping short of it. */}
      <div
        className={notoSC.className}
        data-live-text
        style={{
          ...abs(9, 249, slot.w - 18, 43),
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflow: "hidden",
        }}
      >
        <span style={{ ...txt(20, 24, INK), fontWeight: 700, flexShrink: 0 }}>
          {data.price}
        </span>
        {data.compareAt !== null ? (
          <span
            style={{
              ...txt(14, 16.8, MUTED),
              textDecoration: "line-through",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data.compareAt}
          </span>
        ) : null}
      </div>
      {/* The card's 1px inside stroke, as a top layer rather than an inset
          shadow on the Link. Figma paints a frame's stroke above its children;
          CSS paints an inset shadow below them, so the photo — which reaches
          the card's top, left and right edges — was covering three sides of
          it. Same radius and clip, so it lands exactly on the design's edge. */}
      <div
        aria-hidden
        style={{
          ...abs(0, 0, slot.w, 297),
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 14,
          pointerEvents: "none",
        }}
      />
    </Link>
  );
}

export function ShopInteractive({
  slots,
  data,
  page,
  pageSize,
  query,
  selected,
  subjects,
  emptyNote,
}: {
  slots: SlotSpec[];
  /** The catalog after search AND facets; this component slices the page. */
  data: CardData[];
  page: number;
  pageSize: number;
  /** The live ?q= search, carried through every URL this component builds. */
  query: string;
  /** Facet slugs currently APPLIED — the drawer opens showing these. */
  selected: string[];
  /** Filterable facts for the search-matched catalog, before facets. */
  subjects: FacetSubject[];
  /** Shown in place of the grid when `data` is empty. */
  emptyNote: string;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("new");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  // What the drawer shows before "Show N Results" is tapped. Opening the
  // drawer re-seeds it from what is actually applied (below), so a selection
  // abandoned by tapping the backdrop is never presented as if it were live.
  const [pending, setPending] = useState<string[]>(selected);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortPanel = useRef<HTMLDivElement | null>(null);
  const sortTrigger = useRef<HTMLButtonElement | null>(null);
  const filterPanel = useRef<HTMLDivElement | null>(null);
  const filterTrigger = useRef<HTMLButtonElement | null>(null);

  // A pending fade must not fire into an unmounted tree.
  useEffect(
    () => () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    },
    [],
  );

  /**
   * Fade the grid out, swap the order while it is invisible, fade it back in.
   * The cards keep their DOM nodes across the swap, so they are already
   * painted at opacity 0 and the fade-in needs no rAF dance (unlike PageFade,
   * whose incoming canvas is a fresh element). Reduced motion swaps outright.
   */
  const chooseSort = (next: SortKey) => {
    setSortOpen(false);
    if (next === sort) return;
    if (!wantsMotion()) {
      setSort(next);
      return;
    }
    setFading(true);
    fadeTimer.current = setTimeout(() => {
      setSort(next);
      setFading(false);
    }, FADE_MS);
  };

  // Sort the WHOLE catalog, then slice out this page — so "Price: Low to
  // High" means low to high across the shop, not just within the page you
  // happen to be on. Equal prices keep catalog order because Array#sort is
  // stable, and the copy keeps the server's array untouched. The grid used to
  // cycle the catalog to fill all eight slots and sort the filled result
  // instead; that drew the one real product eight times (owner, 2026-08-06).
  const sorted = [...data];
  if (sort === "high") sorted.sort((a, b) => b.priceCents - a.priceCents);
  if (sort === "low") sorted.sort((a, b) => a.priceCents - b.priceCents);
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  const overlayOpen = sortOpen || filterOpen;

  /**
   * Dismiss whichever overlay is open on a press outside it, or on Escape.
   * The backdrop below covers the 430-wide stage; this covers the rest of the
   * document — the page margins beside the stage on a wide window, and the
   * bottom nav under it. Capture-phase `pointerdown` so the decision is made
   * before any underlying control reacts, and the open panel plus its own
   * trigger count as "inside" — without the trigger, its press would close
   * here and its click would immediately reopen.
   */
  useEffect(() => {
    if (!overlayOpen) return;
    const closeAll = () => {
      setSortOpen(false);
      setFilterOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const inside = [sortPanel, sortTrigger, filterPanel, filterTrigger].some(
        (ref) => ref.current?.contains(target),
      );
      if (!inside) closeAll();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [overlayOpen]);

  /**
   * The /shop URL for a given facet selection. Page is dropped on purpose: a
   * different filter is a different result set, so page 4 of the old one is
   * meaningless — and often past the end of the new one.
   */
  const filterHref = (slugs: string[]) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (slugs.length) qs.set("f", slugs.join(","));
    const search = qs.toString();
    return search ? `/shop?${search}` : "/shop";
  };

  // `scroll: false` — the shopper is looking at the drawer or the chip row,
  // both well down the page; jumping to the top would hide the change they
  // just made.
  const apply = (slugs: string[]) => {
    setFilterOpen(false);
    router.push(filterHref(slugs), { scroll: false });
  };

  // How many products the PENDING selection would leave, counted against the
  // pre-facet catalog rather than the grid — the grid already has the applied
  // filter in it and would only ever count down.
  const pendingCount = subjects.filter((subject) =>
    matchesFacets(subject, pending),
  ).length;

  return (
    <>
      {/* 927:153 SHOP-PRODUCT-COUNT-CARD — the overlay frames patch the base
          frame's "120 Apparel" with the gift-shop count, which the frame drew
          as a flat "120 GIFTS". It counts the real catalog now. */}
      <div style={{ ...abs(0, 307, 185, 45), background: CREAM }} />
      <div
        className={playfair.className}
        style={{ ...abs(18, 321, 150), ...txt(13, 18, INK), fontWeight: 500 }}
      >
        {data.length} {data.length === 1 ? "GIFT" : "GIFTS"}
      </div>

      {/* Sort pill (921:134/138) — now a real dropdown trigger. */}
      <button
        type="button"
        ref={sortTrigger}
        aria-haspopup="menu"
        aria-expanded={sortOpen}
        onClick={() => {
          setSortOpen((open) => !open);
          setFilterOpen(false);
        }}
        style={{
          ...abs(217, 308, 91.136, 43.105),
          background: "rgba(229,217,201,0.10)",
          borderRadius: 33,
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        {sort === "new" ? (
          // Exact frame box for the default label (Tenor inherited from the
          // page's font class, +1.5px baseline correction like the old row).
          <span
            style={{
              ...abs(19, 17.844, 36.33),
              ...txt(13, 13.78, INK_SOFT, "center"),
            }}
          >
            New
          </span>
        ) : (
          <span
            style={{
              position: "absolute",
              left: 8,
              right: 26,
              top: 17.844,
              ...txt(13, 13.78, INK_SOFT, "center"),
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {SORT_ROWS.find((row) => row.key === sort)?.label}
          </span>
        )}
        <span style={abs(58.961, 15, 21, 20)}>
          <DownIcon color={INK} />
        </span>
      </button>
      <div
        style={{
          ...abs(317, 309, 45.099, 43.105),
          background: "rgba(229,217,201,0.10)",
          borderRadius: "50%",
        }}
      />
      <span style={abs(327.022, 318.579, 26, 24)}>
        <ListviewIcon color={INK} />
      </span>
      {/* Filter button (929:162) — opens the drawer. */}
      <button
        type="button"
        ref={filterTrigger}
        aria-haspopup="dialog"
        aria-label="Filters"
        aria-expanded={filterOpen}
        onClick={() => {
          const opening = !filterOpen;
          // Re-seed on the way open, not on the way shut: the drawer should
          // always show the shop the shopper is actually in.
          if (opening) setPending(selected);
          setFilterOpen(opening);
          setSortOpen(false);
        }}
        style={{
          ...abs(374.531, 308.254, 45.099, 43.105),
          background: "rgba(229,217,201,0.10)",
          borderRadius: "50%",
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span style={abs(9.469, 11.746, 26, 24)}>
          <FilterIcon color={GOLD} />
        </span>
      </button>

      {/* Active filter chips (929:169/172) — one per applied facet, each ×
          dropping just that one. The frame fixed two chips at fixed widths;
          eleven facets with labels from "Wife" to "Sparkle Collection" cannot
          be placed that way, so the row flows from the frame's own origin at
          the frame's own height and scrolls sideways rather than colliding
          with the grid. Chip padding reproduces the frame's: 10 left, 6 before
          the 16px ×, 10 right. Nothing selected draws nothing. */}
      {selected.length ? (
        <div
          style={{
            ...abs(17, 359, 396, 32),
            display: "flex",
            gap: 8,
            alignItems: "center",
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
          }}
        >
          {selected.map((slug) => (
            <button
              key={slug}
              type="button"
              aria-label={`Remove filter ${facetLabel(slug)}`}
              onClick={() => apply(selected.filter((item) => item !== slug))}
              style={{
                flex: "0 0 auto",
                height: 32,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 10px",
                background: "transparent",
                border: `1px solid ${SAND}`,
                borderRadius: 31,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  ...txt(14, 16, INK),
                  letterSpacing: 0.14,
                }}
              >
                {facetLabel(slug)}
              </span>
              <span
                style={{ width: 16, height: 16, display: "block" }}
                aria-hidden
              >
                <CloseIcon color={INK_SOFT} />
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Product grid — slot geometry is the design's, one slot per real
          product, in the chosen sort order. Unused slots are simply not
          drawn; the server shortens the canvas to match. The wrapper is
          unpositioned on purpose: the cards stay absolutely placed against
          the same canvas, and it exists only to fade them as one unit. */}
      <div
        style={{
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        {visible.length ? (
          visible.map((card, i) => (
            <ProductCard
              key={card.handle}
              slot={slots[i]}
              href={`/products/${card.handle}`}
              data={card}
            />
          ))
        ) : (
          /* No design exists for an empty grid (docs/ixd/README.md), so this
             is the page's own type at the grid's top-left, not invented art.
             It is reachable three ways: a search that matches nothing, an
             empty catalog, and a catalog read that failed. */
          <div
            className={playfair.className}
            style={{
              ...abs(18, slots[0].y, 394),
              ...txt(15, 20, INK_SOFT),
            }}
          >
            {emptyNote}
          </div>
        )}
      </div>

      {/* Click-away backdrop for either overlay. */}
      {overlayOpen ? (
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            setSortOpen(false);
            setFilterOpen(false);
          }}
          style={{
            ...abs(0, 0, 430, 1822),
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "default",
          }}
        />
      ) : null}

      {/* 921:252 SHOP-SORT-OPEN-DROPDOWN */}
      {sortOpen ? (
        <div
          role="menu"
          ref={sortPanel}
          className={playfair.className}
          style={{
            ...abs(206, 357, 206, 190),
            background: CARD_BG,
            boxShadow: `inset 0 0 0 1px ${SAND}, 0 8px 20px rgba(36,23,18,0.16)`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {SORT_ROWS.map((row, i) => {
            const selected = row.key === sort;
            return (
              <button
                key={row.key}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => chooseSort(row.key)}
                style={{
                  ...abs(0, [16, 57, 100, 143][i] - 6, 206, 32),
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 18,
                    top: 6,
                    ...txt(15, 20, selected ? GOLD : INK),
                    fontWeight: 500,
                  }}
                >
                  {row.label}
                </span>
                {selected ? (
                  <img
                    src="/eldreve/screens/1100-145.svg"
                    alt=""
                    width={13}
                    height={13}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 9.5,
                      display: "block",
                    }}
                  />
                ) : null}
              </button>
            );
          })}
          {[412, 455, 498].map((y) => (
            <div
              key={y}
              style={{ ...abs(18, y - 365, 170, 1), background: SAND }}
            />
          ))}
        </div>
      ) : null}

      {/* 923:252 SHOP-FILTER-OPEN-DRAWER */}
      {filterOpen ? (
        <div
          role="dialog"
          ref={filterPanel}
          aria-label="Filters"
          className={playfair.className}
          style={{
            ...abs(16, 356, 398, 472),
            background: CARD_BG,
            boxShadow: `inset 0 0 0 1px ${SAND}, 0 8px 20px rgba(36,23,18,0.14)`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {FILTER_ROWS.map((row) => (
            <div key={row.title}>
              <div
                style={{
                  ...abs(16, row.y - 356, 180),
                  ...txt(15, 19, INK),
                  fontWeight: 500,
                }}
              >
                {row.title}
              </div>
              {row.chips.map((chip) => {
                const on = pending.includes(chip.slug);
                return (
                  <button
                    key={chip.slug}
                    type="button"
                    aria-pressed={on}
                    // The heading's own rule decides what a tap does — most
                    // are multi-select ("Birthday or Wedding"), Price takes
                    // one band at a time and swaps. That rule lives in
                    // lib/catalog/facets.ts so a pasted URL obeys it too.
                    onClick={() =>
                      setPending((current) => toggleFacet(current, chip.slug))
                    }
                    style={{
                      ...abs(chip.x - 16, row.y - 356 + 28, chip.w, 32),
                      background: on ? GOLD : CARD_BG,
                      boxShadow: `inset 0 0 0 1px ${on ? GOLD : SAND}`,
                      borderRadius: 9,
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 6,
                        right: 6,
                        top: 8,
                        ...txt(11, 16, on ? CREAM : INK, "center"),
                        fontWeight: 500,
                      }}
                    >
                      {facetLabel(chip.slug)}
                      {on ? "  ✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ ...abs(16, 372, 366, 1), background: SAND }} />
          {/* Reset empties the drawer rather than restoring the five chips
              the frame drew lit — those were never a default (see
              FILTER_ROWS). It only clears the pending selection; the shop
              still changes on "Show N Results", like every other chip here. */}
          <button
            type="button"
            onClick={() => setPending([])}
            style={{
              ...abs(18, 398, 88, 21),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ ...txt(17, 21, INK), fontWeight: 500 }}>Reset</span>
          </button>
          {/* The count is the real one for the pending selection, in place of
              the frame's fixed "36" — so the shopper knows before tapping
              whether they are about to empty the shop. */}
          <button
            type="button"
            onClick={() => apply(pending)}
            style={{
              ...abs(146, 390, 236, 52),
              background: GOLD,
              borderRadius: 10,
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                top: 15,
                ...txt(17, 22, CREAM, "center"),
                fontWeight: 500,
              }}
            >
              Show {pendingCount} Result{pendingCount === 1 ? "" : "s"}
            </span>
          </button>
        </div>
      ) : null}
    </>
  );
}
