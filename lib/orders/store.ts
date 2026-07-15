/**
 * ROLE OF THIS FILE
 * The demo order log: saves completed MOCK checkouts to a local JSON file so
 * the /orders page can show the click -> pay -> order loop closing. Live
 * orders never land here — Shopify is their system of record.
 *
 * This file uses Node's filesystem module, so it can only run on the server
 * (API routes / server components) — never in the browser.
 */

import { promises as fs } from "fs";
import path from "path";
import type { Order } from "@/lib/checkout/types";

/**
 * A completed checkout, captured so the demo can SHOW the order landing
 * somewhere after a customer pays. This is the local stand-in for what a real
 * Shopify order record would be in live mode.
 *
 * This is a demo capture, not an order system of record. In live mode the
 * authoritative order lives in Shopify; this file store exists only so the
 * owner can watch the click -> pay -> order loop close end to end.
 */
export type StoredOrder = Order & {
  /** ISO timestamp set when the order was captured server-side. */
  placedAt: string;
  /** "mock" for the demo capture; "live" would be a real Shopify order. */
  mode: "mock" | "live";
};

// A plain JSON file under a gitignored .data/ directory. No database needed for
// a demo: it survives dev-server reloads (unlike in-memory) and is trivial to
// inspect. Note: on an ephemeral/serverless filesystem this resets between
// deploys — fine for a local boss demo, not for production.
const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

/** Read every saved order from the JSON file (empty list if none yet). */
async function readAll(): Promise<StoredOrder[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : [];
  } catch {
    // Missing file or unparseable contents both mean "no orders yet".
    return [];
  }
}

/** Append one completed order to the demo capture log. */
export async function saveOrder(order: StoredOrder): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const all = await readAll();
  all.push(order);
  await fs.writeFile(ORDERS_FILE, JSON.stringify(all, null, 2), "utf8");
}

/** All captured orders, newest first. */
export async function listOrders(): Promise<StoredOrder[]> {
  const all = await readAll();
  return all.slice().reverse();
}
