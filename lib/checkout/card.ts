import type { CardInput } from "@/lib/checkout/types";

export type CardBrand = "Visa" | "Mastercard" | "American Express" | "Discover" | "Card";

export type CardValidation = {
  valid: boolean;
  brand: CardBrand;
  last4: string;
  fieldErrors: Record<string, string>;
};

/**
 * Card validation is FORMAT-ONLY and exists purely to make the mock checkout
 * feel real and to fail fast on obvious typos. It never proves a card can be
 * charged — that is the payment provider's job. The PAN is reduced to a brand
 * and last-four for the receipt and then discarded by the caller; it is never
 * stored. Test numbers like 4242 4242 4242 4242 pass.
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
