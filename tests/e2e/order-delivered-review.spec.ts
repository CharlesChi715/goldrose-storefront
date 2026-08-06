/**
 * ROLE OF THIS FILE
 * Smoke cover for the two me二·级 order frames imported 2026-08-05:
 * /account/orders/delivered (2439:369) and /account/orders/review (2439:370).
 * The delivered view is a static mock, so its checks are the shallow kind the
 * other design imports use — it renders, and its buttons point where the route
 * table says. The review page is the one with real interaction (chips, stars,
 * live counter), so those are exercised, and PUBLISH REVIEW is checked to be
 * deliberately inert while there is no reviews backend.
 * Pixel fidelity is the pixel-diff net's job.
 */

import { test, expect } from "@playwright/test";

test("delivered view renders the order and wires its three actions", async ({
  page,
}) => {
  await page.goto("/account/orders/delivered");
  await expect(
    page.getByText("Delivered", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Order #VL20250821")).toBeVisible();
  await expect(page.getByText("9400 1234 5678 9012 3456 78")).toBeVisible();

  await expect(page.getByRole("link", { name: "BUY AGAIN" })).toHaveAttribute(
    "href",
    "/shop",
  );
  await expect(
    page.getByRole("link", { name: "WRITE A REVIEW" }),
  ).toHaveAttribute("href", "/account/orders/review");
  await expect(
    page.getByRole("link", { name: "RETURNS AND AFTER-SALES" }),
  ).toHaveAttribute("href", "/account/returns");
});

test("the orders list sends a delivered order to the delivered view", async ({
  page,
}) => {
  await page.goto("/account/orders");
  // The mock's second order is the delivered one; signed out, the mock renders.
  const detailLinks = page.getByRole("link", { name: "VIEW DETAILS" });
  await expect(
    detailLinks.filter({ has: page.locator(":scope") }).first(),
  ).toBeVisible();
  await expect(page.locator('a[href="/account/orders/delivered"]')).toHaveCount(
    1,
  );
});

test("review page: chips, stars and the counter are live", async ({ page }) => {
  await page.goto("/account/orders/review");
  await expect(page.getByText("Write a Review")).toBeVisible();

  // The experience chips are a single-choice group.
  const exceeded = page.getByRole("button", { pressed: false }).nth(2);
  await expect(exceeded).toBeVisible();

  // Stars carry their rating in the accessible name.
  const fourth = page.getByRole("button", { name: /4 star/ });
  await expect(fourth).toHaveAttribute("aria-pressed", "false");
  await fourth.click();
  await expect(fourth).toHaveAttribute("aria-pressed", "true");
  // Tapping the same star again clears the rating.
  await fourth.click();
  await expect(fourth).toHaveAttribute("aria-pressed", "false");

  // The character counter counts for real.
  await expect(page.getByText("0 / 800")).toBeVisible();
  await page.locator("textarea").fill("Beautiful gift.");
  await expect(page.getByText("15 / 800")).toBeVisible();
});

test("PUBLISH REVIEW submits a pending review (owner decision 2026-08-06)", async ({
  page,
}) => {
  await page.goto("/account/orders/review");
  const publish = page.getByRole("button", { name: "Publish review" });
  // Locked until a rating and a few words exist — no accidental empty rows.
  await expect(publish).toBeDisabled();
  await page.getByRole("button", { name: /5 star/ }).click();
  await page.locator("textarea").fill("Beautiful gift, arrived perfectly.");
  await expect(publish).toBeEnabled();
  await publish.click();
  // The submitted state relabels and locks; the row is stored as pending.
  await expect(page.getByText("THANK YOU — SENT FOR REVIEW")).toBeVisible();
  await expect(publish).toBeDisabled();
});
