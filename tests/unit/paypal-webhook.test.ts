/**
 * ROLE OF THIS FILE
 * §0.2 fixture tests for the PayPal webhook handler: replayed capture
 * events never duplicate an order (idempotency by provider_order_id), the
 * repair path rebuilds a lost order from the server-priced checkout row,
 * and refund events sync financial status without double-counting. Runs in
 * a temp working directory so the repo's local db is untouched.
 */

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// The local file store roots itself at process.cwd() — isolate it FIRST,
// before any store import can cache a path.
process.chdir(mkdtempSync(path.join(tmpdir(), "goldrose-webhook-test-")));

const { handlePayPalEvent } = await import("../../lib/paypal/webhook.ts");
const { getStore } = await import("../../lib/supabase/store.ts");

const PROVIDER_ORDER_ID = "5O190127TN364715T";
const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";

function captureEvent(eventId: string) {
  return {
    id: eventId,
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "3C679366HH908993F",
      status: "COMPLETED",
      amount: { currency_code: "USD", value: "55.94" },
      supplementary_data: { related_ids: { order_id: PROVIDER_ORDER_ID } },
    },
  };
}

function refundEvent(refundId: string, amount: string, cumulative: string) {
  return {
    id: `WH-${refundId}`,
    event_type: "PAYMENT.CAPTURE.REFUNDED",
    resource: {
      id: refundId,
      status: "COMPLETED",
      amount: { currency_code: "USD", value: amount },
      seller_payable_breakdown: { total_refunded_amount: { value: cumulative } },
      supplementary_data: { related_ids: { order_id: PROVIDER_ORDER_ID } },
    },
  };
}

before(async () => {
  // Seeded fresh store (auto-seeds on first access) + an open checkout row,
  // as /api/paypal/create would have written it.
  await getStore().insert("checkouts", [
    {
      id: "11111111-1111-4111-8111-111111111111",
      cart: {
        lines: [{ variant_id: SIGNATURE_VARIANT, quantity: 1 }],
        note: "Fixture gift note",
        country: "US",
      },
      email: "fixture-buyer@example.com",
      discount_code: null,
      subtotal_cents: 4999,
      total_cents: 5594,
      provider_order_id: PROVIDER_ORDER_ID,
      status: "open",
      created_at: new Date().toISOString(),
      completed_at: null,
    },
  ]);
});

test("capture webhook repairs a missing order from the checkout row", async () => {
  const outcome = await handlePayPalEvent(captureEvent("WH-1"));
  assert.equal(outcome, "repaired");

  const orders = await getStore().all("orders");
  const order = orders.find((row) => row.provider_order_id === PROVIDER_ORDER_ID);
  assert.ok(order);
  assert.equal(order.source, "site");
  assert.equal(order.financial_status, "paid");
  assert.equal(order.total_cents, 5594);
  assert.equal(order.note, "Fixture gift note");
  assert.equal(order.provider_capture_id, "3C679366HH908993F");

  const checkouts = await getStore().all("checkouts");
  assert.equal(checkouts[0].status, "completed");
});

test("a replayed capture webhook never duplicates the order", async () => {
  const outcome = await handlePayPalEvent(captureEvent("WH-2"));
  assert.equal(outcome, "duplicate");
  const orders = await getStore().all("orders");
  assert.equal(
    orders.filter((row) => row.provider_order_id === PROVIDER_ORDER_ID).length,
    1,
  );
});

test("partial refund webhook flips status to partially_refunded", async () => {
  const outcome = await handlePayPalEvent(refundEvent("REF-1", "10.00", "10.00"));
  assert.equal(outcome, "refund_synced");
  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === PROVIDER_ORDER_ID,
  );
  assert.equal(order?.financial_status, "partially_refunded");
  assert.equal(order?.refunded_cents, 1000);
});

test("a replayed refund webhook doesn't double-count", async () => {
  const outcome = await handlePayPalEvent(refundEvent("REF-1", "10.00", "10.00"));
  assert.equal(outcome, "duplicate");
  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === PROVIDER_ORDER_ID,
  );
  assert.equal(order?.refunded_cents, 1000);
});

test("full refund flips status to refunded", async () => {
  const outcome = await handlePayPalEvent(refundEvent("REF-2", "45.94", "55.94"));
  assert.equal(outcome, "refund_synced");
  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === PROVIDER_ORDER_ID,
  );
  assert.equal(order?.financial_status, "refunded");
  assert.equal(order?.refunded_cents, 5594);
});
