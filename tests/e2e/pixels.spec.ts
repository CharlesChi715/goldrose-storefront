/**
 * ROLE OF THIS FILE
 * Stage 0 pixel baseline: full-page screenshots of the three pixel-exact
 * Figma pages. Any later stage that changes a single storefront pixel fails
 * here — the storefront must keep rendering byte-identically until the owner
 * edits content (design doc §3.1 goal 4).
 */

import { test, expect, type Page } from "@playwright/test";

const PAGES = [
  { path: "/", name: "home" },
  { path: "/shop", name: "shop" },
  { path: "/products/signature-24k-gold-rose", name: "product-detail" },
] as const;

/**
 * Force every lazy asset to load before capturing: scroll to the bottom in
 * viewport-sized steps (triggering next/image lazy loading), then back to the
 * top so fixed chrome (bottom nav, concierge chat) sits where a fresh visit
 * puts it.
 */
async function settlePage(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
}

for (const { path, name } of PAGES) {
  test(`pixel baseline: ${name}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await settlePage(page);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
