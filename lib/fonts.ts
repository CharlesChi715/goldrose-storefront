/**
 * ROLE OF THIS FILE
 * Shared Google-font loaders (next/font) for the VELORIA-design pages
 * (/shop, /products/[slug]) and their shared chrome. Each export carries a
 * `className` that sets the font-family; weights still need to be set per
 * element to match the Figma node data exactly.
 */

import { Tenor_Sans, Inter, Cormorant_Garamond, Noto_Sans_SC } from "next/font/google";

export const tenor = Tenor_Sans({ weight: "400", subsets: ["latin"] });

export const inter = Inter({ weight: ["400", "500", "600", "700"], subsets: ["latin"] });

export const cormorant = Cormorant_Garamond({ weight: "600", subsets: ["latin"] });

// Used for prices, star glyphs, and the geometric icon glyphs (⌂ ◆ ✦ …) the
// design sets in Noto Sans SC. The symbol glyphs live outside the latin
// subset; next/font still emits every unicode-range slice, so browsers fetch
// the symbol slices on demand.
export const notoSC = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});
