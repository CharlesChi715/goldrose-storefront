/**
 * ROLE OF THIS FILE
 * Stage 0 click-through: the mock checkout must complete end to end — cart →
 * pay → success page → order recorded — with no payment keys configured.
 * This is the "checkout keeps working" regression net for every later stage
 * (design doc §14.1).
 */

import { test, expect } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";

const CART_KEY = "goldrose-cart-v1";
const ORDERS_FILE = path.join(process.cwd(), ".data", "orders.json");

test("mock checkout: cart → pay → success → order recorded", async ({ page }) => {
  // Seed the cart directly in localStorage — the same shape lib/cart/store.ts
  // persists. (The redesigned product page's ADD TO CART button is wired to
  // the cart in Stage 4.)
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      CART_KEY,
      JSON.stringify([
        { productId: "signature-gold-rose", option: "Gift box included", quantity: 1 },
      ]),
    ] as const,
  );

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("Signature Rose")).toBeVisible();

  // Contact + shipping.
  await page.fill("#email", "stage0-test@example.com");
  await page.fill("#ship-name", "Test Buyer");
  await page.fill("#ship-address1", "1 Test Street");
  await page.fill("#ship-city", "Testville");
  await page.fill("#ship-state", "CA");
  await page.fill("#ship-zip", "90001");

  // Mock card — format-validated locally, never stored.
  await page.fill("#card-name", "Test Buyer");
  await page.fill("#card-number", "4242 4242 4242 4242");
  await page.fill("#card-expiry", "12/33");
  await page.fill("#card-cvc", "123");

  await page.getByRole("button", { name: /^Pay \$/ }).click();

  // Success page with the order number, flagged as a mock order.
  await page.waitForURL(/\/checkout\/success\?/);
  await expect(page.getByText("Thank you for your order.")).toBeVisible();
  await expect(page.getByText("development test order")).toBeVisible();
  const orderNumber = (await page.locator("dd.font-mono").innerText()).trim();
  expect(orderNumber).not.toBe("");

  // The order landed in the local order log.
  const raw = await fs.readFile(ORDERS_FILE, "utf8");
  const orders = JSON.parse(raw) as Array<{ number: string; mode: string; total: number }>;
  const recorded = orders.find((order) => order.number === orderNumber);
  expect(recorded).toBeDefined();
  expect(recorded?.mode).toBe("mock");
  // $49.99 item + $5.95 standard shipping (under the free threshold).
  expect(recorded?.total).toBe(5594);
});
