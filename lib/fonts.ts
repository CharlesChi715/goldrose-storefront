/**
 * ROLE OF THIS FILE
 * Shared Google-font loaders (next/font) for the ELDREVE-design pages
 * (/shop, /products/[slug]) and their shared chrome. Each export carries a
 * `className` that sets the font-family; weights still need to be set per
 * element to match the Figma node data exactly.
 */

import {
  Tenor_Sans,
  Inter,
  Cormorant_Garamond,
  Noto_Sans_SC,
  Playfair_Display,
  Playfair_Display_SC,
  Sorts_Mill_Goudy,
} from "next/font/google";

/** Tenor Sans 400 — the ELDREVE display/headline face. */
export const tenor = Tenor_Sans({ weight: "400", subsets: ["latin"] });

/** Inter 400–700 — the general UI/body face. */
export const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

/** Cormorant Garamond 600 — the serif accent face. */
export const cormorant = Cormorant_Garamond({
  weight: "600",
  subsets: ["latin"],
});

/**
 * Used for prices, star glyphs, and the geometric icon glyphs (⌂ ◆ ✦ …) the
 * design sets in Noto Sans SC. The symbol glyphs live outside the latin
 * subset; next/font still emits every unicode-range slice, so browsers fetch
 * the symbol slices on demand.
 */
export const notoSC = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

/**
 * Playfair Display 400/500/600 — the redesign display face. 600 arrived with
 * the B/C screens (bag, checkout, business, orders, menu); italic with the
 * 07-28 keepsake card (two italic lines).
 */
export const playfair = Playfair_Display({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

/** Playfair Display SC 400 — small-caps accent (single A-4 label). */
export const playfairSC = Playfair_Display_SC({
  weight: "400",
  subsets: ["latin"],
});

/**
 * Sorts Mill Goudy 400 — Figma names it "OFL Sorts Mill Goudy TT" at weight
 * 500, but the family ships one weight; 400 is the same outline set.
 */
export const goudy = Sorts_Mill_Goudy({ weight: "400", subsets: ["latin"] });
