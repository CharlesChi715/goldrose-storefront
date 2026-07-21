/**
 * ROLE OF THIS FILE
 * Stage 3 acceptance (§14.2): products list, create/edit/duplicate/archive/
 * delete per §9.5, and the §9.6 inventory screen with reasoned adjustments
 * + history. Tests are self-cleaning (created products are deleted) because
 * the local db persists across the server's lifetime.
 */

import { test, expect, type Page } from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

const TEST_TITLE = `E2E Test Product ${Date.now()}`;

async function deleteFromForm(page: Page) {
  await page.getByRole("button", { name: "Delete product" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForURL(/\/admin\/products$/);
}

test("products list shows seeded products with inventory summaries", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/products");
  await expect(page.getByText("GoldRose Signature 24K Gold Rose")).toBeVisible();
  await expect(page.getByText("GoldRose Boxed Keepsake Rose")).toBeVisible();
  await expect(page.getByText("GoldRose Premium Gift Bundle")).toBeVisible();
  await expect(page.getByText(/\d+ in stock for 3 variants/).first()).toBeVisible();
});

test("create → edit → duplicate → archive → delete, card for card", async ({ page }) => {
  await adminLogin(page);

  // Create (draft by default, single default variant).
  await page.goto("/admin/products/new");
  await page.getByRole("textbox", { name: /^Title\*?$/ }).fill(TEST_TITLE);
  await page.getByLabel("Description", { exact: true }).fill("A product created by the e2e suite.");
  await page.getByLabel("Price", { exact: true }).fill("12.50");
  await page.getByLabel("Quantity", { exact: true }).fill("5");
  await page.getByLabel("SKU (Stock Keeping Unit)").fill("E2E-001");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL(/\/admin\/products\/(?!new)[a-z0-9-]+$/);

  // It shows in the list as Draft with its stock.
  await page.goto("/admin/products");
  const row = page.getByRole("row").filter({ hasText: TEST_TITLE });
  await expect(row.first()).toBeVisible();
  await expect(row.first().getByText("Draft")).toBeVisible();
  await expect(row.first().getByText("5 in stock")).toBeVisible();

  // Edit: change the price, verify persistence.
  await row.first().getByText(TEST_TITLE).last().click();
  await page.waitForURL(/\/admin\/products\/[a-z0-9-]+$/);
  await page.getByLabel("Price", { exact: true }).fill("15.00");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Product saved")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Price", { exact: true })).toHaveValue("15.00");

  // Duplicate → a "Copy of" draft with its own form.
  await page.getByRole("button", { name: "Duplicate" }).click();
  await page.waitForURL(/copy-of/);
  await expect(page.getByRole("textbox", { name: /^Title\*?$/ })).toHaveValue(
    `Copy of ${TEST_TITLE}`,
  );
  await deleteFromForm(page); // clean the copy up

  // Archive the original…
  const originalRow = page.getByRole("row").filter({ hasText: TEST_TITLE }).first();
  await originalRow.getByText(TEST_TITLE).last().click();
  await page.waitForURL(/\/admin\/products\/[a-z0-9-]+$/);
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.getByText("Archived").first()).toBeVisible();

  // …then Delete it (red confirm) and confirm it's gone.
  await deleteFromForm(page);
  await expect(
    page.getByRole("row").filter({ hasText: TEST_TITLE }),
  ).toHaveCount(0);
});

test("inventory screen: four columns, reasoned adjustment, history", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/products/inventory");

  // Four Shopify columns present.
  for (const column of ["Unavailable", "Committed", "Available", "On hand"]) {
    await expect(page.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
  }

  // Read the current on-hand of the first seeded variant (SKU GR-SIG-001-1).
  const row = page.getByRole("row").filter({ hasText: "GR-SIG-001-1" });
  await expect(row).toBeVisible();
  const before = Number(await row.locator("td").nth(5).innerText());

  // Adjust +3 with a Shopify reason.
  await row.getByRole("button", { name: "Adjust", exact: true }).click();
  await page.getByLabel("Adjust by").fill("3");
  await page.getByLabel("Reason").selectOption("received");
  await page.getByLabel("Note (optional)").fill("e2e adjustment");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row.locator("td").nth(5)).toHaveText(String(before + 3));

  // History shows the movement with reason + note.
  await row.getByRole("button", { name: "View adjustment history" }).click();
  const modal = page.getByRole("dialog");
  await expect(modal.getByText("Received").first()).toBeVisible();
  await expect(modal.getByText("e2e adjustment").first()).toBeVisible();
  await expect(modal.getByText("+3").first()).toBeVisible();
});
