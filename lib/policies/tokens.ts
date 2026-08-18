/**
 * ROLE OF THIS FILE
 * Resolving the fill-in-the-blank tokens the policy frames left behind.
 *
 * The design team wrote the six policy documents with editorial placeholders
 * still in them — `[SUPPORT EMAIL]`, `[LEGAL ENTITY NAME]`, `[STATE]` and
 * five more, sixteen occurrences in all. The import normalises those to
 * `{token}` markers (see documents.ts) and this module answers them from the
 * `store` setting, so the owner changes the support address in
 * /admin/settings rather than by a deploy.
 *
 * The rule when there is no answer: show that there is no answer. A token the
 * business has not settled — the governing-law state, a phone number, the
 * registered postal address — is reported unresolved so the page can draw a
 * visible "to be confirmed" mark, never an invented fact and never a raw
 * `[BRACKET]` leaking design scaffolding onto a live page. That follows
 * docs/ixd's standing instruction to leave a placeholder where a thing is
 * unsure, and it is why the routes stay noindex until the bosses sign the
 * copy off (AI-046).
 *
 * Deliberately free of JSX so `npm run test:unit` can exercise it directly;
 * PolicyDocumentScreen turns these parts into elements.
 */

import type { SettingsShape } from "@/lib/supabase/seed-data";

/** The site's public host, as it is written in prose. */
const WEBSITE = "eldreve.com";

/** The tokens that name an e-mail address, so a page can link them. */
export const EMAIL_TOKENS: ReadonlySet<string> = new Set([
  "supportEmail",
  "privacyEmail",
  "legalNoticeEmail",
]);

/**
 * What each token resolves to, or "" when the business has not answered it.
 *
 * The three e-mail tokens deliberately stay separate even though all three
 * currently answer with the same address: the frames distinguish support,
 * privacy and legal-notice channels, and splitting them later should be a
 * settings change, not a re-import.
 *
 * @param store - The `store` setting.
 * @returns A plain-string answer per token; "" means unanswered.
 */
export function policyTokenAnswers(
  store: SettingsShape["store"],
): Record<string, string> {
  const contact = (store.contact_email ?? "").trim();
  return {
    legalName: (store.legal_name ?? "").trim(),
    postalAddress: (store.address_lines ?? [])
      .map((line) => line.trim())
      .filter(Boolean)
      .join(", "),
    websiteUrl: WEBSITE,
    supportEmail: contact,
    privacyEmail: contact,
    legalNoticeEmail: contact,
    // No phone number exists in the store setting, and inventing one on a
    // policy page would be a claim the business cannot honour.
    phone: "",
    // The governing-law state is a legal decision for the bosses (AI-046).
    governingState: "",
  };
}

/** One piece of a policy string: literal copy, or a token to resolve. */
export type PolicyPart =
  | { kind: "text"; text: string }
  | { kind: "token"; token: string; value: string; email: boolean };

/**
 * Split a policy string on its `{token}` markers and answer each one.
 *
 * An unknown token — documents.ts and the answer table disagreeing — comes
 * back with an empty value, so it draws the same "to be confirmed" mark
 * rather than printing `{somethingNew}` to a customer.
 *
 * @param text - Copy from lib/policies/documents.ts, possibly with tokens.
 * @param store - The `store` setting supplying the answers.
 * @returns The copy in order, as literal and token parts.
 */
export function splitPolicyText(
  text: string,
  store: SettingsShape["store"],
): PolicyPart[] {
  const table = policyTokenAnswers(store);
  // Capturing split: odd indices are the token names.
  return text.split(/\{(\w+)\}/g).map((piece, index) => {
    if (index % 2 === 0) {
      return { kind: "text", text: piece } as const;
    }
    return {
      kind: "token",
      token: piece,
      value: table[piece] ?? "",
      email: EMAIL_TOKENS.has(piece),
    } as const;
  });
}

/**
 * Which tokens the current settings cannot answer — the list the hand-off
 * and the owner's sign-off work from.
 *
 * @param store - The `store` setting.
 * @returns Token names with no value behind them, in declaration order.
 */
export function unresolvedPolicyTokens(
  store: SettingsShape["store"],
): string[] {
  const table = policyTokenAnswers(store);
  return Object.keys(table).filter((token) => !table[token]);
}
