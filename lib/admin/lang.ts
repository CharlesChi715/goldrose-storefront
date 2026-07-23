/**
 * ROLE OF THIS FILE
 * Server-side language helper: read the admin_lang cookie (§9.12 —
 * cookie, not localStorage, so server-rendered pages come out in the right
 * language with no flash). The cookie is set by the language toggle server
 * action in app/admin/actions.ts.
 */

import "server-only";
import { cookies } from "next/headers";
import { ADMIN_LANG_COOKIE, isAdminLang, type AdminLang } from "./i18n";

/** The admin UI language from the admin_lang cookie; missing or invalid values default to "en". */
export async function getAdminLang(): Promise<AdminLang> {
  const store = await cookies();
  const value = store.get(ADMIN_LANG_COOKIE)?.value;
  return isAdminLang(value) ? value : "en";
}
