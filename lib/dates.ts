/**
 * ROLE OF THIS FILE
 * Deterministic date formatting for the admin UI. toLocaleString() output
 * can differ between Node (server render) and the browser (hydration) —
 * e.g. narrow no-break spaces before AM/PM — which triggers React hydration
 * mismatches. These helpers build the string manually, so server and client
 * always agree.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** "Jul 22, 2026" */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "Jul 22, 2026, 10:35 PM" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const meridiem = hours24 < 12 ? "AM" : "PM";
  return `${formatDate(iso)}, ${hours12}:${pad(date.getMinutes())} ${meridiem}`;
}

/** "Jul 22, 10:35 PM" — compact list-row form. */
export function formatShortDateTime(iso: string): string {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const meridiem = hours24 < 12 ? "AM" : "PM";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${hours12}:${pad(date.getMinutes())} ${meridiem}`;
}
