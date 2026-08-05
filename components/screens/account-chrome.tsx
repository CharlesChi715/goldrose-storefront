/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Shared chrome for the account/me-flow screens, restyled to the 2026-07-29
 * unified visual language (the design team's file-wide consistency pass):
 * white cards on the cream page, 1px sand inside-stroke, one uniform drop
 * shadow, ink Save buttons, and the ink/gold pill toggle. The 07-28 batch's
 * five-tab glyph nav band is gone from every account frame in this delivery.
 * Geometry verbatim from the Figma REST data; icons are Figma's own SVG
 * exports.
 */

import { BackButton } from "@/components/BackButton";
import { abs, txt } from "@/lib/figma-layout";
import { playfair } from "@/lib/fonts";

export const INK = "#3B2F2F";
export const SAND = "#E5D9C9";
export const GOLD = "#D4AF37";
export const CREAM = "#FFF6EC";
export const PINK = "#F3C6D1";
/** The one shadow every card in the batch uses (unchanged 07-28 → 07-29). */
export const SHADOW = "0 4px 12px rgba(59,47,47,0.10)";

/**
 * Card surface: white fill (07-29 language; inputs pass bg: CREAM), sand
 * inside-stroke, the batch drop shadow. Inside-strokes ride boxShadow (not
 * border) so absolute children keep frame coordinates.
 */
export function sCard(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { bg?: string; r?: number; stroke?: boolean; shadow?: boolean } = {},
): React.CSSProperties {
  const { bg = "#FFFFFF", r = 14, stroke = true, shadow = true } = opts;
  const shadows = [
    ...(stroke ? [`inset 0 0 0 1px ${SAND}`] : []),
    ...(shadow ? [SHADOW] : []),
  ];
  return {
    ...abs(x, y, w, h),
    background: bg,
    ...(shadows.length ? { boxShadow: shadows.join(", ") } : {}),
    borderRadius: r,
  };
}

/**
 * The brand wordmark that sits centred at the top of every screen.
 *
 * Synced from Figma 2026-08-02: the frames' own **ELDREVE** wordmark
 * (imageRef `a8c8a259`, drawn at 140×51 from x145 — dead centre of the 430
 * canvas) is the brand, so the GoldRose substitution the earlier syncs
 * applied here is retired. `SUMMARY.md` § OQ-4 records the decision and
 * `eldreve.com` is live.
 *
 * The asset is Figma's own scale-2 node render, which bakes in the fill's
 * FILL crop — the same image sits in a 136×40 box on home/shop, exported
 * separately rather than squeezed from one file.
 */
export function BrandWordmark({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <img
      src="/eldreve/brand/eldreve-140x51.png"
      alt="ELDREVE"
      width={140}
      height={51}
      style={{
        // Horizontally centred on the 430 canvas, not inside the passed box:
        // several frames draw the mark a few px off-centre and the owner asked
        // for it centred (08-02). Vertical placement still follows the frame.
        ...abs((430 - 140) / 2, y + (h - 51) / 2, 140, 51),
        display: "block",
      }}
    />
  );
}

/**
 * Header of the settings frames, 07-29 geometry: back arrow at (36,53),
 * centred Playfair title at y65 (1523:955/956 in the personal-info frame;
 * every settings frame repeats the identical pair).
 */
export function SettingsHeader({ title }: { title: string }) {
  return (
    <>
      <BackButton
        fallback="/account"
        src="/eldreve/screens/1523-955.svg"
        style={abs(36, 53, 24, 24)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(83, 65, 278),
          ...txt(25, 28, INK, "center"),
          fontWeight: 500,
        }}
      >
        {title}
      </div>
    </>
  );
}

/**
 * The batch's pill toggle: gold with the knob right when on, ink with the
 * knob left when off (07-29; the security frame draws the off state). Flips
 * visually only — none of these preferences has a backend yet.
 */
export function SettingsToggle({
  x,
  y,
  w = 40,
  on,
  onFlip,
  label,
}: {
  x: number;
  y: number;
  w?: number;
  on: boolean;
  onFlip: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onFlip}
      style={{
        ...abs(x, y, w, 24),
        background: on ? GOLD : INK,
        borderRadius: 12,
        border: 0,
        padding: 0,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? w - 22 : 2,
          width: 20,
          height: 20,
          background: CREAM,
          borderRadius: 10,
          display: "block",
          transition: "left 120ms ease",
        }}
      />
    </button>
  );
}
