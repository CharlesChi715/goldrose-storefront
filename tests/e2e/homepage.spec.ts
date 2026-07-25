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

  test("the visible slide links into the shop", async ({ page }) => {
    await page.goto("/");
    // Placeholder target: H-03 wants the matching product detail page, but
    // that mapping is undecided (OQ-3).
    const active = page.locator('a[href="/shop"]:not([aria-hidden="true"])').first();
    await expect(active).toBeVisible();
  });
});
