/**
 * ROLE OF THIS FILE
 * Smoke cover for the screens imported from the Figma B/C frames: bag (B-1),
 * business partnerships + wholesale application (B-3/B-4), guest order
 * tracking (C-1) and the homepage menu drawer (C-3). These pages are static
 * design imports, so the checks are deliberately shallow — they prove the
 * route renders, the wired links point where the route table says, and the
 * placeholder controls stay inert. Pixel fidelity is the pixel-diff net's job.
 */

import { test, expect } from "@playwright/test";

test("the bag screen renders and its checkout CTA reaches /checkout", async ({
  page,
}) => {
  await page.goto("/bag");
  await expect(page.getByText("Shopping Bag", { exact: true })).toBeVisible();
  // The bag's line items are the design's placeholder rows for now; the CTA is
  // the one thing that must really work.
  await page.getByRole("link", { name: /SECURE CHECKOUT/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("business partnerships links to the wholesale application", async ({
  page,
}) => {
  await page.goto("/business/partnerships");
  await page.getByRole("link", { name: /APPLY FOR WHOLESALE/i }).click();
  await expect(page).toHaveURL(/\/business\/wholesale$/);
});

test("the wholesale form takes input but does not submit", async ({ page }) => {
  await page.goto("/business/wholesale");
  const first = page.locator("input.b4-field").first();
  await first.fill("Rose & Co");
  await expect(first).toHaveValue("Rose & Co");
  // No backend yet: the submit control is a placeholder, not a <button>.
  await expect(page.getByRole("button", { name: /SUBMIT/i })).toHaveCount(0);
});

test("guest order tracking renders the C-1 timeline", async ({ page }) => {
  await page.goto("/orders/track");
  await expect(
    page.getByText("Track Your Order", { exact: true }),
  ).toBeVisible();
  // Nothing here is a real order yet — the frame ships placeholder tracking data.
  await expect(page.getByText("#VL20250821")).toBeVisible();
});

test("the header menu opens the drawer, navigates, and closes on Escape", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  // Wired rows navigate and close the drawer behind them.
  await menu.click();
  await drawer.getByRole("link", { name: "SHOP" }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
});

test("the shop pagination walks pages and reorders the placeholder cards", async ({
  page,
}) => {
  await page.goto("/shop");
  const firstOnPageOne = await page
    .locator(".gr-card-zoom .gr-photo")
    .first()
    .getAttribute("src");

  await page.getByRole("link", { name: "Page 3" }).click();
  await expect(page).toHaveURL(/\/shop\?page=3$/);
  await expect(page.getByRole("link", { name: "Page 3" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // Same eight placeholder products, rotated into different slots (OQ-3).
  const firstOnPageThree = await page
    .locator(".gr-card-zoom .gr-photo")
    .first()
    .getAttribute("src");
  expect(firstOnPageThree).not.toBe(firstOnPageOne);

  // The next-page arrow is inert on the last page, as the design draws it.
  await page.goto("/shop?page=5");
  await expect(page.getByRole("link", { name: "Next page" })).toHaveCount(0);
});

test("the account type tabs are links between the two imported frames", async ({
  page,
}) => {
  await page.goto("/account");
  await page.getByRole("link", { name: "Business & Partnerships" }).click();
  await expect(page).toHaveURL(/\/account\/business$/);
  // And back — the fade itself is motion-gated, so only the routing is asserted.
  await page.getByRole("link", { name: "Gift Shopping" }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("the homepage gift-path cards reach the shop and the on-page sections", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#personalize")).toHaveCount(1);
  // #craft stays as an anchor target, but the EXPLORE OUR CRAFT card now
  // reaches the real /craft page (07-29 import); the story CTA reaches /story.
  await expect(page.locator("#craft")).toHaveCount(1);
  await expect(page.locator('a[href="#personalize"]')).toHaveCount(1);
  await expect(page.locator('a[href="/craft"]')).toHaveCount(1);
  await expect(page.locator('a[href="/story"]')).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: /Valentine/i }).first(),
  ).toBeVisible();
});
