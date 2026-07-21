/**
 * ROLE OF THIS FILE
 * Reads the Supabase env vars and decides which backend runs: hosted
 * Supabase when the project vars are set, the local file adapter otherwise
 * (§0.2 fallback — no Docker on this machine). Keeping env access here means
 * the rest of the data layer never touches process.env directly.
 */

export type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceKey: string;
  /** True when hosted Supabase is fully configured for server-side use. */
  hosted: boolean;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return {
    url,
    anonKey,
    serviceKey,
    hosted: Boolean(url && serviceKey),
  };
}
