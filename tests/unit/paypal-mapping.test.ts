/**
 * ROLE OF THIS FILE
 * §0.2 fixture verification for the PayPal integration: with no sandbox
 * credentials on this machine, the capture-response mapping (the layer that
 * turns PayPal payloads into our order fields) is tested against a recorded
 * Orders-v2 capture payload shape. Runs under plain Node: `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mapCaptureResponse } from "../../lib/paypal/mapping.ts";

// Recorded sandbox-shaped capture response (PayPal Orders v2 docs shape).
const CAPTURE_FIXTURE = {
  id: "5O190127TN364715T",
  status: "COMPLETED",
  payer: {
    email_address: "sb-buyer@personal.example.com",
    name: { given_name: "John", surname: "Doe" },
    phone: { phone_number: { national_number: "4082508100" } },
    address: { country_code: "US" },
  },
  purchase_units: [
    {
      shipping: {
        name: { full_name: "John Doe" },
        address: {
          address_line_1: "123 Townsend St",
          address_line_2: "Floor 6",
          admin_area_2: "San Francisco",
          admin_area_1: "CA",
          postal_code: "94107",
          country_code: "US",
        },
      },
      payments: {
        captures: [
          {
            id: "3C679366HH908993F",
            status: "COMPLETED",
            amount: { currency_code: "USD", value: "55.94" },
            seller_protection: { status: "ELIGIBLE" },
          },
        ],
      },
    },
  ],
};

test("maps a completed capture into order fields", () => {
  const mapped = mapCaptureResponse(CAPTURE_FIXTURE);
  assert.equal(mapped.completed, true);
  assert.equal(mapped.providerOrderId, "5O190127TN364715T");
  assert.equal(mapped.captureId, "3C679366HH908993F");
  assert.equal(mapped.email, "sb-buyer@personal.example.com");
  assert.equal(mapped.phone, "4082508100");
  assert.equal(mapped.amountCents, 5594);
  assert.equal(mapped.currency, "USD");
  assert.equal(mapped.sellerProtection, "ELIGIBLE");
  assert.equal(mapped.shipToCountry, "US");
  assert.deepEqual(mapped.shippingAddress, {
    name: "John Doe",
    address1: "123 Townsend St",
    address2: "Floor 6",
    city: "San Francisco",
    state: "CA",
    postal_code: "94107",
    country: "US",
  });
  assert.deepEqual(mapped.billingAddress, {
    name: "John Doe",
    address1: undefined,
    address2: undefined,
    city: undefined,
    state: undefined,
    postal_code: undefined,
    country: "US",
  });
});

test("an incomplete capture is not treated as paid", () => {
  const pending = structuredClone(CAPTURE_FIXTURE);
  pending.purchase_units[0].payments.captures[0].status = "PENDING";
  const mapped = mapCaptureResponse(pending);
  assert.equal(mapped.completed, false);
  assert.equal(mapped.captureStatus, "PENDING");
});

test("missing payer/shipping data degrades to nulls, never throws", () => {
  const mapped = mapCaptureResponse({ id: "X", status: "COMPLETED" });
  assert.equal(mapped.completed, false); // no capture recorded
  assert.equal(mapped.email, null);
  assert.equal(mapped.shippingAddress, null);
  assert.equal(mapped.amountCents, null);
});
