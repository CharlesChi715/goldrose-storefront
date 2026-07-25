/**
 * ROLE OF THIS FILE
 * Homepage interaction specs from the IxD table (docs/ixd/homepage.md). The
 * pixel baselines in pixels.spec.ts already gate the homepage's appearance;
 * these cover behaviour the static import was missing.
 */

import { test, expect } from "@playwright/test";

test.describe("H-03 · hero carousel and pagination dots", () => {
  test("dots select slides, highlight the current one, and wrap around", async ({ page }) => {
    await page.goto("/");
    const dots = page.getByRole("button", { name: /^Show hero slide / });
    await expect(dots).toHaveCount(4);

    // Rests on the first slide (which is also what the pixel baseline shows).
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");

    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "false");

    // Wrap-around: the last dot then the first is a legal round trip.
    await dots.nth(3).click();
    await expect(dots.nth(3)).toHaveAttribute("aria-current", "true");
    await dots.nth(0).click();
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
  });

  test("cards lead to the placeholder destination", async ({ page }) => {
    await page.goto("/");
    // Placeholder target: H-03 wants the matching product detail page, but
    // that mapping is undecided (OQ-3).
    await page.getByRole("link", { name: "hero slide 1" }).click();
    await expect(page).toHaveURL(/\/placeholder$/);
    await expect(page.getByRole("heading", { name: "Placeholder page" })).toBeVisible();
  });

  test("the track slides horizontally rather than crossfading", async ({ page }) => {
    await page.goto("/");
    const track = page.getByRole("link", { name: "hero slide 1" }).locator("..");
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await page.getByRole("button", { name: "Show hero slide 2" }).click();
    // One window width to the left — the outgoing slide travels off, the next
    // arrives from the right.
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -430, 0)");
  });
});
