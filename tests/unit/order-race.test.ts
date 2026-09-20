import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// The local file store roots itself at process.cwd() — isolate it FIRST.
process.chdir(mkdtempSync(path.join(tmpdir(), "goldrose-order-race-test-")));

const { createOrderIfAbsent } = await import("../../lib/orders/db.ts");
const { getStore } = await import("../../lib/supabase/store.ts");
const { priceCart } = await import("../../lib/checkout/pricing.ts");

const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";
const PROVIDER_ORDER_ID = "cs_test_constraint_race";

let priced: Awaited<ReturnType<typeof priceCart>>;

before(async () => {
  priced = await priceCart({
    lines: [{ variantId: SIGNATURE_VARIANT, quantity: 1 }],
    country: "US",
    discountCode: null,
    email: "race@example.com",
  });
});

function input() {
  return {
    priced,
    source: "site" as const,
    payment_provider: "stripe",
    provider_order_id: PROVIDER_ORDER_ID,
    provider_capture_id: "ch_race",
    financial_status: "paid" as const,
    email: "race@example.com",
  };
}

test("a unique-violation on insert resolves to the winner's order, not a throw", async () => {
  // The local file store has no constraints, so stand in for Postgres: let the
  // first insert through, then reject a second row for the same provider
  // payment exactly as the orders_provider_order_id_key index does. Observed
  // live on 2026-09-20 — the losing path threw and the buyer who had already
  // paid was shown an error page.
  const store = getStore();
  const realInsert = store.insert.bind(store);
  let ordersInserted = 0;
  store.insert = async (table, rows) => {
    if (table === "orders") {
      ordersInserted += 1;
      if (ordersInserted > 1) {
        throw new Error(
          'supabase insert orders: duplicate key value violates unique constraint "orders_provider_order_id_key"',
        );
      }
    }
    return realInsert(table, rows);
  };

  try {
    const winner = await createOrderIfAbsent(input());
    assert.equal(winner.created, true);

    // The loser's own pre-insert lookup is defeated on purpose: it must still
    // come back with the winner's order instead of throwing.
    const realAll = store.all.bind(store);
    let hidden = false;
    store.all = async (table) => {
      const rows = await realAll(table);
      if (table === "orders" && !hidden) {
        // Only the pre-insert lookup is blind — the recovery lookup inside the
        // catch must see the winner, exactly as it would against Postgres.
        hidden = true;
        const orders = rows as Array<{ provider_order_id: string | null }>;
        return orders.filter(
          (row) => row.provider_order_id !== PROVIDER_ORDER_ID,
        ) as never;
      }
      return rows;
    };
    let loser;
    try {
      loser = await createOrderIfAbsent(input());
    } finally {
      store.all = realAll;
    }

    assert.equal(loser.created, false);
    assert.equal(loser.order.id, winner.order.id);
    assert.equal(loser.order.name, winner.order.name);
  } finally {
    store.insert = realInsert;
  }

  const orders = await getStore().all("orders");
  assert.equal(
    orders.filter((row) => row.provider_order_id === PROVIDER_ORDER_ID).length,
    1,
  );
});

test("an insert failure that is not the duplicate guard still throws", async () => {
  const store = getStore();
  const realInsert = store.insert.bind(store);
  store.insert = async (table, rows) => {
    if (table === "orders") {
      throw new Error("supabase insert orders: connection refused");
    }
    return realInsert(table, rows);
  };
  try {
    await assert.rejects(
      () =>
        createOrderIfAbsent({ ...input(), provider_order_id: "cs_test_other" }),
      /connection refused/,
    );
  } finally {
    store.insert = realInsert;
  }
});
