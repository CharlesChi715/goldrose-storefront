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
 * - Sorting is REAL: the four dropdown rows reorder the live catalog data
 *   inside the design's fixed grid slots. "New" is the default catalog order
 *   (the state the frame draws); "Recommended" keeps that order under its
 *   own name until merchandising rules exist; the two price rows sort by
 *   price_cents.
 * - The filter drawer is COSMETIC (B-2 checkout-picker precedent): chips
 *   toggle visually, Reset restores the frame's default selection, and the
 *   confirm button closes the drawer. The catalog has no collection/
 *   occasion/recipient/availability fields yet, so wiring it would fake a
 *   capability the backend does not have (docs/ixd/README.md).
 * - The two label chips ("Ruby Red", "Gift Sets") stay static art like the
 *   "Women"/"All apparel" pair they replace: the base shop frame (24:396)
 *   still carries the template's apparel wording; both overlay frames patch
 *   the row with the gift-shop labels, so the corrected wording is what
 *   ships (designer slip flagged in docs/ixd/README.md).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CloseIcon,
  DownIcon,
  FilterIcon,
  ListviewIcon,
} from "@/components/chrome";
import { abs, txt } from "@/lib/figma-layout";
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

// 923:252 filter drawer groups — labels and the frame's default selection.
const FILTER_GROUPS: Array<{
  title: string;
  y: number;
  options: Array<{ label: string; x: number; w: number; selected?: boolean }>;
}> = [
  {
    title: "Collections",
    y: 368,
    options: [
      { label: "Jewel Collection", x: 32, w: 126, selected: true },
      { label: "Classic Collection", x: 166, w: 112 },
      { label: "Sparkle Collection", x: 286, w: 112 },
    ],
  },
  {
    title: "Occasion",
    y: 438,
    options: [
      { label: "Anniversary", x: 32, w: 100, selected: true },
      { label: "Birthday", x: 140, w: 76 },
      { label: "Wedding", x: 224, w: 80 },
      { label: "Valentine’s", x: 312, w: 86 },
    ],
  },
  {
    title: "Recipient",
    y: 508,
    options: [
      { label: "Wife", x: 32, w: 60 },
      { label: "Girlfriend", x: 100, w: 92, selected: true },
      { label: "Mother", x: 200, w: 74 },
      { label: "Friends", x: 282, w: 70 },
    ],
  },
  {
    title: "Price",
    y: 578,
    options: [
      { label: "Under $100", x: 32, w: 88 },
      { label: "$100–$199", x: 128, w: 92 },
      { label: "$200–$299", x: 228, w: 96, selected: true },
      { label: "$300+", x: 332, w: 66 },
    ],
  },
  {
    title: "Availability",
    y: 648,
    options: [
      { label: "In Stock", x: 32, w: 82 },
      { label: "Ready to Ship", x: 122, w: 112, selected: true },
      { label: "Pre-Order", x: 242, w: 90 },
    ],
  },
];

const defaultFilterSelection = () =>
  FILTER_GROUPS.map((group) =>
    group.options.findIndex((option) => option.selected),
  );

/**
 * Which card's content belongs in grid slot `slot` on `page` — same rotation
 * the server page used before this component existed (placeholder paging).
 */
function contentIndex(
  slot: number,
  page: number,
  cardCount: number,
  rotatePerPage: number,
) {
  return (slot + (page - 1) * rotatePerPage) % cardCount;
}

