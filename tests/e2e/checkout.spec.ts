/**
 * ROLE OF THIS FILE
 * The checkout regression net, Stage 4 edition (§14.2): the mock click-
 * through (cart → pay → success → order recorded in the DB with stock
 * movement + completed checkout + gift note), zone-based international
 * shipping, and the server-re-pricing guarantees (tampered payloads
 * ignored; an admin price edit changes the checkout total).
 */

import { test, expect } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

const CART_KEY = "goldrose-cart-v2";
const DB_FILE = path.join(process.cwd(), ".data", "db.json");
// Seeded variant: Signature rose / "Gift box included" / $49.99.
const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";

type Db = {
  tables: {
    orders: Array<{
      id: string;
      name: string;
      source: string;
      note: string;
      email: string | null;
      subtotal_cents: number;
      shipping_cents: number;
      total_cents: number;
      financial_status: string;
    }>;
    order_lines: Array<{ order_id: string; variant_id: string | null; quantity: number }>;
    inventory_movements: Array<{ variant_id: string; delta: number; reason: string; note: string | null }>;
    checkouts: Array<{ status: string; total_cents: number }>;
    customers: Array<{ email: string }>;
  };
};

async function readDb(): Promise<Db> {
  return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db;
}

test.describe.configure({ mode: "serial" });

test("mock checkout: cart → pay → success → order recorded with note + movement", async ({
  page,
}) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [CART_KEY, JSON.stringify([{ variantId: SIGNATURE_VARIANT, quantity: 1 }])] as const,
  );

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("Signature Rose")).toBeVisible();
  // US zone: $5.95 shipping under the free threshold.
  await expect(page.getByText("$5.95")).toBeVisible();

  await page.fill("#gift-note", "Happy anniversary, my love!");
  await page.fill("#email", "stage4-test@example.com");
  await page.fill("#ship-name", "Test Buyer");
  await page.fill("#ship-address1", "1 Test Street");
  await page.fill("#ship-city", "Testville");
  await page.fill("#ship-state", "CA");
  await page.fill("#ship-zip", "90001");
  await page.fill("#card-name", "Test Buyer");
  await page.fill("#card-number", "4242 4242 4242 4242");
  await page.fill("#card-expiry", "12/33");
  await page.fill("#card-cvc", "123");
  await page.getByRole("button", { name: /^Pay \$/ }).click();

  await page.waitForURL(/\/checkout\/success\?/);
  await expect(page.getByText("Thank you for your order.")).toBeVisible();
  await expect(page.getByText("development test order")).toBeVisible();
  const orderName = (await page.locator("dd.font-mono").innerText()).trim();
  expect(orderName).toMatch(/^#1\d{3}$/);

  const db = await readDb();
  const order = db.tables.orders.find((row) => row.name === orderName);
  expect(order).toBeDefined();
  expect(order!.source).toBe("mock");
  expect(order!.financial_status).toBe("paid");
  expect(order!.note).toBe("Happy anniversary, my love!");
  expect(order!.email).toBe("stage4-test@example.com");
  expect(order!.subtotal_cents).toBe(4999);
  expect(order!.shipping_cents).toBe(595);
  expect(order!.total_cents).toBe(5594);

  // Stock decremented via a visible 'order' movement (§7.3).
  const movement = db.tables.inventory_movements.find(
    (row) =>
      row.variant_id === SIGNATURE_VARIANT &&
      row.reason === "order" &&
      row.note === `Order ${orderName}`,
  );
  expect(movement?.delta).toBe(-1);

  // Customer auto-created; checkout row completed.
  expect(db.tables.customers.some((row) => row.email === "stage4-test@example.com")).toBe(true);
  expect(
    db.tables.checkouts.some((row) => row.status === "completed" && row.total_cents === 5594),
  ).toBe(true);
});

test("non-US address gets its zone's shipping rate (Rest of world)", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [CART_KEY, JSON.stringify([{ variantId: SIGNATURE_VARIANT, quantity: 1 }])] as const,
  );

  await page.goto("/checkout");
  await page.selectOption("#ship-country", "GB");
  // Rest-of-world placeholder rate: $19.95, no free threshold.
  await expect(page.getByText("$19.95")).toBeVisible();
  await expect(page.getByText("Shipping (Rest of world)")).toBeVisible();

  // Mock express (PayPal) completes without the card form.
  await page.getByRole("button", { name: "PayPal" }).click();
  await page.waitForURL(/\/checkout\/success\?/);

  const orderName = (await page.locator("dd.font-mono").innerText()).trim();
  const db = await readDb();
  const order = db.tables.orders.find((row) => row.name === orderName);
  expect(order!.shipping_cents).toBe(1995);
  expect(order!.total_cents).toBe(4999 + 1995);
});

test("tampered client prices are ignored — the server prices from the DB", async ({
  request,
}) => {
  const response = await request.post("/api/checkout", {
    data: {
      method: "paypal",
      lines: [
        {
          variantId: SIGNATURE_VARIANT,
          quantity: 1,
          // Injected garbage a tamperer might try — the schema knows no prices.
          price_cents: 1,
          unit_amount: 0.01,
        },
      ],
      country: "US",
      total: 1,
      subtotal: 1,
    },
  });
  expect(response.ok()).toBe(true);
  const result = await response.json();
  expect(result.order.total).toBe(5594); // DB price, not the tampered one
});

test("an admin price edit changes the checkout total", async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.setViewportSize(ADMIN_VIEWPORT);
  await adminLogin(page);

  async function setPrice(price: string) {
    await page.goto("/admin/products/signature-gold-rose");
    // Per-variant price in the generated variant table (§9.5).
    await page.getByLabel("Price · Gift box included").fill(price);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Product saved")).toBeVisible();
  }

  async function checkoutTotal(): Promise<number> {
    const response = await request.post("/api/checkout", {
      data: {
        method: "paypal",
        lines: [{ variantId: SIGNATURE_VARIANT, quantity: 1 }],
        country: "US",
      },
    });
    expect(response.ok()).toBe(true);
    return (await response.json()).order.total as number;
  }

  const before = await checkoutTotal();
  expect(before).toBe(5594);
  try {
    await setPrice("59.99");
    expect(await checkoutTotal()).toBe(5999 + 595);
  } finally {
    await setPrice("49.99");
  }
  expect(await checkoutTotal()).toBe(5594);
});
