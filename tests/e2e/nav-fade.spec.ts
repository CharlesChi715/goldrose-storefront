/**
 * ROLE OF THIS FILE
 * The bottom tab bar's page cross-fade (owner, 2026-07-25). The suite runs
 * with reduced motion pinned, so the fade tests opt back in explicitly; the
 * last test covers the reduced-motion path the rest of the suite exercises.
 */

import { test, expect } from "@playwright/test";

const canvasOpacity = (page: import("@playwright/test").Page) =>
  page.locator(".figv-wrap").evaluate((el) => Number(getComputedStyle(el).opacity));

/**
 * The fade lives in a click handler, so it only exists once React has taken
 * over; a tap that beats hydration is a plain browser navigation. The hero
 * dots are inert until then, which makes them an honest readiness signal.
 */
async function hydrated(page: import("@playwright/test").Page) {
  const dot = page.getByRole("button", { name: "Show hero slide 2" });
  await dot.click();
  await expect(dot).toHaveAttribute("aria-current", "true");
}

test.describe("bottom-nav page cross-fade", () => {
  // Via contextOptions, not the plain `reducedMotion` fixture: the config pins
  // reduce inside contextOptions, and that object wins when both are set.
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("the canvas fades out, the route lands, the new canvas fades back in", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    await expect.poll(() => canvasOpacity(page)).toBe(1);

    await page.locator('nav a[href="/shop"]').click();
    // The fade flag goes up synchronously on the tap and stays up until the
    // new route has painted, so the canvas is on its way out here.
    await expect(page.locator("html.figv-fading")).toHaveCount(1);
    await expect.poll(() => canvasOpacity(page)).toBeLessThan(1);

    await page.waitForURL(/\/shop$/);
    // …and comes back: a stuck-invisible canvas is the failure that matters.
    await expect(page.locator("html.figv-fading")).toHaveCount(0);
    await expect.poll(() => canvasOpacity(page)).toBe(1);
  });

  test("the tab bar itself never fades", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);
    const nav = page.locator("nav");
    await page.locator('nav a[href="/shop"]').click();
    await expect(nav).toHaveCSS("opacity", "1");
    await page.waitForURL(/\/shop$/);
    await expect(nav).toHaveCSS("opacity", "1");
  });
});

test("reduced motion switches tabs with no fade at all", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  await page.locator('nav a[href="/shop"]').click();
  await page.waitForURL(/\/shop$/);
  await expect(page.locator("html.figv-fading")).toHaveCount(0);
  await expect.poll(() => canvasOpacity(page)).toBe(1);
});
