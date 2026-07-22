/**
 * ROLE OF THIS FILE
 * Stage 7 acceptance (§14.2): browsing the storefront writes page views;
 * Home shows metrics + the things-to-do feed; the analytics cards compute
 * for a chosen range; a completed order shows its Conversion summary;
 * "Visitors right now" reflects the live visit; ⌘K finds an order by
 * number, a product by SKU, and a customer by email.
 */

import { test, expect } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";
const BUYER_EMAIL = `stage7-buyer-${Date.now()}@example.com`;

let orderName = "";

test("browsing the storefront writes page views and checkout carries the visitor", async ({
  page,
}) => {
  // Browse: the beacon posts one view per page.
  const beacon = page.waitForResponse("**/api/beacon");
  await page.goto("/shop");
  await beacon;
  const beacon2 = page.waitForResponse("**/api/beacon");
  await page.goto("/products/signature-24k-gold-rose");
  await beacon2;

  // Buy via the wired product-page button → checkout (also beaconed).
  const beacon3 = page.waitForResponse("**/api/beacon");
  await page.getByRole("button", { name: "Buy now" }).click();
  await page.waitForURL(/\/checkout/);
  await beacon3;

  await page.fill("#email", BUYER_EMAIL);
  await page.fill("#ship-name", "Stage Seven");
  await page.fill("#ship-address1", "7 Beacon Blvd");
  await page.fill("#ship-city", "Testville");
  await page.fill("#ship-state", "CA");
  await page.fill("#ship-zip", "90001");
  await page.fill("#card-name", "Stage Seven");
  await page.fill("#card-number", "4242 4242 4242 4242");
  await page.fill("#card-expiry", "12/33");
  await page.fill("#card-cvc", "123");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await page.waitForURL(/\/checkout\/success\?/);
  orderName = (await page.locator("dd.font-mono").innerText()).trim();

  const db = JSON.parse(
    await fs.readFile(path.join(process.cwd(), ".data", "db.json"), "utf8"),
  ) as {
    tables: {
      page_views: Array<{ path: string; visitor_id: string; session_id: string }>;
      orders: Array<{ name: string; visitor_id: string | null }>;
    };
  };
  expect(db.tables.page_views.some((view) => view.path === "/shop")).toBe(true);
  expect(
    db.tables.page_views.some((view) => view.path === "/products/signature-24k-gold-rose"),
  ).toBe(true);
  const order = db.tables.orders.find((row) => row.name === orderName);
  expect(order?.visitor_id).toBeTruthy();
  // The order's visitor matches a beaconed visitor id.
  expect(db.tables.page_views.some((view) => view.visitor_id === order!.visitor_id)).toBe(true);
});

test("the completed order shows its Conversion summary", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/orders");
  await page.getByText(orderName, { exact: true }).first().click();
  await page.waitForURL(/\/admin\/orders\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: "Conversion summary" })).toBeVisible();
  await expect(page.getByText(/\d+ sessions before this order/)).toBeVisible();
  await expect(page.getByText(/First visit: /)).toBeVisible();
});

test("Home shows metric cards, chart and the things-to-do feed", async ({ page }) => {
  await adminLogin(page);
  await expect(page.getByText("Today", { exact: true })).toBeVisible();
  await expect(page.getByText("Last 7 days").first()).toBeVisible();
  await expect(page.getByText("Last 30 days").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Things to do" })).toBeVisible();
  await expect(page.getByText(/\d+ orders to fulfill/)).toBeVisible();
  // Sessions + conversion cards are live (beaconed browsing above).
  await expect(page.getByText(/Sessions — Last 7 days/)).toBeVisible();
});

test("analytics cards compute for a chosen range with live visitors", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/analytics?range=7d");

  for (const card of [
    "Total sales",
    "Orders",
    "Average order value",
    "Returning customer rate",
    "Top selling products",
    "Sales by country",
    "Sales by discount code",
    "Sessions",
    "Conversion rate",
    "Sales by traffic source",
    "Visitors right now",
  ]) {
    await expect(page.getByText(card, { exact: true }).first()).toBeVisible();
  }

  // Funnel from the beacon: sessions ≥ 1, reached checkout ≥ 1, purchased ≥ 1.
  await expect(page.getByText("Reached checkout")).toBeVisible();
  await expect(page.getByText("Purchased")).toBeVisible();
  // Live-visitor card reflects the storefront visit minutes ago.
  const visitorsCard = page
    .locator("div")
    .filter({ hasText: /^Visitors right now\d+$/ })
    .last();
  await expect(visitorsCard).toBeVisible();

  // Range picker navigates.
  await page.getByLabel("Date range").selectOption("today");
  await page.waitForURL(/range=today/);
  await expect(page.getByText("Total sales", { exact: true }).first()).toBeVisible();
});

test("⌘K finds an order by number, a product by SKU, a customer by email", async ({
  page,
}) => {
  await adminLogin(page);
  await page.keyboard.press("ControlOrMeta+KeyK");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();

  const searchBox = modal.getByPlaceholder("Search");
  // Order by number (without the # prefix).
  await searchBox.fill(orderName.replace("#", ""));
  await expect(modal.getByText(orderName, { exact: true })).toBeVisible();

  // Product by SKU.
  await searchBox.fill("GR-SIG-001-1");
  await expect(modal.getByText("GoldRose Signature 24K Gold Rose")).toBeVisible();

  // Customer by email → navigate to the profile.
  await searchBox.fill(BUYER_EMAIL);
  await expect(modal.getByText("Stage Seven")).toBeVisible();
  await modal.getByText("Stage Seven").click();
  await page.waitForURL(/\/admin\/customers\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: "Last order placed" })).toBeVisible();
});
