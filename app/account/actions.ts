"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for the customer /account page (owner request 2026-07-23).
 * The page itself is a client component (OAuth + WebAuthn run in the
 * browser); this is how it reads the server-side view of the account after
 * the Supabase session cookie exists.
 */

import { getAccountOverview, type AccountOverview } from "@/lib/account/data.ts";

export async function accountOverviewAction(): Promise<AccountOverview | null> {
  return getAccountOverview();
}
