/**
 * ROLE OF THIS FILE
 * The field rules behind /account/personal-info — what a name, a language and
 * an email address are allowed to be — plus the shapes the screen and the
 * server action pass between them.
 *
 * Split from `lib/account/profile.ts` because that module is `server-only`:
 * these values are needed in the browser (the form renders the language list
 * and the types describe its props), and pure enough to unit test without a
 * Next request context (`tests/unit/profile-fields.test.ts`). Persistence
 * lives next door; this file knows nothing about Supabase.
 */

/**
 * Selectable account languages, in the order the form lists them.
 *
 * Deliberately the two languages the business actually operates in (the admin
 * is bilingual EN / 中文), not every language we could name. The storefront
 * itself is English-only until V2 translations, so a choice here records the
 * customer's preference for the day we can honour it — it does not switch the
 * UI today.
 */
export const PROFILE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文（简体）" },
] as const;

export type ProfileLanguage = (typeof PROFILE_LANGUAGES)[number]["code"];

/** What an account falls back to when it has never chosen a language. */
export const DEFAULT_PROFILE_LANGUAGE: ProfileLanguage = "en";

/** Longest name stored per field: long enough for real names, short enough
 * that a pasted essay cannot become somebody's display name. */
export const MAX_NAME_LENGTH = 60;

/**
 * Deliberately loose, and the same test the sign-in screen applies: something,
 * an @, something, a dot, something. Full RFC 5322 is a monster of a regex
 * that still cannot tell you whether an address exists, and the strict ones
 * reject valid addresses. This catches the honest typo; Supabase's own send
 * failure catches the rest.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PersonalInfo = {
  firstName: string;
  lastName: string;
  /** The address the account signs in with today. */
  email: string;
  /** An address that has been requested but not yet confirmed, else null. */
  pendingEmail: string | null;
  language: ProfileLanguage;
};

/** One save's worth of form values, exactly as the browser sent them. Every
 * field is re-read defensively — a server action's input is client input. */
export type PersonalInfoInput = {
  firstName: string;
  lastName: string;
  language: string;
  email: string;
};

export type PersonalInfoField = "firstName" | "lastName" | "email" | "language";

/**
 * The result of one save attempt. `info` is always the account as it stands
 * afterwards, so the form can re-sync from server truth whether the save
 * succeeded, partly succeeded, or failed outright — a name that saved before
 * an email change was rejected must not be silently rolled back on screen.
 */
export type SaveOutcome = {
  info: PersonalInfo;
  /** True when the name or language was actually written on this attempt. */
  savedProfile: boolean;
  /** Set when the new address is live already (no confirmation was needed). */
  emailChangedTo: string | null;
  /** Set when a confirmation round trip is now in flight. */
  emailPendingTo: string | null;
  /** Set when part or all of the save failed; whatever did apply still did. */
  error: { message: string; field?: PersonalInfoField } | null;
};

/**
 * Type guard: true only for a code in {@link PROFILE_LANGUAGES}. Used on both
 * sides — the form to render a stored value, the server action to reject a
 * language the client made up.
 *
 * @param value - Any string, typically off stored metadata or form input.
 * @returns Whether the value is a selectable account language.
 */
export function isProfileLanguage(value: string): value is ProfileLanguage {
  return PROFILE_LANGUAGES.some((language) => language.code === value);
}

/**
 * Whether an address is shaped like an email address. Shape only — an address
 * can pass this and still not exist.
 *
 * @param value - The address as typed.
 * @returns Whether it is worth trying to send to.
 */
export function isEmailShaped(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Read an unknown (stored metadata, client input) value as a string.
 *
 * @param value - Anything at all.
 * @returns The value when it is a string, otherwise "".
 */
export function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Normalise a name field: strip control characters, collapse runs of
 * whitespace to single spaces, trim, and cap the length. Applied on read as
 * well as on write, so a value stored by some other route still compares
 * equal to the same value typed into the form — which is what stops a save
 * that changed nothing from looking like one that did.
 *
 * Punctuation is left alone: "Mary-Jane" and "O'Neill" are names.
 *
 * @param raw - The name as typed or as stored.
 * @returns The cleaned name, possibly empty.
 */
export function cleanName(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

/**
 * Split a single full name into first and last. Google and Apple send
 * `full_name` / `name` and never the two halves, so this is what an OAuth
 * account shows before it has ever been edited here. Everything after the
 * first space is the last name — "Ana Maria Silva" keeps "Maria Silva"
 * together rather than dropping a middle name on the floor.
 *
 * @param full - A full name, already cleaned or not.
 * @returns The two halves, either of which may be empty.
 */
export function splitFullName(full: string): {
  firstName: string;
  lastName: string;
} {
  const cleaned = cleanName(full);
  if (!cleaned) {
    return { firstName: "", lastName: "" };
  }
  const [head, ...rest] = cleaned.split(" ");
  return { firstName: head, lastName: rest.join(" ") };
}
