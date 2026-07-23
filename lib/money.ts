/**
 * ROLE OF THIS FILE
 * Money display: cents → "$49.99". Whole-integer cents everywhere avoids
 * floating-point rounding bugs; this is the one place they become strings.
 */

/**
 * Format integer cents as a USD string, e.g. 4999 → "$49.99".
 *
 * @param cents - Amount in whole integer cents (the repo-wide money unit).
 * @returns The en-US currency string with exactly two decimals.
 */
export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
