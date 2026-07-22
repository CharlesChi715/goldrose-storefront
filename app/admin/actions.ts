"use server";

/**
 * ROLE OF THIS FILE
 * Shell-level server actions: the EN/中文 toggle (sets the admin_lang
 * cookie — §9.12 persistence) and log out. Imported by the client-side
 * admin chrome.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_LANG_COOKIE, isAdminLang } from "@/lib/admin/i18n";
import { requireAdmin, signOut } from "@/lib/admin/auth";
import { searchAdmin, type SearchResults } from "@/lib/admin/analytics";

/**
 * No requireAdmin here on purpose (perf fix 2026-07-22): this only writes
 * the caller's own display-language cookie — whitelist-validated, zero
 * security value — and the auth gate cost a Supabase round trip per toggle.
 */
export async function setAdminLangAction(lang: string): Promise<void> {
  if (!isAdminLang(lang)) {
    return;
  }
  (await cookies()).set(ADMIN_LANG_COOKIE, lang, {
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/admin/login");
}

/** ⌘K global search (§9.1): orders by number/email, products by title/SKU,
 * customers by name/email — grouped like Shopify's. */
export async function searchAdminAction(query: string): Promise<SearchResults> {
  await requireAdmin();
  return searchAdmin(z.string().max(120).parse(query));
}
