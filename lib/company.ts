/**
 * ROLE OF THIS FILE
 * The company's legal identity, derived from the `store` setting: who the
 * seller of record is, where it is registered, and how to reach it.
 *
 * Two callers need the same lines formatted the same way — the public
 * /policies/contact-legal notice and the postal address that US CAN-SPAM
 * requires in every commercial email — so the shaping lives here, pure and
 * testable, while each caller keeps its own presentation.
 *
 * The values are owner data, not code: they are blank until the bosses
 * supply the registered entity, and every helper here degrades to "nothing
 * to show" rather than printing an empty label.
 */

import type { SettingsShape } from "./supabase/seed-data.ts";

/** The legal-identity half of the `store` setting. */
export type CompanyIdentity = SettingsShape["store"];

/** Drop blank/whitespace-only entries and trim what survives. */
function clean(values: readonly string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/**
 * The postal block: registered legal name followed by its address lines,
 * with blanks removed. This is the CAN-SPAM "valid physical postal address"
 * and the address shown on the legal notice.
 *
 * @param store - The `store` setting, whole or partial.
 * @returns One string per line, or an empty array when nothing is set.
 */
export function companyPostalLines(store: Partial<CompanyIdentity>): string[] {
  return clean([store.legal_name ?? "", ...(store.address_lines ?? [])]);
}

/**
 * Whether a registered entity name exists. This alone is enough to PUBLISH —
 * the name is what a platform reviewer matches against a business
 * application, and withholding it until an address arrives is what got the
 * TikTok application rejected on 2026-08-06.
 *
 * @param store - The `store` setting, whole or partial.
 * @returns True when there is an entity name to show.
 */
export function hasCompanyName(store: Partial<CompanyIdentity>): boolean {
  return (store.legal_name ?? "").trim().length > 0;
}

/**
 * Whether a mailable postal identity exists: a registered name AND at least
 * one address line. Stricter than hasCompanyName on purpose — CAN-SPAM wants
 * a physical ADDRESS in commercial email, which a bare company name does not
 * satisfy, so an email footer must not claim one it doesn't have.
 *
 * @param store - The `store` setting, whole or partial.
 * @returns True when the postal block can be printed.
 */
export function hasPostalIdentity(store: Partial<CompanyIdentity>): boolean {
  return hasCompanyName(store) && clean(store.address_lines ?? []).length > 0;
}

/**
 * The one-block company footer appended to buyer-facing emails: brand name,
 * postal lines, then the contact email. Returns an empty string when the
 * identity is unset, so emails never carry a stub footer.
 *
 * @param store - The `store` setting, whole or partial.
 * @returns The plain-text block, or "" when there is nothing to say.
 */
export function companyEmailFooter(store: Partial<CompanyIdentity>): string {
  if (!hasPostalIdentity(store)) {
    return "";
  }
  const contact = (store.contact_email ?? "").trim();
  return clean([store.name ?? "", ...companyPostalLines(store), contact]).join(
    "\n",
  );
}
