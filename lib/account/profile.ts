/**
 * ROLE OF THIS FILE
 * The server half of /account/personal-info: read the signed-in customer's
 * own profile, and save changes to it. Until 2026-08-06 that screen was a
 * visual placeholder showing "Olivia Carter"; this is the backend it was
 * waiting for. The field rules it validates against live next door in
 * `lib/account/profile-fields.ts`, which is importable from the browser.
 *
 * WHERE THE PROFILE LIVES. The auth user's `user_metadata` is the source of
 * truth — it belongs to the person, it travels with the session, and it is
 * writable with their own access token (no service-role key, no new table, no
 * migration). `full_name` is written alongside `first_name`/`last_name`
 * because `lib/account/data.ts#displayNameOf` reads it, so saving a name here
 * is what changes the /account dashboard greeting.
 *
 * SECURITY: the name is *mirrored* onto the customers row already linked by
 * `auth_user_id`, and only that row. It never claims a row by email address.
 * `mailer_autoconfirm` is on for this project (verified 2026-08-06), so a
 * confirmed-looking address proves nothing on its own — the same reason
 * `lib/account/data.ts` refuses to link by email outside Google / Apple. When
 * no linked row exists there is simply nothing to mirror, which is the normal
 * case for accounts created by the emailed-code sign-in.
 *
 * EMAIL CHANGES go through Supabase, never through us: `updateUser({ email })`
 * mails the confirmation and swaps the address only once it is confirmed. The
 * project has `mailer_secure_email_change_enabled` on (verified 2026-08-06),
 * so both the old and the new address must confirm. Rather than hard-code
 * that, `savePersonalInfo` reports what actually came back — already-applied
 * (`emailChangedTo`) or awaiting confirmation (`emailPendingTo`) — so the
 * message stays true if the project setting ever changes.
 */

import "server-only";
import { randomUUID } from "crypto";
import type { User } from "@supabase/supabase-js";
import {
  asText,
  cleanName,
  DEFAULT_PROFILE_LANGUAGE,
  isEmailShaped,
  isProfileLanguage,
  splitFullName,
  type PersonalInfo,
  type PersonalInfoField,
  type PersonalInfoInput,
  type SaveOutcome,
} from "@/lib/account/profile-fields.ts";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { supabaseServerAuthClient } from "@/lib/supabase/server-auth.ts";

/** Supabase's wording for "that address belongs to someone else" varies by
 * version, so match the idea rather than one exact sentence. */
const ADDRESS_TAKEN_RE = /already|registered|exists|in use/i;

/** The cookie-bound client's own type, so this file never has to restate the
 * generics `supabaseServerAuthClient` already resolves. */
type AuthClient = Awaited<ReturnType<typeof supabaseServerAuthClient>>;

/**
 * The account's first and last name. Prefers the fields this module writes;
 * falls back to splitting a provider-supplied full name, so an OAuth account
 * shows a sensible first/last before it has ever been edited here.
 *
 * @param user - The signed-in Supabase auth user.
 * @returns The two name halves, either of which may be empty.
 */
function namesOf(user: User): { firstName: string; lastName: string } {
  const meta = user.user_metadata ?? {};
  const firstName = cleanName(asText(meta.first_name));
  const lastName = cleanName(asText(meta.last_name));
  if (firstName || lastName) {
    return { firstName, lastName };
  }
  return splitFullName(
    asText(meta.full_name) || asText(meta.name) || asText(meta.nickname),
  );
}

/**
 * Project an auth user onto the profile the form renders.
 *
 * @param user - The signed-in Supabase auth user.
 * @returns The profile view of that user.
 */
function infoOf(user: User): PersonalInfo {
  const language = asText(user.user_metadata?.preferred_language).trim();
  // Supabase parks a requested-but-unconfirmed address on `new_email`; it
  // clears itself once the change completes or the request expires.
  const pending = asText(user.new_email).trim();
  return {
    ...namesOf(user),
    email: (user.email ?? "").trim(),
    pendingEmail: pending || null,
    language: isProfileLanguage(language) ? language : DEFAULT_PROFILE_LANGUAGE,
  };
}

/**
 * The signed-in user and the client that can act as them, or null when there
 * is nobody to act as — signed out, or the local file mode, which has no auth
 * server at all. Callers treat null as "send them to /account/signup".
 *
 * @returns The session pair, or null.
 */
