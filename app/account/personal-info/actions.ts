"use server";

/**
 * ROLE OF THIS FILE
 * The server-action boundary for /account/personal-info. The page reads the
 * profile directly (it is already a Server Component); this exists so the
 * save can be handed to the client form as a prop — a client component may
 * only call a function marked "use server", and `lib/account/profile.ts` is
 * `server-only`, not a server-action module.
 *
 * There is deliberately no id parameter: the action always acts on whoever
 * the request's session cookie says is signed in, so a client cannot name
 * somebody else's account to edit.
 */

import { savePersonalInfo } from "@/lib/account/profile.ts";
import type {
  PersonalInfoInput,
  SaveOutcome,
} from "@/lib/account/profile-fields.ts";

/**
 * Save the signed-in customer's own name, language and email address.
 *
 * @param input - The form values, as the browser sent them.
 * @returns What happened, or null when the session has gone (the form sends
 * the visitor to /account/signup).
 */
export async function savePersonalInfoAction(
  input: PersonalInfoInput,
): Promise<SaveOutcome | null> {
  return savePersonalInfo(input);
}
