/**
 * ROLE OF THIS FILE
 * What a STANDALONE preview of one homepage section shows — the small piece of
 * geometry that `/preview/home/[section]` and the admin's per-section preview
 * card both read.
 *
 * The homepage is one fixed 430×5193 stage with every band absolutely
 * positioned at its Figma y-offset (see lib/home-content/layout.ts). Showing a
 * band on its own is therefore not "render the component" — it is "render the
 * component, slide it up to y=0, and make the stage exactly that band tall".
 * Both numbers are the band's own, so a section preview is the same pixels the
 * live page draws, never a re-creation of them.
 *
 * TWO SECTIONS ARE NOT BANDS, AND THEY ARE HANDLED DIFFERENTLY
 * - `promo` is page chrome rather than a module: the strip at y0-32 that the
 *   whole site carries. It has no `band` in the registry, so its geometry is
 *   stated here.
 * - `motion` is a settings section — one shared rail speed with nothing of its
 *   own on the page. A still picture of it would be worthless, so it BORROWS
 *   the Featured band, which is a card rail: the preview then actually moves at
 *   the speed being edited. `from` says which band is drawn, so the screen can
 *   tell the teammate it is looking at a stand-in rather than let them think
 *   A-2 belongs to this section.
 */

import { findSection, type HomeSectionId } from "./registry.ts";

/** The stage rectangle a standalone section preview draws. */
export type HomePreviewBand = {
  /** The band's y-offset on the 430-wide stage — how far the preview slides up. */
  readonly y: number;
  /** The band's height; also the preview stage's whole height. */
  readonly h: number;
  /**
   * The section whose band is actually drawn. Equal to the requested id for
   * every real band; `motion` borrows `featured` — see the file header.
   */
  readonly from: HomeSectionId;
};

/** The promo strip's geometry. Chrome, so the registry gives it no band. */
const PROMO_BAND = { y: 0, h: 32 } as const;

/** Settings sections with nothing of their own on the page, and what they show. */
const BORROWED: Partial<Record<string, HomeSectionId>> = { motion: "featured" };

/**
 * The stage rectangle to draw when previewing one section on its own.
 *
 * @param sectionId - A homepage section id, or any string from a URL segment.
 * @returns The band to draw and where it sits, or null when the id is unknown
 *   or the section has nothing to show.
 */
export function homePreviewBand(sectionId: string): HomePreviewBand | null {
  const borrowed = BORROWED[sectionId];
  if (borrowed !== undefined) {
    const lender = findSection(borrowed);
    if (!lender?.band) return null;
    return { y: lender.band.y, h: lender.band.h, from: borrowed };
  }

  const section = findSection(sectionId);
  if (!section) return null;
  const id = section.id as HomeSectionId;
  if (section.band) return { y: section.band.y, h: section.band.h, from: id };
  if (id === "promo") return { ...PROMO_BAND, from: id };
  return null;
}
