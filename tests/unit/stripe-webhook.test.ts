import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// The local file store roots itself at process.cwd() — isolate it FIRST,
// before any store import can cache a path.
process.chdir(mkdtempSync(path.join(tmpdir(), "goldrose-stripe-test-")));

const { handleStripeEvent } = await import("../../lib/stripe/webhook.ts");
const { getStore } = await import("../../lib/supabase/store.ts");

const SESSION_ID = "cs_test_a1FIXTURE";
const REJECTED_SESSION_ID = "cs_test_rejected";
const CHECKOUT_ID = "22222222-2222-4222-8222-222222222222";
const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";

function completedEvent(eventId: string, sessionId = SESSION_ID) {
  return {
    id: eventId,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        status: "complete",
        payment_status: "paid",
        amount_total: 5594,
        currency: "usd",
        metadata: { checkout_id: CHECKOUT_ID },
        customer_details: {
          email: "fixture-buyer@example.com",
          name: "Fixture Buyer",
        },
        shipping_details: {
          name: "Gift Recipient",
          address: {
            line1: "2 Delivery Road",
            city: "Denver",
            state: "CO",
            postal_code: "80201",
            country: "US",
          },
        },
        payment_intent: "pi_3FIXTURE",
      },
    },
  };
}

function refundedEvent(eventId: string, amountRefunded: number) {
  return {
    id: eventId,
    type: "charge.refunded",
    data: {
      object: {
        id: "ch_3FIXTURE",
        object: "charge",
        payment_intent: "pi_3FIXTURE",
        amount_refunded: amountRefunded,
      },
    },
  };
}

before(async () => {
  // Seeded fresh store (auto-seeds on first access) + open checkout rows, as
  // /api/stripe/checkout would have written them.
  await getStore().insert("checkouts", [
    {
      id: CHECKOUT_ID,
      cart: {
        lines: [{ variant_id: SIGNATURE_VARIANT, quantity: 1 }],
        note: "Fixture gift note",
        country: "US",
      },
      email: "fixture-buyer@example.com",
      discount_code: null,
      subtotal_cents: 4999,
      total_cents: 5594,
      provider_order_id: SESSION_ID,
      status: "open",
      created_at: new Date().toISOString(),
      completed_at: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      cart: {
        lines: [{ variant_id: SIGNATURE_VARIANT, quantity: 1 }],
        country: "US",
      },
      email: "fixture-buyer@example.com",
      discount_code: null,
      subtotal_cents: 4999,
      total_cents: 5594,
      provider_order_id: REJECTED_SESSION_ID,
      status: "rejected",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
  ]);
});

test("a completed session repairs a missing order from the checkout row", async () => {
  const outcome = await handleStripeEvent(completedEvent("evt_1"));
  assert.equal(outcome, "repaired");

  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === SESSION_ID,
  );
  assert.ok(order);
  assert.equal(order.source, "site");
  assert.equal(order.payment_provider, "stripe");
  assert.equal(order.financial_status, "paid");
  assert.equal(order.total_cents, 5594);
  assert.equal(order.note, "Fixture gift note");
  assert.equal(order.provider_capture_id, "pi_3FIXTURE");
  assert.equal(order.payment_method_kind, "card");
  assert.equal(order.shipping_address?.name, "Gift Recipient");

  const checkout = (await getStore().all("checkouts")).find(
    (row) => row.id === CHECKOUT_ID,
  );
  assert.equal(checkout?.status, "completed");
});

test("a replayed completed session never duplicates the order", async () => {
  const outcome = await handleStripeEvent(completedEvent("evt_2"));
  assert.equal(outcome, "duplicate");
  const orders = await getStore().all("orders");
  assert.equal(
    orders.filter((row) => row.provider_order_id === SESSION_ID).length,
    1,
  );
});

test("a rejected checkout is never rebuilt by the repair path", async () => {
  const outcome = await handleStripeEvent(
    completedEvent("evt_3", REJECTED_SESSION_ID),
  );
  assert.equal(outcome, "ignored");
  const orders = await getStore().all("orders");
  assert.equal(
    orders.some((row) => row.provider_order_id === REJECTED_SESSION_ID),
    false,
  );
});

test("an unpaid session is ignored", async () => {
  const event = completedEvent("evt_4");
  event.data.object.payment_status = "unpaid";
  event.data.object.id = "cs_test_unpaid";
  assert.equal(await handleStripeEvent(event), "ignored");
});

test("partial refund syncs cumulative amount and status", async () => {
  const outcome = await handleStripeEvent(refundedEvent("evt_5", 1000));
  assert.equal(outcome, "refund_synced");
  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === SESSION_ID,
  );
  assert.equal(order?.financial_status, "partially_refunded");
  assert.equal(order?.refunded_cents, 1000);
});

test("a replayed refund event doesn't double-count", async () => {
  const outcome = await handleStripeEvent(refundedEvent("evt_5", 1000));
  assert.equal(outcome, "duplicate");
  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === SESSION_ID,
  );
  assert.equal(order?.refunded_cents, 1000);
});

test("full refund flips status to refunded", async () => {
  const outcome = await handleStripeEvent(refundedEvent("evt_6", 5594));
  assert.equal(outcome, "refund_synced");
  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === SESSION_ID,
  );
  assert.equal(order?.financial_status, "refunded");
  assert.equal(order?.refunded_cents, 5594);
});

test("a dispute tags the order and writes the deadline to the timeline", async () => {
  const outcome = await handleStripeEvent({
    id: "evt_7",
    type: "charge.dispute.created",
    data: {
      object: {
        id: "dp_1FIXTURE",
        object: "dispute",
        charge: "ch_3FIXTURE",
        payment_intent: "pi_3FIXTURE",
        reason: "fraudulent",
        evidence_details: { due_by: 1_800_000_000 },
      },
    },
  });
  assert.equal(outcome, "dispute_noted");
  const order = (await getStore().all("orders")).find(
    (row) => row.provider_order_id === SESSION_ID,
  );
  assert.ok(order?.tags.includes("disputed"));
  const events = await getStore().all("order_events");
  assert.ok(
    events.some(
      (entry) =>
        entry.order_id === order?.id &&
        entry.message.includes("Stripe dispute dp_1FIXTURE") &&
        entry.message.includes("fraudulent"),
    ),
  );
});

test("a replayed dispute event is a duplicate", async () => {
  const outcome = await handleStripeEvent({
    id: "evt_7",
    type: "charge.dispute.created",
    data: {
      object: {
        id: "dp_1FIXTURE",
        object: "dispute",
        charge: "ch_3FIXTURE",
        payment_intent: "pi_3FIXTURE",
        reason: "fraudulent",
        evidence_details: { due_by: 1_800_000_000 },
      },
    },
  });
  assert.equal(outcome, "duplicate");
});

test("unhandled event types are ignored", async () => {
  assert.equal(
    await handleStripeEvent({ id: "evt_8", type: "payout.paid", data: {} }),
    "ignored",
  );
});
