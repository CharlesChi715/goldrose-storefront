/**
 * ROLE OF THIS FILE
 * The gift reminders' time zone. The store is US-first and the design team
 * settled on a single zone — Pacific — with the summer/winter switch handled
 * automatically rather than by a picker (Figma comment thread on 1523:3473,
 * accepted by the owner 2026-08-01; the GIFT-REMINDERS-TIME-ZONE sheet was
 * un-marked on 08-02 and is not built).
 *
 * "Automatically" means the offset is derived from the IANA zone
 * `America/Los_Angeles`, which carries the US daylight-saving rules, so the
 * label reads UTC-7 during 夏令时 (Mar–Nov) and UTC-8 during 冬令时 (Nov–Mar)
 * without anyone editing anything — including when Congress next moves the
 * dates, since the rules ship with the platform's time-zone database.
 *
 * The offset is computed by formatting the instant in Los Angeles and reading
 * the wall clock back, rather than by `timeZoneName: "shortOffset"`, because
 * that option is not available on every browser the storefront supports. The
 * same technique keeps server render and client hydration in agreement: the
 * result depends only on the instant and the fixed zone, never on the
 * machine's own time zone (the lib/dates.ts hydration rule).
 */

/** The one zone all reminder times are expressed in (US daylight rules). */
export const REMINDER_TIME_ZONE = "America/Los_Angeles";

/** Label prefix, verbatim from the frame's time-zone row (1523:3473). */
const LABEL = "Pacific Time (PT)UTC";

const wallClockParts = new Intl.DateTimeFormat("en-US", {
  timeZone: REMINDER_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * The Pacific UTC offset in whole hours at a given instant: −7 while daylight
 * saving is in force, −8 otherwise.
 *
 * @param at - The instant to measure. Defaults to now.
 * @returns The offset in hours, always negative for this zone.
 */
export function pacificOffsetHours(at: Date = new Date()): number {
  const parts = new Map(
    wallClockParts.formatToParts(at).map((part) => [part.type, part.value]),
  );
  const wallClockAsUtc = Date.UTC(
    Number(parts.get("year")),
    Number(parts.get("month")) - 1,
    Number(parts.get("day")),
    Number(parts.get("hour")),
    Number(parts.get("minute")),
    Number(parts.get("second")),
  );
  // The formatter has no milliseconds, so compare against a whole second.
  const instant = Math.floor(at.getTime() / 1000) * 1000;
  return Math.round((wallClockAsUtc - instant) / 3_600_000);
}

/**
 * The time-zone label shown on /account/reminders, e.g.
 * "Pacific Time (PT)UTC-7" in summer and "Pacific Time (PT)UTC-8" in winter.
 *
 * @param at - The instant to label. Defaults to now.
 * @returns The label in the design's exact wording and spacing.
 */
export function pacificTimeLabel(at: Date = new Date()): string {
  return `${LABEL}${pacificOffsetHours(at)}`;
}
