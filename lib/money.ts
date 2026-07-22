/**
 * ROLE OF THIS FILE
 * Money display: cents → "$49.99". Whole-integer cents everywhere avoids
 * floating-point rounding bugs; this is the one place they become strings.
 */

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
