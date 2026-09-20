import { test } from "node:test";
import assert from "node:assert/strict";

const { mapStripeSession } = await import("../../lib/stripe/mapping.ts");

const PAID_SESSION = {
  id: "cs_test_a1FIXTURE",
  object: "checkout.session",
  status: "complete",
  payment_status: "paid",
  amount_total: 5594,
  currency: "usd",
  client_reference_id: "11111111-1111-4111-8111-111111111111",
  metadata: { checkout_id: "11111111-1111-4111-8111-111111111111" },
  customer_details: {
    email: "fixture-buyer@example.com",
    name: "Fixture Buyer",
    phone: null,
    address: {
      line1: "1 Billing Way",
      line2: null,
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      country: "US",
    },
  },
  collected_information: {
    shipping_details: {
      name: "Gift Recipient",
      address: {
        line1: "2 Delivery Road",
        line2: "Apt 3",
        city: "Denver",
        state: "CO",
        postal_code: "80201",
        country: "US",
      },
    },
  },
  payment_intent: {
    id: "pi_3FIXTURE",
    status: "succeeded",
    latest_charge: {
      id: "ch_3FIXTURE",
      status: "succeeded",
      amount_refunded: 0,
      payment_method_details: { card: { brand: "visa", last4: "4242" } },
    },
  },
};

test("a paid session with an expanded charge maps every order field", () => {
  const mapped = mapStripeSession(PAID_SESSION);
  assert.equal(mapped.sessionId, "cs_test_a1FIXTURE");
  assert.equal(mapped.checkoutId, "11111111-1111-4111-8111-111111111111");
  assert.equal(mapped.paymentIntentId, "pi_3FIXTURE");
  assert.equal(mapped.chargeId, "ch_3FIXTURE");
  assert.equal(mapped.paid, true);
  assert.equal(mapped.email, "fixture-buyer@example.com");
  assert.equal(mapped.amountCents, 5594);
  assert.equal(mapped.currency, "USD");
  assert.equal(mapped.cardBrand, "VISA");
  assert.equal(mapped.cardLast4, "4242");
  assert.equal(mapped.shipToCountry, "US");
  assert.equal(mapped.shippingAddress?.name, "Gift Recipient");
  assert.equal(mapped.shippingAddress?.address1, "2 Delivery Road");
  assert.equal(mapped.shippingAddress?.city, "Denver");
  assert.equal(mapped.billingAddress?.name, "Fixture Buyer");
  assert.equal(mapped.billingAddress?.city, "Austin");
});

test("the classic shipping_details field is read when collected_information is absent", () => {
  const mapped = mapStripeSession({
    ...PAID_SESSION,
    collected_information: null,
    shipping_details: {
      name: "Classic Field",
      address: { line1: "9 Old Shape St", city: "Reno", country: "US" },
    },
  });
  assert.equal(mapped.shippingAddress?.name, "Classic Field");
  assert.equal(mapped.shippingAddress?.address1, "9 Old Shape St");
});

test("a webhook-shaped session (unexpanded payment intent) still yields the intent id", () => {
  const mapped = mapStripeSession({
    ...PAID_SESSION,
    payment_intent: "pi_3FIXTURE",
  });
  assert.equal(mapped.paymentIntentId, "pi_3FIXTURE");
  assert.equal(mapped.chargeId, null);
  assert.equal(mapped.cardBrand, null);
  assert.equal(mapped.cardLast4, null);
});

test("an unpaid session maps paid=false and empty fields map to null", () => {
  const mapped = mapStripeSession({
    id: "cs_test_open",
    payment_status: "unpaid",
    status: "open",
  });
  assert.equal(mapped.paid, false);
  assert.equal(mapped.email, null);
  assert.equal(mapped.shippingAddress, null);
  assert.equal(mapped.amountCents, null);
  assert.equal(mapped.checkoutId, null);
});
