/**
 * ROLE OF THIS FILE
 * Stage 5 acceptance (§14.2): orders list + detail card-for-card, fulfill
 * with tracking, refund (partial → full) with status flips, cancel with
 * restock, archive, timeline comments, customer auto-creation with profile
 * + its own timeline, and webhook signature rejection. Runs against the
 * local adapter with mock orders placed through the real API.
 */

import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";
const BUYER_EMAIL = `stage5-buyer-${Date.now()}@example.com`;
const GIFT_NOTE = "Stage5 gift note — handle with care";

let orderName = "";
let secondOrderName = "";

async function placeMockOrder(
  request: APIRequestContext,
  email: string = BUYER_EMAIL,
): Promise<string> {
  const response = await request.post("/api/checkout", {
    data: {
      method: "card",
      lines: [{ variantId: SIGNATURE_VARIANT, quantity: 1 }],
      country: "US",
      email,
      note: GIFT_NOTE,
      shipping: {
        name: "Stage Five",
        address1: "5 Webhook Way",
        city: "Testville",
        state: "CA",
        postalCode: "90001",
      },
      card: { number: "4242424242424242", expiry: "12/33", cvc: "123", name: "Stage Five" },
    },
  });
  expect(response.ok()).toBe(true);
  const result = await response.json();
  return result.order.number as string;
}

async function openOrder(page: Page, name: string) {
  await page.goto("/admin/orders");
  await page.getByText(name, { exact: true }).first().click();
  await page.waitForURL(/\/admin\/orders\/[0-9a-f-]+$/);
}

