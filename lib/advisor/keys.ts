/**
 * ROLE OF THIS FILE
 * Server-only access to each admin's Anthropic API key
 * (design: docs/advisor/BLUEPRINT-agent-advisor.md, schema: migration 0013).
 *
 * The key itself lives in Supabase Vault; public.admin_advisor_keys holds only
 * a uuid pointing at it. Both the save and the read go through SECURITY
 * DEFINER functions on service credentials, because supabase-js cannot query
 * the `vault` schema.
 *
 * ⚠️ Every function here takes the user id from the *server session*. Never
 * pass one that arrived from the browser: advisor_key_read() will happily
 * decrypt whatever uuid it is given, so the caller is the only thing standing
 * between one admin and another's key.
 *
 * Nothing in this file may be imported into a client component — the service
 * key would leak into the bundle.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * A service-role client, or null when Supabase is not configured (local file
 * adapter). Callers treat null as "no key can be stored here".
 */
function serviceClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env.hosted) {
    return null;
  }
  return createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Save (or overwrite) this admin's Anthropic key.
 *
 * @param userId - The signed-in admin's auth user id, from the server session.
 * @param key - The raw key as typed. Stored in Vault, never in a column.
 * @returns True when it was stored; false when Supabase is not configured.
 */
export async function saveAdvisorKey(
  userId: string,
  key: string,
): Promise<boolean> {
  const client = serviceClient();
  if (!client) {
    return false;
  }
  const { error } = await client.rpc("advisor_key_save", {
    p_user_id: userId,
    p_key: key,
  });
  if (error) {
    throw new Error(`advisor_key_save failed: ${error.message}`);
  }
  return true;
}

/**
 * Read this admin's Anthropic key for a single API call.
 *
 * Deliberately not cached: the value is a live secret, and holding it in a
 * module-level map would keep it in server memory long after the request.
 *
 * @param userId - The signed-in admin's auth user id, from the server session.
 * @returns The key, or null when this admin has not saved one.
 */
export async function readAdvisorKey(userId: string): Promise<string | null> {
  const client = serviceClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client.rpc("advisor_key_read", {
    p_user_id: userId,
  });
  if (error) {
    throw new Error(`advisor_key_read failed: ${error.message}`);
  }
  return typeof data === "string" && data.length > 0 ? data : null;
}

/**
 * Whether this admin has a key saved, without decrypting it.
 *
 * The settings screen only needs to show "saved" or "not saved", so it reads
 * the pointer row rather than the secret — a plaintext key that is never
 * fetched cannot be leaked by the page that displays its status.
 *
 * @param userId - The signed-in admin's auth user id, from the server session.
 * @returns True when a key is stored for this admin.
 */
export async function hasAdvisorKey(userId: string): Promise<boolean> {
  const client = serviceClient();
  if (!client) {
    return false;
  }
  const { data, error } = await client
    .from("admin_advisor_keys")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    // Migration 0013 not pushed to this environment yet: "no table" and "no
    // key" mean the same thing to the settings screen, and 500-ing the whole
    // page over it would take Settings down for every other section too.
    // Anything else is a real fault and must surface.
    if (isMissingTable(error.code)) {
      return false;
    }
    throw new Error(`admin_advisor_keys read failed: ${error.message}`);
  }
  return Boolean(data);
}

/**
 * Whether a Supabase error means the table simply is not there yet.
 *
 * @param code - The error code returned by PostgREST.
 * @returns True for Postgres `undefined_table` and PostgREST's schema-cache miss.
 */
function isMissingTable(code: string | undefined): boolean {
  return code === "42P01" || code === "PGRST205";
}
