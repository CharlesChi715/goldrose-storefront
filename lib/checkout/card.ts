/**
 * ROLE OF THIS FILE
 * Format-only card validation for the mock (development) checkout: brand
 * detection, the Luhn checksum, and expiry checks. It can say "this LOOKS
 * like a card number", never "this card can pay". In live mode cards are
 * handled entirely by Shopify's hosted checkout and never touch this code.
 */

import type { CardInput } from "@/lib/checkout/types";

export type CardBrand = "Visa" | "Mastercard" | "American Express" | "Discover" | "Card";

export type CardValidation = {
  valid: boolean;
  brand: CardBrand;
  last4: string;
  fieldErrors: Record<string, string>;
};

/**
 * Detect the card brand from a digits-only number via prefix/length patterns
 * (e.g. "4242424242424242" → "Visa"), falling back to the generic "Card".
 *
 * Card validation is FORMAT-ONLY and exists purely to make the mock checkout
 * feel real and to fail fast on obvious typos. It never proves a card can be
 * charged — that is the payment provider's job. The PAN is reduced to a brand
 * and last-four for the receipt and then discarded by the caller; it is never
 * stored. Test numbers like 4242 4242 4242 4242 pass.
 *
 * @param digits - Card number with all non-digits already stripped.
 * @returns The matched brand, or "Card" when no pattern matches.
 */
export function detectBrand(digits: string): CardBrand {
  if (/^4\d{12}(\d{3})?$/.test(digits)) {
    return "Visa";
  }
  if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(digits)) {
    return "Mastercard";
  }
  if (/^3[47]\d{13}$/.test(digits)) {
    return "American Express";
  }
  if (/^(6011\d{12}|65\d{14}|64[4-9]\d{13})$/.test(digits)) {
    return "Discover";
  }
  return "Card";
}

/**
 * The Luhn checksum every real card number satisfies: walking right-to-left,
 * double every second digit (subtracting 9 if that passes 9) and the grand
 * total must end in 0. It catches typos, not fake cards.
 *
 * @param digits - Digits-only card number.
 * @returns True when non-empty and the checksum holds.
 */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) {
        value -= 9;
      }
    }
    sum += value;
    double = !double;
  }
  return digits.length > 0 && sum % 10 === 0;
}

/**
 * Parse "MM/YY" or "MM/YYYY" and check the date is this month or later
 * (within 20 years).
 *
 * @param expiry - Raw expiry text as typed in the form.
 */
function expiryInFuture(expiry: string): boolean {
  const match = expiry.trim().match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/);
  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  if (month < 1 || month > 12) {
    return false;
  }

  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || year > currentYear + 20) {
    return false;
  }
  if (year === currentYear && month < currentMonth) {
    return false;
  }
  return true;
}

/**
 * Run all the format checks on a card form and collect per-field error
 * messages. Returns the detected brand and last four digits so a receipt can
 * say "Visa ····4242" without ever keeping the full number.
 *
 * @param card - The raw card form fields (number, expiry, cvc, name).
 * @returns Overall validity, brand, last four digits, and per-field errors
 *   keyed by form field name (cardName, cardNumber, cardExpiry, cardCvc).
 */
export function validateCard(card: CardInput): CardValidation {
  const fieldErrors: Record<string, string> = {};
  const digits = card.number.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const cvcDigits = card.cvc.replace(/\D/g, "");
  const expectedCvcLength = brand === "American Express" ? 4 : 3;

  if (!card.name.trim()) {
    fieldErrors.cardName = "Enter the name on the card.";
  }
  if (digits.length < 13 || digits.length > 19 || !passesLuhn(digits)) {
    fieldErrors.cardNumber = "Enter a valid card number.";
  }
  if (!expiryInFuture(card.expiry)) {
    fieldErrors.cardExpiry = "Enter a valid future expiry date (MM/YY).";
  }
  if (cvcDigits.length !== expectedCvcLength) {
    fieldErrors.cardCvc = `Enter the ${expectedCvcLength}-digit security code.`;
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    brand,
    last4: digits.slice(-4),
    fieldErrors,
  };
}
