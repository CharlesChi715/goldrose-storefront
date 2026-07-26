/**
 * ROLE OF THIS FILE
 * Customer accounts (owner request 2026-07-23): the server half of the
 * storefront /account page. A signed-in Supabase user is linked to the
 * existing email-keyed customers row (created by checkout, §7.4) — or gets
 * a fresh row on first sign-in — and sees the orders placed with their
 * email. Hosted Supabase only; the local file mode has no customer auth.
 *
 * SECURITY: linking by email is only allowed for identities whose email the
 * provider actually verified (Google / Apple OAuth). Password accounts are
 * auto-confirmed while the admin's confirm-email stays off, so trusting
 * their email would let anyone claim a stranger's order history by signing
 * up with that address.
 */

import "server-only";
import { randomUUID } from "crypto";
import type { User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { supabaseServerAuthClient } from "@/lib/supabase/server-auth.ts";
import type {
  CustomerRow,
  FinancialStatus,
  FulfillmentStatus,
} from "@/lib/supabase/types.ts";

const EMAIL_VERIFIED_PROVIDERS = new Set(["google", "apple"]);

export type AccountOrder = {
  name: string;
  placed_at: string;
  total_cents: number;
  currency: string;
  financial_status: FinancialStatus;
  fulfillment_status: FulfillmentStatus;
  tracking_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  cancelled: boolean;
};

export type AccountOverview = {
  email: string;
  displayName: string;
  orders: AccountOrder[];
};

/**
 * True when at least one of the user's auth providers actually verified
 * their email (Google / Apple OAuth). Password accounts fail this check —
 * see the SECURITY note in the file header.
 *
 * @param user - The signed-in Supabase auth user.
 */
function emailVerifiedByProvider(user: User): boolean {
  const providers: unknown[] = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : [user.app_metadata?.provider];
  return providers.some(
    (p) => typeof p === "string" && EMAIL_VERIFIED_PROVIDERS.has(p),
  );
}

/**
 * Pick a display name from the user's metadata (full_name, name, nickname —
 * first non-empty wins), falling back to the email's local part, then "there".
 *
 * @param user - The signed-in Supabase auth user.
 * @returns A trimmed, never-empty display name.
 */
function displayNameOf(user: User): string {
  const meta = user.user_metadata ?? {};
  for (const key of ["full_name", "name", "nickname"]) {
    if (typeof meta[key] === "string" && meta[key].trim()) {
      return meta[key].trim();
    }
  }
  return (user.email ?? "").split("@")[0] || "there";
}

/**
 * Find (and lazily link) the customers row for this auth user. An already
 * linked row is returned as-is; otherwise, for provider-verified emails
 * only, the existing email-keyed row is claimed (DB write + customer event)
 * or a fresh customer row is created. Unverified emails get null.
 *
 * @param user - The signed-in Supabase auth user.
 * @returns The linked customer row, or null when linking isn't allowed.
 */
async function linkedCustomer(user: User): Promise<CustomerRow | null> {
  const store = getStore();
  const customers = await store.all("customers");
  const existing = customers.find((row) => row.auth_user_id === user.id);
  if (existing) {
    return existing;
  }

  if (!emailVerifiedByProvider(user)) {
    // Unverified email (password accounts, i.e. the admin testing crew) —
    // never claim a checkout customer by email, and don't clutter the
    // admin's Customers list with a new row either.
    return null;
  }

  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) {
    return null;
  }
  const now = new Date().toISOString();

  const byEmail = customers.find((row) => row.email.toLowerCase() === email);
  if (byEmail) {
    await store.update("customers", { id: byEmail.id }, { auth_user_id: user.id });
    await store.insert("customer_events", [
      {
        id: randomUUID(),
        customer_id: byEmail.id,
        kind: "system",
        message: "Created a storefront account",
        created_by: null,
        created_at: now,
      },
    ]);
    return { ...byEmail, auth_user_id: user.id };
  }

  const name = displayNameOf(user);
  const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
  const customer: CustomerRow = {
    id: randomUUID(),
    email,
    first_name: firstName ?? "",
    last_name: rest.join(" "),
    phone: null,
    default_address: null,
    note: "",
    tags: [],
    created_at: now,
    auth_user_id: user.id,
  };
  await store.insert("customers", [customer]);
  await store.insert("customer_events", [
    {
      id: randomUUID(),
      customer_id: customer.id,
      kind: "system",
      message: "Customer created (storefront account sign-up)",
      created_by: null,
      created_at: now,
    },
  ]);
  return customer;
}

/**
 * Build the signed-in customer's account view for the /account page: link
 * the auth user to a customers row, then collect their orders (matched by
 * customer_id, plus by email when the provider verified it), newest first.
 * May write to the DB via the lazy customer linking.
 *
 * @returns The account overview, or null when signed out or not on hosted
 * Supabase (local file mode has no customer auth).
 */
export async function getAccountOverview(): Promise<AccountOverview | null> {
  if (!getSupabaseEnv().hosted) {
    return null;
  }
  const supabase = await supabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const customer = await linkedCustomer(user);
  const email = (user.email ?? "").trim().toLowerCase();
  const canMatchByEmail = Boolean(email) && emailVerifiedByProvider(user);

  const orders = (await getStore().all("orders"))
    .filter(
      (order) =>
        // Placed while signed in as this user (works for every sign-in
        // method — the checkout stamped the session's auth uid on the order).
        order.auth_user_id === user.id ||
        (customer && order.customer_id === customer.id) ||
        (canMatchByEmail && order.email?.toLowerCase() === email),
    )
    .sort((a, b) => b.placed_at.localeCompare(a.placed_at))
    .map((order) => ({
      name: order.name,
      placed_at: order.placed_at,
      total_cents: order.total_cents,
      currency: order.currency,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      tracking_carrier: order.tracking_carrier,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      cancelled: Boolean(order.cancelled_at),
    }));

  return {
    email: user.email ?? "",
    displayName: displayNameOf(user),
    orders,
  };
}
