/**
 * ROLE OF THIS FILE
 * Guards the /account order link (2026-07-29 fix). Orders placed by a
 * signed-in buyer carry their Supabase auth uid, so /account can find them
 * whatever the sign-in method was — previously the only match paths were
 * customers.auth_user_id and an email string match, both gated on Google /
 * Apple, which left emailed-OTP customers with a permanently empty list.
 * Also pins the guest case: no session means no uid, never a wrong one.
 * Runs in a temp working directory so the repo's local db is untouched.
 */

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// The local file store roots itself at process.cwd() — isolate it FIRST,
// before any store import can cache a path.
process.chdir(mkdtempSync(path.join(tmpdir(), "goldrose-order-auth-test-")));

const { createOrder } = await import("../../lib/orders/db.ts");
const { priceCart } = await import("../../lib/checkout/pricing.ts");
const { getStore } = await import("../../lib/supabase/store.ts");

const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";
const BUYER_UID = "9f1d4c2e-0000-4000-8000-00000000abcd";

/** Price a one-item US cart the way the checkout routes do. */
async function pricedCart() {
  return priceCart({
    lines: [{ variantId: SIGNATURE_VARIANT, quantity: 1 }],
    country: "US",
  });
}

before(async () => {
  // Touch the store so it auto-seeds before the tests price a cart.
  await getStore().all("products");
});

test("a signed-in buyer's order carries their auth uid", async () => {
  const order = await createOrder({
    priced: await pricedCart(),
    source: "mock",
    payment_provider: "mock",
    financial_status: "paid",
    email: "signed-in-buyer@example.com",
    auth_user_id: BUYER_UID,
  });

  assert.equal(order.auth_user_id, BUYER_UID);

  // And it survives the round trip to storage — this is the value /account
  // actually reads back.
  const stored = (await getStore().all("orders")).find((row) => row.id === order.id);
  assert.equal(stored?.auth_user_id, BUYER_UID);
});

test("the uid is what /account matches on, even when the emails differ", async () => {
  // The exact failure the owner hit: the address typed at checkout is not
  // the address on the account. The uid must still link the two.
  const order = await createOrder({
    priced: await pricedCart(),
    source: "mock",
    payment_provider: "mock",
    financial_status: "paid",
    email: "some-other-address@example.com",
    auth_user_id: BUYER_UID,
  });

  const mine = (await getStore().all("orders")).filter(
    (row) => row.auth_user_id === BUYER_UID,
  );
  assert.ok(mine.some((row) => row.id === order.id));
  assert.notEqual(order.email, "signed-in-buyer@example.com");
});

test("a guest order gets a null uid, never someone else's", async () => {
  const order = await createOrder({
    priced: await pricedCart(),
    source: "mock",
    payment_provider: "mock",
    financial_status: "paid",
    email: null,
  });

  assert.equal(order.auth_user_id, null);
  assert.equal(order.customer_id, null);

  // A signed-in customer must not pick up guest orders.
  const mine = (await getStore().all("orders")).filter(
    (row) => row.auth_user_id === BUYER_UID,
  );
  assert.ok(!mine.some((row) => row.id === order.id));
});
