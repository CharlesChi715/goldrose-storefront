/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Shared chrome for the 2026-07-28 ACCOUNT-PRIVACY-SUPPORT screens
 * (personal info, preferences, security, privacy policy, log out, delete).
 * Those six frames repeat the same header (back arrow + Playfair title),
 * the same five-tab glyph nav band (Home / Shop / Rose Deals / Wholesale /
 * Me, "Me" active — the CARE bar language at new 72px-band geometry), the
 * same card surface (cream, 1px sand inside-stroke, one uniform drop
 * shadow), and the same gold/pink pill toggle. Geometry verbatim from the
 * Figma REST data; icons are Figma's own SVG exports.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { abs, txt } from "@/lib/figma-layout";
import { playfair } from "@/lib/fonts";

export const INK = "#3B2F2F";
export const SAND = "#E5D9C9";
export const GOLD = "#D4AF37";
export const CREAM = "#FFF6EC";
export const PINK = "#F3C6D1";
/** The one shadow every card in the 07-28 batch uses. */
export const SHADOW = "0 4px 12px rgba(59,47,47,0.10)";

/**
 * Card surface: cream fill, sand inside-stroke, the batch drop shadow.
 * Inside-strokes ride boxShadow (not border) so absolute children keep
 * frame coordinates.
 */
export function sCard(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { bg?: string; r?: number; stroke?: boolean; shadow?: boolean } = {},
): React.CSSProperties {
  const { bg = CREAM, r = 14, stroke = true, shadow = true } = opts;
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

/** Header of the six settings frames: back arrow + centred Playfair title. */
export function SettingsHeader({ title }: { title: string }) {
  return (
    <>
      <BackButton fallback="/account" src="/veloria/screens/1231-111.svg" style={abs(20, 24, 24, 24)} />
      <div className={playfair.className} style={{ ...abs(76, 20, 278), ...txt(25, 28, INK, "center"), fontWeight: 500 }}>
        {title}
      </div>
    </>
  );
}

// 1231:169…189 — the frames' own five-tab glyph nav band ("Me" active).
const NAV = [
  { icon: "1231-171", label: "Home", href: "/" },
  { icon: "1231-175", label: "Shop", href: "/shop" },
  { icon: "1231-179", label: "Rose Deals" }, // no route yet — inert (CARE precedent)
  { icon: "1231-183", label: "Wholesale", href: "/business/wholesale" },
  { icon: "1231-187", label: "Me", href: "/account", active: true },
];

/** The account frames' bottom nav band (0,860 430×72). */
export function AccountNavBand() {
  return (
    <>
      <div style={{ ...abs(0, 860, 430, 72), background: CREAM }} />
      {NAV.map((item, i) => {
        const x = [4, 90, 176, 262, 348][i];
        const body = (
          <>
            <img src={`/veloria/screens/${item.icon}.svg`} alt="" width={22} height={22} style={{ ...abs(28, 4, 22, 22), display: "block" }} />
            <span style={{ position: "absolute", left: 0, top: 32, width: 78, ...txt(10, 16, item.active ? GOLD : INK, "center"), display: "block" }}>
              {item.label}
            </span>
          </>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} style={{ ...abs(x, 866, 78, 60), display: "block" }}>
            {body}
          </Link>
        ) : (
          <div key={item.label} style={abs(x, 866, 78, 60)}>
            {body}
          </div>
        );
      })}
    </>
  );
}

/**
 * The batch's pill toggle: gold with the knob right when on, pink with the
 * knob left when off (the security frame draws the off state). Flips
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
      style={{ ...abs(x, y, w, 24), background: on ? GOLD : PINK, borderRadius: 12, border: 0, padding: 0, cursor: "pointer" }}
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
