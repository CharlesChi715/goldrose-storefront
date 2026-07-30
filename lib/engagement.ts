/**
 * ROLE OF THIS FILE
 * The measurement rules behind engagement tracking (engagement-tracking.md),
 * kept as pure functions and one explicit-time state machine so they can be
 * unit-tested without a browser, a DOM or fake timers. `components/Beacon.tsx`
 * is the thin adapter that feeds real DOM events into this.
 *
 * Two rules carry the whole feature:
 *   1. Time counts only while the tab is VISIBLE and the visitor is not idle.
 *   2. Exactly ONE section owns the clock at a time, so per-section times can
 *      never sum to more than the page total.
 */

/** No scroll, pointer or key for this long and the clock pauses. */
export const IDLE_MS = 30_000;

/** A section must lead for this long before it takes the clock, so a fast
 *  scroll past ten bands credits none of them. */
export const MIN_SECTION_MS = 1_000;

export type SectionBox = {
  /** The section's `data-el` name, e.g. "HOME-HERO-SECTION". */
  name: string;
  /** Offset of the section's top edge from the viewport top, in px (may be
   *  negative once scrolled past). Exactly `getBoundingClientRect().top`. */
  top: number;
  /** Same, for the bottom edge. */
  bottom: number;
};

/**
 * Score one section for the "who owns the clock" contest, 0–1.
 *
 * Naive "most viewport pixels wins" is unusable: a short band between two tall
 * ones can never lead, even dead-centre, so short sections would read zero
 * forever. So coverage is measured against *the most this section could
 * possibly show* — its own height when it is shorter than the screen, the
 * screen when it is taller. Either way a fully-attended section reaches 1.0
 * and height stops deciding the winner.
 *
 * A mild centre bias then breaks the remaining tie: a strip clinging to the
 * top edge should not beat the band filling the middle of the screen.
 *
 * @param box Section edges relative to the viewport.
 * @param viewportHeight Visible height of the window, in px.
 * @returns Score in 0–1; 0 when the section is off-screen.
 */
export function sectionScore(box: SectionBox, viewportHeight: number): number {
  if (viewportHeight <= 0) return 0;

  const visible = Math.min(box.bottom, viewportHeight) - Math.max(box.top, 0);
  if (visible <= 0) return 0;

  const height = box.bottom - box.top;
  if (height <= 0) return 0;

  // The denominator is the point: short sections are judged against
  // themselves, tall sections against the screen.
  const coverage = visible / Math.min(height, viewportHeight);

  // Distance between the section's midpoint and the screen's, as a fraction of
  // a screen. Full credit at dead-centre, down to half a screen away.
  const sectionCentre =
    (Math.max(box.top, 0) + Math.min(box.bottom, viewportHeight)) / 2;
  const offCentre =
    Math.abs(sectionCentre - viewportHeight / 2) / viewportHeight;
  const centreBias = 1 - Math.min(offCentre, 0.5);

  return Math.min(coverage, 1) * centreBias;
}

/**
 * Pick the single section that owns the clock right now.
 *
 * @param boxes Sections currently intersecting the viewport.
 * @param viewportHeight Visible height of the window, in px.
 * @returns The winning section name, or null when nothing scores.
 */
export function pickSection(
  boxes: SectionBox[],
  viewportHeight: number,
): string | null {
  let best: string | null = null;
  let bestScore = 0;
  for (const box of boxes) {
    const score = sectionScore(box, viewportHeight);
    // Strictly greater, so an exact tie keeps the incumbent and the winner
    // does not flicker between two identical bands.
    if (score > bestScore) {
      bestScore = score;
      best = box.name;
    }
  }
  return best;
}

export type EngagementSnapshot = {
  /** Active milliseconds on the page. */
  activeMs: number;
  /** Deepest scroll reached, 0–100. */
  scrollPct: number;
  /** Active milliseconds per section name. Sums to <= activeMs. */
  sections: Record<string, number>;
  /** The last section to hold the clock — where the visit stopped. Sent
   *  explicitly because Postgres jsonb does not preserve key order, so it
   *  cannot be recovered from `sections`. */
  lastSection: string | null;
};

export type EngagementClock = {
  /** Tab became visible or hidden. Hidden time never counts. */
  setVisible(visible: boolean, now: number): void;
  /** A scroll, pointer or key event — resets the idle countdown. */
  activity(now: number): void;
  /** Deepest scroll reached so far, 0–100. Only ever increases. */
  reportScroll(pct: number): void;
  /** Advance to `now`, with `section` the current biggest-share winner. */
  tick(now: number, section: string | null): void;
  /** Totals as of `now`, without mutating further. */
  snapshot(now: number): EngagementSnapshot;
};

/**
 * Build the page-visit clock.
 *
 * Time is always passed in rather than read from `Date.now()`, so tests drive
 * it directly and the rules stay verifiable.
 *
 * @param startedAt Timestamp the visit began, in ms.
 * @returns A clock accumulating active and per-section time.
 */
export function createEngagementClock(startedAt: number): EngagementClock {
  let activeMs = 0;
  let scrollPct = 0;
  const sections: Record<string, number> = {};

  let visible = true;
  let lastActivityAt = startedAt;
  /** Everything before this instant has already been banked. */
  let accruedTo = startedAt;

  let currentSection: string | null = null;
  /** Sticky: scrolling into dead space at the foot of a page should not erase
   *  where the visit actually got to. */
  let lastSection: string | null = null;
  /** A challenger waiting out MIN_SECTION_MS before it takes the clock. */
  let pending: { name: string | null; since: number } | null = null;

  /**
   * Bank the time between `accruedTo` and `now`, minus anything hidden or
   * idle, then move the watermark to `now`.
   */
  function settle(now: number): void {
    // Time only counts up to IDLE_MS past the last interaction; the rest of
    // the gap is a visitor who walked away, and is dropped entirely.
    const countableUntil = Math.min(now, lastActivityAt + IDLE_MS);
    if (visible && countableUntil > accruedTo) {
      const delta = countableUntil - accruedTo;
      activeMs += delta;
      if (currentSection) {
        sections[currentSection] = (sections[currentSection] ?? 0) + delta;
      }
    }
    accruedTo = now;
  }

  return {
    setVisible(next, now) {
      settle(now); // bank under the OLD visibility first
      visible = next;
      // Coming back to the tab is itself an interaction, otherwise a visitor
      // returning after a long break would resume already idle.
      if (next) lastActivityAt = now;
    },

    activity(now) {
      settle(now); // bank under the OLD idle state first
      lastActivityAt = now;
    },

    reportScroll(pct) {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      if (clamped > scrollPct) scrollPct = clamped;
    },

    tick(now, section) {
      if (section === currentSection) {
        pending = null; // incumbent reconfirmed
      } else if (!pending || pending.name !== section) {
        pending = { name: section, since: now };
      } else if (now - pending.since >= MIN_SECTION_MS) {
        settle(now); // close the incumbent's account first
        currentSection = section;
        if (section) lastSection = section;
        pending = null;
      }
      settle(now);
    },

    snapshot(now) {
      settle(now);
      return {
        activeMs: Math.round(activeMs),
        scrollPct,
        sections: { ...sections },
        lastSection,
      };
    },
  };
}
