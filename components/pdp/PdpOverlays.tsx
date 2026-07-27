"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The four product-page overlays added by the 2026-07-27 frames, plus the
 * transparent triggers that open them from the rows the page already draws:
 *
 *   PDP-REVIEW-OPEN-DRAWER   914:117 (panel 925:182) ← the rating row
 *   PDP-COLOR-OPEN-DRAWER    1097:112 (panel 1100:123) ← "View All 120 Colors ›"
 *   PDP-MEDIA-OPEN           914:118 ← the hero photo
 *   PDP-UNBOXING-OPEN-GALLERY 1097:113 (panel 1102:118) ← unboxing "View All ›"
 *
 * Geometry, colors, fonts and copy are verbatim from the Figma REST data.
 * Every overlay is a portal fixed to the viewport (MenuDrawer technique: a
 * transformed ancestor would swallow position:fixed), bottom-anchored so the
 * sheets sit flush with the screen edge at any viewport height.
 *
 * Content is the mocks' own: the reviews, the twelve color cards and the
 * twelve unboxing tiles are design placeholders — the catalog has no review,
 * color-option or UGC tables yet (docs/ixd/README.md). Color selection and
 * the unboxing chips/tabs are cosmetic for the same reason. The media viewer
 * pages through the design's four product images for real. The mocks' iOS
 * home indicator (926:169) is not implemented — C-3 status-bar precedent.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import NoCalcScale from "@/components/NoCalcScale";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const SHEET_BG = "#FFFEFB";
const GREY = "#706661";

const RESET: React.CSSProperties = {
  appearance: "none",
  border: 0,
  padding: 0,
  background: "transparent",
  cursor: "pointer",
};

type OverlayId = "reviews" | "colors" | "media" | "unboxing";

/* ---------- design data ---------- */

// 925:199…221 — the four review rows (52px pitch groups starting y=308).
const REVIEWS = [
  {
    author: "Emma L.",
    date: "3 days ago",
    body: "Absolutely stunning! The blue rose is even more beautiful in person. It arrived perfectly and the gift box feels so elegant.",
  },
  {
    author: "Michael T.",
    date: "1 week ago",
    body: "Bought this for our anniversary and my wife loved it. Beautiful workmanship and exceptional presentation.",
  },
  {
    author: "Sophie M.",
    date: "2 weeks ago",
    body: "Gorgeous rose and beautifully packaged. Shipping was fast and everything arrived in perfect shape.",
  },
  {
    author: "David R.",
    date: "2 weeks ago",
    body: "Such a unique and thoughtful gift. The gold detailing adds a truly luxurious touch.",
  },
];

// 1100:137…185 — the twelve color cards, frame order.
const COLORS = [
  { name: "Ruby Red", tag: "Radiant", img: "1100-138" },
  { name: "Sapphire Blue", tag: "Classic", img: "1100-142" },
  { name: "Rose Pink", tag: "Radiant", img: "1100-147" },
  { name: "Pearl White", tag: "Classic", img: "1100-151" },
  { name: "Royal Purple", tag: "Radiant", img: "1100-155" },
  { name: "Emerald Green", tag: "Classic", img: "1100-159" },
  { name: "Sunset Orange", tag: "Radiant", img: "1100-163" },
  { name: "Midnight Black", tag: "Classic", img: "1100-167" },
  { name: "Champagne Gold", tag: "Sparkle", img: "1100-171" },
  { name: "Lavender Mist", tag: "Radiant", img: "1100-175" },
  { name: "Rainbow Aura", tag: "Sparkle", img: "1100-179" },
  { name: "Blush Pink", tag: "Classic", img: "1100-183" },
];

// 926:155/164 — the viewer pages through the four images the page's own art
// already ships (hero + the three shop-card renders the frame reuses).
const MEDIA = [
  "/veloria/detail-hero.png",
  "/veloria/home/58-91.png",
  "/veloria/home/58-103.png",
  "/veloria/home/58-61.png",
];

