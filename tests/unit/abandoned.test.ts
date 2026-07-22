/**
 * ROLE OF THIS FILE
 * §0.2 unit test for the abandoned-checkout rule (§7.6): a checkout counts
 * as abandoned only when still OPEN and more than 1 hour old. (The e2e
 * suite can't age a checkout, so the rule is verified here in an isolated
 * temp store.)
 */

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.chdir(mkdtempSync(path.join(tmpdir(), "goldrose-abandoned-test-")));

const { listAbandonedCheckouts } = await import("../../lib/admin/drafts.ts");
const { getStore } = await import("../../lib/supabase/store.ts");

const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";

function checkoutRow(id: string, createdAt: string, status: "open" | "completed") {
  return {
    id,
    cart: { lines: [{ variant_id: SIGNATURE_VARIANT, quantity: 2 }], country: "US" },
    email: `${id}@example.com`,
    discount_code: null,
    subtotal_cents: 9998,
    total_cents: 10593,
    provider_order_id: null,
    status,
    created_at: createdAt,
    completed_at: status === "completed" ? createdAt : null,
  };
}

before(async () => {
  const now = Date.now();
  await getStore().insert("checkouts", [
    checkoutRow("old-open", new Date(now - 2 * 60 * 60 * 1000).toISOString(), "open"),
    checkoutRow("fresh-open", new Date(now - 10 * 60 * 1000).toISOString(), "open"),
    checkoutRow("old-completed", new Date(now - 3 * 60 * 60 * 1000).toISOString(), "completed"),
  ]);
});

test("only open checkouts older than 1 hour are abandoned", async () => {
  const abandoned = await listAbandonedCheckouts();
  const ids = abandoned.map((entry) => entry.checkout.id);
  // Our aged open checkout qualifies; fresh/completed ones never do. (The
  // seed also ships one demo abandoned checkout — filtered by id here.)
  assert.ok(ids.includes("old-open"));
  assert.ok(!ids.includes("fresh-open"));
  assert.ok(!ids.includes("old-completed"));
  const oldOpen = abandoned.find((entry) => entry.checkout.id === "old-open")!;
  assert.equal(oldOpen.itemCount, 2);
  assert.match(oldOpen.itemsLabel, /2 × GoldRose Signature 24K Gold Rose/);
  assert.ok(oldOpen.ageHours >= 2);
});
