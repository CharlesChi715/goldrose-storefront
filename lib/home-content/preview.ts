/**
 * ROLE OF THIS FILE
 * Where a section's live preview WINDOW sits on the real home page, and how big
 * its parts are once a width has been chosen.
 *
 * A section preview is not a re-rendering of one band. It is the same document
 * the page-wide preview shows — `/` in an iframe — held still over one band, so
 * a teammate editing the Craft copy sees the Craft band at the size a visitor
 * sees it, in the surroundings a visitor sees it in. Everything here is
 * therefore stated in LIVE stage coordinates (the band's `y` plus whatever
 * hiding and trimming moved it), never in the imported Figma ones.
 *
 * TWO SECTIONS ARE NOT BANDS, AND THEY ARE HANDLED DIFFERENTLY
 * - `promo` is page chrome rather than a module: the strip above the first band
 *   that the whole site carries. The registry gives it no band, so its
 *   rectangle is stated here — as "everything above the first band" rather than
 *   as a literal 32, so a Figma re-sync that moves A-1 carries the strip with it.
 * - `motion` is a settings section — one shared rail speed with nothing of its
 *   own on the page. A still picture of a speed is worthless, so it BORROWS the
 *   Featured band, which is a card rail: the window then shows cards actually
 *   moving at the speed being edited. `from` says which band is really being
 *   looked at, so the screen can say so rather than let a teammate think A-2
 *   belongs to this section.
 *
 * WHY `onPage` IS COMPUTED ON `from` AND NOT ON THE SECTION ID
 * A window can only be held over something that is on the page. A hidden band
 * is not merely invisible — `HomeBand` renders nothing and `homeLayout` closes
 * the gap, so the offset it used to occupy now belongs to the NEXT band. A
 * window that opened there anyway would show a different section under this
 * section's name, which is the worst thing this screen could do. Testing `from`
 * rather than the id also means hiding Featured correctly demotes `motion`,
 * whose whole picture was borrowed from it.
 */

import { HOME_SECTIONS, findSection, type HomeSectionId } from "./registry.ts";

/** Settings sections with nothing of their own on the page, and what they show. */
const BORROWED: Partial<Record<string, HomeSectionId>> = { motion: "featured" };

/** The live rectangle a section's preview window is held over. */
export type HomePreviewTarget = {
  /** The band's first pixel on the live stage, after hiding and trimming. */
  readonly y: number;
  /** The band's drawn height. */
  readonly h: number;
  /**
   * The section whose band is actually shown. Equal to the requested id for
   * every real band; `motion` borrows `featured` — see the file header.
   */
  readonly from: HomeSectionId;
  /** False when that band is not on the live page, so there is nothing to show. */
  readonly onPage: boolean;
};

/**
 * The rectangle a section's preview window should be held over.
 *
 * @param sectionId - A homepage section id.
 * @param visible - Show/hide state per section; missing ids count as shown.
 * @param shift - Per-band offsets from `homeLayout()`; zero or negative.
 * @returns The live rectangle and whether it is on the page, or null when the
 *   section has nothing to show at all.
 */
export function homePreviewTarget(
  sectionId: string,
  visible: Partial<Record<HomeSectionId, boolean>>,
  shift: Readonly<Record<HomeSectionId, number>>,
): HomePreviewTarget | null {
  const from = BORROWED[sectionId] ?? (sectionId as HomeSectionId);
  const section = findSection(from);
  if (!section) return null;

  if (section.band) {
    return {
      y: section.band.y + (shift[from] ?? 0),
      h: section.band.h,
      from,
      onPage: visible[from] !== false,
    };
  }

  // The promo strip: everything above the first band. Chrome, so it is never
  // hideable and never moves — the first band's own `y` is its height.
  if (from === "promo") {
    const first = HOME_SECTIONS.find((entry) => entry.band !== null);
    return { y: 0, h: first?.band?.y ?? 0, from, onPage: true };
  }

  return null;
}

/** The pixel sizes of a preview window's three parts, at one chosen width. */
export type HomePreviewWindow = {
  /**
   * The scrollable rail's height. This is the WHOLE of the constraint: the rail
   * is the window's only child and it clips the page, so the browser's own
   * scroll bounds are the band's bounds — see SectionPreview.tsx.
   */
  readonly railHeight: number;
  /** Where the full-page iframe's top edge sits inside the rail; <= 0. */
  readonly filmTop: number;
  /** How far the window can be scrolled, in pixels. Zero means it cannot. */
  readonly range: number;
  /**
   * Where to open the window: the scroll offset that puts the band's own first
   * pixel at the window's top edge, so the slack above is somewhere you scroll
   * UP into rather than somewhere you start already inside.
   */
  readonly parkAt: number;
};

/**
 * A whole number of pixels to pull the film up by, as a negative offset.
 *
 * `-Math.round(0)` is `-0`, which renders as the string "-0" and compares
 * unequal to 0 under `Object.is` — the same trap `homeLayout()` documents for
 * its own no-shift case. The top of the page is the one offset that is exactly
 * zero, and it is also the commonest, so it is worth keeping plain.
 *
 * @param px - How far down the page the film's visible top edge sits.
 * @returns The offset to apply, zero or negative, never `-0`.
 */
function pullUp(px: number): number {
  const rounded = Math.round(px);
  return rounded === 0 ? 0 : -rounded;
}

/**
 * Size a section's preview window for one width.
 *
 * The band plus a little of its neighbours is revealed; when that is shorter
 * than the window the reveal is centred instead and the window does not scroll,
 * because there is nothing left to scroll to.
 *
 * @param target - The live rectangle, from `homePreviewTarget()`.
 * @param frameHeight - The live stage height, from `homeLayout()`.
 * @param scale - The chosen width divided by the design's 430.
 * @param windowHeight - The visible height of the window, in pixels.
 * @param slack - How far past the band you may scroll, in DESIGN pixels, so the
 *   amount of page you can peek at does not change with the width.
 * @returns Whole-pixel sizes for the rail, the film and the travel.
 */
export function homePreviewWindow(
  target: Pick<HomePreviewTarget, "y" | "h">,
  frameHeight: number,
  scale: number,
  windowHeight: number,
  slack: number,
): HomePreviewWindow {
  // The reveal is clamped to the stage: there is no page above the promo strip
  // and none below the nav, so the slack simply runs out at both ends.
  const from = Math.max(0, target.y - slack);
  const to = Math.min(frameHeight, target.y + target.h + slack);
  const reveal = (to - from) * scale;

  if (reveal >= windowHeight) {
    const railHeight = Math.round(reveal);
    const range = railHeight - windowHeight;
    return {
      railHeight,
      filmTop: pullUp(from * scale),
      range,
      parkAt: Math.min(Math.round((target.y - from) * scale), range),
    };
  }

  // Shorter than the window: centre what there is, then push it back inside the
  // page so a short band at either end does not open onto blank space.
  const slackAbove = (windowHeight - reveal) / 2;
  const lowest = Math.max(0, frameHeight * scale - windowHeight);
  const top = Math.min(Math.max(from * scale - slackAbove, 0), lowest);
  return {
    railHeight: windowHeight,
    filmTop: pullUp(top),
    range: 0,
    parkAt: 0,
  };
}
