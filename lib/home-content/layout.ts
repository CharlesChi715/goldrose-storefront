/**
 * ROLE OF THIS FILE
 * Re-stacking maths for the homepage when a section is hidden.
 *
 * The homepage is one fixed 430×5193 stage: every element is absolutely
 * positioned at its Figma coordinate, so `display: none` on a band would leave
 * a hole rather than closing the gap. The seven A-module bands do tile the
 * stage contiguously though (32 → 764 → 1405 → 1868 → 2344 → 3133 → 4124 →
 * 5134, then 59px of bottom nav), so hiding one is exactly: drop it, slide
 * every later band up by its height, and shrink the stage by the same amount.
 *
 * Bands are moved with a `translateY` wrapper rather than by rewriting
 * coordinates (see components/home/HomeBand.tsx), which keeps every imported
 * pixel value untouched — and when nothing is hidden every shift is 0 and the
 * wrapper renders nothing at all, so the default page is byte-identical to the
 * import.
 */

import { HOME_SECTIONS, type HomeSectionId } from "./registry.ts";

/** Total stage height of frame 2380:370: 5134px of bands + the 59px nav. */
export const HOME_FRAME_HEIGHT = 5193;

/** The seven hideable module bands, in page order, with their design geometry. */
const BANDS = HOME_SECTIONS.filter(
  (section): section is typeof section & { band: { y: number; h: number } } =>
    section.band !== null,
);

/** Where each band ends up once hidden sections are removed. */
export type HomeLayout = {
  /** Pixels to slide each visible band up; 0 when nothing above it is hidden. */
  readonly shift: Readonly<Record<HomeSectionId, number>>;
  /** The stage height after removing hidden bands. */
  readonly frameHeight: number;
};

/**
 * Compute the per-band vertical shift and the resulting stage height.
 *
 * @param visible - Show/hide state per section id; missing ids count as shown.
 * @returns The shift for every section (0 for chrome and for the first visible
 *   band) and the stage height with hidden bands removed.
 */
export function homeLayout(
  visible: Partial<Record<HomeSectionId, boolean>>,
): HomeLayout {
  const shift = {} as Record<HomeSectionId, number>;
  for (const section of HOME_SECTIONS) shift[section.id] = 0;

  let removed = 0;
  for (const section of BANDS) {
    if (visible[section.id] === false) {
      removed += section.band.h;
      continue;
    }
    // `-removed` would be -0 while nothing is hidden; keep it a plain 0 so the
    // "no shift" case is literally zero everywhere it is compared or printed.
    shift[section.id] = removed === 0 ? 0 : -removed;
  }

  return { shift, frameHeight: HOME_FRAME_HEIGHT - removed };
}
