"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The four product-page overlays, restyled 2026-07-29 to the ELDREVE
 * unification frames, plus the transparent triggers that open them from the
 * rows the page already draws:
 *
 *   PDP-REVIEW-OPEN-DRAWER   1523:4185 (panel 1523:4215) ← the rating row
 *   PDP-COLOR-OPEN-DRAWER    1523:4275 (panel 1523:4289) ← "View All 120 Colors ›"
 *   PDP-MEDIA-OPEN           1523:4257 ← the hero photo (drawn here too) (drawn here too)
 *   PDP-UNBOXING-OPEN-GALLERY 1523:4359 (panel 1523:4368) ← unboxing "View All ›"
 *
 * Geometry, colors, fonts and copy are verbatim from the Figma REST data.
 * Every overlay is a portal fixed to the viewport (MenuDrawer technique: a
 * transformed ancestor would swallow position:fixed), bottom-anchored so the
 * sheets sit flush with the screen edge at any viewport height. The page
 * content the frames paint behind each scrim is the live page's job, not
 * drawn here.
 *
 * The HERO is drawn here rather than by the page (owner, 2026-08-06): it is
 * an auto-playing, swipeable carousel over the product's own photos, built on
 * the homepage's shared Carousel so it behaves exactly like H-03. The tap
 * target has to sit above the photo to open the media viewer, and two stacked
 * photo layers could never hold the same slide — so the trigger IS the photo.
 *
 * Content: the REVIEWS drawer is real — rows, average and count come from
 * product_reviews, and an empty table shows an empty drawer rather than the
 * frame's four named testimonials (owner, 2026-08-06: a mock review is
 * indistinguishable from a real one, so it is a review claim, not "visibly
 * mocked" art). The twelve color cards and twelve unboxing tiles are still
 * design placeholders — the catalog has no color-option or UGC tables yet
 * (docs/ixd/README.md), so color selection and the unboxing chips/tabs stay
 * cosmetic. The media viewer pages through the design's four product images
 * for real. The mocks' iOS home indicator (1523:4274) is not implemented —
 * C-3 status-bar precedent.
 * The HERO is drawn here rather than by the page (owner, 2026-08-06): it is
 * an auto-playing, swipeable carousel over the product's own photos, built on
 * the homepage's shared Carousel so it behaves exactly like H-03. The tap
 * target has to sit above the photo to open the media viewer, and two stacked
 * photo layers could never hold the same slide — so the trigger IS the photo.
 *
 * Content: the REVIEWS drawer is real — rows, average and count come from
 * product_reviews, and an empty table shows an empty drawer rather than the
 * frame's four named testimonials (owner, 2026-08-06: a mock review is
 * indistinguishable from a real one, so it is a review claim, not "visibly
 * mocked" art). The twelve color cards and twelve unboxing tiles are still
 * design placeholders — the catalog has no color-option or UGC tables yet
 * (docs/ixd/README.md), so color selection and the unboxing chips/tabs stay
 * cosmetic. The media viewer pages through the design's four product images
 * for real. The mocks' iOS home indicator (1523:4274) is not implemented —
 * C-3 status-bar precedent.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import NoCalcScale from "@/components/NoCalcScale";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";
import { Carousel } from "@/components/home/Carousel";
import { Carousel } from "@/components/home/Carousel";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const SHEET_BG = "#FFFEFB";
const REVIEW_BG = "#FFFBF6"; // the reviews sheet's own white (1523:4215) — the other two drawers keep #FFFEFB
const TILE_BG = "#F0E8DE"; // unboxing media-card ground behind each photo (1523:4388…)
const GREY = "#706661";

// The hero pagination row: 7px indicators on a 14px pitch. The frame draws
// the active one as an 18px pill, but HeroCarousel already settled that call
// for the site — one size for every dot, active by colour.
const DOT_PITCH = 14;

// The hero pagination row: 7px indicators on a 14px pitch. The frame draws
// the active one as an 18px pill, but HeroCarousel already settled that call
// for the site — one size for every dot, active by colour.
const DOT_PITCH = 14;

const RESET: React.CSSProperties = {
  appearance: "none",
  border: 0,
  padding: 0,
  background: "transparent",
  cursor: "pointer",
};

type OverlayId = "reviews" | "colors" | "media" | "unboxing";

