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

  async all<T extends TableName>(table: T): Promise<DbTables[T][]> {
    const { data, error } = await this.client.from(table).select("*");
    if (error) {
      throw new Error(`supabase select ${table}: ${error.message}`);
    }
    return (data ?? []) as DbTables[T][];
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

export function createRemoteStore(): RemoteStore {
  return new RemoteStore();
}
