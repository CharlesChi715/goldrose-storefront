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

/**
 * Read and trim the Supabase env vars. `hosted` is true only when both the
 * project URL and the service-role key are set — that flag is what flips the
 * data layer from the local file adapter to hosted Supabase.
 *
 * @returns The trimmed env values plus the derived `hosted` flag.
 */
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
