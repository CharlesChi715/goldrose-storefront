/**
 * ROLE OF THIS FILE
 * Stage 6 acceptance (§14.2): a code created in the admin applies at
 * checkout (server-validated, re-priced); expired and limit-reached codes
 * are rejected; a draft order "Mark as paid" creates the order with its
 * stock decrement. (The 1-hour abandoned rule is unit-tested — e2e can't
 * age a checkout.)
 */

import { test, expect } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";
const STAMP = Date.now();
const CODE_10 = `E2E10-${STAMP}`;
const CODE_EXPIRED = `E2EEXP-${STAMP}`;
const CODE_LIMIT = `E2ELIM-${STAMP}`;

async function readDb() {
  return JSON.parse(
    await fs.readFile(path.join(process.cwd(), ".data", "db.json"), "utf8"),
  ) as {
    tables: {
      orders: Array<{
        id: string;
        name: string;
        source: string;
        discount_code: string | null;
        discount_cents: number;
        subtotal_cents: number;
        shipping_cents: number;
        total_cents: number;
        financial_status: string;
      }>;
      discounts: Array<{ code: string; used_count: number }>;
      inventory_movements: Array<{ reason: string; delta: number; note: string | null }>;
    };
  };
}

test("create a 10% discount in the admin", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/discounts/new");
  await page.getByLabel("Discount code").fill(CODE_10);
  // Default: Amount off order, Percentage, value 10.
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Discount saved")).toBeVisible();
  await page.goto("/admin/discounts");
  const row = page.getByRole("row").filter({ hasText: CODE_10 });
  await expect(row.getByText("Active")).toBeVisible();
  await expect(row.getByText("Amount off order · 10%")).toBeVisible();
});

test("the code applies at checkout, server-priced, and counts usage", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      "goldrose-cart-v2",
      JSON.stringify([{ variantId: SIGNATURE_VARIANT, quantity: 1 }]),
    ] as const,
  );
  await page.goto("/checkout");
  await page.fill("#discount-code", CODE_10);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(`Code ${CODE_10} applied.`)).toBeVisible();
  await expect(page.getByText("−$5.00")).toBeVisible();

  await page.fill("#email", "discount-buyer@example.com");
  await page.fill("#ship-name", "Discount Buyer");
  await page.fill("#ship-address1", "6 Coupon Court");
  await page.fill("#ship-city", "Testville");
  await page.fill("#ship-state", "CA");
  await page.fill("#ship-zip", "90001");
  await page.fill("#card-name", "Discount Buyer");
  await page.fill("#card-number", "4242 4242 4242 4242");
  await page.fill("#card-expiry", "12/33");
  await page.fill("#card-cvc", "123");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await page.waitForURL(/\/checkout\/success\?/);
  const orderName = (await page.locator("dd.font-mono").innerText()).trim();

  const db = await readDb();
  const order = db.tables.orders.find((row) => row.name === orderName);
  expect(order!.discount_code).toBe(CODE_10);
  expect(order!.discount_cents).toBe(500); // 10% of $49.99
  expect(order!.shipping_cents).toBe(595); // discounted subtotal under threshold
  expect(order!.total_cents).toBe(4999 - 500 + 595);
  expect(db.tables.discounts.find((row) => row.code === CODE_10)?.used_count).toBe(1);
});

test("expired and unknown codes are rejected at checkout", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/discounts/new");
  await page.getByLabel("Discount code").fill(CODE_EXPIRED);
  await page.getByLabel("Start date").fill("2020-01-01T00:00");
  await page.getByLabel("End date (optional)").fill("2020-01-02T00:00");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Discount saved")).toBeVisible();

  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      "goldrose-cart-v2",
      JSON.stringify([{ variantId: SIGNATURE_VARIANT, quantity: 1 }]),
    ] as const,
  );
  await page.goto("/checkout");
  await page.fill("#discount-code", CODE_EXPIRED);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("This code has expired.")).toBeVisible();

  await page.fill("#discount-code", "NO-SUCH-CODE");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Enter a valid discount code.")).toBeVisible();
});

test("limit-reached codes are rejected", async ({ page, request }) => {
  await adminLogin(page);
  await page.goto("/admin/discounts/new");
  await page.getByLabel("Discount code").fill(CODE_LIMIT);
  await page.getByLabel("Total usage limit").fill("1");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Discount saved")).toBeVisible();

  // Use it once through the real checkout API…
  const first = await request.post("/api/checkout", {
    data: {
      method: "paypal",
      lines: [{ variantId: SIGNATURE_VARIANT, quantity: 1 }],
      country: "US",
      discountCode: CODE_LIMIT,
    },
  });
  expect(first.ok()).toBe(true);

  // …then the second validation fails.
  const second = await request.post("/api/discount", {
    data: {
      code: CODE_LIMIT,
      lines: [{ variantId: SIGNATURE_VARIANT, quantity: 1 }],
      country: "US",
    },
  });
  expect(second.status()).toBe(400);
  expect((await second.json()).error).toContain("fully redeemed");
});

test("draft order → Mark as paid → stock decrement", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/orders/drafts/new");
  await page.getByLabel("Product").selectOption(SIGNATURE_VARIANT);
  await page.getByLabel("Quantity").fill("2");
  await page.getByLabel("Customer email (optional)").fill("draft-buyer@example.com");
  await page.getByLabel("Note").fill("Phone order");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.waitForURL(/\/admin\/orders\/[0-9a-f-]+$/);

  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Pending", { exact: true }).first()).toBeVisible();
  const draftName = (await page.locator("h1").first().innerText()).trim();

  // No stock movement yet.
  let db = await readDb();
  expect(
    db.tables.inventory_movements.some(
      (movement) => movement.note === `Order ${draftName}` && movement.reason === "order",
    ),
  ).toBe(false);

  await page.getByRole("button", { name: "Mark as paid" }).click();
  await expect(page.getByText("Paid", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Draft marked as paid")).toBeVisible();

  db = await readDb();
  const order = db.tables.orders.find((row) => row.name === draftName);
  expect(order!.source).toBe("draft");
  expect(order!.financial_status).toBe("paid");
  expect(order!.shipping_cents).toBe(0);
  expect(
    db.tables.inventory_movements.some(
      (movement) =>
        movement.note === `Order ${draftName}` &&
        movement.reason === "order" &&
        movement.delta === -2,
    ),
  ).toBe(true);

  // It shows on the drafts list.
  await page.goto("/admin/orders/drafts");
  await expect(page.getByText(draftName, { exact: true })).toBeVisible();
});

test("abandoned checkouts page renders (rule unit-tested)", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/orders/abandoned");
  await expect(page.getByText("Recovery emails ship in V2.")).toBeVisible();
});
