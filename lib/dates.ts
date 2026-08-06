/**
 * ROLE OF THIS FILE
 * Deterministic date formatting for the admin UI. toLocaleString() output
 * can differ between Node (server render) and the browser (hydration) —
 * e.g. narrow no-break spaces before AM/PM — which triggers React hydration
 * mismatches. These helpers build the string manually, so server and client
 * always agree.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Format an ISO timestamp as a date, e.g. "2026-07-22T22:35:00Z" → "Jul 22, 2026".
 *
 * @param iso - ISO 8601 timestamp string.
 * @returns The date in "Mon D, YYYY" form.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format an ISO timestamp as date plus 12-hour time, e.g. "Jul 22, 2026, 10:35 PM".
 *
 * @param iso - ISO 8601 timestamp string.
 * @returns The date and time in "Mon D, YYYY, h:mm AM/PM" form.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const meridiem = hours24 < 12 ? "AM" : "PM";
  return `${formatDate(iso)}, ${hours12}:${pad(date.getMinutes())} ${meridiem}`;
}

/**
 * Format an ISO timestamp in compact list-row form (no year), e.g. "Jul 22, 10:35 PM".
 *
 * @param iso - ISO 8601 timestamp string.
 * @returns The date and time in "Mon D, h:mm AM/PM" form.
 */
export function formatShortDateTime(iso: string): string {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const meridiem = hours24 < 12 ? "AM" : "PM";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${hours12}:${pad(date.getMinutes())} ${meridiem}`;
}

/**
 * Format an ISO timestamp the way the review design writes dates — "3 days
 * ago", "1 week ago". Rendered on the server (the PDP revalidates every 300
 * seconds), so there is no client recompute to mismatch on hydration.
 *
 * @param iso - ISO 8601 timestamp string.
 * @param now - Reference instant; defaults to the current time.
 * @returns A relative label, e.g. "Today", "Yesterday", "2 weeks ago".
 */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const days = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 86_400_000,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (days < 28) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (days < 365) return months <= 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}