/** One review as the drawer renders it (server rows mapped by the PDP page). */
export type PdpReview = {
  author: string;
  date: string;
  body: string;
  /** 1–5; optional so a row with no score keeps the frame's flat star art. */
  /** 1–5; optional so a row with no score keeps the frame's flat star art. */
  rating?: number;
};

export type PdpReviewStats = { average: number; count: number };

/* ---------- design data ---------- */

// 1523:4303…4351 — the twelve color cards, frame order.
const COLORS = [
  { name: "Ruby Red", tag: "Radiant", img: "1523-4304" },
  { name: "Sapphire Blue", tag: "Classic", img: "1523-4308" },
  { name: "Rose Pink", tag: "Radiant", img: "1523-4313" },
  { name: "Pearl White", tag: "Classic", img: "1523-4317" },
  { name: "Royal Purple", tag: "Radiant", img: "1523-4321" },
  { name: "Emerald Green", tag: "Classic", img: "1523-4325" },
  { name: "Sunset Orange", tag: "Radiant", img: "1523-4329" },
  { name: "Midnight Black", tag: "Classic", img: "1523-4333" },
  { name: "Champagne Gold", tag: "Sparkle", img: "1523-4337" },
  { name: "Lavender Mist", tag: "Radiant", img: "1523-4341" },
  { name: "Rainbow Aura", tag: "Sparkle", img: "1523-4345" },
  { name: "Blush Pink", tag: "Classic", img: "1523-4349" },
];

// 1523:4260/4269 — the viewer pages through the 07-29 blue-rose hero plus
// the three shop-card photos the frame's thumb fills reuse (872ee15b/
// 982aff27/d1715c8b are the home renders, just cropped to 86×106).
const MEDIA = [
  "/eldreve/screens/1523-4260.png",
  "/eldreve/home/58-91.png",
  "/eldreve/home/58-103.png",
  "/eldreve/home/58-61.png",
];

// 1523:4389…4411 — unboxing tiles (badges baked into the renders).
const UNBOXING_TILES = [
  "1523-4389",
  "1523-4391",
  "1523-4393",
  "1523-4395",
  "1523-4397",
  "1523-4399",
  "1523-4401",
  "1523-4403",
  "1523-4405",
  "1523-4407",
  "1523-4409",
  "1523-4411",
];

/* ---------- portal scaffolding (MenuDrawer technique) ---------- */

const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

/**
 * Fixed full-viewport overlay hosting a 430×932 design stage. The stage is
 * bottom-anchored so bottom sheets stay flush with the screen edge whatever
 * the real viewport height is.
 */
function OverlayStage({
  scrim,
  onClose,
  label,
  background,
  children,
}: {
  /** CSS color of the dimming layer (per-overlay in the frames). */
  scrim: string;
  onClose: () => void;
  label: string;
  /** Opaque overlay background (media viewer); default transparent. */
  background?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="figv-pdpfix"
      style={background ? { background } : undefined}
    >
      <style>{`
        .figv-pdpfix { position: fixed; inset: 0; z-index: 40; }
        .figv-pdpstage { position: absolute; bottom: 0; width: 430px; height: 932px; left: calc((100% - 430px) / 2); }
        .figv-pdpsheet-slide-up {
          animation: figv-pdpsheet-slide-up 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform;
        }
        @keyframes figv-pdpsheet-slide-up {
          from { transform: translate3d(0, 100%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-pdpstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .figv-pdpsheet-slide-up { animation: none; }
        }
      `}</style>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          ...RESET,
          position: "absolute",
          inset: 0,
          background: scrim,
          cursor: "default",
        }}
      />
      <div
        className="figv-pdpstage"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
      <NoCalcScale base={430} stage=".figv-pdpstage" origin="bottom center" />
    </div>
  );
}

/** A TEXT-node SVG export (ink-extent crop) placed on its node box. */
function GlyphImg({
  src,
  x,
  y,
  w,
  h,
  align = "center",
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  align?: "left" | "center";
}) {
  return (
    <img
      src={src}
      alt=""
      style={{
        ...abs(x, y, w, h),
        objectFit: "none",
        objectPosition: `${align} center`,
        display: "block",
      }}
    />
  );
}