function ProductCard({
  slot,
  img,
  href,
  data,
}: {
  slot: SlotSpec;
  img: string;
  href: string;
  data: CardData | null;
}) {
  const heartX = slot.w === 203 ? 154 : 155; // 收藏 art: 162/374 in frame coords
  return (
    <Link
      href={href}
      className="gr-card-zoom"
      style={{
        ...abs(slot.x, slot.y, slot.w, 297),
        display: "block",
        background: CARD_BG,
        boxShadow: `inset 0 0 0 1px ${SAND}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* The product's own photo, so sorting moves the picture with the name
          and price; products without one keep the slot's frame art. Real
          catalog photos are not the frame's 203×204, so they cover-crop. */}
      <img
        className="gr-photo"
        src={data?.image ?? `/veloria/home/${img}.png`}
        alt={data ? data.shortName : "Artisan 24K gold-dipped eternal rose"}
        width={slot.w}
        height={204}
        style={{
          ...abs(0, 0, slot.w, 204),
          display: "block",
          objectFit: "cover",
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
        {data?.shortName ?? "Double Rose Gift Set"}
      </div>
      <img
        src={`/veloria/home/${slot.stars}.svg`}
        alt="Five star rating"
        width={slot.starsW}
        height={11}
        style={{ ...abs(9, 234, slot.starsW, 11), display: "block" }}
      />
      {/* Price pair — one flowing row so live prices with cents never overlap
          the compare-at (same reasoning as the server page before). */}
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

export function ShopInteractive({
  slots,
  data,
  page,
  rotatePerPage,
}: {
  slots: SlotSpec[];
  data: CardData[];
  page: number;
  rotatePerPage: number;
}) {
  const [sort, setSort] = useState<SortKey>("new");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSelection, setFilterSelection] = useState<number[]>(
    defaultFilterSelection,
  );
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Fill the grid FIRST, then sort what it holds. The catalog is shorter than
  // the eight design slots (OQ-3), so it cycles to fill them — and sorting the
  // catalog before that cycling made the visible prices restart every time the
  // loop came round ($79, $64, $49, $79 …). Ordering the filled grid instead
  // keeps the sequence strictly monotonic; equal prices stay in fill order
  // because Array#sort is stable. `art` rides along so a product without its
  // own photo keeps the frame art it was filled with.
  const filled = slots.map((_, i) => {
    const c = contentIndex(i, page, slots.length, rotatePerPage);
    return {
      art: slots[c].img,
      card: data.length ? data[c % data.length] : null,
    };
  });
  if (sort === "high")
    filled.sort(
      (a, b) => (b.card?.priceCents ?? 0) - (a.card?.priceCents ?? 0),
    );
  if (sort === "low")
    filled.sort(
      (a, b) => (a.card?.priceCents ?? 0) - (b.card?.priceCents ?? 0),
    );

  const overlayOpen = sortOpen || filterOpen;

  return (
    <>
      {/* 927:153 SHOP-PRODUCT-COUNT-CARD — the overlay frames patch the base
          frame's "120 Apparel" with the gift-shop count. */}
      <div style={{ ...abs(0, 307, 185, 45), background: CREAM }} />
      <div
        className={playfair.className}
        style={{ ...abs(18, 321, 150), ...txt(13, 18, INK), fontWeight: 500 }}
      >
        120 GIFTS
      </div>

      {/* Sort pill (921:134/138) — now a real dropdown trigger. */}
      <button
        type="button"
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
        aria-haspopup="dialog"
        aria-label="Filters"
        aria-expanded={filterOpen}
        onClick={() => {
          setFilterOpen((open) => !open);
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

      {/* Active filter chips (929:169/172) — static art, like the apparel
          pair before them; the drawer is the interactive surface. */}
      {[
        {
          x: 17,
          w: 109,
          label: "Ruby Red",
          labelX: 10,
          labelW: 67,
          closeX: 83,
        },
        {
          x: 134,
          w: 103,
          label: "Gift Sets",
          labelX: 10,
          labelW: 61,
          closeX: 77,
        },
      ].map((chip) => (
        <div key={chip.label} style={abs(chip.x, 359, chip.w, 32)}>
          <div
            style={{
              ...abs(-1, -1, chip.w + 2, 34),
              border: `1px solid ${SAND}`,
              borderRadius: 31,
            }}
          />
          <div
            style={{
              ...abs(chip.labelX, 8, chip.labelW),
              ...txt(14, 16, INK, "center"),
              letterSpacing: 0.14,
            }}
          >
            {chip.label}
          </div>
          <span style={abs(chip.closeX, 8, 16, 16)}>
            <CloseIcon color={INK_SOFT} />
          </span>
        </div>
      ))}

      {/* Product grid — slot geometry is the design's; which card sits in
          each slot rotates per page and follows the chosen sort. The wrapper
          is unpositioned on purpose: the cards stay absolutely placed against
          the same canvas, and it exists only to fade them as one unit. */}
      <div
        style={{
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        {slots.map((slot, i) => {
          const { art, card } = filled[i];
          return (
            <ProductCard
              key={i}
              slot={slot}
              img={art}
              href={card ? `/products/${card.handle}` : "/shop"}
              data={card}
            />
          );
        })}
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
                    src="/veloria/screens/1100-145.svg"
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
          {FILTER_GROUPS.map((group, gi) => (
            <div key={group.title}>
              <div
                style={{
                  ...abs(16, group.y - 356, 180),
                  ...txt(15, 19, INK),
                  fontWeight: 500,
                }}
              >
                {group.title}
              </div>
              {group.options.map((option, oi) => {
                const selected = filterSelection[gi] === oi;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setFilterSelection((current) =>
                        current.map((sel, idx) =>
                          idx === gi ? (sel === oi ? -1 : oi) : sel,
                        ),
                      )
                    }
                    style={{
                      ...abs(option.x - 16, group.y - 356 + 28, option.w, 32),
                      background: selected ? GOLD : CARD_BG,
                      boxShadow: `inset 0 0 0 1px ${selected ? GOLD : SAND}`,
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
                        ...txt(11, 16, selected ? CREAM : INK, "center"),
                        fontWeight: 500,
                      }}
                    >
                      {option.label}
                      {selected ? "  ✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ ...abs(16, 372, 366, 1), background: SAND }} />
          <button
            type="button"
            onClick={() => setFilterSelection(defaultFilterSelection())}
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
          {/* The design's fixed result count — the drawer is cosmetic until
              the catalog carries these fields (docs/ixd/README.md). */}
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
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
              Show 36 Results
            </span>
          </button>
        </div>
      ) : null}
    </>
  );
}
