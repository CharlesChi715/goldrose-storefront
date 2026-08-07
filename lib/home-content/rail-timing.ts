/**
 * ROLE OF THIS FILE
 * The homepage card rails' shared timing, resolved from the registry.
 *
 * WHY IT IS NOT IN Carousel.tsx
 * Carousel is a `"use client"` module, and everything it exports is a client
 * export — so calling this from `app/page.tsx` (a server component) fails the
 * production build with "Attempted to call railTiming() from the server". Dev
 * mode does not enforce that boundary, so the only thing that catches it is
 * `next build`. Keeping the parser in a plain module means the server resolves
 * the timing and passes the result down as a prop, which is the direction the
 * boundary actually allows.
 */

/** The shared rail timing, resolved from the registry and passed down. */
export type RailTiming = {
  /** Full cycle: how long a card is shown before the next one is due. */
  readonly autoplayMs: number;
  /** How long the sliding movement itself takes. */
  readonly slideMs: number;
};

/**
 * The design's own timing. The four card rails advance one card at a time and
 * the owner asked for them to move SLOWLY (2026-07-26): a long pause on each
 * card and a long glide between them.
 */
export const RAIL_AUTOPLAY_MS = 4200;
export const RAIL_SLIDE_MS = 900;

/** The design's timing, used when nothing has been saved. */
export const DESIGN_RAIL_TIMING: RailTiming = {
  autoplayMs: RAIL_AUTOPLAY_MS,
  slideMs: RAIL_SLIDE_MS,
};

/**
 * Turn the registry's two stored strings into a usable timing.
 *
 * Falls back to the design value per field rather than for the pair, so one
 * unreadable slot cannot silently retime the other — and a rail always gets a
 * number, never NaN, which would make setInterval fire continuously.
 *
 * @param cycle - The stored "how long each card stays" value.
 * @param glide - The stored "how long the slide takes" value.
 * @returns The timing to hand to every rail.
 */
export function railTiming(cycle: string, glide: string): RailTiming {
  const parsedCycle = Number(cycle);
  const parsedGlide = Number(glide);
  return {
    autoplayMs:
      Number.isFinite(parsedCycle) && parsedCycle > 0
        ? parsedCycle
        : RAIL_AUTOPLAY_MS,
    slideMs:
      Number.isFinite(parsedGlide) && parsedGlide > 0
        ? parsedGlide
        : RAIL_SLIDE_MS,
  };
}
