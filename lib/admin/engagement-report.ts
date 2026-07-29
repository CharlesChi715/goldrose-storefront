/**
 * ROLE OF THIS FILE
 * Turns raw `page_views` engagement columns into the three admin reports
 * promised by docs/features/backend/engagement-tracking.md: time on page,
 * section attention, and drop-off. Pure functions over rows already filtered
 * to a date range, so `lib/admin/analytics.ts` stays the orchestrator and this
 * stays unit-testable.
 *
 * Medians, not means: one visitor who leaves a tab open behind a lunch break
 * drags an average badly, and dwell distributions are long-tailed by nature.
 */

import type { PageViewRow } from "../supabase/types.ts";

/** Longest lists the dashboard cards will show. */
const TOP_PATHS = 8;
const TOP_SECTIONS = 12;
const TOP_DROP_OFF = 8;

export type PathEngagement = {
  path: string;
  visits: number;
  medianActiveMs: number;
  medianScrollPct: number;
};

export type SectionEngagement = {
  section: string;
  /** Measured visits that spent any time in this section. */
  visits: number;
  medianMs: number;
  /** Share of that page's measured visits which reached this section at all. */
  reachRatePercent: number;
};

export type DropOffEntry = {
  section: string;
  visits: number;
  sharePercent: number;
};

export type EngagementReport = {
  /** Visits that reported engagement — the denominator for everything here. */
  measuredVisits: number;
  medianActiveMs: number;
  byPath: PathEngagement[];
  sections: SectionEngagement[];
  dropOff: DropOffEntry[];
};

/**
 * Middle value of a numeric list; the mean of the middle two when even.
 *
 * @param values Numbers to summarise; order does not matter.
 * @returns The median, or 0 for an empty list.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * A page view counts as measured only once its closing beacon has landed.
 * `active_ms` is null (never 0) until then, so this is the honest filter
 * between "we know" and "we never heard back".
 *
 * @param view One page_views row.
 * @returns True when this visit reported engagement.
 */
export function isMeasured(view: PageViewRow): boolean {
  return typeof view.active_ms === "number";
}

/**
 * Build all three engagement reports from one range's page views.
 *
 * @param views Page views already filtered to the reporting range.
 * @returns Time-on-page, section-attention and drop-off tables.
 */
export function engagementReport(views: PageViewRow[]): EngagementReport {
  const measured = views.filter(isMeasured);

  const activeByPath = new Map<string, number[]>();
  const scrollByPath = new Map<string, number[]>();
  // Section name -> the active-ms samples it collected.
  const msBySection = new Map<string, number[]>();
  // Section names are page-prefixed by the naming grammar (HOME-HERO-SECTION),
  // so a section belongs to exactly one page and needs no page selector in the
  // UI. This map is only used to pick the right reach-rate denominator.
  const pathBySection = new Map<string, string>();
  const dropOffCounts = new Map<string, number>();

  for (const view of measured) {
    const active = view.active_ms ?? 0;
    push(activeByPath, view.path, active);
    push(scrollByPath, view.path, view.scroll_pct ?? 0);

    for (const [section, ms] of Object.entries(view.sections ?? {})) {
      push(msBySection, section, ms);
      if (!pathBySection.has(section)) pathBySection.set(section, view.path);
    }

    if (view.last_section) {
      dropOffCounts.set(view.last_section, (dropOffCounts.get(view.last_section) ?? 0) + 1);
    }
  }

  const visitsPerPath = new Map<string, number>();
  for (const [path, samples] of activeByPath) visitsPerPath.set(path, samples.length);

  const byPath: PathEngagement[] = [...activeByPath.entries()]
    .map(([path, samples]) => ({
      path,
      visits: samples.length,
      medianActiveMs: median(samples),
      medianScrollPct: median(scrollByPath.get(path) ?? []),
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, TOP_PATHS);

  const sections: SectionEngagement[] = [...msBySection.entries()]
    .map(([section, samples]) => {
      const pagePath = pathBySection.get(section);
      const pageVisits = pagePath ? (visitsPerPath.get(pagePath) ?? 0) : 0;
      return {
        section,
        visits: samples.length,
        medianMs: median(samples),
        reachRatePercent:
          pageVisits > 0 ? Math.round((samples.length / pageVisits) * 100) : 0,
      };
    })
    .sort((a, b) => b.medianMs - a.medianMs)
    .slice(0, TOP_SECTIONS);

  const dropOffTotal = [...dropOffCounts.values()].reduce((a, b) => a + b, 0);
  const dropOff: DropOffEntry[] = [...dropOffCounts.entries()]
    .map(([section, visits]) => ({
      section,
      visits,
      sharePercent: dropOffTotal > 0 ? Math.round((visits / dropOffTotal) * 100) : 0,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, TOP_DROP_OFF);

  return {
    measuredVisits: measured.length,
    medianActiveMs: median(measured.map((view) => view.active_ms ?? 0)),
    byPath,
    sections,
    dropOff,
  };
}

/** Append `value` to the list at `key`, starting one if needed. */
function push(map: Map<string, number[]>, key: string, value: number): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}
