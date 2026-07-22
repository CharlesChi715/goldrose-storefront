/**
 * ROLE OF THIS FILE
 * The pixel regression net, Stage 9 edition (§14.2). Home is still a
 * byte-exact full-page snapshot (it keeps design text — §8). /shop and the
 * product page now render LIVE catalog values inside their designated text
 * boxes, so those two run as MASKED snapshots: every [data-live-text] box
 * is masked out, and everything else must stay byte-identical to the Figma
 * baseline. Any pixel change outside a designated box still fails here.
 */

import { test, expect, type Page } from "@playwright/test";

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

test("pixel baseline: home (exact)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await settlePage(page);
  await expect(page).toHaveScreenshot("home.png", { fullPage: true });
});

for (const { path, name } of [
  { path: "/shop", name: "shop" },
  { path: "/products/signature-24k-gold-rose", name: "product-detail" },
] as const) {
  test(`pixel baseline: ${name} (masked live-text boxes)`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await settlePage(page);
    await expect(page).toHaveScreenshot(`${name}-masked.png`, {
      fullPage: true,
      mask: [page.locator("[data-live-text]")],
    });
  });
}
