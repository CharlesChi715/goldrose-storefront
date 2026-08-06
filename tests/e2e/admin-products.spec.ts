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

test("products list shows seeded products with inventory summaries", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/products");
  await expect(page.getByText("ELDREVE Signature 24K Gold Rose")).toBeVisible();
  await expect(page.getByText("ELDREVE Boxed Keepsake Rose")).toBeVisible();
  await expect(page.getByText("ELDREVE Premium Gift Bundle")).toBeVisible();
  await expect(
    page.getByText(/\d+ in stock for 3 variants/).first(),
  ).toBeVisible();
});

test("create → edit → duplicate → archive → delete, card for card", async ({
  page,
}) => {
  await adminLogin(page);

  // Create (draft by default, single default variant).
  await page.goto("/admin/products/new");
  await page.getByRole("textbox", { name: /^Title\*?$/ }).fill(TEST_TITLE);
  await page
    .getByLabel("Description", { exact: true })
    .fill("A product created by the e2e suite.");
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
  const originalRow = page
    .getByRole("row")
    .filter({ hasText: TEST_TITLE })
    .first();
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

test("inventory screen: four columns, reasoned adjustment, history", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/products/inventory");

  // Four Shopify columns present.
  for (const column of ["Unavailable", "Committed", "Available", "On hand"]) {
    await expect(
      page.getByRole("columnheader", { name: column, exact: true }),
    ).toBeVisible();
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

/*
 * 取景框 (owner, 2026-08-06). Storefront photo boxes are fixed design
 * rectangles drawn with object-fit: cover, so the browser crops to the centre
 * and an off-centre subject gets cut. The Media card's framing box is the PDP
 * photo window at its true 398×250; dragging the photo inside it writes
 * product_images.focal_x/focal_y (migration 0008), which every cover-fitted
 * box then honours.
 */
test("framing box: drag sets the focal point, and the storefront honours it", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/products/premium-gift-bundle");

  await page.getByRole("button", { name: "Adjust framing" }).first().click();
  const modal = page.getByRole("dialog");
  const frame = modal.locator("img").first();
  await expect(frame).toBeVisible();

  // The frame IS the PDP photo box, to the pixel — that is the whole point.
  const box = await frame.boundingBox();
  expect(Math.round(box!.width)).toBe(398);
  expect(Math.round(box!.height)).toBe(250);

  // Start from a known point rather than whatever a previous run left.
  await modal.getByRole("button", { name: "Centre" }).click();
  // The seed photos are square, so only the vertical axis has slack; drag up
  // to reveal the bottom of the photo, which is a HIGHER Y percentage.
  await expect(modal.getByText(/· 50% \/ 50%$/)).toBeVisible();
  const centre = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.down();
  for (const dy of [-20, -40, -60, -80]) {
    await page.mouse.move(centre.x, centre.y + dy);
  }
  await page.mouse.up();
  await expect(modal.getByText(/· 50% \/ 100%$/)).toBeVisible();

  await modal.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Product saved").first()).toBeVisible();

  try {
    // The product page crops to the saved point, not the centre.
    await page.goto("/products/premium-gold-rose-gift-bundle", {
      waitUntil: "networkidle",
    });
    const hero = page.locator('button[aria-label*=" photo 1"] img').first();
    await expect(hero).toHaveCSS("object-position", "50% 100%");
    // …and so does the shop card, from the same one stored point.
    await page.goto("/shop", { waitUntil: "networkidle" });
    await expect(
      page.locator(
        'a[href="/products/premium-gold-rose-gift-bundle"] img.gr-photo',
      ),
    ).toHaveCSS("object-position", "50% 100%");
  } finally {
    // Put it back so later runs start from the seeded centre crop.
    await page.setViewportSize(ADMIN_VIEWPORT);
    await page.goto("/admin/products/premium-gift-bundle");
    await page.getByRole("button", { name: "Adjust framing" }).first().click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Centre" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Done" })
      .click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Product saved").first()).toBeVisible();
  }
});
