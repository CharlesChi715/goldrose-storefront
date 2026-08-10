/**
 * ROLE OF THIS FILE
 * The promo bar's content, resolved from the registry into the three things the
 * strip actually needs: its lines, whether line 1 is still the design's own
 * render (§11), and how long each line is held.
 *
 * WHY IT IS A MODULE OF ITS OWN, AND IMPORTS NOTHING BUT THE REGISTRY
 * `components/chrome.tsx` needs the timings, and chrome.tsx is imported by
 * "use client" screens (BagScreen, ShopInteractive …). Anything reaching the
 * database — `index.ts` — would follow it into the browser bundle. So the
 * resolving lives here, on plain values, and the one function that has to read
 * the store (`getPromoBar`) lives in index.ts beside the other reads. Same
 * split, same reason, as rail-timing.ts sitting outside Carousel.tsx.
 *
 * AN EMPTY LINE IS NOT A SLIDE
 * Lines 2–5 default to "", so the untouched design resolves to exactly one line
 * and the bar renders the markup it always did. Blank lines are dropped wherever
 * they sit, so clearing line 2 while line 3 is filled leaves two lines, not a
 * silent gap on the strip.
 */

import { homeDefault } from "./registry.ts";

/** Everything the promo strip needs to draw itself. */
export type PromoBarContent = {
  /** The lines to show, in order, blanks removed. Never empty. */
  readonly lines: readonly string[];
  /**
   * Whether line 1 is still the design's own wording — the §11 rule that serves
   * Figma's rendered strip instead of live text.
   */
  readonly isDefault: boolean;
  /** How long each line is held before the next slides up. */
  readonly cycleMs: number;
};

/** The ids of the optional lines, in the order they play. */
const EXTRA_LINE_IDS = ["line_2", "line_3", "line_4", "line_5"] as const;

/** The design's own hold, used when the stored value is unusable. */
export const PROMO_CYCLE_MS = 5000;

/** How long the upward slide itself takes. Fixed: it is design, not content. */
export const PROMO_SLIDE_MS = 600;

/**
 * The design's promo bar: one line, the design's own render, default timing.
 * What every failed read falls back to.
 */
export const DESIGN_PROMO_BAR: PromoBarContent = {
  lines: [homeDefault("promo", "slogan")],
  isDefault: true,
  cycleMs: PROMO_CYCLE_MS,
};

/**
 * Resolve the promo bar from homepage content already in hand. Structurally
 * typed, so a `HomeContent` fits without this module importing the reader.
 *
 * @param content - The resolved promo copy, and the set of edited slot keys.
 * @returns The strip's lines, its §11 default flag, and its hold.
 */
export function promoBarFrom(content: {
  text: { promo: Readonly<Record<string, string>> };
  overridden: ReadonlySet<string>;
}): PromoBarContent {
  const promo = content.text.promo;
  const lines = [promo.slogan ?? "", ...EXTRA_LINE_IDS.map((id) => promo[id])]
    .map((line) => (line ?? "").trim())
    .filter((line) => line.length > 0);

  const cycle = Number((promo.cycle_ms ?? "").trim());
  return {
    // A slogan edited away to nothing would otherwise leave the strip with no
    // slides at all; the design's wording is the honest thing to fall back to.
    lines: lines.length > 0 ? lines : DESIGN_PROMO_BAR.lines,
    isDefault: !content.overridden.has("promo.slogan"),
    cycleMs: Number.isFinite(cycle) && cycle > 0 ? cycle : PROMO_CYCLE_MS,
  };
}
