import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const { verifyStripeSignature } = await import("../../lib/stripe/verify.ts");

const SECRET = "whsec_fixture_secret";
const BODY = '{"id":"evt_1","type":"checkout.session.completed"}';
const NOW = 1_800_000_000;

function sign(body: string, timestamp: number, secret = SECRET): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`, "utf8")
    .digest("hex");
}

test("a fresh, correctly signed delivery verifies", () => {
  const header = `t=${NOW},v1=${sign(BODY, NOW)}`;
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      nowSeconds: NOW,
    }),
    true,
  );
});

test("a tampered body fails", () => {
  const header = `t=${NOW},v1=${sign(BODY, NOW)}`;
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY.replace("evt_1", "evt_2"),
      header,
      secret: SECRET,
      nowSeconds: NOW,
    }),
    false,
  );
});

test("a wrong secret fails", () => {
  const header = `t=${NOW},v1=${sign(BODY, NOW, "whsec_other")}`;
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      nowSeconds: NOW,
    }),
    false,
  );
});

test("a stale timestamp fails (replay window)", () => {
  const old = NOW - 3600;
  const header = `t=${old},v1=${sign(BODY, old)}`;
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      nowSeconds: NOW,
    }),
    false,
  );
});

test("one valid signature among several v1 entries passes", () => {
  const header = `t=${NOW},v1=${"0".repeat(64)},v1=${sign(BODY, NOW)}`;
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      nowSeconds: NOW,
    }),
    true,
  );
});

test("missing header, malformed header, and missing secret all fail closed", () => {
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY,
      header: null,
      secret: SECRET,
      nowSeconds: NOW,
    }),
    false,
  );
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY,
      header: "v1=deadbeef",
      secret: SECRET,
      nowSeconds: NOW,
    }),
    false,
  );
  assert.equal(
    verifyStripeSignature({
      rawBody: BODY,
      header: `t=${NOW},v1=${sign(BODY, NOW)}`,
      secret: "",
      nowSeconds: NOW,
    }),
    false,
  );
});
