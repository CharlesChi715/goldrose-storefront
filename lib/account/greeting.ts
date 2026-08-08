/**
 * ROLE OF THIS FILE
 * The short, one-word name a greeting can put after "Hello,".
 *
 * `lib/account/data.ts#displayNameOf` already answers "what do we call this
 * person" for the /account dashboard, but it is a server module (it reaches
 * for the store) and it deliberately falls back to the WHOLE email address —
 * the owner's 2026-08-02 rule, which works in the dashboard's full-width
 * heading. The homepage welcome card (Figma 2974:359) is a 187px gold card
 * with the name set in 20px Playfair, where an address cannot fit, so this
 * module answers the narrower question: give me ONE name-shaped word.
 *
 * It takes loose values rather than Supabase's `User` so a client component
 * can call it without pulling a server module in.
 */

/**
 * Trim a metadata value to a usable string, or "" when it isn't one.
 *
 * @param value - Raw `user_metadata` entry, of unknown type.
 * @returns The trimmed string, or "" when the value is not a non-empty string.
 */
function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The single word to greet this customer by: their saved first name, else the
 * first word of any full name a provider supplied, else the account part of
 * their email address, else "there" ("Hello, there" reads as a greeting even
 * with nothing to go on).
 *
 * The email FALLBACK is the local part only, unlike the dashboard's rule —
 * see the file header for why the design's box forces that. Callers should
 * still clip the result, since a saved first name has no length limit.
 *
 * @param metadata - The auth user's `user_metadata`, or null/undefined.
 * @param email - The auth user's email address, if any.
 * @returns A trimmed, never-empty single-word greeting name.
 */
export function greetingName(
  metadata: Record<string, unknown> | null | undefined,
  email: string | null | undefined,
): string {
  const meta = metadata ?? {};

  const firstName = asText(meta.first_name);
  if (firstName) {
    return firstName;
  }

  for (const key of ["full_name", "name", "nickname"]) {
    const full = asText(meta[key]);
    if (full) {
      // Split on any whitespace: "Mei  Ling" and "Mei\tLing" both give "Mei".
      return full.split(/\s+/)[0]!;
    }
  }

  const local = asText(email).split("@")[0]!;
  return local || "there";
}