/**
 * A star row drawn from the design's own five-star glyph, filled to `fill`
 * (0–1): a dimmed copy carries the empty stars, a clipped copy the earned
 * ones. `natural` is the artwork's intrinsic width, so the clip lands in the
 * gaps between stars rather than through one.
 */
function StarFill({
  src,
  x,
  y,
  w,
  h,
  natural,
  fill,
  label,
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  natural: number;
  fill: number;
  label: string;
}) {
  const clipped = Math.max(0, Math.min(1, fill)) * natural;
  return (
    <div role="img" aria-label={label} style={abs(x, y, w, h)}>
      <div style={{ ...abs(0, 0, w, h), opacity: 0.26 }}>
        <GlyphImg src={src} x={0} y={0} w={w} h={h} align="left" />
      </div>
      <div style={{ ...abs(0, 0, clipped, h), overflow: "hidden" }}>
        <GlyphImg src={src} x={0} y={0} w={w} h={h} align="left" />
      </div>
    </div>
  );
}

/* ---------- the four overlays ---------- */

function ReviewsDrawer({
  onClose,
  reviews,
  stats,
}: {
  onClose: () => void;
  reviews: PdpReview[];
  stats: PdpReviewStats | null;
}) {
  // Real rows only. The design's four mock rows carried names, dates and
  // testimonial text that a shopper cannot tell from real ones, which is a
  // review claim rather than "visibly mocked" art; with an empty table the
  // drawer still opens and says so instead (owner, 2026-08-06).
  // Real rows only. The design's four mock rows carried names, dates and
  // testimonial text that a shopper cannot tell from real ones, which is a
  // review claim rather than "visibly mocked" art; with an empty table the
  // drawer still opens and says so instead (owner, 2026-08-06).
  const live = reviews.length > 0;
  const rows = reviews;
  const rows = reviews;
  return (
    <OverlayStage scrim="rgba(20,13,10,0.24)" onClose={onClose} label="Reviews">
      {/* 1523:4215 — sheet from y=120 of the 932 stage */}
      <div
        className={`${notoSC.className} figv-pdpsheet-slide-up`}
        style={{
          ...abs(0, 120, 430, 812),
          background: REVIEW_BG,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: "26px 26px 0 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{ ...abs(188, 14, 54, 5), background: SAND, borderRadius: 3 }}
        />
        <button
          type="button"
          aria-label="Close reviews"
          onClick={onClose}
          style={{ ...RESET, ...abs(378, 28, 34, 30) }}
        >
          <span style={{ ...txt(26, 30, INK, "center"), display: "block" }}>
            ×
          </span>
        </button>
        <div
          className={playfair.className}
          style={{ ...abs(20, 56, 170), ...txt(36, 42, INK), fontWeight: 600 }}
        >
          Reviews
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(202, 48, 76),
            ...txt(52, 58, INK, "center"),
            fontWeight: 500,
          }}
        >
          {live && stats ? stats.average : "—"}
          {live && stats ? stats.average : "—"}
        </div>
        {/* 1523:4220 — 22px star row, gold-filled in the 07-29 pass. With
            live reviews it fills to the real average, so the art can never
            show five stars for a 4.5 score. */}
        <StarFill
          src="/eldreve/screens/1523-4220.svg"
          x={282}
          y={60}
          w={128}
          h={26}
          natural={109}
          fill={live && stats ? stats.average / 5 : 0}
          label={
            live && stats ? `${stats.average} out of 5 stars` : "No ratings yet"
          }
        />
        <StarFill
          src="/eldreve/screens/1523-4220.svg"
          x={282}
          y={60}
          w={128}
          h={26}
          natural={109}
          fill={live && stats ? stats.average / 5 : 0}
          label={
            live && stats ? `${stats.average} out of 5 stars` : "No ratings yet"
          }
        />
        <div style={{ ...abs(286, 90, 120), ...txt(15, 19, INK) }}>
          {live && stats
            ? `${stats.count} Review${stats.count === 1 ? "" : "s"}`
            : "No reviews yet"}
            : "No reviews yet"}
        </div>

        {/* filter chips — static art like the mock (one review set only) */}
        <div
          style={{ ...abs(20, 128, 58, 38), background: INK, borderRadius: 19 }}
        >
          <div
            style={{
              ...abs(6, 11, 46),
              ...txt(11, 15, CREAM, "center"),
              fontWeight: 500,
            }}
          >
            All
          </div>
        </div>
        {[
          { x: 86, w: 96, label: "With Photos" },
          { x: 190, w: 62, label: "5 ★" },
          { x: 260, w: 62, label: "4 ★" },
        ].map((chip) => (
          <div
            key={chip.label}
            style={{
              ...abs(chip.x, 128, chip.w, 38),
              background: REVIEW_BG,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 19,
            }}
          >
            <div
              style={{
                ...abs(6, 11, chip.w - 12),
                ...txt(11, 15, INK, "center"),
                fontWeight: 500,
              }}
            >
              {chip.label}
            </div>
          </div>
        ))}
        <div
          style={{
            ...abs(330, 128, 80, 38),
            background: REVIEW_BG,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 19,
          }}
        >
          {/* 1523:4231 «Recent⌄» — glyph-bearing label; the 07-29 export is
              missing, so the identically-specced 925-198 pixels stay in. */}
          <GlyphImg
            src="/eldreve/screens/925-198.svg"
            x={6}
            y={11}
            w={68}
            h={15}
          />
        </div>

        {/* 1523:4232… — review rows on the mock's 150px pitch, now a real
            scrolling list: the region below the chips scrolls, the header
            and chips above stay put. Row-internal offsets are the mock's. */}
        <div
          style={{
            ...abs(0, 188, 430, 624),
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {rows.length === 0 ? (
            <div
              className={playfair.className}
              style={{ ...abs(20, 8, 390), ...txt(15, 22, GREY) }}
            >
              No reviews yet — be the first to review this rose.
            </div>
          ) : null}
          {rows.length === 0 ? (
            <div
              className={playfair.className}
              style={{ ...abs(20, 8, 390), ...txt(15, 22, GREY) }}
            >
              No reviews yet — be the first to review this rose.
            </div>
          ) : null}
          {rows.map((review, i) => (
            <div
              key={`${review.author}-${i}`}
              style={{ position: "relative", height: 150 }}
            >
              {review.rating === undefined ? (
                <GlyphImg
                  src="/eldreve/screens/1523-4232.svg"
                  x={20}
                  y={0}
                  w={120}
                  h={21}
                  align="left"
                />
              ) : (
                <StarFill
                  src="/eldreve/screens/1523-4232.svg"
                  x={20}
                  y={0}
                  w={120}
                  h={21}
                  natural={89}
                  fill={review.rating / 5}
                  label={`${review.rating} out of 5 stars`}
                />
              )}
              <div
                className={playfair.className}
                style={{
                  ...abs(20, 30, 190),
                  ...txt(20, 24, INK),
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {review.author}&nbsp;&nbsp;●
              </div>
              <div style={{ ...abs(218, 34, 120), ...txt(12, 16, INK) }}>
                {review.date}
              </div>
              <div
                style={{
                  ...abs(392, 4, 18),
                  ...txt(20, 22, INK, "center"),
                  fontWeight: 700,
                }}
              >
                ⋮
              </div>
              <div
                style={{
                  ...abs(20, 62, 370, 72),
                  ...txt(12, 20, INK),
                  whiteSpace: "normal",
                  overflow: "hidden",
                }}
              >
                {review.body}
              </div>
              <div style={{ ...abs(20, 140, 390, 1), background: SAND }} />
            </div>
          ))}
        </div>
        {/* 1523:4256 — the mock's decorative scroll indicator */}
        <div
          style={{
            ...abs(422, 190, 4, 164),
            background: SAND,
            borderRadius: 2,
          }}
        />
      </div>
    </OverlayStage>
  );
}

function ColorDrawer({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(1); // Sapphire Blue — the mock's state
  const color = COLORS[selected];
  return (
    <OverlayStage
      scrim="rgba(59,47,47,0.28)"
      onClose={onClose}
      label="Choose your rose color"
    >
      {/* 1523:4289 — sheet from y=260 */}
      <div
        className={notoSC.className}
        style={{
          ...abs(0, 260, 430, 672),
          background: SHEET_BG,
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...abs(196, 12, 38, 5),
            background: SAND,
            borderRadius: 999,
          }}
        />
        <button
          type="button"
          aria-label="Close color picker"
          onClick={onClose}
          style={{ ...RESET, ...abs(390, 12, 28, 30) }}
        >
          <span
            style={{
              ...txt(27, 32.4, INK, "center"),
              display: "block",
              marginTop: -1.2,
            }}
          >
            ×
          </span>
        </button>

        {/* search field — static mock (colors are design placeholders) */}
        <div
          style={{
            ...abs(16, 48, 398, 44),
            background: SHEET_BG,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 22,
          }}
        />
        <GlyphImg
          src="/eldreve/screens/1523-4293.svg"
          x={30}
          y={51}
          w={32}
          h={38}
        />
        <div style={{ ...abs(64, 61.6, 240), ...txt(14, 16.8, GREY) }}>
          Search colors…
        </div>

        {/* style chips — static mock */}
        <div
          style={{
            ...abs(16, 102, 52, 32),
            background: INK,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 16,
          }}
        >
          <div
            style={{
              ...abs(5, 9.4, 42),
              ...txt(11, 13.2, CREAM, "center"),
              fontWeight: 500,
            }}
          >
            All
          </div>
        </div>
        {[
          { x: 78, w: 100, label: "Radiant" },
          { x: 188, w: 100, label: "Classic" },
          { x: 298, w: 112, label: "Sparkle" },
        ].map((chip) => (
          <div
            key={chip.label}
            style={{
              ...abs(chip.x, 102, chip.w, 32),
              background: SHEET_BG,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                ...abs(5, 9.4, chip.w - 10),
                ...txt(11, 13.2, INK, "center"),
                fontWeight: 500,
              }}
            >
              {chip.label}
            </div>
          </div>
        ))}

        {/* 12 color cards, 3 × 4, 134/112 pitch from (16,146) sheet-local */}
        {COLORS.map((option, i) => {
          const x = 16 + (i % 3) * 134;
          const y = 146 + Math.floor(i / 3) * 112;
          const isSelected = i === selected;
          return (
            <button
              key={option.name}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(i)}
              style={{
                ...RESET,
                ...abs(x, y, 126, 104),
                background: SHEET_BG,
                boxShadow: `inset 0 0 0 1px ${isSelected ? GOLD : SAND}`,
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <img
                src={`/eldreve/screens/${option.img}.png`}
                alt={option.name}
                width={70}
                height={62}
                style={{
                  ...abs(28, 4, 70, 62),
                  display: "block",
                  borderRadius: 6,
                }}
              />
              <span
                className={playfair.className}
                style={{
                  ...abs(4, 67.5, 118, 14),
                  ...txt(10.5, 14, INK, "center"),
                  fontWeight: 600,
                  display: "block",
                }}
              >
                {option.name}
              </span>
              <span
                style={{
                  ...abs(8, 86.9, 110, 10.2),
                  ...txt(8.5, 10.2, isSelected ? GOLD : GREY, "center"),
                  display: "block",
                }}
              >
                •&nbsp;&nbsp;{option.tag}
              </span>
              {isSelected ? (
                // 1523:4311 ✓ — card-relative (96,7), Figma's gold glyph
                <img
                  src="/eldreve/screens/1523-4311.svg"
                  alt=""
                  style={{
                    ...abs(96, 7, 23, 23),
                    objectFit: "none",
                    objectPosition: "center",
                  }}
                />
              ) : null}
            </button>
          );
        })}

        {/* 1523:4352 sticky bar */}
        <div
          style={{
            ...abs(0, 595, 430, 77),
            background: SHEET_BG,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 18,
          }}
        />
        <img
          src={`/eldreve/screens/${selected === 1 ? "1523-4353" : color.img}.png`}
          alt=""
          width={50}
          height={52}
          style={{
            ...abs(18, 605, 50, 52),
            display: "block",
            borderRadius: 25,
            objectFit: "cover",
          }}
        />
        <div style={{ ...abs(75, 602, 160), ...txt(10, 12, GREY) }}>
          Currently Selected
        </div>
        <div
          style={{
            ...abs(75, 619.2, 165),
            ...txt(13, 15.6, INK),
            fontWeight: 700,
          }}
        >
          {color.name}
        </div>
        <div style={{ ...abs(75, 641.3, 165), ...txt(9.5, 11.4, GOLD) }}>
          ●&nbsp;&nbsp;{color.tag} Collection
        </div>
        {/* Confirm just closes — the twelve colors are mock options, not
            variants (docs/ixd/README.md). */}
        <button
          type="button"
          onClick={onClose}
          style={{
            ...RESET,
            ...abs(238, 606, 176, 48),
            background: GOLD,
            borderRadius: 12,
          }}
        >
          <span
            className={playfair.className}
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              top: 14.35,
              ...txt(13, 17.3, INK, "center"),
              fontWeight: 600,
            }}
          >
            Confirm Selection&nbsp;&nbsp;›
          </span>
        </button>
      </div>
    </OverlayStage>
  );
}

function MediaViewer({
  onClose,
  shots,
}: {
  onClose: () => void;
  /** The same photo set the hero carousel pages through. */
  shots: string[];
}) {
  const [index, setIndex] = useState(0);
  const step = (delta: number) =>
    setIndex((i) => (i + delta + shots.length) % shots.length);
    setIndex((i) => (i + delta + shots.length) % shots.length);
  return (
    <OverlayStage
      scrim="transparent"
      onClose={onClose}
      label="Product photos"
      background="#040404"
    >
      {/* 2571:375 "Close Menu · 44px" — the frame's own close control, top
          right, with its 20×20 icon inset 12px. The 1523 import missed it
          (it was added to the frame later), so the viewer shipped with only
          a top-left back chevron the frame no longer draws, and closing
          worked solely through OverlayStage's invisible scrim — you could
          dismiss it but never see how (owner, 2026-08-06). */}
      <button
        type="button"
        aria-label="Close product photos"
        onClick={onClose}
        style={{ ...RESET, ...abs(376, 10, 44, 44) }}
      >
        <img
          src="/eldreve/screens/2571-376.svg"
          alt=""
          width={20}
          height={20}
          style={{ ...abs(12, 12, 20, 20), display: "block" }}
        />
      </button>
      <div
        className={notoSC.className}
        style={{
          ...abs(170, 44, 90),
          ...txt(16, 20, CREAM, "center"),
          fontWeight: 500,
        }}
      >
        {index + 1} / {shots.length}
        {index + 1} / {shots.length}
      </div>
      {/* 1523:4260 — FIT inside 410×620 */}
      <img
        src={shots[index]}
        alt={`Product photo ${index + 1}`}
        style={{
          ...abs(10, 102, 410, 620),
          objectFit: "contain",
          display: "block",
        }}
      />
      <button
        type="button"
        aria-label="Previous photo"
        onClick={() => step(-1)}
        style={{
          ...RESET,
          ...abs(16, 430, 48, 48),
          background: "rgba(31,31,31,0.94)",
          borderRadius: 24,
        }}
      >
        <span
          className={notoSC.className}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 4,
            ...txt(34, 40, CREAM, "center"),
          }}
        >
          ‹
        </span>
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={() => step(1)}
        style={{
          ...RESET,
          ...abs(366, 430, 48, 48),
          background: "rgba(31,31,31,0.94)",
          borderRadius: 24,
        }}
      >
        <span
          className={notoSC.className}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 4,
            ...txt(34, 40, CREAM, "center"),
          }}
        >
          ›
        </span>
      </button>
      <GlyphImg
        src="/eldreve/screens/1523-4265.svg"
        x={86}
        y={727}
        w={28}
        h={24}
      />
      <div
        className={notoSC.className}
        style={{ ...abs(120, 728, 120), ...txt(12, 18, CREAM) }}
      >
        Pinch to zoom
      </div>
      <GlyphImg
        src="/eldreve/screens/1523-4267.svg"
        x={248}
        y={725}
        w={30}
        h={26}
      />
      <div
        className={notoSC.className}
        style={{ ...abs(282, 728, 132), ...txt(12, 18, CREAM) }}
      >
        Swipe to explore
      </div>
      {/* 1523:4269 filmstrip */}
      <div
        style={{
          ...abs(16, 772, 398, 128),
          background: "#171717",
          borderRadius: 18,
        }}
      >
        {shots.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Photo ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{ ...RESET, ...abs(12 + i * 96, 11, 86, 106) }}
          >
            <img
              src={src}
              alt=""
              style={{
                ...abs(0, 0, 86, 106),
                borderRadius: 12,
                objectFit: i === index ? "contain" : "cover",
                background: "#000000",
                display: "block",
              }}
            />
            {i === index ? (
              <span
                style={{
                  ...abs(0, 0, 86, 106),
                  borderRadius: 12,
                  boxShadow: `inset 0 0 0 2px ${GOLD}`,
                  display: "block",
                }}
              />
            ) : null}
          </button>
        ))}
      </div>
      {/* The mock's iOS home indicator (1523:4274) is intentionally omitted. */}
    </OverlayStage>
  );
}

