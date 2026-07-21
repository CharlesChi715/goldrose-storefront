/**
 * ROLE OF THIS FILE
 * Stage 2 acceptance (§14.2): logged-out visitors are redirected to the
 * admin login; the owner logs in and sees the Shopify-clone chrome; a wrong
 * password fails vaguely; the EN/中文 toggle switches every label and
 * persists across reloads. Runs against the local file adapter with the
 * dev password from playwright.config.ts.
 */

import { test, expect, type Page } from "@playwright/test";

const DEV_PASSWORD = "stage2-test-password";

// The admin is a desktop app; the storefront viewport (430px) would collapse
// the Polaris nav behind the mobile toggle.
test.use({ viewport: { width: 1280, height: 900 } });

async function logIn(page: Page) {
  await page.goto("/admin");
  await page.waitForURL(/\/admin\/login/);
  await page.getByLabel(/Email|邮箱/).fill("owner@goldrose.local");
  await page.getByLabel(/Password|密码/).fill(DEV_PASSWORD);
  await page.getByRole("button", { name: /Log in|登录/ }).click();
  await page.waitForURL(/\/admin$/);
}

test("logged-out visit to /admin redirects to the login page", async ({ page }) => {
  await page.goto("/admin/orders");
  await page.waitForURL(/\/admin\/login/);
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("wrong password is rejected with a vague error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("owner@goldrose.local");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Your email or password is incorrect.")).toBeVisible();
  expect(page.url()).toContain("/admin/login");
});

test("owner logs in and sees the Shopify-clone nav and top bar", async ({ page }) => {
  await logIn(page);

  const nav = page.getByRole("navigation");
  for (const label of [
    "Home",
    "Orders",
    "Products",
    "Customers",
    "Content",
    "Analytics",
    "Discounts",
    "Settings",
  ]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  // Top bar: search + account menu with the signed-in email.
  await expect(page.getByPlaceholder("Search")).toBeVisible();
  await expect(page.getByText("owner@goldrose.local")).toBeVisible();
  // Payment-mode banner: mock mode (no PayPal env in tests).
  await expect(page.getByText(/Test mode/)).toBeVisible();
});

test("EN/中文 toggle switches every label and persists across pages and reloads", async ({
  page,
}) => {
  await logIn(page);

  // Switch to 中文 from the account menu.
  await page.getByText("owner@goldrose.local").click();
  await page.getByRole("menuitem", { name: "中文" }).click();

  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("link", { name: "订单", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "产品" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "设置" })).toBeVisible();
  await expect(page.getByPlaceholder("搜索")).toBeVisible();

  // Persists across a navigation and a hard reload.
  await page.goto("/admin/orders");
  await expect(page.getByRole("navigation").getByRole("link", { name: "订单", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("navigation").getByRole("link", { name: "订单", exact: true })).toBeVisible();

  // And back to English for the suite's other tests.
  await page.getByText("owner@goldrose.local").click();
  await page.getByRole("menuitem", { name: "English" }).click();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Orders" })).toBeVisible();
});
