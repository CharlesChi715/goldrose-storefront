/**
 * ROLE OF THIS FILE
 * Unit coverage for the carrier registry behind order tracking
 * (features/backend/order-tracking.md): tracking URLs build correctly per
 * carrier, unknown carriers and blank numbers refuse, and labels render
 * for known, legacy, and absent values. Runs under plain Node:
 * `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARRIERS,
  buildTrackingUrl,
  carrierLabel,
  isCarrierId,
} from "../../lib/shipping/carriers.ts";

test("UPS URL embeds the tracking number", () => {
  assert.equal(
    buildTrackingUrl("ups", "1Z999AA10123456784"),
    "https://www.ups.com/track?tracknum=1Z999AA10123456784",
  );
});

test("USPS URL embeds the tracking number", () => {
  assert.equal(
    buildTrackingUrl("usps", "940011189922333334444"),
    "https://tools.usps.com/go/TrackConfirmAction?tLabels=940011189922333334444",
  );
});

test("tracking numbers are URL-encoded and trimmed", () => {
  assert.equal(
    buildTrackingUrl("ups", "  1Z 999&AA  "),
    "https://www.ups.com/track?tracknum=1Z%20999%26AA",
  );
});

test("unknown carrier, null carrier, or blank number → null", () => {
  assert.equal(buildTrackingUrl("fedex", "123"), null);
  assert.equal(buildTrackingUrl(null, "123"), null);
  assert.equal(buildTrackingUrl("ups", ""), null);
  assert.equal(buildTrackingUrl("ups", "   "), null);
});

test("every registered carrier builds a URL containing its number", () => {
  for (const [id, def] of Object.entries(CARRIERS)) {
    const url = buildTrackingUrl(id, "TRACK123");
    assert.ok(url?.startsWith("https://"), `${id} URL is https`);
    assert.ok(url?.includes("TRACK123"), `${id} URL carries the number`);
    assert.ok(def.label.length > 0, `${id} has a label`);
  }
});

test("labels: known ids map, legacy free text passes through, empty → null", () => {
  assert.equal(carrierLabel("ups"), "UPS");
  assert.equal(carrierLabel("usps"), "USPS");
  assert.equal(carrierLabel("dhl"), "dhl");
  assert.equal(carrierLabel(null), null);
  assert.equal(carrierLabel(""), null);
});

test("isCarrierId accepts only registered ids", () => {
  assert.equal(isCarrierId("ups"), true);
  assert.equal(isCarrierId("usps"), true);
  assert.equal(isCarrierId("fedex"), false);
  assert.equal(isCarrierId(null), false);
  assert.equal(isCarrierId(3), false);
});