// 1102:165…176 — unboxing tiles (badges baked into the renders).
const UNBOXING_TILES = [
  "1102-165",
  "1102-166",
  "1102-167",
  "1102-168",
  "1102-169",
  "1102-170",
  "1102-171",
  "1102-172",
  "1102-173",
  "1102-174",
  "1102-175",
  "1102-176",
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
    <div className="figv-pdpfix" style={background ? { background } : undefined}>
      <style>{`
        .figv-pdpfix { position: fixed; inset: 0; z-index: 40; }
        .figv-pdpstage { position: absolute; bottom: 0; width: 430px; height: 932px; left: calc((100% - 430px) / 2); }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-pdpstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <button type="button" aria-label="Close" onClick={onClose} style={{ ...RESET, position: "absolute", inset: 0, background: scrim, cursor: "default" }} />
      <div className="figv-pdpstage" role="dialog" aria-modal="true" aria-label={label}>
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
      style={{ ...abs(x, y, w, h), objectFit: "none", objectPosition: `${align} center`, display: "block" }}
    />
  );
}

/* ---------- the four overlays ---------- */

function ReviewsDrawer({ onClose }: { onClose: () => void }) {
  return (
    <OverlayStage scrim="rgba(20,13,10,0.24)" onClose={onClose} label="Reviews">
      {/* 925:182 — sheet from y=120 of the 932 stage */}
      <div
        className={notoSC.className}
        style={{
          ...abs(0, 120, 430, 812),
          background: SHEET_BG,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: "26px 26px 0 0",
          overflow: "hidden",
        }}
      >
        <div style={{ ...abs(188, 14, 54, 5), background: SAND, borderRadius: 3 }} />
        <button type="button" aria-label="Close reviews" onClick={onClose} style={{ ...RESET, ...abs(378, 28, 34, 30) }}>
          <span style={{ ...txt(26, 30, INK, "center"), display: "block" }}>×</span>
        </button>
        <div className={playfair.className} style={{ ...abs(20, 56, 170), ...txt(36, 42, INK), fontWeight: 600 }}>
          Reviews
        </div>
        <div className={playfair.className} style={{ ...abs(202, 48, 76), ...txt(52, 58, INK, "center"), fontWeight: 500 }}>
          4.9
        </div>
        {/* 925:187 — 22px star row, Figma's own outlined glyphs */}
        <GlyphImg src="/veloria/screens/925-187.svg" x={282} y={60} w={128} h={26} align="left" />
        <div style={{ ...abs(286, 90, 120), ...txt(15, 19, INK) }}>286 Reviews</div>

        {/* filter chips — static art like the mock (one review set only) */}
        <div style={{ ...abs(20, 128, 58, 38), background: INK, borderRadius: 19 }}>
          <div style={{ ...abs(6, 11, 46), ...txt(11, 15, CREAM, "center"), fontWeight: 500 }}>All</div>
        </div>
        {[
          { x: 86, w: 96, label: "With Photos" },
          { x: 190, w: 62, label: "5 ★" },
          { x: 260, w: 62, label: "4 ★" },
        ].map((chip) => (
          <div key={chip.label} style={{ ...abs(chip.x, 128, chip.w, 38), background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 19 }}>
            <div style={{ ...abs(6, 11, chip.w - 12), ...txt(11, 15, INK, "center"), fontWeight: 500 }}>{chip.label}</div>
          </div>
        ))}
        <div style={{ ...abs(330, 128, 80, 38), background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 19 }}>
          {/* 925:198 «Recent⌄» — glyph-bearing label served as design pixels */}
          <GlyphImg src="/veloria/screens/925-198.svg" x={6} y={11} w={68} h={15} />
        </div>

        {/* 925:199… — four static review rows on a 150px pitch */}
        {REVIEWS.map((review, i) => {
          const y = 188 + i * 150;
          return (
            <div key={review.author}>
              <GlyphImg src="/veloria/screens/925-199.svg" x={20} y={y} w={120} h={21} align="left" />
              <div className={playfair.className} style={{ ...abs(20, y + 30, 190), ...txt(20, 24, INK), fontWeight: 600 }}>
                {review.author}&nbsp;&nbsp;●
              </div>
              <div style={{ ...abs(218, y + 34, 120), ...txt(12, 16, INK) }}>{review.date}</div>
              <div style={{ ...abs(392, y + 4, 18), ...txt(20, 22, INK, "center"), fontWeight: 700 }}>⋮</div>
              <div style={{ ...abs(20, y + 62, 370), ...txt(12, 20, INK), whiteSpace: "normal" }}>{review.body}</div>
              <div style={{ ...abs(20, y + 140, 390, 1), background: SAND }} />
            </div>
          );
        })}
        {/* 925:223 — the mock's decorative scroll indicator */}
        <div style={{ ...abs(422, 190, 4, 164), background: SAND, borderRadius: 2 }} />
      </div>
    </OverlayStage>
  );
}

function ColorDrawer({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(1); // Sapphire Blue — the mock's state
  const color = COLORS[selected];
  return (
    <OverlayStage scrim="rgba(59,47,47,0.28)" onClose={onClose} label="Choose your rose color">
      {/* 1100:123 — sheet from y=260 */}
      <div className={notoSC.className} style={{ ...abs(0, 260, 430, 672), background: SHEET_BG, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ ...abs(196, 12, 38, 5), background: SAND, borderRadius: 999 }} />
        <button type="button" aria-label="Close color picker" onClick={onClose} style={{ ...RESET, ...abs(390, 12, 28, 30) }}>
          <span style={{ ...txt(27, 30, INK, "center"), display: "block" }}>×</span>
        </button>

        {/* search field — static mock (colors are design placeholders) */}
        <div style={{ ...abs(16, 48, 398, 44), background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 22 }} />
        <GlyphImg src="/veloria/screens/920-117-ink.svg" x={30} y={51} w={32} h={38} />
        <div style={{ ...abs(64, 61.6, 240), ...txt(14, 16.8, GREY) }}>Search colors…</div>

        {/* style chips — static mock */}
        <div style={{ ...abs(16, 102, 52, 32), background: INK, borderRadius: 16 }}>
          <div style={{ ...abs(5, 9, 42), ...txt(11, 13.2, CREAM, "center"), fontWeight: 500 }}>All</div>
        </div>
        {[
          { x: 78, w: 100, label: "Radiant" },
          { x: 188, w: 100, label: "Classic" },
          { x: 298, w: 112, label: "Sparkle" },
        ].map((chip) => (
          <div key={chip.label} style={{ ...abs(chip.x, 102, chip.w, 32), background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 16 }}>
            <div style={{ ...abs(5, 9, chip.w - 10), ...txt(11, 13.2, INK, "center"), fontWeight: 500 }}>{chip.label}</div>
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
                src={`/veloria/screens/${option.img}.png`}
                alt={option.name}
                width={70}
                height={62}
                style={{ ...abs(28, 4, 70, 62), display: "block", borderRadius: 6 }}
              />
              <span
                className={playfair.className}
                style={{ ...abs(4, 65, 118, 19), ...txt(10.5, 14, INK, "center"), fontWeight: 600, display: "block" }}
              >
                {option.name}
              </span>
              <span style={{ ...abs(8, 84, 110, 16), ...txt(8.5, 10.2, isSelected ? GOLD : GREY, "center"), display: "block" }}>
                •&nbsp;&nbsp;{option.tag}
              </span>
              {isSelected ? (
                // 1100:145 ✓ — card-relative (96,7), Figma's outlined glyph
                <img src="/veloria/screens/1100-145.svg" alt="" style={{ ...abs(96, 7, 23, 23), objectFit: "none", objectPosition: "center" }} />
              ) : null}
            </button>
          );
        })}

        {/* 1100:186 sticky bar */}
        <div style={{ ...abs(0, 595, 430, 77), background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 18 }} />
        <img
          src={`/veloria/screens/${selected === 1 ? "1100-187" : color.img}.png`}
          alt=""
          width={50}
          height={52}
          style={{ ...abs(18, 605, 50, 52), display: "block", borderRadius: 25, objectFit: "cover" }}
        />
        <div style={{ ...abs(75, 602, 160), ...txt(10, 12, GREY) }}>Currently Selected</div>
        <div style={{ ...abs(75, 619, 165), ...txt(13, 15.6, INK), fontWeight: 700 }}>{color.name}</div>
        <div style={{ ...abs(75, 640, 165), ...txt(9.5, 11.4, GOLD) }}>●&nbsp;&nbsp;{color.tag} Collection</div>
        {/* Confirm just closes — the twelve colors are mock options, not
            variants (docs/ixd/README.md). */}
        <button type="button" onClick={onClose} style={{ ...RESET, ...abs(238, 606, 176, 48), background: GOLD, borderRadius: 12 }}>
          <span className={playfair.className} style={{ position: "absolute", left: 8, right: 8, top: 14, ...txt(13, 17.33, INK, "center"), fontWeight: 600 }}>
            Confirm Selection&nbsp;&nbsp;›
          </span>
        </button>
      </div>
    </OverlayStage>
  );
}

function MediaViewer({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const step = (delta: number) => setIndex((i) => (i + delta + MEDIA.length) % MEDIA.length);
  return (
    <OverlayStage scrim="transparent" onClose={onClose} label="Product photos" background="#040404">
      <button type="button" aria-label="Back" onClick={onClose} style={{ ...RESET, ...abs(18, 30, 42, 50) }}>
        <GlyphImg src="/veloria/screens/926-153.svg" x={0} y={0} w={42} h={50} />
      </button>
      <div className={notoSC.className} style={{ ...abs(170, 44, 90), ...txt(16, 20, CREAM, "center"), fontWeight: 500 }}>
        {index + 1} / {MEDIA.length}
      </div>
      {/* 926:155 — FIT inside 410×620 */}
      <img
        src={MEDIA[index]}
        alt={`Product photo ${index + 1}`}
        style={{ ...abs(10, 102, 410, 620), objectFit: "contain", display: "block" }}
      />
      <button type="button" aria-label="Previous photo" onClick={() => step(-1)} style={{ ...RESET, ...abs(16, 430, 48, 48), background: "rgba(31,31,31,0.94)", borderRadius: 24 }}>
        <span className={notoSC.className} style={{ position: "absolute", left: 0, right: 0, top: 4, ...txt(34, 40, CREAM, "center") }}>‹</span>
      </button>
      <button type="button" aria-label="Next photo" onClick={() => step(1)} style={{ ...RESET, ...abs(366, 430, 48, 48), background: "rgba(31,31,31,0.94)", borderRadius: 24 }}>
        <span className={notoSC.className} style={{ position: "absolute", left: 0, right: 0, top: 4, ...txt(34, 40, CREAM, "center") }}>›</span>
      </button>
      <GlyphImg src="/veloria/screens/926-160.svg" x={86} y={727} w={28} h={24} />
      <div className={notoSC.className} style={{ ...abs(120, 728, 120), ...txt(12, 18, CREAM) }}>Pinch to zoom</div>
      <GlyphImg src="/veloria/screens/926-162.svg" x={248} y={725} w={30} h={26} />
      <div className={notoSC.className} style={{ ...abs(282, 728, 132), ...txt(12, 18, CREAM) }}>Swipe to explore</div>
      {/* 926:164 filmstrip */}
      <div style={{ ...abs(16, 772, 398, 128), background: "#171717", borderRadius: 18 }}>
        {MEDIA.map((src, i) => (
          <button key={src} type="button" aria-label={`Photo ${i + 1}`} onClick={() => setIndex(i)} style={{ ...RESET, ...abs(12 + i * 96, 11, 86, 106) }}>
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
            {i === index ? <span style={{ ...abs(0, 0, 86, 106), borderRadius: 12, boxShadow: `inset 0 0 0 2px ${GOLD}`, display: "block" }} /> : null}
          </button>
        ))}
      </div>
      {/* The mock's iOS home indicator (926:169) is intentionally omitted. */}
    </OverlayStage>
  );
}

function UnboxingGallery({ onClose }: { onClose: () => void }) {
  return (
    <OverlayStage scrim="rgba(59,47,47,0.18)" onClose={onClose} label="Unboxing highlights">
      {/* 1102:118 — sheet from y=180 */}
      <div className={notoSC.className} style={{ ...abs(0, 180, 430, 752), background: SHEET_BG, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ ...abs(192, 12, 46, 5), background: SAND, borderRadius: 999 }} />
        <button type="button" aria-label="Close unboxing highlights" onClick={onClose} style={{ ...RESET, ...abs(394, 18, 24, 30) }}>
          <span style={{ ...txt(27, 30, INK, "center"), display: "block" }}>×</span>
        </button>
        <div className={playfair.className} style={{ ...abs(24, 37, 260, 38), ...txt(24, 32, INK), fontWeight: 600 }}>
          Unboxing Highlights
        </div>
        <div style={{ ...abs(24, 74.8, 260), ...txt(12, 14.4, GREY) }}>32K+ real GoldRose moments</div>
        {/* Share — pixel placeholder; sharing needs the secure-link backend
            (ORDER-DETAIL-SHARE-TRACKING has the same dependency). */}
        <div style={{ ...abs(326, 52, 84, 38), background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 8 }}>
          <GlyphImg src="/veloria/screens/1102-124.svg" x={4} y={2} w={76} h={36} />
        </div>
        {/* style chips + tabs — cosmetic (single mock media set) */}
        <div style={{ ...abs(24, 108, 92, 34), background: "#FAEDE3", boxShadow: `inset 0 0 0 1px ${GOLD}`, borderRadius: 17 }}>
          <div className={playfair.className} style={{ ...abs(4, 9, 84), ...txt(11, 14.66, GOLD, "center"), fontWeight: 500 }}>All Styles</div>
        </div>
        {[
          { x: 126, w: 86, label: "Radiant" },
          { x: 222, w: 86, label: "Classic" },
          { x: 318, w: 88, label: "Sparkle" },
        ].map((chip) => (
          <div key={chip.label} style={{ ...abs(chip.x, 108, chip.w, 34), background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 17 }}>
            <div className={playfair.className} style={{ ...abs(4, 9, chip.w - 8), ...txt(11, 14.66, INK, "center"), fontWeight: 500 }}>{chip.label}</div>
          </div>
        ))}
        <div className={playfair.className} style={{ ...abs(28, 153, 54, 30), ...txt(14, 18.66, INK, "center"), fontWeight: 600 }}>All</div>
        <div className={playfair.className} style={{ ...abs(92, 153, 64, 30), ...txt(14, 18.66, GREY, "center"), fontWeight: 500 }}>Photos</div>
        <div className={playfair.className} style={{ ...abs(162, 153, 66, 30), ...txt(14, 18.66, GREY, "center"), fontWeight: 500 }}>Videos</div>
        <div style={{ ...abs(32, 182, 44, 3), background: GOLD, borderRadius: 2 }} />
        <div style={{ ...abs(24, 185, 382, 1), background: SAND }} />
        {/* 12 tiles, 3 × 4, 128/132 pitch from (24,196) sheet-local */}
        {UNBOXING_TILES.map((tile, i) => (
          <img
            key={tile}
            src={`/veloria/screens/${tile}.png`}
            alt="Customer unboxing photo"
            width={118}
            height={122}
            style={{ ...abs(24 + (i % 3) * 128, 196 + Math.floor(i / 3) * 132, 118, 122), borderRadius: 8, display: "block" }}
          />
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
export function PdpOverlays() {
  const [open, setOpen] = useState<OverlayId | null>(null);
  const mounted = useSyncExternalStore(subscribeToNothing, onTheClient, onTheServer);
  const close = () => setOpen(null);

  return (
    <>
      {/* Hero (16,94 398×281) → media viewer. The button carries its own copy
          of the hero art so the wired hover-zoom keeps working — a plain
          transparent cover would sit outside the zoom container and kill it. */}
      <button
        type="button"
        aria-label="Open product photos"
        onClick={() => setOpen("media")}
        className="gr-card-zoom"
        style={{ ...RESET, ...abs(16, 94, 398, 281), borderRadius: 15, overflow: "hidden" }}
      >
        <img
          className="gr-photo"
          src="/veloria/detail-hero.png"
          alt=""
          width={398}
          height={250}
          style={{ ...abs(0, 8, 398, 250), display: "block" }}
        />
      </button>
      {/* Rating row (rel 0,96 in the info card at 16,375) → reviews drawer */}
      <button
        type="button"
        aria-label="Open reviews"
        onClick={() => setOpen("reviews")}
        style={{ ...RESET, ...abs(16, 468, 200, 28) }}
      />
      {/* "View All 120 Colors ›" (configurator at 16,697) → color drawer */}
      <button
        type="button"
        aria-label="View all rose colors"
        onClick={() => setOpen("colors")}
        style={{ ...RESET, ...abs(280, 712, 126, 26) }}
      />
      {/* Unboxing "View All ›" (section at 16,1465) → unboxing gallery */}
      <button
        type="button"
        aria-label="View all unboxing highlights"
        onClick={() => setOpen("unboxing")}
        style={{ ...RESET, ...abs(338, 1478, 70, 24) }}
      />

      {mounted && open === "reviews" ? createPortal(<ReviewsDrawer onClose={close} />, document.body) : null}
      {mounted && open === "colors" ? createPortal(<ColorDrawer onClose={close} />, document.body) : null}
      {mounted && open === "media" ? createPortal(<MediaViewer onClose={close} />, document.body) : null}
      {mounted && open === "unboxing" ? createPortal(<UnboxingGallery onClose={close} />, document.body) : null}
    </>
  );
}
