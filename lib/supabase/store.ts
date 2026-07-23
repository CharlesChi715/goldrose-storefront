/**
 * ROLE OF THIS FILE
 * Backend selection: hand out the one TableStore for this process — hosted
 * Supabase when its env vars are set (OQ-4 activation), the local file
 * adapter otherwise (§0.2 fallback). Cached on globalThis so dev-server hot
 * reloads reuse the same instance (and the local write queue).
 */

import { getSupabaseEnv } from "./env.ts";
import { createLocalStore } from "./local.ts";
import { createRemoteStore } from "./remote.ts";
import type { TableStore } from "./types.ts";

const GLOBAL_KEY = "__goldrose_table_store__";

/**
 * Hand out the one TableStore for this process: hosted Supabase when its env
 * vars are set, the local file adapter otherwise. First call creates the
 * store and caches it on globalThis; later calls (and dev hot reloads) reuse
 * the same instance, keeping the local adapter's write queue intact.
 *
 * @returns The process-wide TableStore singleton.
 */
export function getStore(): TableStore {
  const holder = globalThis as Record<string, unknown>;
  if (!holder[GLOBAL_KEY]) {
    holder[GLOBAL_KEY] = getSupabaseEnv().hosted
      ? createRemoteStore()
      : createLocalStore();
  }
  return holder[GLOBAL_KEY] as TableStore;
}
