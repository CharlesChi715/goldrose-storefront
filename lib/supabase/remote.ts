/**
 * ROLE OF THIS FILE
 * The hosted-Supabase backend: the same TableStore interface as the local
 * file adapter, implemented with @supabase/supabase-js and the SERVICE-ROLE
 * key. Server-side only — app code must reach this through lib/supabase/
 * server.ts (a `server-only` module), never from anything client-shipped.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env.ts";
import type {
  DbTables,
  InventoryReason,
  Match,
  TableName,
  TableStore,
} from "./types.ts";

/** Stable pagination key per table — "id" everywhere it exists. */
const PAGE_ORDER: Partial<Record<TableName, string>> = {
  settings: "key",
  site_content: "key",
  admin_users: "user_id",
};

class RemoteStore implements TableStore {
  backend = "supabase" as const;

  private client: SupabaseClient;

  constructor() {
    const env = getSupabaseEnv();
    if (!env.hosted) {
      throw new Error("Supabase env vars are not configured.");
    }
    this.client = createClient(env.url, env.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * PostgREST silently truncates a bare select at its max-rows cap (1000 by
   * default) — `all()` must mean ALL, so page through with range() until a
   * short page arrives.
   */
  async all<T extends TableName>(table: T): Promise<DbTables[T][]> {
    const pageSize = 1000;
    const rows: DbTables[T][] = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await this.client
        .from(table)
        .select("*")
        .order(PAGE_ORDER[table] ?? "id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) {
        throw new Error(`supabase select ${table}: ${error.message}`);
      }
      const page = (data ?? []) as DbTables[T][];
      rows.push(...page);
      if (page.length < pageSize) {
        return rows;
      }
    }
  }

  async where<T extends TableName>(table: T, match: Match<T>): Promise<DbTables[T][]> {
    const pageSize = 1000;
    const rows: DbTables[T][] = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await this.client
        .from(table)
        .select("*")
        .match(match as Record<string, unknown>)
        .order(PAGE_ORDER[table] ?? "id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) {
        throw new Error(`supabase select ${table}: ${error.message}`);
      }
      const page = (data ?? []) as DbTables[T][];
      rows.push(...page);
      if (page.length < pageSize) {
        return rows;
      }
    }
  }

  async insert<T extends TableName>(table: T, rows: DbTables[T][]): Promise<void> {
    const { error } = await this.client.from(table).insert(rows);
    if (error) {
      throw new Error(`supabase insert ${table}: ${error.message}`);
    }
  }

  async update<T extends TableName>(
    table: T,
    match: Match<T>,
    patch: Partial<DbTables[T]>,
  ): Promise<number> {
    const { data, error } = await this.client
      .from(table)
      .update(patch as never)
      .match(match as Record<string, unknown>)
      .select("*");
    if (error) {
      throw new Error(`supabase update ${table}: ${error.message}`);
    }
    return data?.length ?? 0;
  }

  async remove<T extends TableName>(table: T, match: Match<T>): Promise<number> {
    const { data, error } = await this.client
      .from(table)
      .delete()
      .match(match as Record<string, unknown>)
      .select("*");
    if (error) {
      throw new Error(`supabase delete ${table}: ${error.message}`);
    }
    return data?.length ?? 0;
  }

  async adjustInventory(input: {
    variantId: string;
    delta: number;
    reason: InventoryReason;
    note?: string | null;
    createdBy?: string | null;
  }): Promise<void> {
    const { error } = await this.client.rpc("adjust_inventory", {
      p_variant_id: input.variantId,
      p_delta: input.delta,
      p_reason: input.reason,
      p_note: input.note ?? null,
      p_created_by: input.createdBy ?? null,
    });
    if (error) {
      throw new Error(`supabase adjust_inventory: ${error.message}`);
    }
  }

  async nextOrderNumber(): Promise<number> {
    const { data, error } = await this.client.rpc("next_order_number");
    if (error) {
      throw new Error(`supabase next_order_number: ${error.message}`);
    }
    return data as number;
  }
}

/**
 * Create the hosted-Supabase TableStore using the service-role key. Throws
 * when the Supabase env vars are not configured — lib/supabase/store.ts only
 * calls this in hosted mode, and caches the instance per process.
 */
export function createRemoteStore(): RemoteStore {
  return new RemoteStore();
}
