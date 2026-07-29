"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * C-3 · Menu drawer overlay — nodes 1523:3224 (Menu Scrim) and 1523:3225
 * (Left Navigation Drawer) of the 07-29 Figma frame 1523:3197
 * " Homepage-Menu_drawer". The homepage under the scrim (1523:3199) is
 * context in the design only and is not rebuilt here; its "9:41" status bar
 * stays unimplemented — C-3 precedent. HOME / SHOP / PERSONALIZE /
 * FOR BUSINESS / OUR CRAFT / OUR STORY are wired; BLOG is a pixel-exact
 * placeholder (no blog exists yet). Coordinates, colours and fonts are
 * verbatim from the Figma REST data.
 */

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import NoCalcScale from "@/components/NoCalcScale";
import { Glyph } from "@/components/screens/glyphs";
import { abs } from "@/lib/figma-layout";
import { playfair } from "@/lib/fonts";

type Row = {
  /** Figma node id of the row frame, for traceability. */
  id: string;
  label: string;
  /** Row top in frame coordinates (every row is 264×82 at x=25). */
  y: number;
  href?: string;
  /** HOME is the design's current row: darker fill, amber label. */
  current?: boolean;
  /** The row's icon — the 07-29 icons ship as whole 30×30 frame exports. */
  icon: string;
};

// 1523:3236 … 1523:3262 — the seven menu rows on an 87px pitch (82 tall + a
// 5px gap; the 07-27 between-row separators are gone from this frame). Each
// row places its 30×30 icon frame at (38, y+26) and its label at (86, y+29.5)
// in frame coordinates.
const ROWS: Row[] = [
  { id: "1523:3236", label: "HOME", y: 196, href: "/", current: true, icon: "1523-3237" },
  { id: "1523:3240", label: "SHOP", y: 283, href: "/shop", icon: "1523-3241" },
  // /#personalize — the homepage anchor on the A-4 personalize card (H-16 precedent)
  { id: "1523:3244", label: "PERSONALIZE", y: 370, href: "/#personalize", icon: "1523-3245" },
  { id: "1523:3248", label: "FOR BUSINESS", y: 457, href: "/business/partnerships", icon: "1523-3249" },
  { id: "1523:3253", label: "BLOG", y: 544, icon: "1523-3254" },
  { id: "1523:3258", label: "OUR CRAFT", y: 631, href: "/craft", icon: "1523-3259" },
  { id: "1523:3262", label: "OUR STORY", y: 718, href: "/story", icon: "1523-3263" },
];

const RESET: React.CSSProperties = {
  appearance: "none",
  border: 0,
  padding: 0,
  background: "transparent",
  cursor: "pointer",
};

// The portal may only render once we are on the client, or the server markup
// and the first client render disagree. Read that as an external "are we
// hydrated yet" store rather than a setState inside an effect: the snapshot is
// taken during render, so there is no second cascading render pass.
const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // The trigger lives inside ScaleFrame's `.figv-stage`, which is transformed.
  // A transform makes that stage the containing block AND the stacking context
  // for fixed descendants, so an in-place drawer would be scaled twice and
  // would lose the z-order fight to the tab bar (z-index 10 outside the stage
  // beats anything inside it). Portal to <body> so `fixed` means the viewport
  // and z-index 40 actually wins — same reason BottomNav sits outside the stage.
  const mounted = useSyncExternalStore(subscribeToNothing, onTheClient, onTheServer);

  // Escape closes, and the page behind must not scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open || !mounted) return null;
  return createPortal(
    <div className="figv-menufix">
      <style>{`
        .figv-menufix { position: fixed; inset: 0; z-index: 40; }
        /* left calc, not margin:auto — auto margins pin an over-wide box to the
           left edge on narrow phones, drifting it right after the scale. */
        .figv-menustage { position: relative; width: 430px; height: 932px; left: calc((100% - 430px) / 2); }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-menustage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: top center; }
        }
      `}</style>

      {/* 1523:3224 Menu Scrim — #0A0605 at 0.44 fill alpha under a 0.34 node
          opacity (both composed). Figma sizes it to the 430×932 frame; here it
          fills the viewport so the dim never stops short of the screen edge. */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        style={{ ...RESET, position: "absolute", inset: 0, background: "rgba(10,6,5,0.44)", opacity: 0.34 }}
      />

      <div className="figv-menustage">
        {/* 1523:3225 Left Navigation Drawer — flush to the stage's left edge */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          style={{
            ...abs(0, 0, 314, 932),
            background: "#241B16",
            boxShadow: "inset 0 0 0 1px #D18005",
            overflow: "hidden",
          }}
        >
          {/* 1523:3226 Drawer Inner Border — decoration only (it neither clips
              nor changes the fill), so the header and rows below stay on the
              outline's frame coordinates instead of nesting inside it. */}
          <div
            style={{
              ...abs(9, 9, 296, 914),
              background: "#241B16",
              boxShadow: "inset 0 0 0 1px #D18005",
              borderRadius: 18,
            }}
          />

          {/* 1523:3227 … 1523:3231 — five hairlines ruled across the drawer's
              top, the 07-29 frame's ornament. */}
          {[27, 33, 39, 45, 51].map((y) => (
            <div key={y} style={{ ...abs(25, y, 240, 1), background: "#D18005", opacity: 0.48 }} />
          ))}

          {/* 1523:3233 Close / 1523:3234 × — Figma's ink-cropped glyph export
              (20×20), centred on the TEXT node's 31×37 box. */}
          <button type="button" aria-label="Close menu" onClick={onClose} style={{ ...RESET, ...abs(258, 57, 31, 37) }}>
            <Glyph src="1523-3234" x={0} y={0} w={31} h={37} ink={[20, 20]} />
          </button>

          {/* 1523:3235 drawer title */}
          <div
            className={playfair.className}
            style={{
              ...abs(25, 92, 264),
              fontSize: 48,
              lineHeight: "64px",
              fontWeight: 500,
              color: "#D18005",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {"M E N U"}
          </div>

          {/* Menu rows; wired rows close the drawer as they navigate. */}
          {ROWS.map((row) => {
            const box: React.CSSProperties = {
              ...abs(25, row.y, 264, 82),
              background: row.current ? "#33261F" : "#241B16",
              borderRadius: 16,
            };
            const inner = (
              <>
                {/* icon frame export — placed exactly at its 30×30 sheet box */}
                <img
                  src={`/veloria/screens/${row.icon}.svg`}
                  alt=""
                  style={{ ...abs(13, 26, 30, 30), display: "block" }}
                />
                <div
                  className={playfair.className}
                  style={{
                    ...abs(61, 29.5, 185),
                    fontSize: 17,
                    lineHeight: "22.66px",
                    fontWeight: 500,
                    color: row.current ? "#D18005" : "#FFFFFF",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.label}
                </div>
              </>
            );
            return row.href ? (
              <Link key={row.id} href={row.href} onClick={onClose} style={{ ...box, display: "block" }}>
                {inner}
              </Link>
            ) : (
              <div key={row.id} style={box}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fallback for browsers without calc() length division: same scale via
          zoom/transform so the drawer still fits narrow screens. */}
      <NoCalcScale base={430} stage=".figv-menustage" origin="top center" />
    </div>,
    document.body,
  );
}
