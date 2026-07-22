/**
 * ROLE OF THIS FILE
 * The local file adapter (§0.2 fallback): the whole database as one JSON
 * file at .data/db.json, implementing the same TableStore interface as the
 * hosted-Supabase backend so every screen and test runs with no external
 * service. First access auto-seeds from lib/supabase/seed-data.ts.
 *
 * Server-side only (uses Node fs). Writes are serialized through a promise
 * queue so concurrent server actions never interleave file writes.
 */

import { promises as fs } from "fs";
import path from "path";
import type {
  DbTables,
  InventoryReason,
  Match,
  TableName,
  TableStore,
} from "./types.ts";
import { buildSeedTables } from "./seed-data.ts";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type DbFile = {
  seeded_at: string;
  /** Shopify-style order number counter; #1001 is the first order. */
  next_order_number: number;
  tables: { [T in TableName]: DbTables[T][] };
};

function matches<T extends TableName>(row: DbTables[T], match: Match<T>): boolean {
  return Object.entries(match).every(
    ([key, value]) => (row as Record<string, unknown>)[key] === value,
  );
}

export function buildFreshDb(now = new Date().toISOString()): DbFile {
  return {
    seeded_at: now,
    next_order_number: 1001,
    tables: buildSeedTables(now),
  };
}

class LocalStore implements TableStore {
  backend = "local" as const;

  private cache: DbFile | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  /** Serialize every read-modify-write so file state never interleaves. */
  private locked<R>(fn: () => Promise<R>): Promise<R> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async load(): Promise<DbFile> {
    if (this.cache) {
      return this.cache;
    }
    try {
      this.cache = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as DbFile;
    } catch {
      // Missing or unreadable → fresh seed (first run in a clean checkout).
      this.cache = buildFreshDb();
      await this.persist(this.cache);
    }
    return this.cache;
  }

  /** True once the filesystem rejected a write (e.g. Vercel's read-only
   * serverless fs) — from then on this store is in-memory only. */
  private ephemeral = false;

  private async persist(db: DbFile): Promise<void> {
    if (this.ephemeral) {
      return;
    }
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
      await fs.rename(tmp, DB_FILE);
    } catch (error) {
      // Read-only fs (serverless without Supabase): keep serving the seeded
      // in-memory copy so the site demos instead of erroring. Data written
      // here does not survive the instance — hosted Supabase is the fix.
      this.ephemeral = true;
      console.warn("[local-db] filesystem not writable — running in-memory:", error);
    }
  }

  /** Reset to a fresh seed (used by scripts/seed.ts and tests). */
  reset(): Promise<void> {
    return this.locked(async () => {
      this.cache = buildFreshDb();
      await this.persist(this.cache);
    });
  }

  all<T extends TableName>(table: T): Promise<DbTables[T][]> {
    return this.locked(async () => {
      const db = await this.load();
      // Clone so callers can't mutate the cache behind the store's back.
      return structuredClone(db.tables[table]);
    });
  }

  insert<T extends TableName>(table: T, rows: DbTables[T][]): Promise<void> {
    return this.locked(async () => {
      const db = await this.load();
      db.tables[table].push(...structuredClone(rows));
      await this.persist(db);
    });
  }

  update<T extends TableName>(
    table: T,
    match: Match<T>,
    patch: Partial<DbTables[T]>,
  ): Promise<number> {
    return this.locked(async () => {
      const db = await this.load();
      const rows = db.tables[table] as DbTables[T][];
      let count = 0;
      const next = rows.map((row) => {
        if (!matches<T>(row, match)) {
          return row;
        }
        count += 1;
        return { ...row, ...structuredClone(patch) };
      });
      (db.tables as Record<string, unknown[]>)[table] = next;
      if (count > 0) {
        await this.persist(db);
      }
      return count;
    });
  }

  remove<T extends TableName>(table: T, match: Match<T>): Promise<number> {
    return this.locked(async () => {
      const db = await this.load();
      const rows = db.tables[table] as DbTables[T][];
      const next = rows.filter((row) => !matches<T>(row, match));
      (db.tables as Record<string, unknown[]>)[table] = next;
      const removed = rows.length - next.length;
      if (removed > 0) {
        await this.persist(db);
      }
      return removed;
    });
  }

  adjustInventory(input: {
    variantId: string;
    delta: number;
    reason: InventoryReason;
    note?: string | null;
    createdBy?: string | null;
  }): Promise<void> {
    return this.locked(async () => {
      const db = await this.load();
      const variant = db.tables.product_variants.find((v) => v.id === input.variantId);
      if (!variant) {
        throw new Error(`adjust_inventory: unknown variant ${input.variantId}`);
      }
      variant.inventory_on_hand += input.delta;
      db.tables.inventory_movements.push({
        id: crypto.randomUUID(),
        variant_id: input.variantId,
        delta: input.delta,
        reason: input.reason,
        note: input.note ?? null,
        created_by: input.createdBy ?? null,
        created_at: new Date().toISOString(),
      });
      await this.persist(db);
    });
  }

  nextOrderNumber(): Promise<number> {
    return this.locked(async () => {
      const db = await this.load();
      const number = db.next_order_number;
      db.next_order_number += 1;
      await this.persist(db);
      return number;
    });
  }
}

export function createLocalStore(): LocalStore {
  return new LocalStore();
}

export type { LocalStore };
