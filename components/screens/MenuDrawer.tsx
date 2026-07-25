"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * C-3 · Menu drawer overlay — nodes 765:130 (Menu Scrim) and 765:131 (Left
 * Navigation Drawer) of Figma frame 765:114 "Homepage · Menu Open". The
 * homepage under the scrim (765:126) is context in the design only and is not
 * rebuilt here. HOME / SHOP / FOR BUSINESS are wired; PERSONALIZE, BLOG,
 * OUR CRAFT and OUR STORY are pixel-exact placeholders (no routes yet).
 * Coordinates, colours and fonts are verbatim from the Figma REST data.
 */

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import NoCalcScale from "@/components/NoCalcScale";
import { abs } from "@/components/veloria";
import { playfair } from "@/lib/fonts";

/**
 * One VECTOR node of a row's icon, boxed relative to that row's 30×30 icon
 * frame. Figma's SVG export canvas is the node box grown by the 1.8px centred
 * stroke, so each image is drawn at (x-0.9, y-0.9) sized (w+1.8)×(h+1.8) —
 * that is the export's own bounds, not a nudge.
 */
type Icon = { src: string; x: number; y: number; w: number; h: number };

type Row = {
  /** Figma node id of the row frame, for traceability. */
  id: string;
  label: string;
  /** Row top in frame coordinates (every row is 264×82 at x=25). */
  y: number;
  href?: string;
  /** HOME is the design's current row: darker fill, amber label. */
  current?: boolean;
  icons: Icon[];
};

// 771:140 … 771:175 — the seven menu rows. Each row places its icon frame at
// (38, y+26) and its label at (86, y+29.5) in frame coordinates.
const ROWS: Row[] = [
  {
    id: "771:140",
    label: "HOME",
    y: 161,
    href: "/",
    current: true,
    icons: [{ src: "771-142", x: 3.75, y: 4.688, w: 22.5, h: 21.5625 }],
  },
  {
    id: "771:145",
    label: "SHOP",
    y: 244,
    href: "/shop",
    icons: [{ src: "771-147", x: 5.625, y: 3.75, w: 18.75, h: 22.5 }],
  },
  {
    id: "771:150",
    label: "PERSONALIZE",
    y: 327,
    icons: [{ src: "771-152", x: 5.625, y: 3.75, w: 20.625, h: 22.5 }],
  },
  {
    id: "771:155",
    label: "FOR BUSINESS",
    y: 410,
    href: "/business/partnerships",
    icons: [
      { src: "771-157", x: 4.6875, y: 9.375, w: 20.625, h: 15.9375 },
      { src: "771-158", x: 4.6875, y: 6.562, w: 20.625, h: 11.25 },
    ],
  },
  {
    id: "771:161",
    label: "BLOG",
    y: 493,
    icons: [
      { src: "771-163", x: 6.5625, y: 3.75, w: 16.875, h: 22.5 },
      { src: "771-164", x: 10.3125, y: 9.375, w: 9.375, h: 9.375 },
    ],
  },
  {
    id: "771:167",
    label: "OUR CRAFT",
    y: 576,
    icons: [{ src: "771-169", x: 6.5625, y: 9.375, w: 16.875, h: 16.875 }],
  },
  {
    id: "771:172",
    label: "OUR STORY",
    y: 659,
    icons: [{ src: "771-174", x: 4.6875, y: 5.911, w: 20.625, h: 19.4016 }],
  },
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

      {/* 765:130 Menu Scrim — #0A0605 at 0.44 fill alpha under a 0.34 node
          opacity (both composed). Figma sizes it to the 430×932 frame; here it
          fills the viewport so the dim never stops short of the screen edge. */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        style={{ ...RESET, position: "absolute", inset: 0, background: "rgba(10,6,5,0.44)", opacity: 0.34 }}
      />

      <div className="figv-menustage">
        {/* 765:131 Left Navigation Drawer — flush to the stage's left edge */}
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
          {/* 771:132 Drawer Inner Border — decoration only (it neither clips
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

          {/* 771:134 Close / 771:135 × — Figma's own glyph render, drawn at
              natural size inside the TEXT node's 31×37 box (LEFT/TOP align). */}
          <button type="button" aria-label="Close menu" onClick={onClose} style={{ ...RESET, ...abs(258, 27, 31, 37) }}>
            <img
              src="/veloria/screens/771-135.svg"
              alt="×"
              style={{
                display: "block",
                width: 31,
                height: 37,
                objectFit: "none",
                objectPosition: "left center",
              }}
            />
          </button>

          {/* 771:139 drawer title */}
          <div
            className={playfair.className}
            style={{
              ...abs(25, 62, 264),
              fontSize: 48,
              lineHeight: "63.98px",
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
                {/* icon frame (30×30, clips) */}
                <div style={{ ...abs(13, 26, 30, 30), overflow: "hidden" }}>
                  {row.icons.map((ic) => (
                    <img
                      key={ic.src}
                      src={`/veloria/screens/${ic.src}.svg`}
                      alt=""
                      style={{ ...abs(ic.x - 0.9, ic.y - 0.9, ic.w + 1.8, ic.h + 1.8), display: "block" }}
                    />
                  ))}
                </div>
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

          {/* 771:144 / 149 / 154 / 160 / 166 / 171 separators — one per row
              except the last, each in the 1px gap below its row. They are 240
              wide, i.e. 24px short of the 264-wide rows (per the design). */}
          {ROWS.slice(0, -1).map((row) => (
            <div
              key={`sep-${row.id}`}
              style={{ ...abs(25, row.y + 82, 240, 1), background: "#D18005", opacity: 0.48 }}
            />
          ))}
        </div>
      </div>

      {/* Fallback for browsers without calc() length division: same scale via
          zoom/transform so the drawer still fits narrow screens. */}
      <NoCalcScale base={430} stage=".figv-menustage" origin="top center" />
    </div>,
    document.body,
  );
}