function UnboxingGallery({ onClose }: { onClose: () => void }) {
  return (
    <OverlayStage
      scrim="rgba(59,47,47,0.18)"
      onClose={onClose}
      label="Unboxing highlights"
    >
      {/* 1523:4368 — sheet from y=180 */}
      <div
        className={notoSC.className}
        style={{
          ...abs(0, 180, 430, 752),
          background: SHEET_BG,
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...abs(192, 12, 46, 5),
            background: SAND,
            borderRadius: 999,
          }}
        />
        <button
          type="button"
          aria-label="Close unboxing highlights"
          onClick={onClose}
          style={{ ...RESET, ...abs(394, 18, 24, 30) }}
        >
          <span
            style={{
              ...txt(27, 32.4, INK, "center"),
              display: "block",
              marginTop: -1.2,
            }}
          >
            ×
          </span>
        </button>
        <div
          className={playfair.className}
          style={{
            ...abs(24, 37, 260, 38),
            ...txt(24, 32, INK),
            fontWeight: 600,
          }}
        >
          Unboxing Highlights
        </div>
        <div style={{ ...abs(24, 74.8, 260), ...txt(12, 14.4, GREY) }}>
          32K+ real ELDREVE moments
        </div>
        {/* Share (1523:4373) — inert placeholder; sharing needs the
            secure-link backend (ORDER-DETAIL-SHARE-TRACKING has the same
            dependency). The 07-29 export of the label is missing, so the
            «▣  Share» chars render as text in the sheet's gold. */}
        <div
          style={{
            ...abs(326, 52, 84, 38),
            background: SHEET_BG,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              ...abs(4, 12.4, 76),
              ...txt(11, 13.2, GOLD, "center"),
              fontWeight: 500,
            }}
          >
            ▣&nbsp;&nbsp;Share
          </div>
        </div>
        {/* style chips + tabs — cosmetic (single mock media set) */}
        <div
          style={{
            ...abs(24, 108, 92, 34),
            background: "#FAEDE3",
            boxShadow: `inset 0 0 0 1px ${GOLD}`,
            borderRadius: 17,
          }}
        >
          <div
            className={playfair.className}
            style={{
              ...abs(4, 9.65, 84),
              ...txt(11, 14.7, GOLD, "center"),
              fontWeight: 500,
            }}
          >
            All Styles
          </div>
        </div>
        {[
          { x: 126, w: 86, label: "Radiant" },
          { x: 222, w: 86, label: "Classic" },
          { x: 318, w: 88, label: "Sparkle" },
        ].map((chip) => (
          <div
            key={chip.label}
            style={{
              ...abs(chip.x, 108, chip.w, 34),
              background: SHEET_BG,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 17,
            }}
          >
            <div
              className={playfair.className}
              style={{
                ...abs(4, 9.65, chip.w - 8),
                ...txt(11, 14.7, INK, "center"),
                fontWeight: 500,
              }}
            >
              {chip.label}
            </div>
          </div>
        ))}
        <div
          className={playfair.className}
          style={{
            ...abs(28, 158.65, 54),
            ...txt(14, 18.7, INK, "center"),
            fontWeight: 600,
          }}
        >
          All
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(92, 158.65, 64),
            ...txt(14, 18.7, GREY, "center"),
            fontWeight: 500,
          }}
        >
          Photos
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(162, 158.65, 66),
            ...txt(14, 18.7, GREY, "center"),
            fontWeight: 500,
          }}
        >
          Videos
        </div>
        <div
          style={{ ...abs(32, 182, 44, 3), background: GOLD, borderRadius: 2 }}
        />
        <div style={{ ...abs(24, 185, 382, 1), background: SAND }} />
        {/* 12 tiles, 3 × 4, 128/132 pitch from (24,196) sheet-local; each
            photo sits on its 1523:4388… card ground (only shows while the
            photo loads — the renders fill the box). */}
        {UNBOXING_TILES.map((tile, i) => (
          <div
            key={tile}
            style={{
              ...abs(
                24 + (i % 3) * 128,
                196 + Math.floor(i / 3) * 132,
                118,
                122,
              ),
              background: TILE_BG,
              borderRadius: 8,
            }}
          >
            <img
              src={`/eldreve/screens/${tile}.png`}
              alt="Customer unboxing photo"
              width={118}
              height={122}
              style={{
                ...abs(0, 0, 118, 122),
                borderRadius: 8,
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
    </OverlayStage>
  );
}

/* ---------- triggers + host ---------- */

/**
 * Mounted inside the PDP's ScaleFrame: absolutely-positioned transparent
 * triggers over the rows the server page draws, plus the portal overlays.
 */
export function PdpOverlays({
  reviews = [],
  stats = null,
  media = [],
  productTitle = "Product",
  media = [],
  productTitle = "Product",
}: {
  reviews?: PdpReview[];
  stats?: PdpReviewStats | null;
  /** The product's photos — the hero carousel and the media viewer. */
  media?: string[];
  /** Names the hero slides for screen readers. */
  productTitle?: string;
}) {
  const [open, setOpen] = useState<OverlayId | null>(null);
  // One source of truth for both the hero and the viewer. A product with no
  // photos of its own falls back to the frame's set rather than an empty box.
  const shots = media.length ? media : MEDIA;
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );
  const close = () => setOpen(null);

  return (
    <>
      {/* Hero (photo window 16,102 398×250) → media viewer. This IS the hero:
          the page draws only the card behind it, because the trigger has to
          sit on top to catch the tap and two stacked photo layers could never
          stay on the same slide. Built on the homepage's shared Carousel so
          the product's own photos auto-play and follow the finger exactly as
          H-03 does (owner, 2026-08-06). Dots are all one size, active by
          colour — the same call HeroCarousel made. */}
      <Carousel
        window={{ left: 16, top: 102, width: 398, height: 250 }}
        radius={18}
        count={shots.length}
        dots={
          shots.length > 1
            ? shots.map((_, i) => ({ x: 16 + i * DOT_PITCH, y: 362, size: 7 }))
            : []
        }
        activeColor="#153C34"
        idleColor="#DED9D0"
        label={`${productTitle} photo`}
        onActivate={() => setOpen("media")}
        renderSlide={(i) => (
          <img
            src={shots[i]}
            alt=""
            width={398}
            height={250}
            style={{
              ...abs(0, 0, 398, 250),
              display: "block",
              objectFit: "cover",
            }}
          />
        )}
      />
      {/* Rating row (rel 0,98 in the info card at 16,375) → reviews drawer */}
      <button
        type="button"
        aria-label="Open reviews"
        onClick={() => setOpen("reviews")}
        style={{ ...RESET, ...abs(16, 468, 200, 28) }}
      />
      {/* Ratings summary block inside "10 · Reviews" → the same drawer. The
          prototype gives the reviews sheet TWO entries: the rating row above
          (1523:3992) and the whole rating-summary block (1523:4109, 366×120). */}
      <button
        type="button"
        aria-label="Open reviews from the ratings summary"
        onClick={() => setOpen("reviews")}
        style={{ ...RESET, ...abs(32, 757, 366, 120) }}
      />
      {/* Unboxing "View All ›" (section at 15,1192) → unboxing gallery */}
      <button
        type="button"
        aria-label="View all unboxing highlights"
        onClick={() => setOpen("unboxing")}
        style={{ ...RESET, ...abs(337, 1205, 70, 24) }}
      />

      {mounted && open === "reviews"
        ? createPortal(
            <ReviewsDrawer onClose={close} reviews={reviews} stats={stats} />,
            document.body,
          )
        : null}
      {mounted && open === "colors"
        ? createPortal(<ColorDrawer onClose={close} />, document.body)
        : null}
      {mounted && open === "media"
        ? createPortal(
            <MediaViewer onClose={close} shots={shots} />,
            document.body,
          )
        ? createPortal(
            <MediaViewer onClose={close} shots={shots} />,
            document.body,
          )
        : null}
      {mounted && open === "unboxing"
        ? createPortal(<UnboxingGallery onClose={close} />, document.body)
        : null}
    </>
  );
}