async function signedInUser(): Promise<{
  supabase: AuthClient;
  user: User;
} | null> {
  if (!getSupabaseEnv().hosted) {
    return null;
  }
  const supabase = await supabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

/**
 * Copy a saved name onto the customers row already linked to this auth user,
 * so the admin's Customers list stops showing the checkout-time name after
 * somebody corrects it. Deliberately forgiving: the profile itself is saved
 * in auth metadata by the time this runs, so a mirror failure is logged and
 * swallowed rather than shown to a customer who did nothing wrong.
 *
 * @param userId - The signed-in auth user's id; the only row it can match.
 * @param firstName - The saved first name.
 * @param lastName - The saved last name.
 */
async function mirrorNameToCustomer(
  userId: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  try {
    const store = getStore();
    const [customer] = await store.where("customers", {
      auth_user_id: userId,
    });
    if (
      !customer ||
      (customer.first_name === firstName && customer.last_name === lastName)
    ) {
      return;
    }
    await store.update(
      "customers",
      { id: customer.id },
      { first_name: firstName, last_name: lastName },
    );
    await store.insert("customer_events", [
      {
        id: randomUUID(),
        customer_id: customer.id,
        kind: "system",
        message: "Updated their name from the storefront account",
        created_by: null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error("[account/profile] customers mirror failed", error);
  }
}

/**
 * The signed-in customer's own profile, for /account/personal-info.
 *
 * @returns The profile, or null when signed out or running the local file
 * adapter (which has no customer auth).
 */
export async function getPersonalInfo(): Promise<PersonalInfo | null> {
  const session = await signedInUser();
  return session ? infoOf(session.user) : null;
}

/**
 * Save the signed-in customer's own profile. Writes name and language to the
 * auth user's metadata, mirrors the name onto their linked customers row, and
 * — only when the address actually differs — asks Supabase to start an email
 * change. Nothing is written when nothing changed.
 *
 * The two writes are separate calls on purpose: an address Supabase rejects
 * (already taken, rate limited) must not also throw away a perfectly good
 * name change made in the same tap.
 *
 * @param input - The form values, as the browser sent them.
 * @returns What happened, or null when there is no session to save against.
 */
export async function savePersonalInfo(
  input: PersonalInfoInput,
): Promise<SaveOutcome | null> {
  const session = await signedInUser();
  if (!session) {
    return null;
  }
  const { supabase } = session;
  const before = infoOf(session.user);

  const firstName = cleanName(asText(input.firstName));
  const lastName = cleanName(asText(input.lastName));
  const language = asText(input.language).trim();
  const nextEmail = asText(input.email).trim();

  const rejected = (
    message: string,
    field?: PersonalInfoField,
  ): SaveOutcome => ({
    info: before,
    savedProfile: false,
    emailChangedTo: null,
    emailPendingTo: null,
    error: { message, field },
  });

  if (!isProfileLanguage(language)) {
    return rejected("Choose one of the listed languages.", "language");
  }

  // Case-insensitive: addresses are, and re-typing "Olivia@…" for "olivia@…"
  // must not send a confirmation email for a change that is not one.
  const emailChanged = nextEmail.toLowerCase() !== before.email.toLowerCase();
  if (emailChanged && !nextEmail) {
    return rejected(
      "Your account needs an email address — it is how you sign in.",
      "email",
    );
  }
  if (emailChanged && !isEmailShaped(nextEmail)) {
    return rejected(
      "Enter a valid email address, like name@example.com.",
      "email",
    );
  }

  const profileChanged =
    firstName !== before.firstName ||
    lastName !== before.lastName ||
    language !== before.language;

  let user = session.user;
  let savedProfile = false;

  if (profileChanged) {
    // `data` merges into user_metadata rather than replacing it, so provider
    // keys (avatar_url, name) survive untouched. full_name is written too —
    // it is what the dashboard greeting reads.
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: [firstName, lastName].filter(Boolean).join(" "),
        preferred_language: language,
      },
    });
    if (error || !data.user) {
      return rejected("We couldn't save those details. Try again in a moment.");
    }
    user = data.user;
    savedProfile = true;
    await mirrorNameToCustomer(user.id, firstName, lastName);
  }

  if (!emailChanged) {
    return {
      info: infoOf(user),
      savedProfile,
      emailChangedTo: null,
      emailPendingTo: null,
      error: null,
    };
  }

  const { data, error } = await supabase.auth.updateUser({ email: nextEmail });
  if (error || !data.user) {
    return {
      info: infoOf(user),
      savedProfile,
      emailChangedTo: null,
      emailPendingTo: null,
      error: {
        field: "email",
        message: ADDRESS_TAKEN_RE.test(error?.message ?? "")
          ? "That address is already used by another account."
          : "We couldn't start the email change. Check the address, or try again in a minute.",
      },
    };
  }

  // Which of the two outcomes happened is Supabase's decision, not ours, so
  // read it back rather than assuming (see the file header).
  const after = infoOf(data.user);
  const applied = after.email.toLowerCase() === nextEmail.toLowerCase();
  return {
    info: after,
    savedProfile,
    emailChangedTo: applied ? after.email : null,
    emailPendingTo: applied ? null : (after.pendingEmail ?? nextEmail),
    error: null,
  };
}
