/**
 * ROLE OF THIS FILE
 * Tests for the stock check in `priceCart` (lib/checkout/pricing.ts).
 *
 * The defect this protects against was live until 2026-09-07: nothing on the
 * purchase path read inventory at all. A shopper holding a stale tab could buy
 * the last unit after it had sold, again and again, and `adjust_inventory` has
 * no floor — so the shop cheerfully took money for stock it did not have and
 * drove `inventory_on_hand` negative.
 *
 * Every payment route prices through this one function, which is what makes a
 * single check sufficient — so these tests are the guarantee for mock
 * checkout, PayPal create and PayPal capture together.
 *
 * Runs in a temp working directory so the repo's own .data/db.json is
 * untouched (the pattern from paypal-webhook.test.ts).
 */

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// The local file store roots itself at process.cwd() — isolate it FIRST,
// before any store import can cache a path.
process.chdir(mkdtempSync(path.join(tmpdir(), "eldreve-pricing-test-")));

const { priceCart } = await import("../../lib/checkout/pricing.ts");
const { getStore } = await import("../../lib/supabase/store.ts");

/** The seeded variant ids, discovered once the store has auto-seeded. */
let inStockVariant = "";

/**
 * Set one variant's stock, and return its id.
 *
 * @param patch - The inventory fields to apply.
 * @returns The variant id that was changed.
 */
async function setStock(patch: {
  inventory_on_hand?: number;
  track_quantity?: boolean;
  continue_selling_when_oos?: boolean;
}): Promise<string> {
  const store = getStore();
  const variants = await store.all("product_variants");
  const target = variants[0];
  await store.update("product_variants", { id: target.id }, patch);
  return target.id;
}

before(async () => {
  const variants = await getStore().all("product_variants");
  assert.ok(variants.length > 0, "the store should auto-seed variants");
  inStockVariant = variants[0].id;
});

test("a cart within stock prices normally", async () => {
  await setStock({
    inventory_on_hand: 5,
    track_quantity: true,
    continue_selling_when_oos: false,
  });
  const priced = await priceCart({
    lines: [{ variantId: inStockVariant, quantity: 2 }],
    country: "US",
  });
  assert.equal(priced.lines[0].quantity, 2);
  assert.ok(priced.total_cents > 0);
});

test("ordering more than exists is refused, and says how many are left", async () => {
  const id = await setStock({
    inventory_on_hand: 1,
    track_quantity: true,
    continue_selling_when_oos: false,
  });
  await assert.rejects(
    () => priceCart({ lines: [{ variantId: id, quantity: 2 }], country: "US" }),
    /Only 1 left/,
  );
});

test("a sold-out variant is refused, and says so plainly", async () => {
  const id = await setStock({
    inventory_on_hand: 0,
    track_quantity: true,
    continue_selling_when_oos: false,
  });
  await assert.rejects(
    () => priceCart({ lines: [{ variantId: id, quantity: 1 }], country: "US" }),
    /just sold out/,
  );
});

test("stock can never be driven negative through pricing", async () => {
  // The exact shape of the original defect: buy the last unit, then buy it
  // again. The second attempt must not price at all.
  const id = await setStock({
    inventory_on_hand: -3,
    track_quantity: true,
    continue_selling_when_oos: false,
  });
  await assert.rejects(
    () => priceCart({ lines: [{ variantId: id, quantity: 1 }], country: "US" }),
    /just sold out/,
  );
});

test("a variant that does not track quantity is always sellable", async () => {
  // Made to order, or a service. Zero on hand means nothing here.
  const id = await setStock({
    inventory_on_hand: 0,
    track_quantity: false,
    continue_selling_when_oos: false,
  });
  const priced = await priceCart({
    lines: [{ variantId: id, quantity: 3 }],
    country: "US",
  });
  assert.equal(priced.lines[0].quantity, 3);
});

test("backorder is honoured when the owner has allowed it", async () => {
  // `continue_selling_when_oos` is the owner's explicit decision to take the
  // order anyway; the check must respect it rather than override it.
  const id = await setStock({
    inventory_on_hand: 0,
    track_quantity: true,
    continue_selling_when_oos: true,
  });
  const priced = await priceCart({
    lines: [{ variantId: id, quantity: 2 }],
    country: "US",
  });
  assert.equal(priced.lines[0].quantity, 2);
});