test("orders list shows the placed order with statuses and source badge", async ({
  page,
  request,
}) => {
  orderName = await placeMockOrder(request);
  await adminLogin(page);
  await page.goto("/admin/orders");

  const row = page.getByRole("row").filter({ hasText: orderName });
  await expect(row).toBeVisible();
  await expect(row.getByText("Paid", { exact: true })).toBeVisible();
  await expect(row.getByText("Unfulfilled", { exact: true })).toBeVisible();
  await expect(row.getByText("Test", { exact: true })).toBeVisible();
  await expect(row.getByText("1 items")).toBeVisible();

  // Unpaid tab: not there. Unfulfilled tab: there.
  await page.getByRole("tab", { name: "Unfulfilled" }).click();
  await expect(page.getByText(orderName, { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Unpaid" }).click();
  await expect(page.getByText(orderName, { exact: true })).toHaveCount(0);
});

test("order detail: cards, gift note in Notes, timeline + comment", async ({ page }) => {
  await adminLogin(page);
  await openOrder(page, orderName);

  // Cards.
  for (const heading of [
    "Line items",
    "Payment",
    "Timeline",
    "Notes",
    "Customer",
    "Contact information",
    "Shipping address",
    "Billing address",
    "Tags",
    "Conversion summary",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  // The buyer's gift message landed in Notes, editable (§7.4).
  await expect(page.locator("textarea").first()).toHaveValue(GIFT_NOTE);
  await expect(page.getByText(BUYER_EMAIL).first()).toBeVisible();
  await expect(page.getByText("5 Webhook Way")).toBeVisible();
  await expect(page.getByText("$55.94").first()).toBeVisible();

  // Timeline system events + a typed comment.
  await expect(page.getByText("Order placed (mock)")).toBeVisible();
  await expect(page.getByText(/Payment of \$55\.94 captured via mock/)).toBeVisible();
  await page.getByPlaceholder("Leave a comment…").fill("Called the buyer about delivery");
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page.getByText("Called the buyer about delivery")).toBeVisible();
});

test("fulfill flow stores tracking and flips status", async ({ page }) => {
  await adminLogin(page);
  await openOrder(page, orderName);

  await page.getByRole("button", { name: "Fulfill items" }).first().click();
  const modal = page.getByRole("dialog");
  // "Other" carrier: the pre-carrier path — admin pastes the full URL.
  await modal.getByLabel("Carrier").selectOption("other");
  await modal.getByLabel("Tracking number").fill("TRACK-12345");
  await modal.getByLabel("Tracking URL (optional)").fill("https://example.com/track/TRACK-12345");
  await modal.getByRole("button", { name: "Fulfill items" }).click();

  await expect(page.getByText("Fulfilled").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "TRACK-12345" })).toBeVisible();
  await expect(page.getByText(/Order fulfilled — tracking TRACK-12345/)).toBeVisible();
});

test("fulfill with the default UPS carrier auto-builds the tracking link", async ({
  page,
  request,
}) => {
  // Own buyer email: the customer test counts BUYER_EMAIL's orders (exactly 2).
  const upsOrderName = await placeMockOrder(request, `ups-buyer-${Date.now()}@example.com`);
  await adminLogin(page);
  await openOrder(page, upsOrderName);

  await page.getByRole("button", { name: "Fulfill items" }).first().click();
  const modal = page.getByRole("dialog");
  // Carrier dropdown defaults to UPS; the URL field stays blank on purpose —
  // fulfillOrder builds it from the carrier template (order-tracking Option B).
  await modal.getByLabel("Tracking number").fill("1Z999AA10123456784");
  await modal.getByRole("button", { name: "Fulfill items" }).click();

  await expect(page.getByText("Fulfilled").first()).toBeVisible();
  await expect(page.getByText(/UPS ·/)).toBeVisible();
  await expect(page.getByRole("link", { name: "1Z999AA10123456784" })).toHaveAttribute(
    "href",
    "https://www.ups.com/track?tracknum=1Z999AA10123456784",
  );
  await expect(page.getByText(/Order fulfilled — UPS tracking 1Z999AA10123456784/)).toBeVisible();
});

test("refund: partial → partially refunded, remainder → refunded", async ({ page }) => {
  await adminLogin(page);
  await openOrder(page, orderName);

  await page.getByRole("button", { name: "Refund", exact: true }).click();
  let modal = page.getByRole("dialog");
  await modal.getByLabel("Refund amount").fill("10.00");
  await modal.getByRole("button", { name: "Refund", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Partially refunded").first()).toBeVisible();
  await expect(page.getByText("Refunded $10.00")).toBeVisible();

  await page.getByRole("button", { name: "Refund", exact: true }).click();
  modal = page.getByRole("dialog");
  await expect(modal.getByLabel("Refund amount")).toHaveValue("45.94");
  await modal.getByRole("button", { name: "Refund", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Refunded", { exact: true }).first()).toBeVisible();
});

test("cancel with refund + restock writes movement and timeline", async ({ page, request }) => {
  secondOrderName = await placeMockOrder(request);
  await adminLogin(page);
  await openOrder(page, secondOrderName);

  await page.getByRole("button", { name: "Cancel order" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Reason (optional)").fill("Buyer changed their mind");
  await modal.getByRole("button", { name: "Cancel order" }).click();

  await expect(page.getByText("Cancelled").first()).toBeVisible();
  await expect(
    page.getByText(/Order cancelled — Buyer changed their mind, payment refunded, items restocked/),
  ).toBeVisible();

  // Restock movement recorded (return_restock, §7.3).
  const db = JSON.parse(
    await fs.readFile(path.join(process.cwd(), ".data", "db.json"), "utf8"),
  ) as {
    tables: {
      inventory_movements: Array<{ reason: string; delta: number; note: string | null }>;
    };
  };
  expect(
    db.tables.inventory_movements.some(
      (movement) =>
        movement.reason === "return_restock" &&
        movement.delta === 1 &&
        movement.note === `Refund/cancel of order ${secondOrderName}`,
    ),
  ).toBe(true);
});

test("archive moves the order to the Archived tab", async ({ page }) => {
  await adminLogin(page);
  await openOrder(page, secondOrderName);
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page.goto("/admin/orders");
  await expect(page.getByText(secondOrderName, { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Archived" }).click();
  await expect(page.getByText(secondOrderName, { exact: true })).toBeVisible();
});

test("customer auto-created with profile, orders and its own timeline", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/customers");
  const row = page.getByRole("row").filter({ hasText: BUYER_EMAIL });
  await expect(row).toBeVisible();
  await expect(row.getByText("2", { exact: true })).toBeVisible();

  await row.getByText("Stage Five").last().click();
  await page.waitForURL(/\/admin\/customers\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: "Last order placed" })).toBeVisible();
  await expect(page.getByText(orderName, { exact: true })).toBeVisible();
  await expect(page.getByText(secondOrderName, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Customer created")).toBeVisible();
  await expect(page.getByText(`Placed order ${orderName}`)).toBeVisible();

  await page.getByPlaceholder("Leave a comment…").fill("VIP gift buyer");
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page.getByText("VIP gift buyer")).toBeVisible();
});

test("webhook rejects unverifiable deliveries with 401", async ({ request }) => {
  const response = await request.post("/api/webhooks/paypal", {
    data: { event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "FAKE" } },
  });
  expect(response.status()).toBe(401);
});
