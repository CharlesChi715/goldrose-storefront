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

  test("the track follows the finger and holds wherever it pauses", async ({ page }) => {
    await page.goto("/");
    const card = page.getByRole("link", { name: "hero slide 1" });
    const track = card.locator("..");
    const box = (await card.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // The track is the finger: pixel-for-pixel, no easing, no snapping.
    await page.mouse.move(cx - 60, cy, { steps: 6 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -60, 0)");
    await page.mouse.move(cx - 137, cy, { steps: 8 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -137, 0)");

    // Paused mid-swipe it stays parked — nothing snaps it to a slide edge.
    await page.waitForTimeout(1200);
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -137, 0)");

    // Only the release commits, and the drag must not also open the card.
    await page.mouse.up();
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -430, 0)");
    await expect(page).toHaveURL(/\/$/);
  });

  test("a short drag springs back, and the first slide resists a rightward pull", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.getByRole("link", { name: "hero slide 1" });
    const track = card.locator("..");
    const box = (await card.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 20, cy, { steps: 4 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -20, 0)");
    await page.mouse.up();
    // Under the 40px commit threshold, so it returns to the slide it left.
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

    // Pulling right off the first slide is damped 3:1 — there is no cell there.
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 30, cy, { steps: 4 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 10, 0)");
    await page.mouse.up();
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
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
